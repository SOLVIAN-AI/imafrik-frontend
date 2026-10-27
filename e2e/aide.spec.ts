import { expect, test } from "./support/fixtures";

/**
 * Aide contextuelle : le panneau du bouton « ? ».
 *
 * Il s'ouvre au clavier comme à la souris, montre l'aide de l'écran du
 * rôle actif, cherche dans l'aide et le glossaire, et suit la navigation.
 */

test.describe("radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("la touche « ? » ouvre l’aide de l’écran, Échap la ferme", async ({
    page,
  }) => {
    await page.goto("/worklist");
    await page.keyboard.press("?");
    const aide = page.getByRole("dialog", { name: "Aide" });
    await expect(aide).toBeVisible();
    await expect(aide.getByText("Sur cette page :")).toBeVisible();
    await expect(aide.getByText("À quoi sert cette page")).toBeVisible();
    await expect(aide.getByText("Gestes clés")).toBeVisible();
    await expect(aide.getByText("Termes employés ici")).toBeVisible();
    // La file se parcourt au clavier : l'aide le dit.
    await expect(
      aide.getByText("Parcourir la liste des examens"),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(aide).toBeHidden();
  });

  test("la recherche trouve un terme et l’ouvre dans le glossaire", async ({
    page,
  }) => {
    await page.goto("/worklist");
    await page.getByRole("button", { name: "Aide" }).click();
    const aide = page.getByRole("dialog", { name: "Aide" });
    await aide
      .getByRole("searchbox", { name: "Rechercher dans l’aide" })
      .fill("code personnel");
    await aide
      .getByRole("button", { name: /Code personnel/ })
      .first()
      .click();
    await expect(aide.getByText("Glossaire", { exact: true })).toBeVisible();
    await expect(aide.getByText("Revenir à l’aide de cet écran")).toBeVisible();
  });

  test("la touche « ? » reste un caractère dans un champ de saisie", async ({
    page,
  }) => {
    await page.goto("/worklist");
    const recherche = page.getByRole("searchbox").first();
    await recherche.click();
    await page.keyboard.press("?");
    await expect(page.getByRole("dialog", { name: "Aide" })).toBeHidden();
  });
});

test.describe("clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("l’aide suit la navigation", async ({ page }) => {
    await page.goto("/tableau-de-bord");
    await page.getByRole("button", { name: "Aide" }).click();
    const aide = page.getByRole("dialog", { name: "Aide" });
    await expect(
      aide.getByText("Tableau de bord", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("navigation", { name: "Navigation principale" })
      .locator('a[href="/examens"]')
      .click();
    await expect(page).toHaveURL(/\/examens$/);
    await expect(aide.getByText("Examens", { exact: true })).toBeVisible();
  });
});

test.describe("équipe IMAFRIK, en anglais", () => {
  test.use({ membership: "m-admin", langue: "en" });

  test("le panneau parle la langue choisie", async ({ page }) => {
    await page.goto("/admin/passerelles");
    await page.keyboard.press("?");
    const aide = page.getByRole("dialog", { name: "Help" });
    await expect(aide.getByText("What this page is for")).toBeVisible();
    await expect(aide.getByText("Key steps")).toBeVisible();
  });
});

test.describe("équipe IMAFRIK, guide de raccordement", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("le guide se lit depuis l’aide des passerelles, étape par étape", async ({
    page,
  }) => {
    await page.goto("/admin/passerelles");
    await page.keyboard.press("?");
    const aide = page.getByRole("dialog", { name: "Aide" });
    // L'écran Passerelles dit comment vérifier le kit.
    await expect(aide.getByText(/certutil -hashfile/)).toBeVisible();
    await aide
      .getByRole("button", { name: "Guide : Raccorder une nouvelle clinique" })
      .click();
    await expect(
      aide.getByRole("heading", { name: "Raccorder une nouvelle clinique" }),
    ).toBeVisible();
    await expect(
      aide.getByText("Installer la passerelle, en ligne avec la clinique"),
    ).toBeVisible();
    await expect(aide.getByText(/Émettre un code/).first()).toBeVisible();
    await aide
      .getByRole("button", { name: "Revenir à l’aide de cet écran" })
      .click();
    await expect(aide.getByText("Gestes clés")).toBeVisible();
  });
});
