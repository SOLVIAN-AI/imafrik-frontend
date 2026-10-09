import type { Locator, Page } from "@playwright/test";

import {
  expect,
  settle,
  test,
  type DemoMembership,
  type Langue,
  type Theme,
} from "./support/fixtures";

/**
 * Accessibilité : audit axe-core (WCAG 2.1 A et AA) et contrôles au
 * clavier.
 *
 * L'audit tourne sur un échantillon représentatif, dans les deux langues
 * et les deux thèmes : le site public (dont le formulaire de contact en
 * erreur), la connexion, puis les écrans principaux de chaque portail.
 * Les couleurs changent d'un thème à l'autre, les libellés d'une langue à
 * l'autre : un contraste ou un nom accessible correct dans une
 * combinaison ne l'est pas forcément dans une autre.
 *
 * Les contrôles au clavier, eux, ne dépendent ni de la langue ni du
 * thème : ils tournent une fois, en français. Voir `docs/tests.md`.
 */

/** Écrans audités, par portail ; `null` pour le site public. */
const SCREENS: {
  membership: DemoMembership | null;
  paths: Record<Langue, string[]>;
}[] = [
  {
    membership: null,
    paths: {
      fr: ["/", "/securite", "/contact", "/connexion"],
      en: ["/en", "/en/security", "/en/contact", "/connexion"],
    },
  },
  {
    membership: "m-radio",
    paths: {
      fr: ["/worklist", "/lecture/1", "/parametres"],
      en: ["/worklist", "/lecture/1", "/parametres"],
    },
  },
  {
    membership: "m-clinic",
    paths: {
      fr: ["/tableau-de-bord", "/examens", "/examens/1"],
      en: ["/tableau-de-bord", "/examens", "/examens/1"],
    },
  },
  {
    membership: "m-admin",
    paths: {
      fr: [
        "/admin",
        "/admin/utilisateurs",
        "/admin/organisations",
        "/admin/demandes?etat=all",
      ],
      en: [
        "/admin",
        "/admin/utilisateurs",
        "/admin/organisations",
        "/admin/demandes?etat=all",
      ],
    },
  },
];

/** Adresse du formulaire de contact, et libellés de l'état en erreur. */
const CONTACT: Record<Langue, { path: string; submit: string; error: string }> =
  {
    fr: {
      path: "/contact",
      submit: "Envoyer la demande",
      error: "Indiquez votre nom.",
    },
    en: {
      path: "/en/contact",
      submit: "Send request",
      error: "Please enter your name.",
    },
  };

const LANGUES: Langue[] = ["fr", "en"];
const THEMES: Theme[] = ["light", "dark"];

/**
 * Charge une page et attend qu'elle soit stable dans le thème voulu.
 *
 * @param page  Page du test.
 * @param path  Adresse à ouvrir.
 * @param theme Thème attendu sur `<html>`.
 */
async function open(page: Page, path: string, theme: Theme): Promise<void> {
  await page.goto(path);
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
  await settle(page);
}

for (const langue of LANGUES) {
  for (const theme of THEMES) {
    for (const { membership, paths } of SCREENS) {
      test.describe(`axe ${langue} ${theme} ${membership ?? "public"}`, () => {
        test.use({ langue, theme, membership, colorScheme: theme });

        for (const path of paths[langue]) {
          test(`${path} sans violation grave`, async ({ page, checkA11y }) => {
            await open(page, path, theme);
            await checkA11y();
          });
        }
      });
    }

    test.describe(`axe ${langue} ${theme} contact en erreur`, () => {
      test.use({ langue, theme, colorScheme: theme });

      test("formulaire envoyé vide sans violation grave", async ({
        page,
        checkA11y,
      }) => {
        const { path, submit, error } = CONTACT[langue];
        await open(page, path, theme);
        await page.getByRole("button", { name: submit }).click();
        await expect(
          page.locator("form").getByText(error, { exact: true }),
        ).toBeVisible();
        await settle(page);
        await checkA11y();
      });
    });
  }
}

/**
 * Vrai si l'élément porte un repère de focus visible : un contour non
 * nul, ou à défaut une ombre (anneau dessiné par `box-shadow`).
 *
 * @param locator Élément qui a le focus.
 */
async function hasVisibleFocus(locator: Locator): Promise<boolean> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    const outline =
      style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    return outline || style.boxShadow !== "none";
  });
}

/**
 * Tabule `count` fois depuis le haut de la page et vérifie, à chaque pas,
 * que l'élément atteint montre un repère de focus.
 *
 * @param page  Page fraîchement chargée.
 * @param count Nombre d'éléments à parcourir.
 * @returns Description des éléments sans repère visible.
 */
async function tabWithoutVisibleFocus(
  page: Page,
  count: number,
): Promise<string[]> {
  const missing: string[] = [];
  for (let step = 0; step < count; step++) {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveCount(1);
    if (!(await hasVisibleFocus(focused)))
      missing.push(
        await focused.evaluate(
          (el) =>
            `<${el.tagName.toLowerCase()}> « ${(el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 40)} »`,
        ),
      );
  }
  return missing;
}

test.describe("clavier", () => {
  test.use({ langue: "fr" });

  test.describe("site public", () => {
    test("le lien d’évitement mène au contenu principal", async ({ page }) => {
      await open(page, "/", "dark");
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: "Aller au contenu" });
      await expect(skip).toBeFocused();
      await expect(skip).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(page.locator("main")).toBeFocused();
    });

    test("repères de page et focus visible", async ({ page }) => {
      await open(page, "/", "dark");
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      expect(await tabWithoutVisibleFocus(page, 6)).toEqual([]);
    });

    test("connexion : repères et focus visible", async ({ page }) => {
      await open(page, "/connexion", "dark");
      await expect(page.getByRole("main")).toHaveCount(1);
      expect(await tabWithoutVisibleFocus(page, 4)).toEqual([]);
    });
  });

  for (const membership of ["m-radio", "m-clinic", "m-admin"] as const) {
    test.describe(membership, () => {
      test.use({ membership });

      test("lien d’évitement, repères et focus visible", async ({ page }) => {
        const home = {
          "m-radio": "/worklist",
          "m-clinic": "/tableau-de-bord",
          "m-admin": "/admin",
        }[membership];
        await open(page, home, "dark");
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(
          page.getByRole("navigation", { name: /./ }).first(),
        ).toBeAttached();
        await page.keyboard.press("Tab");
        const skip = page.getByRole("link", { name: "Aller au contenu" });
        await expect(skip).toBeFocused();
        await expect(skip).toBeVisible();
        await page.keyboard.press("Enter");
        await expect(page.locator("main")).toBeFocused();
        // Le parcours reprend dans le contenu, focus visible.
        expect(await tabWithoutVisibleFocus(page, 4)).toEqual([]);
      });
    });
  }

  test.describe("dialogue de confirmation", () => {
    test.use({ membership: "m-admin" });

    test("le focus reste dans le dialogue, puis revient au bouton", async ({
      page,
      checkA11y,
    }) => {
      await open(page, "/admin/utilisateurs?validation=attente", "dark");
      const trigger = page
        .locator('[data-credentials-row="pending"]')
        .getByRole("button", { name: "Valider le numéro d’ordre" });
      await trigger.focus();
      await page.keyboard.press("Enter");

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(
        "Valider le numéro d’ordre de Dr Kossi Amegah",
      );
      // Le focus entre dans le dialogue et n'en sort pas à la tabulation.
      for (let step = 0; step < 6; step++) {
        await expect(dialog.locator(":focus")).toHaveCount(1);
        await page.keyboard.press("Tab");
      }
      await expect(dialog.locator(":focus")).toHaveCount(1);
      await settle(page);
      await checkA11y();

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  });
});
