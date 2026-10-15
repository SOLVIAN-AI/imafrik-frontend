import { afterEach, describe, expect, it, vi } from "vitest";

/** Service configuré ou non, comme le voient robots.ts et sitemap.ts. */
const configured = vi.hoisted(() => ({ value: true }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => configured.value,
}));
vi.mock("@/lib/api/config", () => ({
  isApiConfigured: () => configured.value,
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

afterEach(() => {
  configured.value = true;
  vi.unstubAllEnvs();
});

/** Règle unique de robots.ts, sous forme de liste. */
function rule() {
  const rules = robots().rules;
  return Array.isArray(rules) ? rules[0] : rules;
}

describe("indexation de la connexion", () => {
  it("est ouverte à l'adresse exacte seulement", () => {
    const allow = [rule().allow ?? []].flat();
    expect(allow).toContain("/connexion$");
    expect(allow).not.toContain("/connexion");
    expect(rule().disallow).toBe("/");
  });

  it("figure au plan du site, une seule fois", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://imafrik.tech");
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.filter((url) => url.endsWith("/connexion"))).toEqual([
      "https://imafrik.tech/connexion",
    ]);
  });

  it("reste fermée, comme tout le reste, sur un aperçu non configuré", () => {
    configured.value = false;
    expect(rule()).toEqual({ userAgent: "*", disallow: "/" });
    expect(sitemap()).toEqual([]);
  });
});
