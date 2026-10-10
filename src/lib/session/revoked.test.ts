import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { clearRevokedSession, isRevokedSession } from "@/lib/session/revoked";

/**
 * Session révoquée par une déconnexion globale, jeton encore valide
 * localement : sans ce mécanisme, l'écran de connexion et le portail se
 * renvoyaient la page sans fin.
 */

describe("session révoquée : reconnue sans être confondue avec une panne", () => {
  it("session supprimée côté GoTrue : révoquée", async () => {
    expect(
      await isRevokedSession(async () => ({
        error: new AuthSessionMissingError(),
      })),
    ).toBe(true);
  });

  it("compte supprimé ou jeton refusé (4xx) : révoquée", async () => {
    expect(
      await isRevokedSession(async () => ({
        error: new AuthApiError("User not found", 403, "user_not_found"),
      })),
    ).toBe(true);
  });

  it("session ouverte : pas de révocation", async () => {
    expect(await isRevokedSession(async () => ({ error: null }))).toBe(false);
  });

  it("panne, limite de débit ou réseau coupé : pas de révocation", async () => {
    expect(
      await isRevokedSession(async () => ({
        error: new AuthApiError("down", 503, "unexpected_failure"),
      })),
    ).toBe(false);
    expect(
      await isRevokedSession(async () => ({
        error: new AuthApiError("slow down", 429, "over_request_rate_limit"),
      })),
    ).toBe(false);
    expect(
      await isRevokedSession(async () => ({
        error: new AuthRetryableFetchError("fetch failed", 0),
      })),
    ).toBe(false);
    expect(
      await isRevokedSession(async () => {
        throw new TypeError("fetch failed");
      }),
    ).toBe(false);
  });
});

describe("effacement de la session révoquée", () => {
  function request() {
    return new NextRequest("https://imafrik.test/connexion", {
      headers: {
        cookie: [
          "sb-projet-auth-token.0=morceau-0",
          "sb-projet-auth-token.1=morceau-1",
          "sb-projet-auth-token-code-verifier=pkce",
          "imafrik-langue=en",
        ].join("; "),
      },
    });
  }

  it("expire chaque cookie de session sur la réponse, et eux seuls", () => {
    const req = request();
    const { response, cleared } = clearRevokedSession(req, new Headers());
    expect(cleared.sort()).toEqual([
      "sb-projet-auth-token-code-verifier",
      "sb-projet-auth-token.0",
      "sb-projet-auth-token.1",
    ]);
    for (const name of cleared) {
      const cookie = response.cookies.get(name);
      expect(cookie?.value).toBe("");
      expect(cookie?.maxAge).toBe(0);
      expect(cookie?.path).toBe("/");
      expect(cookie?.httpOnly).toBe(true);
    }
    expect(response.cookies.get("imafrik-langue")).toBeUndefined();
  });

  it("le rendu qui suit ne voit plus la session, mais garde la langue", () => {
    const req = request();
    const headers = new Headers({ "x-nonce": "n" });
    clearRevokedSession(req, headers);
    expect(req.cookies.getAll().map(({ name }) => name)).toEqual([
      "imafrik-langue",
    ]);
    expect(headers.get("cookie")).toBe("imafrik-langue=en");
    expect(headers.get("x-nonce")).toBe("n");
  });

  it("sans autre cookie, l'en-tête cookie disparaît", () => {
    const req = new NextRequest("https://imafrik.test/connexion", {
      headers: { cookie: "sb-projet-auth-token=jeton" },
    });
    const headers = new Headers({ cookie: "sb-projet-auth-token=jeton" });
    clearRevokedSession(req, headers);
    expect(headers.has("cookie")).toBe(false);
  });
});
