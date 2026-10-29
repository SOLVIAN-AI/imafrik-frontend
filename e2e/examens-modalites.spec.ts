import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

/**
 * Examens classés par modalité (démonstration).
 *
 * En tête de chaque liste d'examens, un onglet par groupe de modalités,
 * avec son nombre d'examens, compté par le service avec les mêmes filtres
 * que la liste. Le groupe est dans l'adresse (`?modalite=scanner`), se
 * combine avec la vue « À attribuer », les urgences et la recherche, et la
 * liste repart de sa première page.
 */

/** Le nombre d'examens qu'annonce l'onglet d'un groupe. */
async function tabCount(page: Page, label: string): Promise<number> {
  const tab = page
    .getByRole("navigation", { name: "Modalités" })
    .getByRole("link", { name: new RegExp(`^${label}`) });
  return Number((await tab.innerText()).replace(/\D/g, ""));
}

test.describe("le responsable de la clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("classe ses examens par modalité, avec le nombre de chacun", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/examens");
    const onglets = page.getByRole("navigation", { name: "Modalités" });
    for (const label of [
      "Toutes",
      "Radiographie",
      "Mammographie",
      "Échographie",
      "Scanner",
      "IRM",
      "Autres",
    ]) {
      await expect(
        onglets.getByRole("link", { name: new RegExp(`^${label}`) }),
      ).toBeVisible();
    }
    const total = await tabCount(page, "Toutes");
    const scanners = await tabCount(page, "Scanner");
    expect(scanners).toBeGreaterThan(0);
    expect(scanners).toBeLessThan(total);
    await expect(page.getByText(`${total} examens ·`)).toBeVisible();

    await onglets.getByRole("link", { name: /^Scanner/ }).click();
    await expect(page).toHaveURL(/modalite=scanner/);
    await expect(
      onglets.getByRole("link", { name: /^Scanner/ }),
    ).toHaveAttribute("aria-current", "page");
    // Le compte de l'onglet est le total de la liste filtrée.
    await expect(
      page.getByText(new RegExp(`^${scanners} examens? ·`)),
    ).toBeVisible();
    const lignes = page.locator("main tbody tr");
    await expect(lignes).toHaveCount(scanners);
    for (const cellule of await lignes
      .locator("td:nth-child(2)")
      .allInnerTexts())
      expect(cellule).toMatch(/^CT/);
    await checkA11y();

    // Combiné avec la vue « À attribuer » : le groupe est gardé.
    await page
      .getByRole("navigation", { name: "Afficher" })
      .getByRole("link", { name: "À attribuer" })
      .click();
    await expect(page).toHaveURL(/modalite=scanner/);
    await expect(page).toHaveURL(/vue=a-attribuer/);
    const aAttribuer = await tabCount(page, "Scanner");
    await expect(lignes).toHaveCount(aAttribuer);
  });
});

test.describe("l’équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("classe les examens de la plateforme et ceux d’une clinique", async ({
    page,
  }) => {
    await page.goto("/admin/examens");
    // La barre de filtres commune : des puces dans le groupe « Modalité ».
    const puces = page.getByRole("group", { name: "Modalité" });
    const reseau = Number(
      (
        await puces
          .getByRole("link", { name: /^Toutes les modalités/ })
          .innerText()
      ).replace(/\D/g, ""),
    );
    await puces.getByRole("link", { name: /^IRM/ }).click();
    await expect(page).toHaveURL(/modalite=irm/);
    // Le filtre des urgences garde le groupe.
    await page.getByRole("link", { name: "Urgences en cours" }).click();
    await expect(page).toHaveURL(/modalite=irm/);
    await expect(page).toHaveURL(/urgent=1/);

    // La vue d'une clinique compte comme son responsable.
    await page.goto("/admin/vue-clinique/org-stj/examens");
    const clinique = await tabCount(page, "Toutes");
    expect(clinique).toBeLessThan(reseau);
  });
});

test.describe("en anglais", () => {
  test.use({ membership: "m-clinic", langue: "en" });

  test("nomme les groupes dans la langue de l’utilisateur", async ({
    page,
  }) => {
    await page.goto("/examens");
    const tabs = page.getByRole("navigation", { name: "Modalities" });
    await expect(tabs.getByRole("link", { name: /^All/ })).toBeVisible();
    await expect(tabs.getByRole("link", { name: /^Ultrasound/ })).toBeVisible();
  });
});
