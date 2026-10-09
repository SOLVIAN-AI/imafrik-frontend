import { createServerClient } from "@supabase/ssr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Avertissement « Using the user object as returned from
 * supabase.auth.getSession() … could be insecure! » : sa cause, et sa
 * disparition, contre la **vraie** bibliothèque Supabase.
 *
 * Seul le réseau est simulé (`fetch`) : la lecture du cookie de session,
 * le décodage du jeton et le mandataire qui émet l'avertissement sont
 * ceux de `@supabase/supabase-js`. Une mise à jour de la bibliothèque
 * qui changerait ce comportement ferait échouer ces tests.
 */

const SUPABASE_URL = "https://projet-test.supabase.co";
const ANON_KEY = "cle-anonyme-de-test";
const USER_ID = "4d1f3c2a-9b7e-4c55-8a10-2f6d9e3b7a01";

/** Encodage base64url, sans remplissage. */
function base64url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

/**
 * Jeton d'accès au premier niveau d'assurance. Signé en HS256 : sans clé
 * publique à récupérer, `getClaims()` le fait vérifier par le service
 * d'authentification (`GET /auth/v1/user`), simulé plus bas.
 */
const ACCESS_TOKEN = [
  base64url(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  base64url(
    JSON.stringify({
      sub: USER_ID,
      aud: "authenticated",
      role: "authenticated",
      aal: "aal1",
      amr: [{ method: "password", timestamp: 1_760_000_000 }],
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ),
  base64url("signature"),
].join(".");

/** Utilisateur tel que le service d'authentification le renvoie. */
const USER = {
  id: USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "admin@imafrik.test",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-01T00:00:00Z",
  factors: [
    {
      id: "f-1",
      factor_type: "totp",
      status: "verified",
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
    },
  ],
};

/** Cookie de session, au format de `@supabase/ssr`. */
const SESSION_COOKIE = {
  name: "sb-projet-test-auth-token",
  value: `base64-${base64url(
    JSON.stringify({
      access_token: ACCESS_TOKEN,
      refresh_token: "jeton-de-renouvellement",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: USER,
    }),
  )}`,
};

/** Client serveur, comme `lib/supabase/server.ts` en crée un par appel. */
function serverClient() {
  return createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: { getAll: () => [SESSION_COOKIE], setAll: () => {} },
  });
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => serverClient(),
}));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => false }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

/** Réponse JSON simulée. */
function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** Service d'authentification et base, simulés au niveau du réseau. */
async function fakeNetwork(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.pathname === "/auth/v1/user") return json(USER);
  if (url.pathname === "/rest/v1/profiles") {
    const profile = {
      full_name: "Awa Admin",
      title: null,
      license_number: null,
      credentials_verified_at: null,
      active_membership_id: "m-1",
      locale: "fr",
    };
    const accept = new Headers(init?.headers).get("Accept") ?? "";
    return json(accept.includes("vnd.pgrst.object") ? profile : [profile]);
  }
  if (url.pathname === "/rest/v1/memberships") {
    return json([
      {
        id: "m-1",
        role: "platform_admin",
        organizations: {
          id: "org-1",
          name: "IMAFRIK",
          kind: "platform",
          city: null,
          report_language: "fr",
          is_active: true,
        },
      },
    ]);
  }
  throw new Error(`requête inattendue : ${url.pathname}`);
}

/** Avertissements émis par la bibliothèque sur l'utilisateur non vérifié. */
function insecureUserWarnings(warn: ReturnType<typeof vi.spyOn>): unknown[] {
  return warn.mock.calls.filter((call: unknown[]) =>
    String(call[0]).includes("could be insecure"),
  );
}

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(fakeNetwork));
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  warn.mockRestore();
});

describe("avertissement Supabase sur l'utilisateur non vérifié", () => {
  it("cause : le niveau d'assurance lu sans jeton, sur un client neuf", async () => {
    // C'est ce que faisait `getAuthState` : un second client, créé après
    // celui de `getUser()`, et `getAuthenticatorAssuranceLevel()` sans
    // argument, qui lit `session.user.factors` dans le cookie.
    const { data } =
      await serverClient().auth.mfa.getAuthenticatorAssuranceLevel();
    expect(data?.nextLevel).toBe("aal2");
    expect(insecureUserWarnings(warn)).toHaveLength(1);
  });

  it("correction : la session se résout sans lire l'utilisateur du cookie", async () => {
    const { getAuthState } = await import("@/lib/session/server");
    // Administrateur au premier niveau, facteur activé : le second
    // facteur reste exigé, et la décision repose sur des données vérifiées.
    expect(await getAuthState()).toBe("mfa-required");
    expect(insecureUserWarnings(warn)).toHaveLength(0);
  });
});
