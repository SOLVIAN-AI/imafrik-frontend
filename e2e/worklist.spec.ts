import type { Page, Request } from "@playwright/test";

import { expect, test } from "./support/fixtures";

/**
 * File de lecture du radiologue.
 *
 * - les deux sections (attribués à vous, urgences à prendre), sans les
 *   examens des confrères, que le radiologue ne voit plus ;
 * - la navigation au clavier `j` / `k` et l'ouverture par `Entrée` ;
 * - les filtres, portés par l'adresse et conservés au rechargement ;
 * - la relecture automatique, au plus une toutes les trente secondes,
 *   vérifiée sur une horloge simulée (`page.clock`) plutôt qu'en
 *   attendant réellement.
 */

test.use({ membership: "m-radio", langue: "fr" });

/** Liens des lignes de la file, ceux de la vue affichée (tableau à 1440 px). */
function rowLinks(page: Page) {
  return page.locator("table a[data-row-link]");
}

/**
 * Attend que la file soit hydratée.
 *
 * Le rendu serveur ne connaît pas l'heure du poste : la mesure « En
 * retard » y vaut « — », et ne prend sa valeur qu'au premier rendu
 * client. Son changement prouve que les composants client, dont les
 * raccourcis clavier et la minuterie de relecture, sont branchés.
 */
async function waitForHydration(page: Page): Promise<void> {
  const valeur = page
    .getByText("En retard", { exact: true })
    .locator("xpath=..")
    .locator("span.tabular-nums")
    .first();
  await expect(valeur).toHaveText(/^\d+$/);
}

test("les sections de la file sont affichées", async ({ page }) => {
  await page.goto("/worklist");
  await expect(
    page.getByRole("heading", { level: 1, name: "À lire" }),
  ).toBeVisible();
  const table = page.locator("table");
  await expect(
    table.getByText("Attribués à vous", { exact: true }),
  ).toBeVisible();
  await expect(
    table.getByText("Urgences à prendre", { exact: true }),
  ).toBeVisible();
  // Le radiologue ne voit que ce qu'on lui confie : plus de section des
  // confrères, ni d'examens libres hors urgence.
  await expect(table.getByText(/Chez un confrère/)).toHaveCount(0);
  await expect(rowLinks(page).first()).toBeVisible();
});

test("j et k parcourent la file, Entrée ouvre l'examen", async ({ page }) => {
  await page.goto("/worklist");
  await waitForHydration(page);
  const links = rowLinks(page);
  await expect(links.nth(1)).toBeVisible();

  await page.keyboard.press("j");
  await expect(links.nth(0)).toBeFocused();
  await page.keyboard.press("j");
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press("k");
  await expect(links.nth(0)).toBeFocused();

  const href = await links.nth(0).getAttribute("href");
  expect(href).toMatch(/^\/lecture\//);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(href ?? "");
});

test("un filtre est porté par l'adresse et survit au rechargement", async ({
  page,
}) => {
  await page.goto("/worklist");
  await waitForHydration(page);
  const modalites = page.getByRole("navigation", { name: "Modalités" });
  const ct = modalites.getByRole("link", { name: /^CT/ });
  await expect(ct).not.toHaveAttribute("aria-current");

  await ct.click();
  await expect(page).toHaveURL(/[?&]modalite=CT(&|$)/);
  await expect(ct).toHaveAttribute("aria-current", "true");
  const filtrees = await rowLinks(page).count();
  expect(filtrees).toBeGreaterThan(0);
  // Chaque ligne restante est un scanner.
  await expect(
    page.locator("table tbody tr:has(a[data-row-link]) td:nth-child(3)"),
  ).toHaveText(Array(filtrees).fill(/^CT/));

  await page.reload();
  await expect(page).toHaveURL(/[?&]modalite=CT(&|$)/);
  await expect(ct).toHaveAttribute("aria-current", "true");
  await expect(rowLinks(page)).toHaveCount(filtrees);

  // La clinique s'ajoute au filtre de modalité.
  const clinique = page.getByRole("combobox", { name: "Clinique" });
  const valeur = await clinique.locator("option").nth(1).getAttribute("value");
  expect(valeur).toBeTruthy();
  await clinique.selectOption(valeur ?? "");
  await expect(page).toHaveURL(new RegExp(`[?&]clinique=${valeur}(&|$)`));
  await expect(page).toHaveURL(/[?&]modalite=CT(&|$)/);

  await page.getByRole("link", { name: "Retirer les filtres" }).click();
  await expect(page).toHaveURL("/worklist");
  await expect(ct).not.toHaveAttribute("aria-current");
});

test("la file se relit au plus une fois toutes les trente secondes", async ({
  page,
}) => {
  // Horloge simulée : minuteries et `Date` sous le contrôle du test.
  await page.clock.install();
  const relectures: Request[] = [];
  page.on("request", (request) => {
    const headers = request.headers();
    // Une relecture du routeur : requête RSC de la page, hors préchargement.
    if (
      headers["rsc"] === "1" &&
      !headers["next-router-prefetch"] &&
      new URL(request.url()).pathname === "/worklist"
    )
      relectures.push(request);
  });

  await page.goto("/worklist");
  await waitForHydration(page);
  // Le temps cesse de s'écouler de lui-même : seul le test le fait avancer.
  // Une seconde de marge, pour que l'instant visé ne soit pas déjà passé
  // quand l'ordre arrive.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1_000));

  // L'horloge avance seconde par seconde, et non d'un bloc : le routeur a
  // besoin de ses propres minuteries pour traiter la réponse d'une
  // relecture. Chaque relecture est datée à la seconde près, et sa réponse
  // attendue avant d'avancer encore.
  //
  // Le temps simulé file bien plus vite que le rendu : sur une machine
  // chargée, une relecture peut ne pas être terminée au battement suivant,
  // qui est alors sauté à dessein (`useAutoRefresh` n'empile pas les
  // relectures). Le test vérifie donc la règle, pas un horaire exact :
  // jamais deux relectures dans la même fenêtre de trente secondes,
  // toujours sur un battement, et la relecture continue de tourner.
  const ATTENDUES = 3;
  const LIMITE_S = 300;
  const instants: number[] = [];
  for (
    let seconde = 1;
    seconde <= LIMITE_S && instants.length < ATTENDUES;
    seconde++
  ) {
    await page.clock.runFor(1_000);
    while (instants.length < relectures.length) {
      const relecture = relectures[instants.length];
      instants.push(seconde);
      expect((await relecture.response())?.status()).toBe(200);
    }
  }

  expect(instants, "relectures observées (secondes simulées)").toHaveLength(
    ATTENDUES,
  );
  // La première arrive au premier battement, trente secondes après le
  // montage de l'écran ; le décompte part de la mise en pause, qui le suit
  // d'une seconde de marge et du temps d'attente de l'hydratation.
  expect(instants[0]).toBeGreaterThanOrEqual(26);
  expect(instants[0]).toBeLessThanOrEqual(32);
  for (let i = 1; i < instants.length; i++) {
    const ecart = instants[i] - instants[i - 1];
    // Un multiple de trente secondes, à l'arrivée de l'événement près.
    expect(ecart).toBeGreaterThanOrEqual(28);
    expect(Math.abs(ecart - 30 * Math.round(ecart / 30))).toBeLessThanOrEqual(
      2,
    );
  }
});

/**
 * Le compte des urgences à prendre reste dans le titre de l'onglet : Next
 * réécrit `<title>` après l'hydratation, et un compte posé à la main dans
 * `document.title` disparaissait aussitôt. Il est désormais calculé côté
 * serveur, dans les métadonnées de la page (`generateMetadata`, qui lit la
 * file par `loadQueue`, `app/(app)/worklist/page.tsx`).
 */
test("le titre de l’onglet compte les urgences à prendre", async ({ page }) => {
  await page.goto("/worklist");
  await waitForHydration(page);
  await expect(page).toHaveTitle(/^\(2\) À lire/);
  // Toujours là après un rechargement complet.
  await page.reload();
  await waitForHydration(page);
  await expect(page).toHaveTitle(/^\(2\) À lire/);
});
