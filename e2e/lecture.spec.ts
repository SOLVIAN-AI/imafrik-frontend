import { expect, test } from "./support/fixtures";

/**
 * Écran de lecture, ouvert depuis la file.
 *
 * Les cliniques de démonstration reçoivent leurs comptes-rendus en
 * français. Une pastille le signale au radiologue dont l'interface est
 * dans une autre langue, et seulement à lui : en français, elle n'a rien
 * à dire et n'apparaît pas.
 */

test.use({ membership: "m-radio" });

for (const { langue, pastille, absente } of [
  { langue: "fr", pastille: null, absente: /Compte-rendu en/ },
  { langue: "en", pastille: "Report in French", absente: null },
] as const) {
  test.describe(`interface en ${langue}`, () => {
    test.use({ langue });

    test(`la lecture s'ouvre depuis la file${pastille ? ", avec la langue du compte-rendu" : ""}`, async ({
      page,
    }) => {
      await page.goto("/worklist");
      const premier = page.locator("table a[data-row-link]").first();
      const patient = (await premier.innerText()).trim();
      const href = await premier.getAttribute("href");
      expect(href).toMatch(/^\/lecture\/[^/]+$/);

      await premier.click();
      await expect(page).toHaveURL(href ?? "");
      // La barre de contexte nomme le patient : c'est le titre de l'écran.
      const titre = page.getByRole("heading", { level: 1, name: patient });
      await expect(titre).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", langue);

      const barre = page.locator("header", { has: titre });
      // La pastille porte aussi une explication réservée aux lecteurs
      // d'écran : son texte commence par le libellé visible.
      if (pastille) await expect(barre.getByText(pastille)).toBeVisible();
      if (absente) await expect(barre.getByText(absente)).toHaveCount(0);
    });
  });
}
