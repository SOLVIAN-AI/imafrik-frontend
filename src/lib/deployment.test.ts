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
  REPORT_BACKUP_SECRET: "s".repeat(48),
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

describe("contrôles propres à IMAFRIK", () => {
  it("protège aussi un hébergement hors Vercel déclaré en production", async () => {
    const { mustRefuseToServe } = await load({ IMAFRIK_ENV: "production" });
    expect(mustRefuseToServe()).toBe(true);
  });

  it("exige un secret des copies de secours assez long", async () => {
    const { missingProductionConfig } = await load({
      ...COMPLETE,
      REPORT_BACKUP_SECRET: "trop-court",
      VERCEL_ENV: "production",
    });
    expect(missingProductionConfig().map((entry) => entry.name)).toEqual([
      "REPORT_BACKUP_SECRET",
    ]);
  });

  it("refuse un viewer servi depuis l'origine du site", async () => {
    const { missingProductionConfig } = await load({
      ...COMPLETE,
      NEXT_PUBLIC_VIEWER_URL: "https://imafrik.tech/viewer",
      VERCEL_ENV: "production",
    });
    const missing = missingProductionConfig();
    expect(missing).toHaveLength(1);
    expect(missing[0].name).toBe("NEXT_PUBLIC_VIEWER_URL");
    expect(missing[0].purpose).toBe("viewerIsolation");
  });
});
