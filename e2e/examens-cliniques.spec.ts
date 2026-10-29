import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

/**
 * Examens de la console classés par clinique (démonstration).
 *
 * En tête de « Examens », un choix par clinique avec son nombre
 * d'examens, compté par le service avec les mêmes filtres que la liste ;
 * il se combine avec les onglets de modalité, « Urgences en cours » et la
 * recherche. La clinique est dans l'adresse (`?clinique=`), par son
 * identifiant.
 */

test.use({ membership: "m-admin", langue: "fr" });

/** Le nombre qu'annonce un choix d'une barre de filtres. */
async function countOf(page: Page, bar: string, label: string) {
  const link = page
    .getByRole("navigation", { name: bar })
    .getByRole("link", { name: new RegExp(`^${label}`) });
  return Number((await link.innerText()).replace(/\D/g, ""));
}

test("classe les examens par clinique, avec le nombre de chacune", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/examens");
  const cliniques = page.getByRole("navigation", { name: "Cliniques" });
  await expect(
    cliniques.getByRole("link", { name: /^Toutes les cliniques/ }),
  ).toHaveAttribute("aria-current", "page");
  const toutes = await countOf(page, "Cliniques", "Toutes les cliniques");
  const stj = await countOf(page, "Cliniques", "Clinique Saint-Joseph");
  const kara = await countOf(page, "Cliniques", "Polyclinique de Kara");
  expect(stj + kara).toBe(toutes);
  // Une clinique sans examen reste proposée, à zéro.
  expect(await countOf(page, "Cliniques", "Cabinet Espérance")).toBe(0);

  await cliniques.getByRole("link", { name: /^Clinique Saint-Joseph/ }).click();
  await expect(page).toHaveURL(/clinique=org-stj/);
  await expect(
    page.getByText(`${stj} examens · Clinique Saint-Joseph`),
  ).toBeVisible();
  const lignes = page.locator("main tbody tr");
  await expect(lignes).toHaveCount(stj);
  for (const etablissement of await lignes
    .locator("td:nth-child(3)")
    .allInnerTexts())
    expect(etablissement).toBe("Clinique Saint-Joseph");
  // Les onglets de modalité comptent dans la clinique choisie.
  expect(await countOf(page, "Modalités", "Toutes")).toBe(stj);
  await checkA11y();

  // Combiné avec une modalité : chaque choix garde l'autre.
  const scanners = await countOf(page, "Modalités", "Scanner");
  await page
    .getByRole("navigation", { name: "Modalités" })
    .getByRole("link", { name: /^Scanner/ })
    .click();
  await expect(page).toHaveURL(/clinique=org-stj/);
  await expect(page).toHaveURL(/modalite=scanner/);
  await expect(lignes).toHaveCount(scanners);
  expect(await countOf(page, "Cliniques", "Clinique Saint-Joseph")).toBe(
    scanners,
  );

  // Et avec les urgences en cours.
  await page.getByRole("link", { name: "Urgences en cours" }).click();
  await expect(page).toHaveURL(/clinique=org-stj/);
  await expect(page).toHaveURL(/modalite=scanner/);
  await expect(page).toHaveURL(/urgent=1/);

  // Retour à toutes les cliniques, la modalité gardée.
  await cliniques.getByRole("link", { name: /^Toutes les cliniques/ }).click();
  await expect(page).not.toHaveURL(/clinique=/);
  await expect(page).toHaveURL(/modalite=scanner/);
});

test("une clinique inconnue dans l’adresse revient à toutes", async ({
  page,
}) => {
  await page.goto("/admin/examens?clinique=org-inconnue");
  await expect(
    page
      .getByRole("navigation", { name: "Cliniques" })
      .getByRole("link", { name: /^Toutes les cliniques/ }),
  ).toHaveAttribute("aria-current", "page");
});

test("la fiche d’une clinique mène à ses examens", async ({ page }) => {
  await page.goto("/admin/organisations/org-pka");
  await page.getByRole("link", { name: "Examens de la clinique" }).click();
  await expect(page).toHaveURL(/\/admin\/examens\?clinique=org-pka/);
  await expect(
    page
      .getByRole("navigation", { name: "Cliniques" })
      .getByRole("link", { name: /^Polyclinique de Kara/ }),
  ).toHaveAttribute("aria-current", "page");
});

test.describe("en anglais", () => {
  test.use({ langue: "en" });

  test("nomme le choix dans la langue de l’utilisateur", async ({ page }) => {
    await page.goto("/admin/examens");
    await expect(
      page
        .getByRole("navigation", { name: "Clinics" })
        .getByRole("link", { name: /^All clinics/ }),
    ).toBeVisible();
  });
});
