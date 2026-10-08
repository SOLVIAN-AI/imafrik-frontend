import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout (Playwright).
 *
 * Ils tournent contre une **compilation de production** servie par
 * `next start`, en mode démonstration : les variables Supabase et API sont
 * forcées à vide, ce qui fait servir le jeu de démonstration intégré. Une
 * chaîne vide l'emporte sur `.env.local` (Next ne remplace pas une
 * variable déjà définie dans l'environnement), si bien qu'un poste
 * configuré pour le staging lance les mêmes tests que la CI.
 *
 * Par défaut, le serveur web compile avant de démarrer : une compilation
 * précédente a pu être faite avec Supabase configuré, et les variables
 * `NEXT_PUBLIC_*` sont figées dans le code compilé. La CI compile dans une
 * étape à part et pose `E2E_SKIP_BUILD=1` pour ne pas compiler deux fois.
 *
 * Voir `docs/tests.md`.
 */

/** Port dédié, distinct de celui de `next dev` (3000), pour cohabiter avec lui. */
const PORT = Number(process.env.E2E_PORT ?? 3200);
const BASE_URL = `http://localhost:${PORT}`;
const CI = Boolean(process.env.CI);

/**
 * Environnement du mode démonstration, partagé par la compilation et le
 * serveur.
 */
const DEMO_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  NEXT_PUBLIC_API_URL: "",
  NEXT_PUBLIC_SITE_URL: "",
  NEXT_PUBLIC_VIEWER_URL: "",
  // Une production incomplète refuse de servir : ces deux signaux ne
  // doivent pas fuir d'un environnement de déploiement vers les tests.
  IMAFRIK_ENV: "",
  VERCEL_ENV: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

const start = `npx next start --port ${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "./test-results",
  // Les tests ne modifient pas l'état du serveur de démonstration : ils
  // peuvent tourner en parallèle, fichier par fichier comme test par test.
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // Deux processus sur les machines GitHub (deux cœurs) : au-delà, le
  // serveur Next devient le goulot et les temps de réponse dérivent.
  workers: CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: CI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
        ["github"],
      ]
    : [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
      ],
  use: {
    baseURL: BASE_URL,
    locale: "fr-FR",
    timezoneId: "Africa/Lome",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: process.env.E2E_SKIP_BUILD ? start : `npx next build && ${start}`,
    url: `${BASE_URL}/robots.txt`,
    env: DEMO_ENV,
    // Hors CI, un serveur déjà lancé sur le port est réutilisé : il doit
    // alors avoir été compilé en mode démonstration.
    reuseExistingServer: !CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
