import { readFile } from "node:fs/promises";

import { expect, test } from "./support/fixtures";

/**
 * Activité et facturation de la clinique (démonstration).
 *
 * Le responsable de la clinique ouvre « Activité et facturation » depuis
 * la navigation : l'activité du mois, puis le relevé de facturation, le
 * même que celui de l'équipe IMAFRIK. Un mois passé est clos et le dit.
 * Un radiologue n'a pas accès à l'écran. L'équipe IMAFRIK lit le relevé
 * de chaque clinique et renseigne la formule d'abonnement sur la fiche de
 * la clinique ; en démonstration, l'enregistrement s'arrête sur le
 * message qui le dit.
 */

/** Mois `AAAA-MM` courant et précédent, en UTC comme le service. */
const now = new Date();
const MOIS = now.toISOString().slice(0, 7);
const PRECEDENT = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
)
  .toISOString()
  .slice(0, 7);
// La démonstration clôt un mois le 3 du mois suivant, à 8 h.
const PRECEDENT_CLOS =
  now.getTime() >= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 3, 8);

test.describe("le responsable de la clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("lit l'activité et le relevé du mois, puis exporte le relevé", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/tableau-de-bord");
    await page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Activité et facturation" })
      .click();
    await expect(page).toHaveURL(/\/activite$/);
    await expect(page).toHaveTitle(/Activité et facturation/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Activité et facturation" }),
    ).toBeVisible();

    // L'activité : quatre chiffres, puis le détail.
    for (const label of [
      "Examens reçus",
      "Rendus",
      "Délai médian",
      "Dans les délais promis",
    ]) {
      await expect(
        page.getByText(label, { exact: true }).first(),
      ).toBeVisible();
    }
    const modalites = page.getByRole("table").first();
    await expect(
      modalites.getByRole("rowheader", { name: "Scanner" }),
    ).toBeVisible();

    // Les performances par radiologue : rangées par délai médian, triables.
    const performances = page.getByRole("table").filter({
      has: page.getByRole("columnheader", { name: /Radiologue/ }),
    });
    const medianes = performances.getByRole("columnheader", {
      name: "Trier par Délai médian",
    });
    await expect(medianes).toHaveAttribute("aria-sort", "ascending");
    for (const colonne of [
      "Moyen",
      "90e centile",
      "Prise en charge",
      "Lecture",
      "Rendus sans signature",
      "Urgences prises",
      "En cours",
    ]) {
      await expect(
        performances
          .getByRole("button", {
            name: `Trier par ${colonne}`,
            exact: true,
          })
          .first(),
      ).toBeVisible();
    }
    const premier = () =>
      performances.getByRole("rowheader").first().textContent();
    const avant = await premier();
    await performances
      .getByRole("button", { name: "Trier par Actes signés" })
      .click();
    await expect(
      performances.getByRole("columnheader", {
        name: "Trier par Actes signés",
      }),
    ).toHaveAttribute("aria-sort", "descending");
    await expect(medianes).toHaveAttribute("aria-sort", "none");
    await performances
      .getByRole("button", { name: "Trier par Délai médian" })
      .click();
    expect(await premier()).toBe(avant);
    await expect(
      page.getByText(/contrairement à la moyenne/).first(),
    ).toBeVisible();

    // Le relevé du mois en cours : provisoire, formule Pro.
    await expect(page.getByText(/^Relevé provisoire/)).toBeVisible();
    await expect(page.getByText("Formule Pro")).toBeVisible();
    await expect(page.getByText("25 000 FCFA").first()).toBeVisible();
    await expect(page.getByText("Honoraires des radiologues")).toBeVisible();
    await expect(
      page.getByText(/au tarif de base de sa modalité/),
    ).toBeVisible();
    await checkA11y();

    // L'export du mois.
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Exporter en CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(`imafrik-releve-${MOIS}.csv`);
    const csv = await readFile((await download.path())!, "utf8");
    expect(csv).toContain("Mois;Poste;Détail;Actes;Dont urgences");
    expect(csv).toContain(`${MOIS};Abonnement;Formule Pro;;;;;25000`);
    expect(csv).toContain(`${MOIS};Forfait technique;Scanner;`);

    // Le mois précédent, clos : le relevé le dit.
    await page.getByRole("link", { name: "Mois précédent" }).click();
    await expect(page).toHaveURL(new RegExp(`mois=${PRECEDENT}`));
    if (PRECEDENT_CLOS) {
      await expect(page.getByText(/^Mois clos le /)).toBeVisible();
    } else {
      await expect(page.getByText(/^Relevé provisoire/)).toBeVisible();
    }
    await expect(
      page.getByRole("link", { name: "Mois suivant" }),
    ).toBeVisible();
  });
});

test.describe("le responsable de la clinique, en anglais", () => {
  test.use({ membership: "m-clinic", langue: "en" });

  test("lit le même écran dans sa langue", async ({ page }) => {
    await page.goto("/activite");
    await expect(
      page.getByRole("heading", { level: 1, name: "Activity and billing" }),
    ).toBeVisible();
    await expect(page.getByText("Pro plan")).toBeVisible();
    await expect(page.getByText("Radiologists’ fees")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Performance by radiologist" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sort by Median turnaround" }),
    ).toBeVisible();
  });
});

test.describe("un radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("n'a pas accès à l'activité et à la facturation d'une clinique", async ({
    page,
  }) => {
    await page.goto("/activite");
    await expect(page).toHaveURL(/\/worklist$/);
  });
});

test.describe("l'équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("lit les performances des radiologues du mois choisi", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin/activite?jours=30");
    await expect(
      page.getByRole("heading", { name: "Performances par radiologue" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Trier par Délai médian" }),
    ).toHaveAttribute("aria-sort", "ascending");
    await expect(
      page.getByRole("rowheader", { name: "Dr Adjo Kponton" }),
    ).toBeVisible();
    await checkA11y();
    // Le mois précédent garde la période de l'écran.
    await page
      .getByRole("navigation", { name: "Mois" })
      .getByRole("link", { name: "Mois précédent" })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`jours=30.*mois=${PRECEDENT}|mois=${PRECEDENT}.*jours=30`),
    );
    await expect(
      page.getByRole("rowheader", { name: "Dr Adjo Kponton" }),
    ).toBeVisible();
  });

  test("lit le relevé de chaque clinique, le même que celui du responsable", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin/facturation");
    await expect(
      page.getByText("Mois en cours : les relevés sont provisoires."),
    ).toBeVisible();
    for (const label of [
      "Total HT",
      "Actes facturés",
      "Sans compte-rendu signé",
      "Sans formule",
    ]) {
      await expect(
        page.getByText(label, { exact: true }).first(),
      ).toBeVisible();
    }
    // Le panneau d'une clinique : le plus petit bloc qui porte son nom et
    // ses honoraires.
    const panneau = (clinique: string) =>
      page
        .locator("div")
        .filter({ has: page.getByRole("heading", { name: clinique }) })
        .filter({ hasText: "Honoraires des radiologues" })
        .last();
    const stj = panneau("Clinique Saint-Joseph");
    await expect(stj.getByText("Formule Pro")).toBeVisible();
    // Une clinique sans formule : ni abonnement ni total.
    const lumiere = panneau("Centre médical Lumière");
    await expect(
      lumiere.getByText("Formule non renseignée").first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Clore le mois" }),
    ).toHaveCount(0);
    await checkA11y();
  });

  test("renseigne la formule d'abonnement sur la fiche de la clinique", async ({
    page,
  }) => {
    await page.goto("/admin/organisations/org-stj");
    await expect(page.getByText("25 000 FCFA HT par mois")).toBeVisible();
    const enregistrer = page
      .locator("form")
      .filter({ has: page.getByRole("radio", { name: /Formule Pro/ }) })
      .getByRole("button", { name: "Enregistrer" });
    await expect(
      page.getByRole("radio", { name: /Formule Pro/ }),
    ).toBeChecked();
    await expect(enregistrer).toBeDisabled();

    await page.getByRole("radio", { name: "Formule Établissement" }).check();
    const prix = page.getByLabel("Prix mensuel (FCFA HT)");
    await expect(prix).toHaveValue("100000");
    await prix.fill("90000");
    await expect(enregistrer).toBeDisabled();
    await prix.fill("150000");
    await expect(enregistrer).toBeEnabled();
    await enregistrer.click();
    await expect(
      page.getByText(/n’est pas disponible en démonstration/),
    ).toBeVisible();
  });
});
