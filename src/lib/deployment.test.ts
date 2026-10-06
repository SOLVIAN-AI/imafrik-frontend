import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Charge le module après avoir posé l'environnement : les modules de configuration le lisent au chargement. */
async function load(env: Record<string, string>) {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return import("@/lib/deployment");
}

const COMPLETE = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  NEXT_PUBLIC_API_URL: "https://api.imafrik.tech",
  NEXT_PUBLIC_VIEWER_URL: "https://viewer.imafrik.tech/viewer",
  NEXT_PUBLIC_SITE_URL: "https://imafrik.tech",
};

describe("mustRefuseToServe", () => {
  it("sert une production complète", async () => {
    const { mustRefuseToServe } = await load({
      ...COMPLETE,
      VERCEL_ENV: "production",
    });
    expect(mustRefuseToServe()).toBe(false);
  });

  it("refuse une production à laquelle manque l'adresse du viewer", async () => {
    const { missingProductionConfig, mustRefuseToServe } = await load({
      ...COMPLETE,
      NEXT_PUBLIC_VIEWER_URL: "",
      VERCEL_ENV: "production",
    });
    expect(mustRefuseToServe()).toBe(true);
    expect(missingProductionConfig().map((entry) => entry.name)).toEqual([
      "NEXT_PUBLIC_VIEWER_URL",
    ]);
  });

  it("laisse un aperçu tourner sur la démonstration", async () => {
    const { mustRefuseToServe } = await load({ VERCEL_ENV: "preview" });
    expect(mustRefuseToServe()).toBe(false);
  });
});
