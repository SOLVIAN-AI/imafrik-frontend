import { defineConfig, devices } from "@playwright/test";

/**
 * Vidéo de démonstration (Playwright), filmée sur le jeu de démonstration.
 *
 * Ce n'est pas une suite de tests : un seul scénario, `e2e/demo/`, que
 * Playwright enregistre en vidéo pour le présenter à des cliniques et à
 * des radiologues. `playwright.config.ts` l'écarte de la suite normale.
 *
 * - **Mode démonstration**, comme la suite normale : les variables
 *   Supabase et API sont forcées à vide, ni Supabase ni l'API ne sont
 *   appelés.
 * - **Serveur neuf à chaque prise** (`reuseExistingServer: false`) : le
 *   jeu de démonstration date ses examens à partir du démarrage du
 *   serveur. Un serveur lancé depuis une heure afficherait un examen
 *   « reçu il y a 8 min » comme reçu il y a plus d'une heure.
 * - **Compilation** avant le démarrage, sauf `E2E_SKIP_BUILD=1` : la
 *   compilation présente doit alors avoir été faite en mode
 *   démonstration.
 * - **Sortie** : `DEMO_VIDEO_OUT` (par défaut `test-results/demo-video`),
 *   où l'assemblage (`tools/demo-video/assembler.sh`) va chercher la
 *   vidéo et les captures.
 *
 * Voir `docs/video-demo.md`.
 */

/** Port dédié, distinct de `next dev` (3000) et de la suite normale (3200). */
const PORT = Number(process.env.DEMO_PORT ?? 3210);
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = process.env.DEMO_VIDEO_OUT ?? "./test-results/demo-video";
const VIEWPORT = { width: 1440, height: 900 };

/** Environnement du mode démonstration (voir `playwright.config.ts`). */
const DEMO_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  NEXT_PUBLIC_API_URL: "",
  NEXT_PUBLIC_SITE_URL: "",
  NEXT_PUBLIC_VIEWER_URL: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
  IMAFRIK_ENV: "",
  VERCEL_ENV: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

const start = `npx next start --port ${PORT}`;

export default defineConfig({
  testDir: "./e2e/demo",
  testMatch: "**/*.spec.ts",
  outputDir: OUTPUT_DIR,
  fullyParallel: false,
  workers: 1,
  // Une prise ratée se refait à la main : un second essai écraserait la
  // vidéo de la première sans le dire.
  retries: 0,
  timeout: 8 * 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    locale: "fr-FR",
    timezoneId: "Africa/Lome",
    viewport: VIEWPORT,
    video: { mode: "on", size: VIEWPORT },
    trace: "retain-on-failure",
    screenshot: "off",
  },
  projects: [{ name: "video" }],
  webServer: {
    command: process.env.E2E_SKIP_BUILD ? start : `npx next build && ${start}`,
    url: `${BASE_URL}/robots.txt`,
    env: DEMO_ENV,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
