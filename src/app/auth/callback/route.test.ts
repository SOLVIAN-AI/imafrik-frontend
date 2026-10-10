import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Retour des liens envoyés par courriel : quelles adresses ouvrent une
 * session, et où elles conduisent.
 *
 * Le client Supabase est simulé : ce qui est vérifié ici, c'est l'aiguillage
 * (type de lien, destination, échec), pas le service d'authentification.
 */

const auth = {
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
};
const demo = { on: false };

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth }),
}));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => demo.on }));

const { GET } = await import("@/app/auth/callback/route");

const ORIGIN = "https://imafrik.test";

/** Appelle la route et renvoie l'adresse de redirection. */
async function follow(query: string): Promise<string> {
  const response = await GET(
    new NextRequest(`${ORIGIN}/auth/callback?${query}`),
  );
  expect(response.status).toBeGreaterThanOrEqual(300);
  expect(response.status).toBeLessThan(400);
  return response.headers.get("location") ?? "";
}

describe("adresse de redirection", () => {
  it("reste relative, quel que soit l'hôte vu par le serveur", async () => {
    // Hors de Vercel, nextUrl porte le nom d'hôte d'écoute (« localhost »),
    // et non celui que le navigateur a ouvert : une redirection absolue
    // l'envoyait sur un autre hôte, sans ses cookies de session.
    const response = await GET(
      new NextRequest(
        "http://localhost:5173/auth/callback?token_hash=abc&type=invite",
      ),
    );
    expect(response.headers.get("location")).toBe("/invitation");
  });
});

beforeEach(() => {
  demo.on = false;
  auth.verifyOtp.mockReset().mockResolvedValue({ error: null });
  auth.exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
});

describe("liens par token_hash", () => {
  it("ouvre la session d'une personne invitée et la conduit à l'accueil", async () => {
    const location = await follow(
      "token_hash=abc&type=invite&suite=/invitation",
    );
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "abc",
      type: "invite",
    });
    expect(location).toBe(`/invitation`);
  });

  it("ouvre la session d'une réinitialisation, depuis n'importe quel appareil", async () => {
    const location = await follow(
      "token_hash=abc&type=recovery&suite=/nouveau-mot-de-passe",
    );
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "abc",
      type: "recovery",
    });
    // Aucun échange de code : pas de vérificateur PKCE nécessaire.
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(location).toBe(`/nouveau-mot-de-passe`);
  });

  it("conduit à la page du type quand `suite` manque", async () => {
    expect(await follow("token_hash=abc&type=invite")).toBe(`/invitation`);
    expect(await follow("token_hash=abc&type=recovery")).toBe(
      `/nouveau-mot-de-passe`,
    );
  });

  it.each([
    ["absolue", "https://exemple.test/"],
    ["relative au protocole", "//exemple.test"],
    ["normalisée en //hôte", "/.//exemple.test"],
  ])("ignore une destination %s", async (_label, suite) => {
    const location = await follow(
      `token_hash=abc&type=recovery&suite=${encodeURIComponent(suite)}`,
    );
    expect(location).toBe(`/nouveau-mot-de-passe`);
  });

  it.each(["signup", "email_change", "magiclink", "email", "", "INVITE"])(
    "refuse le type %j sans ouvrir de session",
    async (type) => {
      const location = await follow(`token_hash=abc&type=${type}`);
      expect(location).toBe(`/connexion?motif=lien-invalide`);
      expect(auth.verifyOtp).not.toHaveBeenCalled();
    },
  );

  it("signale un lien expiré ou déjà utilisé", async () => {
    auth.verifyOtp.mockResolvedValue({ error: new Error("expired") });
    expect(await follow("token_hash=abc&type=invite")).toBe(
      `/connexion?motif=lien-expire`,
    );
  });
});

describe("liens par code (PKCE)", () => {
  it("échange le code et suit `suite`", async () => {
    const location = await follow("code=xyz&suite=/nouveau-mot-de-passe");
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("xyz");
    expect(location).toBe(`/nouveau-mot-de-passe`);
  });

  it("signale un code refusé", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: new Error("x") });
    expect(await follow("code=xyz")).toBe(`/connexion?motif=lien-expire`);
  });
});

describe("sans jeton ni code, ou en démonstration", () => {
  it("refuse un lien vide", async () => {
    expect(await follow("suite=/invitation")).toBe(
      `/connexion?motif=lien-invalide`,
    );
  });

  it("n'ouvre aucune session en démonstration", async () => {
    demo.on = true;
    expect(await follow("token_hash=abc&type=invite")).toBe(
      `/connexion?motif=lien-invalide`,
    );
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
});
