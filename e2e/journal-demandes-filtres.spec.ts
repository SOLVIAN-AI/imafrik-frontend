import type { Locator, Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * Journal d'audit et demandes reçues sur la barre commune (démonstration).
 * Le journal se filtre par le service (organisation, auteur, famille,
 * action, période) ; les demandes, sur la page, chaque option comptée.
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

test("le journal se filtre par famille, puis par action de la famille", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/audit");
  const filtres = bar(page);
  await filtres.getByRole("button", { name: /^Famille / }).click();
  await page
    .getByRole("listbox", { name: "Famille" })
    .getByRole("option", { name: /^Comptes-rendus/ })
    .click();
  await expect(page).toHaveURL(/[?&]famille=report(&|$)/);
  // Les actions proposées sont celles de la famille.
  await filtres.getByRole("button", { name: /^Action / }).click();
  const actions = page.getByRole("listbox", { name: "Action" });
  const noms = (await actions.getByRole("option").allInnerTexts()).map(
    (texte) => texte.trim(),
  );
  expect(noms[0]).toBe("Toutes les actions");
  const duCompteRendu = [
    "Compte-rendu signé",
    "Addendum ajouté",
    "Compte-rendu remis",
    "Compte-rendu téléchargé",
    "Compte-rendu annulé",
    "Brouillon relu par l’IA",
  ];
  expect(noms.length).toBeGreaterThan(1);
  for (const nom of noms.slice(1)) expect(duCompteRendu).toContain(nom);
  await page.keyboard.press("Escape");
  await settle(page);
  await checkA11y();
});

test("une ancienne adresse d’action reste lue", async ({ page }) => {
  await page.goto("/admin/audit?action=report.signed");
  await expect(
    bar(page).getByRole("button", { name: /^Action Compte-rendu signé/ }),
  ).toBeVisible();
});

test("les demandes montrent tout par défaut, chaque étape comptée", async ({
  page,
}) => {
  await page.goto("/admin/demandes");
  const etapes = bar(page).getByRole("group", { name: "Étape" });
  const toutes = etapes.getByRole("link", { name: /^Toutes les étapes/ });
  await expect(toutes).toHaveAttribute("aria-current", "true");
  let somme = 0;
  for (const nom of ["Nouvelles", "Contactées", "Converties", "Écartées"])
    somme += await shown(
      etapes.getByRole("link", { name: new RegExp(`^${nom}`) }),
    );
  expect(somme).toBe(await shown(toutes));

  // L'alerte du cockpit ouvre les nouvelles : l'ancienne valeur est lue.
  await page.goto("/admin/demandes?etat=new");
  await expect(
    etapes.getByRole("link", { name: /^Nouvelles/ }),
  ).toHaveAttribute("aria-current", "true");
});

test("cherche une demande sans l’écrire dans l’adresse", async ({ page }) => {
  await page.goto("/admin/demandes");
  const champ = page.getByRole("searchbox", { name: "Rechercher une demande" });
  await champ.fill("akakpo");
  await champ.press("Enter");
  await expect(page.getByText("Dr Sena Akakpo")).toBeVisible();
  await expect(page.getByText("Komlan Adjavon")).toHaveCount(0);
  expect(page.url()).not.toContain("akakpo");
});
