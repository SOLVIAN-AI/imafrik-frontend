import { afterEach, describe, expect, it, vi } from "vitest";

import { contentSecurityPolicy, createNonce } from "@/lib/security/csp";

afterEach(() => vi.unstubAllEnvs());

describe("contentSecurityPolicy", () => {
  it("n'autorise un script que porteur du nonce de la requête", () => {
    const policy = contentSecurityPolicy("abc", true);
    expect(policy).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });

  it("ne réécrit en HTTPS que sur une page servie en HTTPS", () => {
    expect(contentSecurityPolicy("n", true)).toContain(
      "upgrade-insecure-requests",
    );
    expect(contentSecurityPolicy("n", false)).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("n'ouvre que le viewer en cadre et que l'API en connexion", () => {
    vi.stubEnv("NEXT_PUBLIC_VIEWER_URL", "https://viewer.imafrik.tech/viewer");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.imafrik.tech");
    const policy = contentSecurityPolicy("n", true);
    expect(policy).toContain("frame-src https://viewer.imafrik.tech");
    expect(policy).toContain("connect-src 'self' https://api.imafrik.tech");
  });

  it("produit un nonce différent à chaque appel", () => {
    expect(createNonce()).not.toBe(createNonce());
  });
});
