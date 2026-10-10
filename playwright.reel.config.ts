import { defineConfig, devices } from "@playwright/test";

/**
 * Parcours réels (Playwright) : le vrai Supabase et la vraie API.
 *
 * À l'inverse de `playwright.config.ts`, rien n'est simulé : l'application
 * compilée parle au Supabase local (GoTrue, PostgREST, le hook des jetons,
 * Mailpit) et à l'API du backend lancée depuis son image, sur une base où
 * les migrations du backend ont été appliquées. La pile est démarrée par
 * `tools/parcours-reels/pile.sh`, en CI ; ces parcours ne tournent pas
 * sans elle (voir `docs/tests.md`).
 *
 * - **Un seul processus** : les parcours partagent une base, et l'un
 *   d'eux arrête l'API. Chacun crée néanmoins ses propres comptes et
 *   examens, et n'en suppose aucun autre.
 * - **Adresse du site** (`E2E_SITE_URL`) : celle que le Supabase local
 *   déclare comme adresse du site (`site_url`), et donc celle des liens de
 *   ses courriels. La pile la lit dans la configuration du backend.
 * - **Deux projets** : `reel` d'abord, puis `panne`, qui arrête l'API et
 *   vérifie l'écran d'interruption. La dépendance garantit l'ordre en
 *   local ; la CI les lance l'un après l'autre (`--project`, puis
 *   `--project=panne --no-deps`), pour que la panne soit vérifiée même
 *   quand un parcours précédent a échoué. `E2E_LOT` sépare alors leurs
 *   résultats, que chaque lancement efface sinon.
 */

const BASE_URL = process.env.E2E_SITE_URL ?? "http://127.0.0.1:3000";
const { hostname: HOSTNAME, port: PORT } = new URL(BASE_URL);
const LOT = process.env.E2E_LOT ?? "reel";
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e/reel",
  testMatch: "**/*.spec.ts",
  outputDir: `./test-results/${LOT}`,
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  // Pas de nouvel essai : un parcours réel qui échoue une fois dit quelque
  // chose (un délai, une course), et un second essai le masquerait. Le
  // courriel d'invitation est en outre limité à deux par heure.
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: `playwright-report/${LOT}` }],
        ["github"],
      ]
    : [
        ["list"],
        ["html", { open: "never", outputFolder: `playwright-report/${LOT}` }],
      ],
  use: {
    baseURL: BASE_URL,
    locale: "fr-FR",
    timezoneId: "Africa/Lome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: "reel", testIgnore: "**/panne.spec.ts" },
    { name: "panne", testMatch: "**/panne.spec.ts", dependencies: ["reel"] },
  ],
  webServer: {
    // Compilé au préalable avec les adresses de la pile : les variables
    // `NEXT_PUBLIC_*` sont figées dans le code compilé.
    command: `npx next start --hostname ${HOSTNAME} --port ${PORT}`,
    url: `${BASE_URL}/robots.txt`,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
