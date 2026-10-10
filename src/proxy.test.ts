import { AuthApiError, AuthSessionMissingError } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Proxy face à une session révoquée côté Supabase (déconnexion globale
 * depuis un autre appareil) dont le jeton reste valide localement.
 *
 * Avant la correction, `/connexion` renvoyait vers le portail (jeton
 * valide), le portail vers `/connexion` (`getUser` refusé) : une boucle.
 */

const auth = {
  claims: {
    aal: "aal2",
    user_role: "clinic_staff",
    mfa_required: false,
  } as Record<string, unknown> | null,
  userError: null as unknown,
  getUserCalls: 0,
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getClaims: async () => ({
        data: auth.claims ? { claims: auth.claims } : null,
        error: null,
      }),
      getUser: async () => {
        auth.getUserCalls += 1;
        return { data: { user: null }, error: auth.userError };
      },
    },
  }),
}));
vi.mock("@/lib/deployment", () => ({ mustRefuseToServe: () => false }));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/supabase/env", () => ({
  supabaseEnv: () => ({ url: "https://projet.supabase.co", anonKey: "anon" }),
}));

const { proxy } = await import("@/proxy");

const SESSION = "sb-projet-auth-token";

function visit(path: string) {
  return proxy(
    new NextRequest(`https://imafrik.test${path}`, {
      headers: { cookie: `${SESSION}=jeton; imafrik-langue=fr` },
    }),
  );
}

beforeEach(() => {
  auth.claims = { aal: "aal2", user_role: "clinic_staff", mfa_required: false };
  auth.userError = null;
  auth.getUserCalls = 0;
});

describe("connexion avec un jeton valide localement", () => {
  it("session ouverte : renvoi vers le portail, comme avant", async () => {
    const response = await visit("/connexion");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).not.toContain("/connexion");
    expect(response.cookies.get(SESSION)).toBeUndefined();
  });

  it("session révoquée : la connexion s'affiche et la session est effacée", async () => {
    auth.userError = new AuthSessionMissingError();
    const response = await visit("/connexion");
    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
    const cleared = response.cookies.get(SESSION);
    expect(cleared?.value).toBe("");
    expect(cleared?.maxAge).toBe(0);
    expect(response.headers.get("content-security-policy")).toBeTruthy();
  });

  it("panne de GoTrue : pas d'effacement, renvoi vers le portail", async () => {
    auth.userError = new AuthApiError("down", 503, "unexpected_failure");
    const response = await visit("/connexion");
    expect(response.status).toBe(307);
    expect(response.cookies.get(SESSION)).toBeUndefined();
  });
});

describe("ailleurs, la vérification reste locale", () => {
  it("un écran du portail n'interroge pas GoTrue", async () => {
    auth.userError = new AuthSessionMissingError();
    await visit("/clinique");
    expect(auth.getUserCalls).toBe(0);
  });

  it("sans jeton valide, la connexion s'affiche sans appel", async () => {
    auth.claims = null;
    const response = await visit("/connexion");
    expect(response.status).toBe(200);
    expect(auth.getUserCalls).toBe(0);
  });
});
