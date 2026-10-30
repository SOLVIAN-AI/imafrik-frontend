import type { Locator, Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * Listes bornées sur la barre commune (démonstration), filtrées et
 * comptées sur la page : « Équipe » (rôle, liste d'urgence, recherche
 * hors adresse), « Modèles » (origine, modalité), « Formation »
 * (modalité, état) et l'historique de « Système » (tâche, échecs).
 */

test.use({ langue: "fr" });

/** La barre de filtres. */
function bar(scope: Page | Locator) {
  return scope.getByRole("group", { name: "Filtres" });
}

/** Le nombre affiché par une puce. */
async function shown(target: Locator): Promise<number> {
  return Number(await target.locator("span[aria-hidden]").first().innerText());
}

/** Les membres affichés par « Équipe ». */
function members(page: Page) {
  return page.getByRole("main").getByRole("listitem");
}

test.describe("équipe", () => {
  test.use({ membership: "m-clinic" });

  test("filtre par rôle puis par liste d’urgence, chaque option comptée", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/equipe");
    const roles = bar(page).getByRole("group", { name: "Rôle" });
    const tous = await shown(
      roles.getByRole("link", { name: /^Tous les rôles/ }),
    );
    const responsables = roles.getByRole("link", { name: /^Responsable/ });
    const radiologues = roles.getByRole("link", { name: /^Radiologue/ });
    expect((await shown(responsables)) + (await shown(radiologues))).toBe(tous);
    await expect(members(page)).toHaveCount(tous);

    const attendu = await shown(radiologues);
    await radiologues.click();
    await expect(page).toHaveURL(/[?&]role=radiologue(&|$)/);
    await expect(members(page)).toHaveCount(attendu);

    const urgence = page.getByTestId("filter-urgentReader");
    const inscrits = await shown(urgence);
    expect(inscrits).toBeGreaterThan(0);
    await urgence.click();
    await expect(page).toHaveURL(/[?&]liste-urgence=1(&|$)/);
    await expect(members(page)).toHaveCount(inscrits);
    for (const membre of await members(page).all())
      await expect(membre).toContainText("Liste d’urgence");
    await settle(page);
    await checkA11y();
  });

  test("ne filtre plus par modalité lue : l’équipe IMAFRIK la règle", async ({
    page,
  }) => {
    await page.goto("/equipe");
    await expect(bar(page).getByRole("group", { name: "Rôle" })).toBeVisible();
    await expect(
      bar(page).getByRole("group", { name: "Modalité" }),
    ).toHaveCount(0);
    await expect(page.getByText("Radiographie, Échographie")).toHaveCount(0);
  });

  test("cherche un membre sans l’écrire dans l’adresse", async ({ page }) => {
    await page.goto("/equipe");
    const champ = page.getByRole("searchbox", {
      name: "Rechercher un membre",
    });
    await champ.fill("lawson");
    await champ.press("Enter");
    await expect(members(page)).toHaveCount(1);
    await expect(members(page)).toContainText("Komi Lawson");
    expect(page.url()).not.toContain("lawson");

    // Une recherche sans résultat, sans filtre : la page le dit, sans
    // nommer de filtre.
    await champ.fill("zzzz");
    await champ.press("Enter");
    await expect(
      page.getByText("Aucun résultat pour cette recherche"),
    ).toBeVisible();
    await expect(page.getByText(/Filtres retenus/)).toHaveCount(0);
    await champ.fill("");
    await champ.press("Enter");
    await expect(members(page)).not.toHaveCount(1);
  });
});

test.describe("modèles et formation", () => {
  test.use({ membership: "m-radio" });

  test("les modèles se filtrent par origine, dans l’adresse", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/modeles");
    const origines = bar(page).getByRole("group", { name: "Origine" });
    const imafrik = origines.getByRole("link", { name: /^IMAFRIK/ });
    const attendu = await shown(imafrik);
    await imafrik.click();
    await expect(page).toHaveURL(/[?&]origine=imafrik(&|$)/);
    // Un modèle de la bibliothèque : une ligne avec son bouton.
    const modeles = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({ has: page.getByRole("button") });
    await expect(modeles).toHaveCount(attendu);
    for (const modele of await modeles.all())
      await expect(modele).toContainText("IMAFRIK");
    await settle(page);
    await checkA11y();
  });

  test("les exercices se filtrent par état", async ({ page, checkA11y }) => {
    await page.goto("/formation");
    const etats = bar(page).getByRole("group", { name: "État" });
    const aFaire = etats.getByRole("link", { name: /^À faire/ });
    const attendu = await shown(aFaire);
    await aFaire.click();
    await expect(page).toHaveURL(/[?&]etat=a-faire(&|$)/);
    // Une carte par exercice ; le parcours est une liste numérotée.
    const cartes = page.getByRole("main").locator("ul > li");
    await expect(cartes).toHaveCount(attendu);
    for (const carte of await cartes.all())
      await expect(carte).toContainText("À faire");
    await settle(page);
    await checkA11y();
  });
});

test.describe("système", () => {
  test.use({ membership: "m-admin" });

  test("l’historique se filtre aux échecs seulement", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin/systeme");
    const historique = page.locator("#historique");
    const echecs = historique.getByTestId("filter-failed");
    const attendu = await shown(echecs);
    expect(attendu).toBeGreaterThan(0);
    await echecs.click();
    await expect(page).toHaveURL(/[?&]echecs=1(&|$)/);
    await expect(historique.getByRole("listitem")).toHaveCount(attendu);
    await expect(
      historique.getByText("Exécutions récentes retenues par les filtres"),
    ).toBeVisible();
    await settle(page);
    await checkA11y();
  });

  test("une tâche sans échec le dit", async ({ page }) => {
    await page.goto("/admin/systeme?tache=sauvegarde&echecs=1");
    await expect(
      page.getByText("Aucune exécution ne correspond à ces filtres"),
    ).toBeVisible();
  });
});

test.describe("sur téléphone", () => {
  test.use({ viewport: { width: 390, height: 844 }, membership: "m-clinic" });

  test("l’équipe filtrée tient dans la largeur", async ({ page }) => {
    await page.goto("/equipe?role=radiologue&liste-urgence=1");
    await expect(members(page)).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
