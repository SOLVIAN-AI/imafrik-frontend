import {
  APP_SCREENS,
  DEMO_DATA_PHRASES,
  FRENCH_UI_WORDS,
  without,
} from "./support/donnees";
import { expect, test, type DemoMembership } from "./support/fixtures";

/**
 * Application en anglais : aucun libellé d'interface français.
 *
 * Chaque écran de chaque portail est chargé avec le cookie de langue en
 * anglais. `<html lang>` doit valoir `en`, et le texte visible ne doit
 * contenir aucun des libellés français de `FRENCH_UI_WORDS`. Les données
 * de démonstration, en français, n'y figurent pas : elles ne sont pas
 * traduites, et ne doivent pas l'être.
 */

test.use({ langue: "en" });

for (const membership of Object.keys(APP_SCREENS) as DemoMembership[]) {
  test.describe(`portail ${membership}`, () => {
    test.use({ membership });

    for (const path of APP_SCREENS[membership]) {
      test(`${path} est entièrement en anglais`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        const texte = await page.locator("body").innerText();
        const francais = without(texte, DEMO_DATA_PHRASES).match(
          FRENCH_UI_WORDS,
        );
        expect([...new Set(francais ?? [])]).toEqual([]);
      });
    }
  });
}
