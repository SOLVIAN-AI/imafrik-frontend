import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

/**
 * Examens de la console classés par clinique (démonstration).
 *
 * En tête de « Examens », une liste déroulante : « Toutes les cliniques »
 * puis les cliniques par ordre alphabétique, chacune avec son nombre
 * d'examens, compté par le service avec les mêmes filtres que la liste ;
 * elle se combine avec les onglets de modalité, « Urgences en cours » et
 * la recherche. La clinique est dans l'adresse (`?clinique=`), par son
 * identifiant. La liste se lit au clavier et au lecteur d'écran (motif
 * « combobox »), et tient sur un téléphone. La recherche dans la liste,
 * ouverte à partir de huit cliniques, est éprouvée par
 * `lib/clinic-choice.test.ts` : la démonstration n'en compte que cinq.
 */

test.use({ membership: "m-admin", langue: "fr" });

/** Le bouton de la liste des cliniques. */
function choice(page: Page): Locator {
  return page.getByRole("button", { name: /^Clinique / });
}

/** Le nombre d'examens qu'annonce une option, ou un onglet de modalité. */
async function countOf(target: Locator): Promise<number> {
  const name =
    (await target.getAttribute("aria-label")) ??
    (await target.evaluate((element) => element.textContent ?? ""));
  const match = name.match(/(\d+)\s*examens?\s*$/) ?? name.match(/(\d+)\s*$/);
  return Number(match?.[1]);
}

/** Une option de la liste ouverte. */
function option(page: Page, name: string): Locator {
  return page
    .getByRole("listbox", { name: "Clinique" })
    .getByRole("option", { name: new RegExp(`^${name}`) });
}

test("classe les examens par clinique, avec le nombre de chacune", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/examens");
  await expect(choice(page)).toContainText("Toutes les cliniques");
  await choice(page).click();
  const liste = page.getByRole("listbox", { name: "Clinique" });
  await expect(liste).toBeVisible();
  await expect(choice(page)).toHaveAttribute("aria-expanded", "true");

  // « Toutes les cliniques », puis l'ordre alphabétique.
  const noms = (await liste.getByRole("option").allInnerTexts()).map((texte) =>
    texte.split("\n")[0].trim(),
  );
  expect(noms[0]).toBe("Toutes les cliniques");
  expect(noms.slice(1)).toEqual(
    [...noms.slice(1)].sort((a, b) => a.localeCompare(b, "fr")),
  );
  await expect(option(page, "Toutes les cliniques")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const toutes = await countOf(option(page, "Toutes les cliniques"));
  const stj = await countOf(option(page, "Clinique Saint-Joseph"));
  const kara = await countOf(option(page, "Polyclinique de Kara"));
  expect(stj + kara).toBe(toutes);
  // Une clinique sans examen reste proposée, à zéro.
  expect(await countOf(option(page, "Cabinet Espérance"))).toBe(0);
  await checkA11y();

  // Au clavier : une lettre mène à la clinique suivante qui commence par
  // elle, Entrée choisit.
  // Cabinet, Centre, Clinique du Golfe, Clinique Saint-Joseph.
  for (let fois = 0; fois < 4; fois += 1) await page.keyboard.press("c");
  await expect(page.getByRole("listbox")).toHaveAttribute(
    "aria-activedescendant",
    (await option(page, "Clinique Saint-Joseph").getAttribute("id")) ?? "",
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/clinique=org-stj/);
  await expect(liste).toHaveCount(0);
  await expect(choice(page)).toBeFocused();
  await expect(choice(page)).toContainText("Clinique Saint-Joseph");
  await expect(
    page.getByText(`${stj} examens · Clinique Saint-Joseph`),
  ).toBeVisible();
  const lignes = page.locator("main tbody tr");
  await expect(lignes).toHaveCount(stj);
  for (const etablissement of await lignes
    .locator("td:nth-child(3)")
    .allInnerTexts())
    expect(etablissement).toBe("Clinique Saint-Joseph");
  // Les puces de modalité comptent dans la clinique choisie.
  const modalites = page.getByRole("group", { name: "Modalité" });
  expect(
    await countOf(
      modalites.getByRole("link", { name: /^Toutes les modalités/ }),
    ),
  ).toBe(stj);

  // Combiné avec une modalité : chaque choix garde l'autre.
  const onglet = modalites.getByRole("link", { name: /^Scanner/ });
  const scanners = await countOf(onglet);
  await onglet.click();
  await expect(page).toHaveURL(/clinique=org-stj/);
  await expect(page).toHaveURL(/modalite=scanner/);
  await expect(lignes).toHaveCount(scanners);
  await expect(choice(page)).toContainText(String(scanners));

  // Et avec les urgences en cours.
  await page.getByRole("link", { name: "Urgences en cours" }).click();
  await expect(page).toHaveURL(/clinique=org-stj/);
  await expect(page).toHaveURL(/modalite=scanner/);
  await expect(page).toHaveURL(/urgent=1/);

  // Retour à toutes les cliniques, à la souris, la modalité gardée.
  await choice(page).click();
  await option(page, "Toutes les cliniques").click();
  await expect(page).not.toHaveURL(/clinique=/);
  await expect(page).toHaveURL(/modalite=scanner/);
});

test("se ferme par Échap, au clavier seul", async ({ page }) => {
  await page.goto("/admin/examens");
  await choice(page).focus();
  await page.keyboard.press("ArrowDown");
  const liste = page.getByRole("listbox", { name: "Clinique" });
  await expect(liste).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Escape");
  await expect(liste).toHaveCount(0);
  await expect(choice(page)).toBeFocused();
  await expect(page).not.toHaveURL(/clinique=/);
});

test("une clinique inconnue dans l’adresse revient à toutes", async ({
  page,
}) => {
  await page.goto("/admin/examens?clinique=org-inconnue");
  await expect(choice(page)).toContainText("Toutes les cliniques");
});

test("la fiche d’une clinique mène à ses examens", async ({ page }) => {
  await page.goto("/admin/organisations/org-pka");
  await page.getByRole("link", { name: "Examens de la clinique" }).click();
  await expect(page).toHaveURL(/\/admin\/examens\?clinique=org-pka/);
  await expect(choice(page)).toContainText("Polyclinique de Kara");
});

test.describe("sur téléphone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("tient dans la largeur, liste ouverte comprise", async ({ page }) => {
    await page.goto("/admin/examens");
    await choice(page).click();
    const liste = page.getByRole("listbox", { name: "Clinique" });
    await expect(liste).toBeVisible();
    const boite = await liste.boundingBox();
    expect(boite?.x).toBeGreaterThanOrEqual(0);
    expect((boite?.x ?? 0) + (boite?.width ?? 0)).toBeLessThanOrEqual(390);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await option(page, "Polyclinique de Kara").click();
    await expect(page).toHaveURL(/clinique=org-pka/);
  });
});

test.describe("en anglais", () => {
  test.use({ langue: "en" });

  test("nomme le choix dans la langue de l’utilisateur", async ({ page }) => {
    await page.goto("/admin/examens");
    const bouton = page.getByRole("button", { name: /^Clinic / });
    await expect(bouton).toContainText("All clinics");
    await bouton.click();
    await expect(
      page
        .getByRole("listbox", { name: "Clinic" })
        .getByRole("option", { name: /^All clinics.*examinations$/ }),
    ).toBeVisible();
  });
});
