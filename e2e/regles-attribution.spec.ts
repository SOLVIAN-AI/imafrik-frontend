import { expect, test } from "./support/fixtures";

/**
 * Règles d'attribution et alerte des urgences non prises (démonstration).
 *
 * Le responsable de la clinique règle, depuis « Équipe », le radiologue de
 * chaque modalité et le planning de la semaine ; l'équipe IMAFRIK règle
 * les mêmes règles depuis la fiche de la clinique. L'écran signale deux
 * radiologues de garde en même temps et les gardes de nuit ; en
 * démonstration, l'enregistrement s'arrête sur le message qui le dit.
 * La tour de contrôle affiche en rouge les urgences que personne n'a
 * prises depuis plus de 10 minutes.
 */

test.describe("le responsable de la clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("règle le planning et le radiologue de chaque modalité", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/equipe");
    await page.getByRole("link", { name: "Règles d’attribution" }).click();
    // Navigation côté client : le titre du document arrive avec la page.
    await expect(page).toHaveTitle(/Règles d’attribution/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Règles d’attribution" }),
    ).toBeVisible();

    // Les règles lues : l'échographie à Afi Mensah, une semaine couverte.
    await expect(page.getByLabel("Échographie")).toHaveValue("p-amensah");
    await expect(page.getByLabel("Scanner")).toHaveValue("");
    const creneaux = page.getByRole("listitem", { name: /^Créneau \d$/ });
    await expect(creneaux).toHaveCount(3);
    await expect(creneaux.first()).toContainText("Afi Mensah");
    await expect(page.getByText("jusqu’au lendemain matin")).toBeVisible();
    await expect(page.getByText(/sont de garde en même temps/)).toHaveCount(0);
    const enregistrer = page.getByRole("button", {
      name: "Enregistrer les règles",
    });
    await expect(enregistrer).toBeDisabled();
    await checkA11y();

    // Un créneau qui chevauche celui d'Afi Mensah est signalé.
    await page.getByRole("button", { name: "Ajouter un créneau" }).click();
    const nouveau = page.getByRole("listitem", { name: "Créneau 4" });
    await expect(nouveau.getByRole("alert")).toHaveText(
      "Choisissez un radiologue.",
    );
    await nouveau
      .getByLabel("Radiologue")
      .selectOption({ label: "Pr Mawuli Agbeko · Réseau IMAFRIK" });
    await expect(nouveau.getByRole("alert")).toHaveCount(0);
    const chevauchements = page.getByText(/sont de garde en même temps/);
    await expect(
      chevauchements.filter({ hasText: "Afi Mensah" }),
    ).toContainText("lundi, mardi, mercredi, jeudi, vendredi");

    // Une garde de nuit, le samedi seulement : plus de chevauchement avec
    // Afi Mensah, mais elle croise la garde de nuit de Fatou Diallo.
    for (const jour of ["lundi", "mardi", "mercredi", "jeudi", "vendredi"]) {
      await nouveau.getByRole("button", { name: jour }).click();
    }
    await nouveau.getByRole("button", { name: "samedi" }).click();
    await expect(
      nouveau.getByRole("button", { name: "samedi" }),
    ).toHaveAttribute("aria-pressed", "true");
    await nouveau.getByLabel("Toute la journée").uncheck();
    await nouveau.getByLabel("De", { exact: true }).fill("20:00");
    await nouveau.getByLabel("à", { exact: true }).fill("06:00");
    await expect(nouveau).toContainText("jusqu’au lendemain matin");
    await expect(chevauchements.filter({ hasText: "Afi Mensah" })).toHaveCount(
      0,
    );
    // La nuit du samedi croise la sienne jusqu'au dimanche matin.
    await expect(chevauchements).toHaveText([
      /Fatou Diallo.*\(samedi, dimanche\)/,
    ]);

    // On ne désigne pour une modalité qu'un radiologue qui la lit.
    await expect(
      page.getByLabel("Scanner").locator("option", { hasText: "Afi Mensah" }),
    ).toHaveCount(0);

    await enregistrer.click();
    await expect(
      page.getByText(/n’est pas disponible en démonstration/),
    ).toBeVisible();
    await checkA11y();
  });

  test("trouve l'aide de l'écran", async ({ page }) => {
    await page.goto("/equipe/regles");
    await page.getByRole("button", { name: "Aide" }).click();
    const aide = page.getByRole("dialog", { name: "Aide" });
    await expect(aide).toContainText("Règles d’attribution");
    await expect(aide).toContainText("garde de nuit");
    await expect(aide).toContainText("Planning de la semaine");
  });
});

test.describe("the clinic manager, in English", () => {
  test.use({ membership: "m-clinic", langue: "en" });

  test("sees the weekly schedule and modality radiologists", async ({
    page,
  }) => {
    await page.goto("/equipe/regles");
    await expect(
      page.getByRole("heading", { level: 1, name: "Assignment rules" }),
    ).toBeVisible();
    await expect(page.getByLabel("Ultrasound")).toHaveValue("p-amensah");
    await expect(page.getByRole("listitem", { name: /^Slot \d$/ })).toHaveCount(
      3,
    );
    await expect(page.getByText("until the next morning")).toBeVisible();
  });
});

test.describe("l'équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("règle les règles d'une clinique depuis sa fiche", async ({ page }) => {
    await page.goto("/admin/organisations/org-stj");
    await expect(
      page.getByRole("heading", { name: "Règles d’attribution" }),
    ).toBeVisible();
    await expect(
      page.getByText(/reçoit d’office les examens de cette clinique/),
    ).toBeVisible();
    await expect(page.getByLabel("Échographie")).toHaveValue("p-amensah");
    await expect(
      page.getByRole("listitem", { name: /^Créneau \d$/ }),
    ).toHaveCount(3);
    // L'équipe choisit parmi tout le groupe, pas seulement la clinique.
    await expect(
      page
        .getByRole("listitem", { name: "Créneau 1" })
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

  test("lit « Règle d’attribution » comme auteur dans le journal", async ({
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
