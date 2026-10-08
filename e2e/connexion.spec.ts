import type { Page } from "@playwright/test";

import {
  expect,
  HOME_BY_MEMBERSHIP,
  test,
  type DemoMembership,
} from "./support/fixtures";

/**
 * Connexion et déconnexion, en démonstration.
 *
 * En démonstration, n'importe quelle adresse et n'importe quel mot de
 * passe ouvrent la session du portail choisi (cookie
 * `imafrik-demo-membership`, radiologue à défaut). Le formulaire garde
 * ses contrôles : sans mot de passe, il refuse.
 */

/**
 * Remplit et envoie le formulaire de connexion.
 *
 * @param page     Page affichant le formulaire.
 * @param email    Adresse saisie.
 * @param password Mot de passe saisi.
 */
async function seConnecter(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('form button[type="submit"]').click();
}

for (const membership of Object.keys(HOME_BY_MEMBERSHIP) as DemoMembership[]) {
  test.describe(`portail ${membership}`, () => {
    test.use({ membership });

    test(`la connexion mène à ${HOME_BY_MEMBERSHIP[membership]}`, async ({
      page,
    }) => {
      await page.goto("/connexion");
      await expect(page.locator("html")).toHaveAttribute("lang", "fr");
      await seConnecter(page, "qui.que.ce.soit@exemple.tg", "nimporte-quoi");
      await expect(page).toHaveURL(HOME_BY_MEMBERSHIP[membership]);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  });
}

test("sans mot de passe, le formulaire refuse et le dit", async ({ page }) => {
  await page.goto("/connexion");
  await seConnecter(page, "qui.que.ce.soit@exemple.tg", "");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL("/connexion");
});

test("la connexion depuis le site anglais garde l'anglais", async ({
  page,
}) => {
  await page.goto("/en");
  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await seConnecter(page, "a.kponton@imafrik.tech", "demo");
  await expect(page).toHaveURL("/worklist");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { level: 1, name: "To read" }),
  ).toBeVisible();
});

test("la déconnexion ramène à l'écran de connexion", async ({ page }) => {
  await page.goto("/worklist");
  // Le menu du compte, en pied de navigation, porte l'adresse de l'utilisateur.
  await page.getByRole("button", { name: /a\.kponton@imafrik\.tech/ }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/connexion");
  await expect(page.locator("#email")).toBeVisible();
});
