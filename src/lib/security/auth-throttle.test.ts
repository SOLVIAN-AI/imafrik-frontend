import { afterEach, describe, expect, it, vi } from "vitest";

import {
  attemptSucceeded,
  beginAttempt,
  normalizeAccount,
  pause,
  retryMinutes,
  throttleKeys,
  type RpcClient,
} from "@/lib/security/auth-throttle";

/**
 * Limitation des essais de connexion, côté serveur de l'application.
 * Les seuils eux-mêmes sont testés en base (backend, db/tests).
 */

const SECRET = "x".repeat(48);
const HEX64 = /^[0-9a-f]{64}$/;

/** Client simulé : enregistre les appels, répond ce qu'on lui dit. */
function client(answer: { data: unknown; error: unknown }) {
  const calls: { fn: string; args: Record<string, string> }[] = [];
  const rpc: RpcClient["rpc"] = async (fn, args) => {
    calls.push({ fn, args });
    return answer;
  };
  return { rpc, calls };
}

function visitorHeaders(ip = "203.0.113.7") {
  return new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` });
}

afterEach(() => vi.restoreAllMocks());

describe("clés opaques", () => {
  it("ne transmettent ni l'adresse de courriel ni l'adresse IP", () => {
    const keys = throttleKeys(
      "password",
      "alice@clinique-a.tg",
      "203.0.113.7",
      SECRET,
    );
    expect(keys.account).toMatch(HEX64);
    expect(keys.visitor).toMatch(HEX64);
    expect(JSON.stringify(keys)).not.toContain("alice");
    expect(JSON.stringify(keys)).not.toContain("203.0.113.7");
  });

  it("une même adresse, quelle qu'en soit la casse, a un seul quota", () => {
    expect(normalizeAccount("  Alice@Clinique-A.tg ")).toBe(
      "alice@clinique-a.tg",
    );
    expect(
      throttleKeys("password", "Alice@Clinique-A.tg ", null, SECRET).account,
    ).toBe(
      throttleKeys("password", "alice@clinique-a.tg", null, SECRET).account,
    );
  });

  it("mot de passe et code, compte et visiteur, secrets : des clés distinctes", () => {
    const password = throttleKeys("password", "u-1", "203.0.113.7", SECRET);
    const totp = throttleKeys("totp", "u-1", "203.0.113.7", SECRET);
    expect(password.account).not.toBe(totp.account);
    expect(password.visitor).not.toBe(totp.visitor);
    expect(password.account).not.toBe(password.visitor);
    expect(
      throttleKeys("password", "u-1", null, "y".repeat(48)).account,
    ).not.toBe(throttleKeys("password", "u-1", null, SECRET).account);
  });
});

describe("un essai", () => {
  it("permis : transmet les clés du compte et du visiteur réel", async () => {
    const supabase = client({
      data: { allowed: true, delay_ms: 0, retry_after: 0 },
      error: null,
    });
    const verdict = await beginAttempt(
      supabase,
      "password",
      "alice@clinique-a.tg",
      visitorHeaders(),
    );
    expect(verdict.allowed).toBe(true);
    expect(supabase.calls).toHaveLength(1);
    expect(supabase.calls[0].fn).toBe("auth_throttle_attempt");
    const expected = throttleKeys(
      "password",
      "alice@clinique-a.tg",
      "203.0.113.7",
    );
    expect(supabase.calls[0].args).toEqual({
      p_account: expected.account,
      p_visitor: expected.visitor,
    });
  });

  it("ralenti : l'attente imposée est observée, bornée à 8 s", async () => {
    const wait = vi.spyOn(pause, "wait").mockResolvedValue();
    await beginAttempt(
      client({
        data: { allowed: true, delay_ms: 4000, retry_after: 0 },
        error: null,
      }),
      "password",
      "a@b.tg",
      visitorHeaders(),
    );
    expect(wait).toHaveBeenCalledWith(4000);
    await beginAttempt(
      client({
        data: [{ allowed: true, delay_ms: 60000, retry_after: 0 }],
        error: null,
      }),
      "password",
      "a@b.tg",
      visitorHeaders(),
    );
    expect(wait).toHaveBeenLastCalledWith(8000);
  });

  it("bloqué : aucun essai, et le délai avant de réessayer", async () => {
    const wait = vi.spyOn(pause, "wait").mockResolvedValue();
    const verdict = await beginAttempt(
      client({
        data: { allowed: false, delay_ms: 0, retry_after: 845 },
        error: null,
      }),
      "totp",
      "u-1",
      visitorHeaders(),
    );
    expect(verdict).toEqual({ allowed: false, retryAfterSeconds: 845 });
    expect(wait).not.toHaveBeenCalled();
    expect(retryMinutes(845)).toBe(15);
    expect(retryMinutes(20)).toBe(1);
  });

  it("base indisponible ou réponse inattendue : l'essai passe, sans attente", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const wait = vi.spyOn(pause, "wait").mockResolvedValue();
    for (const answer of [
      { data: null, error: new Error("PostgREST ne répond pas") },
      { data: { allowed: "oui" }, error: null },
    ]) {
      const verdict = await beginAttempt(
        client(answer),
        "password",
        "a@b.tg",
        visitorHeaders(),
      );
      expect(verdict.allowed).toBe(true);
    }
    expect(wait).not.toHaveBeenCalled();
  });

  it("une réussite efface le compteur, et son échec ne fait rien échouer", async () => {
    const keys = throttleKeys("password", "a@b.tg", null);
    const ok = client({ data: null, error: null });
    await attemptSucceeded(ok, keys);
    expect(ok.calls).toEqual([
      {
        fn: "auth_throttle_succeeded",
        args: { p_account: keys.account, p_visitor: keys.visitor },
      },
    ]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      attemptSucceeded(client({ data: null, error: new Error("panne") }), keys),
    ).resolves.toBeUndefined();
  });
});
