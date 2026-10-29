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
  // La barre de filtres commune : les modalités par groupe, comme partout.
  const modalites = page.getByRole("group", { name: "Modalité" });
  const scanner = modalites.getByRole("link", { name: /^Scanner/ });
  await expect(scanner).not.toHaveAttribute("aria-current");

  await scanner.click();
  await expect(page).toHaveURL(/[?&]modalite=scanner(&|$)/);
  await expect(scanner).toHaveAttribute("aria-current", "true");
  const filtrees = await rowLinks(page).count();
  expect(filtrees).toBeGreaterThan(0);
  // Chaque ligne restante est un scanner, et la puce le compte.
  await expect(
    page.locator("table tbody tr:has(a[data-row-link]) td:nth-child(3)"),
  ).toHaveText(Array(filtrees).fill(/^CT/));
  await expect(scanner).toContainText(String(filtrees));

  await page.reload();
  await expect(page).toHaveURL(/[?&]modalite=scanner(&|$)/);
  await expect(scanner).toHaveAttribute("aria-current", "true");
  await expect(rowLinks(page)).toHaveCount(filtrees);

  // La clinique s'ajoute au filtre de modalité, depuis sa liste.
  const clinique = page.getByRole("button", { name: /^Clinique / });
  await expect(clinique).toContainText("Toutes les cliniques");
  await clinique.click();
  const premiere = page.getByRole("listbox").getByRole("option").nth(1);
  const nom = (await premiere.innerText()).split("\n")[0].trim();
  await premiere.click();
  await expect(page).toHaveURL(/[?&]clinique=[^&]+/);
  await expect(page).toHaveURL(/[?&]modalite=scanner(&|$)/);
  await expect(clinique).toContainText(nom);

  await page.getByRole("link", { name: "Effacer les filtres" }).click();
  await expect(page).toHaveURL("/worklist");
  await expect(scanner).not.toHaveAttribute("aria-current");
});

/**
 * L'ancienne file écrivait des codes DICOM (`?modalite=CT`) : un favori
 * ouvre le groupe de son premier code. Un mot qui ressemblait à un code
 * (`?modalite=SCANNER`) vidait la file ; il est ignoré.
 */
test("un ancien lien ouvre son groupe, un mot inconnu ne vide plus la file", async ({
  page,
}) => {
  await page.goto("/worklist");
  const toutes = await rowLinks(page).count();
  expect(toutes).toBeGreaterThan(0);

  await page.goto("/worklist?modalite=CT");
  await expect(
    page
      .getByRole("group", { name: "Modalité" })
      .getByRole("link", { name: /^Scanner/ }),
  ).toHaveAttribute("aria-current", "true");

  await page.goto("/worklist?modalite=SCANNER");
  await expect(rowLinks(page)).toHaveCount(toutes);
});

/**
 * Les filtres passent par le service, qui compte chaque option sur la file
 * entière : les urgences seules, puis toutes.
 */
test("les urgences se filtrent depuis la barre", async ({ page }) => {
  await page.goto("/worklist");
  const urgences = page
    .getByRole("group", { name: "Filtres" })
    .getByRole("link", { name: "Urgences", exact: true });
  await urgences.click();
  await expect(page).toHaveURL(/[?&]urgent=1(&|$)/);
  await expect(urgences).toHaveAttribute("aria-current", "true");
  const lignes = page.locator("main table tbody tr:has(a[data-row-link])");
  const nombre = await lignes.count();
  expect(nombre).toBeGreaterThan(0);
  for (const ligne of await lignes.all())
    await expect(ligne.getByText("Urgent", { exact: true })).toBeVisible();
  await urgences.click();
  await expect(page).toHaveURL("/worklist");
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

/**
 * « Mes examens » se cherche et se filtre comme « À lire » : recherche
 * hors de l'adresse, barre commune comptée par le service.
 */
test("« Mes examens » se cherche et se filtre comme la file", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/mes-examens");
  const lignes = page.locator("main table tbody tr:has(a[data-row-link])");
  const toutes = await lignes.count();
  expect(toutes).toBeGreaterThan(0);
  const modalites = page.getByRole("group", { name: "Modalité" });
  await expect(
    modalites.getByRole("link", { name: /^Toutes les modalités/ }),
  ).toContainText(String(toutes));
  await checkA11y();

  // La première modalité présente : la liste se réduit à ses examens,
  // autant que la puce en annonçait.
  const puces = modalites.getByRole("link");
  let choisie = -1;
  let attendu = 0;
  for (let rang = 1; rang < (await puces.count()) && choisie < 0; rang += 1) {
    // Le nombre affiché, pas sa forme en toutes lettres (« , 3 examens »).
    attendu = Number(
      await puces.nth(rang).locator("span[aria-hidden]").innerText(),
    );
    if (attendu > 0) choisie = rang;
  }
  expect(choisie).toBeGreaterThan(0);
  await puces.nth(choisie).click();
  await expect(page).toHaveURL(/[?&]modalite=/);
  await expect(puces.nth(choisie)).toHaveAttribute("aria-current", "true");
  await expect(lignes).toHaveCount(attendu);

  // La recherche ne passe pas par l'adresse.
  const champ = page.getByRole("searchbox", {
    name: "Rechercher un patient ou une modalité",
  });
  await champ.fill("zzzz");
  await champ.press("Enter");
  await expect(page.getByText("Aucun résultat")).toBeVisible();
  expect(page.url()).not.toContain("zzzz");
  await champ.fill("");
  await champ.press("Enter");
  await expect(lignes.first()).toBeVisible();
});
