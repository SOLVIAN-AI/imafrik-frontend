import type { Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * « Examens » filtrés par la barre commune (démonstration) : radiologue,
 * modalité, état, urgence, période, chacun compté par le service en un
 * appel (`/studies/facets`), pour le responsable, la vue des cliniques et
 * l'équipe IMAFRIK.
 */

/** La barre de filtres. */
function bar(page: Page) {
  return page.getByRole("group", { name: "Filtres" });
}

/** Le nombre affiché par une puce ou une option. */
async function shown(target: ReturnType<Page["locator"]>): Promise<number> {
  return Number(await target.locator("span[aria-hidden]").first().innerText());
}

test.describe("le responsable de la clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("filtre par état, chaque état compté, leur somme faisant le tout", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/examens");
    const etats = bar(page).getByRole("group", { name: "État" });
    await expect(etats.getByRole("link")).toHaveText([
      /^Tous les états/,
      /^À attribuer/,
      /^En lecture/,
      /^Prêt/,
      /^Remis/,
    ]);
    const tous = await shown(
      etats.getByRole("link", { name: /^Tous les états/ }),
    );
    let somme = 0;
    for (const nom of ["À attribuer", "En lecture", "Prêt", "Remis"])
      somme += await shown(
        etats.getByRole("link", { name: new RegExp(`^${nom}`) }),
      );
    expect(somme).toBe(tous);

    const prets = etats.getByRole("link", { name: /^Prêt/ });
    const attendu = await shown(prets);
    await prets.click();
    await expect(page).toHaveURL(/[?&]etat=pret(&|$)/);
    await expect(page.locator("main tbody tr")).toHaveCount(attendu);
    await settle(page);
    await checkA11y();
  });

  test("filtre par radiologue, depuis une liste triée par nom", async ({
    page,
  }) => {
    await page.goto("/examens");
    const choix = bar(page).getByRole("button", {
      name: /^Radiologue Tous les radiologues/,
    });
    await choix.click();
    const liste = page.getByRole("listbox", { name: "Radiologue" });
    const noms = (await liste.getByRole("option").allInnerTexts()).map(
      (texte) => texte.split("\n")[0].trim(),
    );
    expect(noms[0]).toBe("Tous les radiologues");
    expect(noms.length).toBeGreaterThan(1);
    expect(noms.slice(1)).toEqual(
      [...noms.slice(1)].sort((a, b) => a.localeCompare(b, "fr")),
    );
    const premier = liste.getByRole("option").nth(1);
    const nom = noms[1];
    const attendu = await shown(premier);
    await premier.click();
    await expect(page).toHaveURL(/[?&]radiologue=[^&]+/);
    await expect(
      bar(page).getByRole("button", { name: new RegExp(`^Radiologue ${nom}`) }),
    ).toBeVisible();
    const lignes = page.locator("main tbody tr");
    await expect(lignes).toHaveCount(attendu);
    for (const ligne of await lignes.all())
      await expect(ligne).toContainText(nom);
  });

  test("filtre par période de réception", async ({ page }) => {
    await page.goto("/examens");
    const tous = await page.locator("main tbody tr").count();
    await bar(page)
      .getByRole("button", { name: /^Période Toutes les dates/ })
      .click();
    const liste = page.getByRole("listbox", { name: "Période" });
    // L'ordre de la durée, pas l'ordre alphabétique.
    expect(
      (await liste.getByRole("option").allInnerTexts()).map((texte) =>
        texte.trim(),
      ),
    ).toEqual([
      "Toutes les dates",
      "24 h",
      "7 jours",
      "30 jours",
      "90 jours",
      "12 mois",
    ]);
    await liste.getByRole("option", { name: "24 h" }).click();
    await expect(page).toHaveURL(/[?&]jours=1(&|$)/);
    const recents = page.locator("main tbody tr");
    expect(await recents.count()).toBeLessThanOrEqual(tous);
  });

  test("l’ancienne vue « À attribuer » mène à l’état du même nom", async ({
    page,
  }) => {
    await page.goto("/examens?vue=a-attribuer");
    const etats = bar(page).getByRole("group", { name: "État" });
    await expect(
      etats.getByRole("link", { name: /^À attribuer/ }),
    ).toHaveAttribute("aria-current", "true");
    // Changer d'état remplace l'ancien paramètre.
    await etats.getByRole("link", { name: /^Remis/ }).click();
    await expect(page).toHaveURL(/[?&]etat=remis(&|$)/);
    expect(page.url()).not.toContain("vue=");
  });
});

test.describe("la vue des cliniques", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("propose les filtres du responsable, sans choix de clinique", async ({
    page,
  }) => {
    await page.goto("/admin/vue-clinique/org-stj/examens");
    const filtres = bar(page);
    await expect(filtres.getByRole("group", { name: "État" })).toBeVisible();
    await expect(
      filtres.getByRole("button", { name: /^Radiologue / }),
    ).toBeVisible();
    await expect(
      filtres.getByRole("button", { name: /^Clinique / }),
    ).toHaveCount(0);
  });
});

test.describe("l’équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("combine clinique, état et radiologue", async ({ page }) => {
    await page.goto("/admin/examens?clinique=org-stj&etat=en-lecture");
    const etats = bar(page).getByRole("group", { name: "État" });
    const enLecture = etats.getByRole("link", { name: /^En lecture/ });
    await expect(enLecture).toHaveAttribute("aria-current", "true");
    await expect(page.locator("main tbody tr")).toHaveCount(
      await shown(enLecture),
    );
    for (const statut of await page
      .locator("main tbody tr td:nth-child(4)")
      .allInnerTexts())
      expect(statut).toMatch(/Attribué|En cours/);
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
    await page.goto("/examens?etat=pret&modalite=scanner&jours=30");
    const filtres = bar(page);
    await expect(
      filtres.getByRole("button", { name: /^État Prêt/ }),
    ).toBeVisible();
    await expect(
      filtres.getByRole("button", { name: /^Modalité Scanner/ }),
    ).toBeVisible();
    await expect(
      filtres.getByRole("button", { name: /^Période 30 jours/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
