import {
  FRENCH_COMMON_WORDS,
  FRENCH_PROPER_NAMES,
  PUBLIC_PAIRS,
  without,
} from "./support/donnees";
import { expect, test } from "./support/fixtures";

/**
 * Site public, en français et en anglais.
 *
 * Chaque page existe dans les deux langues, déclare sa langue dans
 * `<html lang>`, annonce son équivalent aux moteurs de recherche
 * (`<link rel="alternate" hreflang>`), et son sélecteur de langue mène à
 * la **même** page dans l'autre langue, pas à l'accueil.
 */

for (const pair of PUBLIC_PAIRS) {
  for (const langue of ["fr", "en"] as const) {
    const path = pair[langue];
    const autre = langue === "fr" ? "en" : "fr";

    test(`${pair.name} (${langue}) : langue, hreflang et bascule vers ${pair[autre]}`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", langue);
      await expect(page.locator("h1").first()).toBeVisible();

      // Équivalents déclarés aux moteurs de recherche, comparés sur le
      // chemin : l'origine dépend de NEXT_PUBLIC_SITE_URL.
      const alternates = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((links) =>
          Object.fromEntries(
            links.map((link) => [
              link.getAttribute("hreflang"),
              new URL(link.getAttribute("href") ?? "", location.href).pathname,
            ]),
          ),
        );
      expect(alternates).toEqual({
        fr: pair.fr,
        en: pair.en,
        "x-default": pair.fr,
      });

      if (langue === "en") {
        // Le texte visible du site anglais (hors maquette de l'application,
        // `aria-hidden`, qui reprend des données de démonstration).
        const texte = await page
          .locator("main, header, footer")
          .evaluateAll((nodes) =>
            nodes
              .map((node) => {
                const copy = node.cloneNode(true) as HTMLElement;
                copy
                  .querySelectorAll("[aria-hidden=true], .sr-only")
                  .forEach((n) => n.remove());
                return copy.textContent ?? "";
              })
              .join("\n"),
          );
        const francais = without(texte, FRENCH_PROPER_NAMES).match(
          FRENCH_COMMON_WORDS,
        );
        expect([...new Set(francais ?? [])]).toEqual([]);
      }

      // Bascule : un lien ordinaire, qui recharge la page dans l'autre langue.
      const bascule = page.locator(`nav a[hreflang="${autre}"]`).first();
      await expect(bascule).toHaveAttribute("href", pair[autre]);
      await bascule.click();
      await expect(page).toHaveURL(pair[autre]);
      await expect(page.locator("html")).toHaveAttribute("lang", autre);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }
}

test.describe("adresse inexistante", () => {
  // Le navigateur journalise lui-même le statut 404 du document : c'est
  // précisément ce que le test provoque.
  test.use({ ignoredErrors: [/status of 404/] });

  for (const [path, langue] of [
    ["/page-inexistante", "fr"],
    ["/en/page-inexistante", "en"],
  ] as const) {
    test(`${path} répond 404, en ${langue}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", langue);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }
});
