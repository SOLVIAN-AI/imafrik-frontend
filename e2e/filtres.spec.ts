import type { Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * Barre de filtres commune des listes (démonstration), sur « Examens » de
 * l'équipe IMAFRIK, son écran de référence (`docs/vues-filtrees.md`).
 *
 * - les dimensions dans l'ordre commun : clinique (liste déroulante),
 *   modalité (puces), urgences en cours (bascule), chacune nommée ;
 * - les filtres dans l'adresse, combinables, la page repartant du début ;
 * - « Effacer les filtres » dès qu'un filtre est actif ;
 * - une liste vide à cause des filtres le dit et nomme les filtres ;
 * - le nombre de résultats annoncé aux lecteurs d'écran ;
 * - sur téléphone : rien ne défile en largeur, les puces de modalité
 *   deviennent une liste qui affiche sa valeur.
 *
 * L'audit d'accessibilité attend la fin des transitions de couleur
 * (`settle`) : mesuré pendant, un contraste intermédiaire le ferait
 * échouer.
 */

test.use({ membership: "m-admin", langue: "fr" });

/** La barre de filtres. */
function bar(page: Page) {
  return page.getByRole("group", { name: "Filtres" });
}

test("présente chaque dimension, dans l’ordre commun", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/examens");
  const filtres = bar(page);
  await expect(
    filtres.getByRole("button", { name: /^Clinique Toutes les cliniques/ }),
  ).toBeVisible();
  const modalites = filtres.getByRole("group", { name: "Modalité" });
  await expect(modalites.getByRole("link")).toHaveText([
    /^Toutes les modalités/,
    /^Radiographie/,
    /^Mammographie/,
    /^Échographie/,
    /^Scanner/,
    /^IRM/,
    /^Autres/,
  ]);
  await expect(
    modalites.getByRole("link", { name: /^Toutes les modalités/ }),
  ).toHaveAttribute("aria-current", "true");
  await expect(
    filtres.getByRole("link", { name: "Urgences en cours" }),
  ).not.toHaveAttribute("aria-current");
  // Aucun filtre : rien à effacer.
  await expect(
    filtres.getByRole("link", { name: "Effacer les filtres" }),
  ).toHaveCount(0);
  // Le nombre d'examens, pour les lecteurs d'écran.
  await expect(filtres.locator("[aria-live]")).toHaveText("15 examens");
  await settle(page);
  await checkA11y();
});

test("combine les filtres dans l’adresse, puis les efface d’un geste", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/examens?apres=demo-recent-1");
  const filtres = bar(page);
  await filtres
    .getByRole("group", { name: "Modalité" })
    .getByRole("link", { name: /^Scanner/ })
    .click();
  // La page repart du début.
  await expect(page).toHaveURL("/admin/examens?modalite=scanner");
  await filtres.getByRole("link", { name: "Urgences en cours" }).click();
  await expect(page).toHaveURL(/modalite=scanner/);
  await expect(page).toHaveURL(/urgent=1/);
  await expect(
    filtres.getByRole("link", { name: "Urgences en cours" }),
  ).toHaveAttribute("aria-current", "true");
  await settle(page);
  await checkA11y();

  // Le rechargement garde la vue filtrée.
  await page.reload();
  await expect(
    filtres
      .getByRole("group", { name: "Modalité" })
      .getByRole("link", { name: /^Scanner/ }),
  ).toHaveAttribute("aria-current", "true");

  await filtres.getByRole("link", { name: "Effacer les filtres" }).click();
  await expect(page).toHaveURL("/admin/examens");
  await expect(filtres.locator("[aria-live]")).toHaveText("15 examens");
});

test("une liste vide à cause des filtres le dit, et nomme les filtres", async ({
  page,
}) => {
  // Le cabinet Espérance n'a envoyé aucun examen.
  await page.goto("/admin/examens?clinique=org-esp&modalite=irm");
  await expect(
    page.getByText("Aucun examen ne correspond à ces filtres"),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Filtres retenus : Cabinet Espérance, IRM. Effacez-en un pour élargir la liste.",
    ),
  ).toBeVisible();
  await expect(page.locator("main table")).toBeHidden();
  await page
    .getByRole("main")
    .getByRole("link", { name: "Effacer les filtres" })
    .last()
    .click();
  await expect(page).toHaveURL("/admin/examens");
  await expect(page.locator("main tbody tr")).toHaveCount(15);
});

test("ignore une valeur inconnue dans l’adresse", async ({ page }) => {
  await page.goto("/admin/examens?modalite=SCANNER&urgent=oui");
  await expect(
    bar(page)
      .getByRole("group", { name: "Modalité" })
      .getByRole("link", { name: /^Toutes les modalités/ }),
  ).toHaveAttribute("aria-current", "true");
  await expect(page.locator("main tbody tr")).toHaveCount(15);
});

test.describe("sur téléphone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("tient dans la largeur ; les modalités deviennent une liste", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin/examens?clinique=org-stj&urgent=1");
    const filtres = bar(page);
    // Les puces de modalité cèdent la place à une liste qui dit sa valeur.
    await expect(filtres.getByRole("group", { name: "Modalité" })).toBeHidden();
    const modalite = filtres.getByRole("button", {
      name: /^Modalité Toutes les modalités/,
    });
    await expect(modalite).toBeVisible();
    // Chaque filtre actif reste visible.
    await expect(
      filtres.getByRole("button", { name: /^Clinique Clinique Saint-Joseph/ }),
    ).toBeVisible();
    await expect(
      filtres.getByRole("link", { name: "Urgences en cours" }),
    ).toHaveAttribute("aria-current", "true");
    for (const control of await filtres
      .locator("a:visible, button:visible")
      .all()) {
      const boite = await control.boundingBox();
      expect(boite?.x).toBeGreaterThanOrEqual(0);
      expect((boite?.x ?? 0) + (boite?.width ?? 0)).toBeLessThanOrEqual(390);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    // Les modalités dans l'ordre de l'écran, pas par ordre alphabétique.
    await modalite.click();
    const liste = page.getByRole("listbox", { name: "Modalité" });
    const noms = (await liste.getByRole("option").allInnerTexts()).map(
      (texte) => texte.split("\n")[0].trim(),
    );
    expect(noms).toEqual([
      "Toutes les modalités",
      "Radiographie",
      "Mammographie",
      "Échographie",
      "Scanner",
      "IRM",
      "Autres",
    ]);
    await liste.getByRole("option", { name: /^Scanner/ }).click();
    await expect(page).toHaveURL(/modalite=scanner/);
    await expect(page).toHaveURL(/clinique=org-stj/);
    await expect(
      filtres.getByRole("button", { name: /^Modalité Scanner/ }),
    ).toBeVisible();
    await settle(page);
    await checkA11y();
  });
});

test.describe("en anglais", () => {
  test.use({ langue: "en" });

  test("nomme les filtres dans la langue de l’utilisateur", async ({
    page,
  }) => {
    await page.goto("/admin/examens?modalite=irm");
    const filtres = page.getByRole("group", { name: "Filters" });
    await expect(
      filtres
        .getByRole("group", { name: "Modality" })
        .getByRole("link", { name: /^All modalities/ }),
    ).toBeVisible();
    await expect(
      filtres.getByRole("link", { name: "Clear filters" }),
    ).toBeVisible();
  });
});
