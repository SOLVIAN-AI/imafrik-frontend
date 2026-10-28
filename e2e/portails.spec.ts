import { NAV_BY_MEMBERSHIP } from "./support/donnees";
import {
  expect,
  HOME_BY_MEMBERSHIP,
  test,
  type DemoMembership,
} from "./support/fixtures";

/**
 * Portails : radiologue, clinique, équipe IMAFRIK.
 *
 * Pour chaque portail et chaque langue, chaque entrée de la navigation
 * principale est cliquée dans l'ordre : l'adresse change, l'écran affiche
 * son titre, `<html lang>` reste celui de la langue choisie, et aucune
 * erreur JavaScript ni `console.error` n'est émise (vérifié par la
 * fixture `pageErrors`).
 */

for (const membership of Object.keys(NAV_BY_MEMBERSHIP) as DemoMembership[]) {
  for (const langue of ["fr", "en"] as const) {
    test.describe(`portail ${membership} en ${langue}`, () => {
      test.use({ membership, langue });

      test("chaque entrée de la navigation ouvre son écran", async ({
        page,
      }) => {
        // Un écran après l'autre dans le même test : le délai suit le nombre
        // d'entrées. L'équipe IMAFRIK en a dix-huit ; sous charge, le délai
        // commun de trente secondes ne suffisait plus à les parcourir.
        test.setTimeout(10_000 + NAV_BY_MEMBERSHIP[membership].length * 4_000);
        await page.goto(HOME_BY_MEMBERSHIP[membership]);
        const nav = page.getByRole("navigation", {
          name: langue === "fr" ? "Navigation principale" : "Main navigation",
        });
        const hrefs = await nav
          .locator("a")
          .evaluateAll((links) =>
            links.map((link) => link.getAttribute("href")),
          );
        expect(hrefs).toEqual(NAV_BY_MEMBERSHIP[membership]);

        for (const href of NAV_BY_MEMBERSHIP[membership]) {
          await test.step(href, async () => {
            const link = nav.locator(`a[href="${href}"]`);
            // Une entrée d'un bloc replié (les lectures, chez
            // l'équipe IMAFRIK) s'ouvre d'abord par le titre de son bloc.
            if (!(await link.isVisible())) {
              const bloc = await link.evaluate(
                (element) => element.closest("[id]")?.id ?? "",
              );
              await nav.locator(`button[aria-controls="${bloc}"]`).click();
            }
            await link.click();
            await expect(page).toHaveURL(href);
            await expect(nav.locator(`a[href="${href}"]`)).toHaveAttribute(
              "aria-current",
              "page",
            );
            await expect(page.locator("h1").first()).toBeVisible();
            await expect(page.locator("html")).toHaveAttribute("lang", langue);
          });
        }
      });
    });
  }
}
