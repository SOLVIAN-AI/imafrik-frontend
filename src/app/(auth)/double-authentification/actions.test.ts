import { beforeEach, describe, expect, it, vi } from "vitest";

import { messagesFor } from "@/i18n";

/**
 * Vérification du code TOTP : les essais répétés d'un même compte sont
 * freinés avant toute question à Supabase.
 */

const state = {
  verdict: { allowed: true, delay_ms: 0, retry_after: 0 } as Record<
    string,
    unknown
  >,
  rpcCalls: [] as { fn: string; args: Record<string, string> }[],
  verifyCalls: 0,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (fn: string, args: Record<string, string>) => {
      state.rpcCalls.push({ fn, args });
      return {
        data: fn === "auth_throttle_attempt" ? state.verdict : null,
        error: null,
      };
    },
    auth: {
      getClaims: async () => ({
        data: { claims: { sub: "u-1", aal: "aal1" } },
        error: null,
      }),
      mfa: {
        challengeAndVerify: async () => {
          state.verifyCalls += 1;
          return { error: { status: 422 } };
        },
      },
    },
  }),
}));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => false }));
vi.mock("@/i18n/server", () => ({
  getMessages: async () => ({ t: messagesFor("fr"), locale: "fr" }),
}));
vi.mock("@/lib/session/server", () => ({
  tryGetAuthState: async () => "mfa-required",
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.7" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));

const { verifyCode } =
  await import("@/app/(auth)/double-authentification/actions");
const { throttleKeys } = await import("@/lib/security/auth-throttle");

const t = messagesFor("fr");

beforeEach(() => {
  state.verdict = { allowed: true, delay_ms: 0, retry_after: 0 };
  state.rpcCalls = [];
  state.verifyCalls = 0;
});

describe("code TOTP freiné par la limitation des essais", () => {
  it("bloqué : le code n'est pas soumis, et le délai est annoncé", async () => {
    state.verdict = { allowed: false, delay_ms: 0, retry_after: 900 };
    const result = await verifyCode("f-1", "123 456", "");
    expect(result).toEqual({
      ok: false,
      error: t.session.mfa.errors.locked(15),
      status: 429,
    });
    expect(state.verifyCalls).toBe(0);
  });

  it("le quota suit le compte du jeton vérifié, pas le facteur désigné", async () => {
    await verifyCode("f-1", "123456", "");
    await verifyCode("f-autre", "123456", "");
    const expected = throttleKeys("totp", "u-1", "203.0.113.7");
    for (const call of state.rpcCalls) {
      expect(call).toEqual({
        fn: "auth_throttle_attempt",
        args: { p_account: expected.account, p_visitor: expected.visitor },
      });
    }
    expect(state.verifyCalls).toBe(2);
  });
});
