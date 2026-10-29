import { expect, test } from "./support/fixtures";

/**
 * « À lire », poste de répartition de l'équipe IMAFRIK (démonstration).
 *
 * Chaque ligne « À attribuer » porte « Attribuer », chaque ligne « Chez un
 * radiologue » « Réattribuer » : la même fenêtre que dans « Examens ». Un
 * clic sur le bouton n'ouvre pas l'examen, et la navigation au clavier
 * reste celle de la file. L'entrée « À lire » compte ce qui attend une
 * attribution, en rouge s'il y a une urgence.
 *
 * Le bouton reste quand personne ne peut recevoir l'examen (la
 * mammographie de BOKO Essi, que personne ne lit dans le jeu) : la ligne le
 * dit, et la fenêtre explique pourquoi et mène à l'écran qui le règle.
 * Replié, le bloc « Lectures » garde le compteur de « À lire ».
 *
 * La démonstration ne réserve rien : valider la fenêtre aboutit au message
 * « indisponible en démonstration ». Le passage aussitôt de la ligne d'une
 * section à l'autre est éprouvé par `lib/worklist.test.ts`, l'éligibilité
 * par `tests/test_eligibilite_repartition.py` côté service.
 */

test.describe("l’équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("attribue depuis la file, sans quitter la file", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/worklist");
    const table = page.locator("main table");
    const aAttribuer = table
      .locator("tbody")
      .filter({ hasText: "À attribuer" });
    const chezUnRadiologue = table
      .locator("tbody")
      .filter({ hasText: "Chez un radiologue" });
    await expect(
      table.getByRole("columnheader", { name: "Attribution" }),
    ).toBeVisible();
    await expect(
      aAttribuer.getByRole("button", {
        name: "Attribuer l’examen de KOFFI Ama",
      }),
    ).toBeVisible();
    await expect(
      chezUnRadiologue
        .getByRole("button", { name: /^Réattribuer l’examen de/ })
        .first(),
    ).toBeVisible();
    await checkA11y();

    // Le bouton ouvre la fenêtre de l'équipe, pas l'examen.
    await aAttribuer
      .getByRole("button", { name: "Attribuer l’examen de KOFFI Ama" })
      .click();
    const fenetre = page.getByRole("dialog", { name: "Attribuer l’examen" });
    await expect(fenetre).toBeVisible();
    await expect(page).toHaveURL(/\/worklist$/);
    await expect(fenetre.getByText(/Réseau IMAFRIK/).first()).toBeVisible();
    await fenetre.getByRole("radio").first().check();
    await fenetre
      .getByRole("button", { name: "Attribuer", exact: true })
      .click();
    await expect(fenetre.getByRole("alert")).toContainText("démonstration");
    // Un clic dans la fenêtre n'a pas ouvert l'examen.
    await expect(page).toHaveURL(/\/worklist$/);
    await page.keyboard.press("Escape");
    await expect(fenetre).toHaveCount(0);

    // La navigation au clavier reste celle de la file.
    await page.keyboard.press("j");
    await expect(page.locator("a[data-row-link]:focus")).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/lecture\//);
  });

  test("répartit dans la file filtrée", async ({ page }) => {
    await page.goto("/worklist?modalite=CT");
    const lignes = page.locator("main table tbody tr").filter({
      has: page.getByRole("button", { name: /ttribuer l’examen de/ }),
    });
    await expect(lignes.first()).toBeVisible();
    for (const examen of await lignes
      .locator("td:nth-child(3)")
      .allInnerTexts())
      expect(examen).toMatch(/^CT/);
  });

  test("compte sur « À lire » ce qui attend une attribution, en rouge s’il y a une urgence", async ({
    page,
  }) => {
    await page.goto("/worklist");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const entree = nav.getByRole("link", { name: /^À lire/ });
    const badge = entree.getByLabel(/, dont des urgences$/);
    await expect(badge).toBeVisible();
    const attendus = await page
      .locator("main table tbody")
      .filter({ hasText: "À attribuer" })
      .getByRole("button", { name: /^Attribuer l’examen de/ })
      .count();
    await expect(badge).toHaveText(String(attendus));
  });
});

test.describe("quand personne ne peut recevoir un examen", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("garde « Attribuer », et la fenêtre dit pourquoi et quoi faire", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/worklist");
    const ligne = page
      .locator("main table tbody tr")
      .filter({ hasText: "BOKO Essi" });
    await expect(ligne.getByTestId("nobody-eligible")).toHaveText(
      /^Personne d’éligible/,
    );
    // Les autres lignes disent combien de radiologues peuvent les recevoir.
    await expect(
      page
        .locator("main table tbody tr")
        .filter({ hasText: "KOFFI Ama" })
        .getByText(/^\d+ éligibles?$/)
        .filter({ visible: true }),
    ).toBeVisible();

    const bouton = ligne.getByRole("button", {
      name: "Attribuer l’examen de BOKO Essi",
    });
    await expect(bouton).toHaveText("Attribuer");
    await bouton.click();
    const fenetre = page.getByRole("dialog", { name: "Attribuer l’examen" });
    await expect(
      fenetre.getByRole("heading", {
        name: "Personne ne peut recevoir cet examen",
      }),
    ).toBeVisible();
    await expect(fenetre).toContainText(
      "Aucun radiologue habilité ne lit « Mammographie » pour cette clinique.",
    );
    await expect(fenetre.getByRole("radio")).toHaveCount(0);
    await expect(
      fenetre.getByRole("button", { name: "Attribuer", exact: true }),
    ).toBeDisabled();
    await expect(
      fenetre.getByRole("link", { name: "Fiche de la clinique" }),
    ).toHaveAttribute("href", "/admin/organisations/org-pka");
    await page.waitForFunction(() => document.getAnimations().length === 0);
    await checkA11y();

    // Le geste mène à l'écran qui le règle : les modalités, dans « Comptes ».
    await fenetre.getByRole("link", { name: "Comptes" }).click();
    await expect(page).toHaveURL(/\/admin\/utilisateurs$/);
    await expect(fenetre).toHaveCount(0);
  });

  test("le dit aussi dans « Examens » et dans la vue des cliniques", async ({
    page,
  }) => {
    for (const adresse of [
      "/admin/examens",
      "/admin/vue-clinique/org-pka/examens",
    ]) {
      await page.goto(adresse);
      const ligne = page
        .locator("main tbody tr")
        .filter({ hasText: "BOKO Essi" });
      await expect(ligne.getByTestId("nobody-eligible")).toBeVisible();
      await expect(
        ligne.getByRole("button", { name: "Attribuer l’examen de BOKO Essi" }),
      ).toHaveText("Attribuer");
    }
  });
});

test.describe("la navigation de l’équipe", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("compte « À lire » sur « Lectures » replié", async ({ page }) => {
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const lectures = nav.getByRole("button", { name: /^Lectures/ });
    await expect(lectures).toHaveAttribute("aria-expanded", "false");
    const compteur = lectures.getByLabel(/^À lire : \d+, dont des urgences$/);
    await expect(compteur).toBeVisible();

    // Ouvert, le compteur revient sur l'entrée.
    await lectures.click();
    await expect(compteur).toHaveCount(0);
    await expect(
      nav
        .getByRole("link", { name: /^À lire/ })
        .getByLabel(/, dont des urgences$/),
    ).toBeVisible();
  });
});

test.describe("le radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("garde sa file, sans rien à attribuer", async ({ page }) => {
    await page.goto("/worklist");
    await expect(
      page.getByRole("heading", { level: 1, name: "À lire" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /ttribuer l’examen/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: "Attribution" }),
    ).toHaveCount(0);
  });
});
