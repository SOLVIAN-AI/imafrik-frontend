import { describe, expect, it } from "vitest";

import { isSessionCookie } from "@/lib/supabase/cookies";

describe("isSessionCookie", () => {
  it.each([
    "sb-abcdefgh-auth-token",
    "sb-abcdefgh-auth-token.0",
    "sb-abcdefgh-auth-token.12",
    "sb-abcdefgh-auth-token-code-verifier",
    "sb-127-auth-token",
  ])("reconnaît le cookie de session %s", (name) => {
    expect(isSessionCookie(name)).toBe(true);
  });

  it.each([
    "imafrik-lang",
    "imafrik-demo-membership",
    "sb-abcdefgh-other",
    "xsb-abcdefgh-auth-token",
    "sb-abcdefgh-auth-token.x",
  ])("laisse les autres cookies : %s", (name) => {
    expect(isSessionCookie(name)).toBe(false);
  });
});
