import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Déconnexion : les cookies de session disparaissent quoi qu'il arrive.
 *
 * Quand le jeton d'accès a expiré et que son rafraîchissement échoue,
 * `signOut` de la bibliothèque renvoie l'erreur sans rien effacer ; sur un
 * poste partagé, le jeton de rafraîchissement survivait au verrouillage
 * d'inactivité.
 */

const jar = new Map<string, { value: string; options?: unknown }>();
const store = {
  getAll: () =>
    [...jar.entries()].map(([name, { value }]) => ({ name, value })),
  set: (name: string, value: string, options?: { maxAge?: number }) => {
    if (options?.maxAge === 0) jar.delete(name);
    else jar.set(name, { value, options });
  },
};
const auth = { signOut: vi.fn() };

vi.mock("next/headers", () => ({ cookies: async () => store }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/api/client", () => ({ apiFetch: vi.fn(async () => undefined) }));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth }),
}));
vi.mock("@/lib/session/server", () => ({
  DEMO_MEMBERSHIP_COOKIE: "imafrik-demo-membership",
  getAvailableMemberships: async () => [],
}));
vi.mock("@/i18n/server", () => ({ getMessages: async () => ({}) }));

const { signOut } = await import("@/lib/session/actions");

beforeEach(() => {
  jar.clear();
  jar.set("sb-projet-auth-token.0", { value: "a" });
  jar.set("sb-projet-auth-token.1", { value: "b" });
  jar.set("sb-projet-auth-token-code-verifier", { value: "c" });
  jar.set("imafrik-lang", { value: "fr" });
  auth.signOut.mockReset();
});

describe("signOut", () => {
  it("efface les cookies de session quand le service renvoie une erreur", async () => {
    auth.signOut.mockResolvedValue({
      error: new Error("rafraîchissement impossible"),
    });
    await signOut();
    expect([...jar.keys()]).toEqual(["imafrik-lang"]);
  });

  it("les efface aussi quand l'appel lève une exception", async () => {
    auth.signOut.mockRejectedValue(new Error("réseau"));
    await signOut();
    expect([...jar.keys()]).toEqual(["imafrik-lang"]);
  });

  it("les efface après une déconnexion réussie", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect([...jar.keys()]).toEqual(["imafrik-lang"]);
  });
});
