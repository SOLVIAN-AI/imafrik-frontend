import type { Locator, Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * « Organisations » et choix de la clinique consultée (démonstration) :
 * nature, statut et raccordement sur la barre commune, comptés sur la
 * page ; recherche par nom ou ville, hors de l'adresse ; cliniques par
 * ordre alphabétique de la langue dans la navigation.
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

test("filtre par nature et par raccordement, chaque option comptée", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/organisations");
  const natures = bar(page).getByRole("group", { name: "Nature" });
  const cliniques = natures.getByRole("link", { name: /^Cliniques/ });
  const groupes = natures.getByRole("link", { name: /^Groupes de radiologie/ });
  const tout = await shown(
    natures.getByRole("link", { name: /^Toutes les natures/ }),
  );
  expect((await shown(cliniques)) + (await shown(groupes))).toBe(tout);

  await cliniques.click();
  await expect(page).toHaveURL(/[?&]type=clinique(&|$)/);
  // Le tableau, à 1 280 px : une ligne par organisation.
  await expect(page.locator("main tbody tr")).toHaveCount(
    await shown(cliniques),
  );

  const raccordement = bar(page).getByRole("group", { name: "Raccordement" });
  const raccordees = raccordement.getByRole("link", { name: /^PACS raccordé/ });
  const attendu = await shown(raccordees);
  await raccordees.click();
  await expect(page).toHaveURL(/[?&]raccordement=raccordee(&|$)/);
  await expect(page.locator("main tbody tr")).toHaveCount(attendu);
  await settle(page);
  await checkA11y();
});

test("cherche une organisation par ville, sans l’écrire dans l’adresse", async ({
  page,
}) => {
  await page.goto("/admin/organisations");
  const champ = page.getByRole("searchbox", {
    name: "Rechercher une organisation",
  });
  await champ.fill("kara");
  await champ.press("Enter");
  await expect(page.locator("main tbody tr")).toHaveCount(1);
  await expect(page.locator("main tbody")).toContainText(
    "Polyclinique de Kara",
  );
  expect(page.url()).not.toContain("kara");
  await champ.fill("");
  await champ.press("Enter");
  await expect(page.locator("main tbody tr")).not.toHaveCount(1);
});

test("une liste vide à cause des filtres le dit", async ({ page }) => {
  await page.goto("/admin/organisations?type=groupe&raccordement=raccordee");
  await expect(
    page.getByText("Aucune organisation ne correspond à ces filtres"),
  ).toBeVisible();
});

test("la navigation propose les cliniques par ordre alphabétique", async ({
  page,
}) => {
  await page.goto("/admin/vue-clinique/org-stj/equipe");
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await nav.getByRole("button", { name: /Clinique Saint-Joseph/ }).click();
  const liste = page.getByRole("listbox", { name: "Clinique consultée" });
  const noms = (await liste.getByRole("option").allInnerTexts()).map((texte) =>
    texte.split("\n")[0].trim(),
  );
  expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, "fr")));
  // La liste ouverte ne déborde pas de la navigation, qui ne défile pas en
  // largeur.
  const boite = await liste.boundingBox();
  const navBoite = await nav.boundingBox();
  expect((boite?.x ?? 0) + (boite?.width ?? 0)).toBeLessThanOrEqual(
    (navBoite?.x ?? 0) + (navBoite?.width ?? 0) + 1,
  );
  // Le bloc qui défile, sous la marque : sa largeur reste la sienne.
  const defilement = nav.locator("div.overflow-y-auto").first();
  expect(
    await defilement.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  // La clinique consultée est cochée ; Échap referme sans changer de page.
  await expect(
    liste.getByRole("option", { name: /Clinique Saint-Joseph/ }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(liste).toHaveCount(0);
  await expect(page).toHaveURL("/admin/vue-clinique/org-stj/equipe");
});

test.describe("sur téléphone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("tient dans la largeur, filtres actifs visibles", async ({ page }) => {
    await page.goto("/admin/organisations?type=clinique&statut=active");
    await expect(
      bar(page).getByRole("link", { name: /^Cliniques/ }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
