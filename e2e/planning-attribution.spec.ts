import { expect, test } from "./support/fixtures";

/**
 * Planning d'attribution et alerte des urgences non prises (démonstration).
 *
 * Le responsable de la clinique compose, depuis « Équipe », le planning
 * de la semaine : des lignes par radiologue, avec au besoin une modalité,
 * des heures et une période. À l'arrivée d'un examen, le service
 * l'attribue d'office au radiologue de la ligne la plus précise ; l'écran
 * signale les conflits, où le planning ne tranche pas. L'équipe IMAFRIK
 * règle le même planning depuis la fiche de la clinique, radiologues du
 * réseau compris. En démonstration, chaque écriture s'arrête sur le
 * message qui le dit.
 *
 * Le planning de Saint-Joseph (`demoAssignmentPlan`) : Afi Mensah et Adjo
 * Kponton de jour en semaine (un conflit), Fatou Diallo la nuit, Mawuli
 * Agbeko le week-end, Ibrahim Bakari les scanners chaque semaine ; les IRM
 * de cette semaine à Mawuli Agbeko, les scanners de la suivante à Fatou
 * Diallo.
 */

const DEMO = /n’est pas disponible en démonstration/;

test.describe("le responsable de la clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("lit le planning de la semaine, ses conflits, et change de semaine", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/equipe");
    await page.getByRole("link", { name: "Planning d’attribution" }).click();
    // Navigation côté client : le titre du document arrive avec la page.
    await expect(page).toHaveTitle(/Planning d’attribution/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Planning d’attribution" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Cette semaine" }),
    ).toHaveAttribute("aria-current", "date");

    // Six lignes valent cette semaine : cinq chaque semaine, les IRM datées.
    const lignes = page.getByTestId("plan-line");
    await expect(lignes).toHaveCount(6);
    await expect(lignes.filter({ hasText: "IRM" })).toContainText(
      "Pr Mawuli Agbeko",
    );
    // Deux radiologues de jour, aussi précisément : le planning ne tranche pas.
    await expect(
      page.getByTestId("plan-warnings").getByText(/sont prévus en même temps/),
    ).toContainText("Dr Afi Mensah et Dr Adjo Kponton");
    await expect(
      page.getByRole("table").getByText("Conflit").first(),
    ).toBeVisible();

    // Le responsable modifie ses lignes ; celles du réseau, il les retire.
    await expect(
      page.getByRole("button", { name: /^Modifier la ligne : Dr Afi Mensah/ }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", {
        name: /^Modifier la ligne : Dr Fatou Diallo/,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^Retirer la ligne : Dr Fatou Diallo/ }),
    ).toHaveCount(1);
    await expect(
      page.getByText("Placé par l’équipe IMAFRIK", { exact: false }).first(),
    ).toBeVisible();

    // Rien à recopier vers cette semaine : la précédente n'a pas de ligne datée.
    const recopier = page.getByRole("button", {
      name: "Recopier la semaine précédente",
    });
    await expect(recopier).toBeDisabled();
    await checkA11y();

    // La semaine prochaine : les scanners de Fatou Diallo, et les IRM de
    // cette semaine à recopier.
    await page.getByRole("link", { name: "Semaine prochaine" }).click();
    await expect(page).toHaveURL(/[?&]semaine=\d{4}-\d{2}-\d{2}/);
    await expect(lignes).toHaveCount(6);
    await expect(lignes.filter({ hasText: "Scanner" })).toHaveCount(2);
    await expect(recopier).toBeEnabled();
    await recopier.click();
    // La semaine a déjà sa ligne datée : la recopie demande de la remplacer.
    const remplacer = page.getByRole("dialog", {
      name: "Remplacer les lignes de cette semaine ?",
    });
    await expect(remplacer).toContainText("une ligne datée");
    await remplacer.getByRole("button", { name: "Remplacer" }).click();
    await expect(page.getByText(DEMO)).toBeVisible();
  });

  test("filtre par modalité et passe à la présentation par modalité", async ({
    page,
  }) => {
    await page.goto("/equipe/regles");
    const lignes = page.getByTestId("plan-line");
    await page
      .getByTestId("filter-bar")
      .getByRole("link", { name: /^Scanner/ })
      .click();
    await expect(page).toHaveURL(/[?&]modalite=scanner/);
    // Les lignes pour toutes les modalités couvrent aussi les scanners.
    await expect(lignes).toHaveCount(5);
    await expect(lignes.filter({ hasText: "IRM" })).toHaveCount(0);

    await page.getByRole("link", { name: "Par modalité" }).click();
    await expect(page).toHaveURL(/[?&]vue=modalite/);
    const grille = page.getByRole("table");
    await expect(
      grille.getByRole("rowheader", { name: "Scanner" }),
    ).toBeVisible();
    await expect(
      grille.getByRole("rowheader", { name: "Toutes modalités" }),
    ).toBeVisible();
  });

  test("ajoute une ligne, vérifiée avant l’envoi", async ({ page }) => {
    await page.goto("/equipe/regles");
    await page.getByRole("button", { name: "Ajouter une ligne" }).click();
    const fenetre = page.getByRole("dialog", { name: "Ajouter une ligne" });
    // Ses seuls radiologues : Afi Mensah, choisie d'office.
    await expect(fenetre.getByLabel("Radiologue")).toHaveValue("p-amensah");
    // Elle ne lit pas l'IRM, réglée par l'équipe IMAFRIK.
    await expect(fenetre.getByRole("button", { name: "IRM" })).toBeDisabled();
    await fenetre.getByRole("button", { name: "Échographie" }).click();
    await fenetre.getByRole("button", { name: "Toute la semaine" }).click();
    await expect(
      fenetre.getByRole("button", { name: "dimanche" }),
    ).toHaveAttribute("aria-pressed", "true");

    await fenetre.getByLabel("Une période").check();
    const du = fenetre.getByLabel("Du", { exact: true });
    const au = fenetre.getByLabel("Au", { exact: true });
    // La semaine affichée, proposée d'office.
    const debut = await du.inputValue();
    await expect(au).not.toHaveValue("");
    await du.fill("2099-12-31");
    await fenetre.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(fenetre.getByRole("alert")).toHaveText(
      "La période finit après avoir commencé.",
    );

    await du.fill(debut);
    await fenetre.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(fenetre.getByText(DEMO)).toBeVisible();
  });

  test("tient sur un téléphone, la semaine jour par jour", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/equipe/regles");
    await expect(page.getByRole("table")).toBeHidden();
    await expect(
      page.getByRole("listitem").filter({ hasText: /^lundi/ }),
    ).toBeVisible();
    await expect(page.getByTestId("plan-line")).toHaveCount(6);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("trouve l'aide de l'écran", async ({ page }) => {
    await page.goto("/equipe/regles");
    await page.getByRole("button", { name: "Aide" }).click();
    const aide = page.getByRole("dialog", { name: "Aide" });
    await expect(aide).toContainText("Planning d’attribution");
    await expect(aide).toContainText("Recopier la semaine précédente");
    await expect(aide).toContainText("Règle d’attribution");
  });
});

test.describe("the clinic manager, in English", () => {
  test.use({ membership: "m-clinic", langue: "en" });

  test("reads the assignment schedule", async ({ page }) => {
    await page.goto("/equipe/regles");
    await expect(
      page.getByRole("heading", { level: 1, name: "Assignment schedule" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Next week" })).toBeVisible();
    await expect(
      page.getByTestId("plan-line").filter({ hasText: "MRI" }),
    ).toContainText("From");
    await expect(page.getByText("Every week").first()).toBeVisible();
  });
});

test.describe("l'équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("règle le planning d'une clinique depuis sa fiche", async ({ page }) => {
    await page.goto("/admin/organisations/org-stj");
    await expect(
      page.getByRole("heading", { name: "Planning d’attribution" }),
    ).toBeVisible();
    // L'équipe modifie aussi les lignes des radiologues du réseau.
    await expect(
      page.getByRole("button", {
        name: /^Modifier la ligne : Dr Fatou Diallo/,
      }),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Ajouter une ligne" }).click();
    await expect(
      page
        .getByRole("dialog", { name: "Ajouter une ligne" })
        .getByLabel("Radiologue")
        .locator("option", { hasText: "Ibrahim Bakari" }),
    ).toHaveCount(1);
  });

  test("voit en rouge une urgence que personne n'a prise", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByText(
        /urgences? (n’est|ne sont) prises? par aucun radiologue depuis plus de 10 min/,
      ),
    ).toBeVisible();
  });

  test("lit « Règle d’attribution » comme auteur des attributions d’avant", async ({
    page,
  }) => {
    await page.goto("/admin/audit");
    const ligne = page
      .getByRole("listitem")
      .filter({ hasText: "Examen attribué par une règle" })
      .first();
    await expect(ligne).toContainText("Règle d’attribution");
  });
});
