import type { Locator, Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * Pilotage de l'équipe IMAFRIK sur la barre commune (démonstration) :
 * flux d'images filtré par le service avant sa limite, relevés du mois et
 * passerelles filtrés sur la page, activité par clinique.
 */

test.use({ membership: "m-admin", langue: "fr" });

/** La barre de filtres. */
function bar(page: Page) {
  return page.getByRole("group", { name: "Filtres" });
}

/** Le nombre affiché par une puce. */
async function shown(target: Locator): Promise<number> {
  return Number(await target.locator("span[aria-hidden]").first().innerText());
}

test("le flux d’images se filtre par modalité, état et urgence", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/flux");
  const filtres = bar(page);
  await filtres
    .getByRole("group", { name: "Modalité" })
    .getByRole("link", { name: /^Scanner/ })
    .click();
  await expect(page).toHaveURL(/[?&]modalite=scanner(&|$)/);
  await expect(
    filtres.getByRole("link", { name: "Effacer les filtres" }),
  ).toBeVisible();
  // Chaque examen montré est un scanner : sa seconde ligne commence par CT.
  const lignes = page.locator("main li.grid");
  await expect(lignes.first()).toBeVisible();
  for (const ligne of await lignes.all())
    await expect(ligne.locator("p").nth(1)).toHaveText(/^CT/);
  await filtres.getByRole("link", { name: "Urgences" }).click();
  await expect(page).toHaveURL(/[?&]urgent=1(&|$)/);
  await settle(page);
  await checkA11y();
});

test("la facturation isole les cliniques sans formule", async ({ page }) => {
  await page.goto("/admin/facturation");
  const sansFormule = bar(page).getByRole("link", { name: /^Sans formule/ });
  const attendu = await shown(sansFormule);
  await sansFormule.click();
  await expect(page).toHaveURL(/[?&]sans-formule=1(&|$)/);
  if (attendu === 0)
    await expect(
      page.getByText("Aucun relevé ne correspond à ces filtres"),
    ).toBeVisible();
  // Le mois suivant ou précédent garde le filtre.
  await page.getByRole("link", { name: "Mois précédent" }).click();
  await expect(page).toHaveURL(/[?&]sans-formule=1(&|$)/);
  await expect(page).toHaveURL(/[?&]mois=/);
});

test("les passerelles se filtrent par clinique et par silence", async ({
  page,
}) => {
  await page.goto("/admin/passerelles");
  const filtres = bar(page);
  const muettes = filtres.getByRole("link", { name: /^Muettes/ });
  await expect(muettes).toBeVisible();
  await filtres.getByRole("button", { name: /^Clinique / }).click();
  const premiere = page
    .getByRole("listbox", { name: "Clinique" })
    .getByRole("option")
    .nth(1);
  const nom = (await premiere.innerText()).split("\n")[0].trim();
  const attendu = await shown(premiere);
  await premiere.click();
  await expect(page).toHaveURL(/[?&]clinique=/);
  const lignes = page.getByRole("table").locator("tbody tr");
  await expect(lignes).toHaveCount(attendu);
  for (const ligne of await lignes.all())
    await expect(ligne).toContainText(nom);
});

test("l’activité propose « Toutes les cliniques » et garde la rubrique", async ({
  page,
}) => {
  await page.goto("/admin/activite?onglet=cliniques");
  await expect(
    page.getByRole("button", { name: /^Clinique Toutes les cliniques/ }),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("link", { name: "Clinique Saint-Joseph" })
    .first()
    .click();
  await expect(page).toHaveURL(/onglet=cliniques/);
  await expect(page).toHaveURL(/clinique=org-stj/);
});

test("l’activité se filtre par modalité, d’une période et d’une rubrique à l’autre", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/activite");
  await bar(page)
    .getByRole("group", { name: "Modalité" })
    .getByRole("link", { name: /^Scanner/ })
    .click();
  await expect(page).toHaveURL(/[?&]modalite=scanner(&|$)/);
  // Le bloc « Modalités » (son titre et sa liste) ne garde que le code
  // du scanner.
  const modalites = page
    .getByRole("main")
    .locator("div")
    .filter({
      has: page.getByRole("heading", { name: "Modalités", exact: true }),
    })
    .filter({ has: page.getByRole("list") })
    .last();
  await expect(modalites.getByRole("listitem")).toHaveCount(1);
  await expect(modalites.getByRole("listitem")).toContainText("CT");
  await settle(page);
  await checkA11y();

  // La période et la rubrique gardent la modalité.
  await page.getByRole("link", { name: "7 j", exact: true }).click();
  await expect(page).toHaveURL(/[?&]jours=7(&|$)/);
  await expect(page).toHaveURL(/[?&]modalite=scanner(&|$)/);
  await page.getByRole("link", { name: "Par clinique" }).click();
  await expect(page).toHaveURL(/[?&]onglet=cliniques(&|$)/);
  await expect(page).toHaveURL(/[?&]modalite=scanner(&|$)/);

  // Les performances par radiologue ne distinguent pas les modalités.
  await page.getByRole("link", { name: "Par radiologue" }).click();
  await expect(page).toHaveURL(/[?&]onglet=radiologues(&|$)/);
  expect(page.url()).not.toContain("modalite");
  await expect(bar(page).getByRole("group", { name: "Modalité" })).toHaveCount(
    0,
  );
});
