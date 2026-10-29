import type { Locator, Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * « Comptes-rendus » filtrés par la barre commune (démonstration), pour
 * chaque rôle : le responsable par « À télécharger », le radiologue par
 * clinique, l'équipe par état ; chaque option comptée par le service.
 */

/** La barre de filtres. */
function bar(page: Page) {
  return page.getByRole("group", { name: "Filtres" });
}

/** Le nombre affiché par une puce. */
async function shown(target: Locator): Promise<number> {
  return Number(await target.locator("span[aria-hidden]").first().innerText());
}

test.describe("le responsable de la clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("isole ce qui reste à télécharger, compté", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/comptes-rendus");
    const etats = bar(page).getByRole("group", { name: "État" });
    await expect(etats.getByRole("link")).toHaveText([
      /^Tous les états/,
      /^À télécharger/,
      /^Téléchargés/,
    ]);
    const aTelecharger = etats.getByRole("link", { name: /^À télécharger/ });
    const attendu = await shown(aTelecharger);
    expect(attendu).toBeGreaterThan(0);
    await aTelecharger.click();
    await expect(page).toHaveURL(/[?&]etat=pret(&|$)/);
    const lignes = page.locator("main ul > li");
    await expect(lignes).toHaveCount(attendu);
    for (const ligne of await lignes.all())
      await expect(ligne).toContainText("À télécharger");
    await settle(page);
    await checkA11y();
  });

  test("le tableau de bord mène à ce qui reste à télécharger", async ({
    page,
  }) => {
    await page.goto("/tableau-de-bord");
    await page
      .locator('[data-tour="reports-ready"]')
      .getByRole("link", { name: "Tout voir" })
      .click();
    await expect(page).toHaveURL("/comptes-rendus?etat=pret");
    await expect(
      bar(page)
        .getByRole("group", { name: "État" })
        .getByRole("link", { name: /^À télécharger/ }),
    ).toHaveAttribute("aria-current", "true");
  });

  test("une liste vide à cause des filtres le dit", async ({ page }) => {
    await page.goto("/comptes-rendus?modalite=mammographie&etat=remis");
    await expect(
      page.getByText("Aucun compte-rendu ne correspond à ces filtres"),
    ).toBeVisible();
  });
});

test.describe("le radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("filtre ses comptes-rendus par modalité, sans état à choisir", async ({
    page,
  }) => {
    await page.goto("/comptes-rendus");
    const filtres = bar(page);
    await expect(filtres.getByRole("group", { name: "État" })).toHaveCount(0);
    const modalites = filtres.getByRole("group", { name: "Modalité" });
    const puces = modalites.getByRole("link");
    let choisie = -1;
    let attendu = 0;
    for (let rang = 1; rang < (await puces.count()) && choisie < 0; rang += 1) {
      attendu = await shown(puces.nth(rang));
      if (attendu > 0) choisie = rang;
    }
    expect(choisie).toBeGreaterThan(0);
    await puces.nth(choisie).click();
    await expect(page).toHaveURL(/[?&]modalite=/);
    await expect(page.locator("main ul > li")).toHaveCount(attendu);
  });
});

test.describe("l’équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("combine clinique et état, chaque option comptée", async ({ page }) => {
    await page.goto("/comptes-rendus?clinique=org-stj");
    const etats = bar(page).getByRole("group", { name: "État" });
    const signes = etats.getByRole("link", { name: /^Signés/ });
    const attendu = await shown(signes);
    await signes.click();
    await expect(page).toHaveURL(/clinique=org-stj/);
    await expect(page).toHaveURL(/etat=pret/);
    await expect(page.locator("main ul > li")).toHaveCount(attendu);
  });
});

test.describe("sur téléphone", () => {
  test.use({
    membership: "m-clinic",
    langue: "fr",
    viewport: { width: 390, height: 844 },
  });

  test("tient dans la largeur, chaque filtre actif visible", async ({
    page,
  }) => {
    await page.goto("/comptes-rendus?etat=pret&modalite=scanner");
    await expect(
      bar(page).getByRole("link", { name: /^À télécharger/ }),
    ).toHaveAttribute("aria-current", "true");
    await expect(
      bar(page).getByRole("button", { name: /^Modalité Scanner/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
