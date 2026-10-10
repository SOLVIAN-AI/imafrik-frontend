import { AuthApiError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authCopy } from "@/content/auth";

/**
 * Connexion : les essais répétés sont freinés avant toute question à
 * Supabase, de la même façon qu'un compte existe ou non.
 */

const state = {
  verdict: { allowed: true, delay_ms: 0, retry_after: 0 } as Record<
    string,
    unknown
  >,
  signInError: null as unknown,
  rpcCalls: [] as string[],
  signInCalls: 0,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (fn: string) => {
      state.rpcCalls.push(fn);
      return {
        data: fn === "auth_throttle_attempt" ? state.verdict : null,
        error: null,
      };
    },
    auth: {
      signInWithPassword: async () => {
        state.signInCalls += 1;
        return { error: state.signInError };
      },
    },
  }),
}));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/i18n/cookie", () => ({ writeLanguageCookie: async () => {} }));
vi.mock("@/lib/session/server", () => ({
  tryGetAuthState: async () => ({
    active: { role: "clinic_staff" },
    locale: "fr",
  }),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));

const { signIn } = await import("@/app/(auth)/actions");

const errors = authCopy("fr").signIn.errors;

function form(email: string) {
  const data = new FormData();
  data.set("email", email);
  data.set("password", "mot-de-passe");
  data.set("locale", "fr");
  return data;
}

beforeEach(() => {
  state.verdict = { allowed: true, delay_ms: 0, retry_after: 0 };
  state.signInError = null;
  state.rpcCalls = [];
  state.signInCalls = 0;
});

describe("connexion freinée par la limitation des essais", () => {
  it("bloquée : Supabase n'est pas interrogé, et le délai est annoncé", async () => {
    state.verdict = { allowed: false, delay_ms: 0, retry_after: 600 };
    const result = await signIn({}, form("alice@clinique-a.tg"));
    expect(result).toEqual({ error: errors.locked(10) });
    expect(state.signInCalls).toBe(0);
  });

  it("même réponse pour une adresse sans compte", async () => {
    state.verdict = { allowed: false, delay_ms: 0, retry_after: 600 };
    const known = await signIn({}, form("alice@clinique-a.tg"));
    const unknown = await signIn({}, form("personne@nulle-part.tg"));
    expect(unknown).toEqual(known);
  });

  it("mot de passe faux : le compteur n'est pas effacé", async () => {
    state.signInError = new AuthApiError(
      "Invalid login credentials",
      400,
      "invalid_credentials",
    );
    expect(await signIn({}, form("alice@clinique-a.tg"))).toEqual({
      error: errors.invalid,
    });
    expect(state.rpcCalls).toEqual(["auth_throttle_attempt"]);
  });

  it("connexion réussie : le compteur du compte est effacé", async () => {
    await expect(signIn({}, form("alice@clinique-a.tg"))).rejects.toThrow(
      "redirect:",
    );
    expect(state.signInCalls).toBe(1);
    expect(state.rpcCalls).toEqual([
      "auth_throttle_attempt",
      "auth_throttle_succeeded",
    ]);
  });
});
