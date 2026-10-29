import { expect, test } from "./support/fixtures";

/**
 * Modalités lues dans « Comptes », et performances à un clic
 * (démonstration).
 *
 * Sur la ligne de chaque radiologue : ses modalités lues, en clair, avec un
 * bouton « Modalités » libellé, les listes d'urgence où il figure, et
 * « Voir ses performances », qui ouvre la rubrique « Par radiologue » de
 * l'activité sur sa ligne. Chaque indicateur y est expliqué en une phrase,
 * dans la bulle ⓘ de son intitulé (clavier, clic, Échap), qui mène au
 * glossaire quand il en dit davantage ; un mois sans activité le dit.
 */

test.describe("l’équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("lit les modalités et les listes d’urgence de chaque radiologue", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin/utilisateurs");
    const diallo = page
      .locator("li")
      .filter({ hasText: "Fatou Diallo" })
      .getByTestId("reading-row");
    await expect(diallo.getByText("Scanner, IRM")).toBeVisible();
    await expect(diallo.getByText("Sur aucune liste d’urgence")).toBeVisible();
    await expect(
      diallo.getByRole("button", {
        name: /^Modalités lues par Dr Fatou Diallo/,
      }),
    ).toHaveText("Modalités");
    const kponton = page
      .locator("li")
      .filter({ hasText: "Adjo Kponton" })
      .getByTestId("reading-row");
    // Personne ne lit la mammographie dans le jeu de démonstration.
    await expect(
      kponton.getByText("Radiographie, Échographie, Scanner, IRM, Autres"),
    ).toBeVisible();
    await expect(
      kponton.getByText("Liste d’urgence : Clinique Saint-Joseph"),
    ).toBeVisible();
    await checkA11y();

    // Le bouton ouvre le réglage.
    await diallo.getByRole("button", { name: /Modalités/ }).click();
    await expect(
      page.getByRole("dialog", { name: "Lecture de Dr Fatou Diallo" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // Filtrer par modalité lue : l'échographie, Dr Diallo ne la lit pas.
    await page
      .getByLabel("Modalité lue")
      .selectOption({ label: "Échographie" });
    await expect(page).toHaveURL(/modalite=echographie/);
    await expect(page.getByText("Adjo Kponton").first()).toBeVisible();
    await expect(page.getByText("Fatou Diallo")).toHaveCount(0);

    // La mammographie, aucun radiologue habilité ne la lit : seuls restent
    // ceux dont le dossier attend encore sa validation.
    await page
      .getByLabel("Modalité lue")
      .selectOption({ label: "Mammographie" });
    await expect(page).toHaveURL(/modalite=mammographie/);
    await expect(page.getByText("Kossi Amegah").first()).toBeVisible();
    await expect(page.getByText("Adjo Kponton")).toHaveCount(0);
    await expect(page.getByText("Fatou Diallo")).toHaveCount(0);
  });

  /**
   * Un nom ou une adresse cherchés n'entrent jamais dans l'adresse : ils
   * finiraient dans l'historique et les journaux d'accès. La recherche vit
   * dans un cookie lié au compte, et suit d'un filtre à l'autre.
   */
  test("cherche un compte sans mettre le nom dans l’adresse", async ({
    page,
  }) => {
    await page.goto("/admin/utilisateurs");
    const champ = page.getByRole("searchbox", { name: "Rechercher un compte" });
    await champ.fill("diallo");
    await champ.press("Enter");
    await expect(page.getByText("Dr Fatou Diallo")).toBeVisible();
    await expect(page.getByText("Dr Adjo Kponton")).toHaveCount(0);
    expect(page.url()).not.toContain("diallo");

    // Un filtre garde la recherche, sans qu'elle passe par l'adresse.
    await page
      .getByRole("navigation", { name: "Filtre" })
      .getByRole("link", { name: /^En attente/ })
      .click();
    await expect(page).toHaveURL("/admin/utilisateurs?attente=1");
    await expect(champ).toHaveValue("diallo");

    // Effacer la recherche rend toute la liste.
    await page
      .getByRole("navigation", { name: "Filtre" })
      .getByRole("link", { name: "Tous", exact: true })
      .click();
    await expect(page).toHaveURL("/admin/utilisateurs");
    await expect(champ).toHaveValue("diallo");
    await champ.fill("");
    await champ.press("Enter");
    await expect(page.getByText("Dr Adjo Kponton")).toBeVisible();
  });

  test("retire la recherche d’un ancien lien", async ({ page }) => {
    await page.goto("/admin/utilisateurs?q=diallo&validation=attente");
    await expect(page).toHaveURL("/admin/utilisateurs?validation=attente");
    await expect(
      page.getByRole("searchbox", { name: "Rechercher un compte" }),
    ).toHaveValue("");
  });

  test("ouvre les performances d’un radiologue depuis sa ligne", async ({
    page,
  }) => {
    await page.goto("/admin/utilisateurs");
    await page
      .locator("li")
      .filter({ hasText: "Adjo Kponton" })
      .getByRole("link", { name: "Voir ses performances" })
      .click();
    await expect(page).toHaveURL(/onglet=radiologues/);
    await expect(page).toHaveURL(/radiologue=/);
    await expect(
      page.getByRole("heading", { name: "Performances de Dr Adjo Kponton" }),
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /Dr Adjo Kponton/ }),
    ).toHaveAttribute("aria-current", "true");
    // Chaque indicateur en une phrase, dans la bulle ⓘ de son intitulé :
    // plus de légende sous le tableau.
    const tableau = page.getByRole("table").filter({
      has: page.getByRole("columnheader", { name: /Radiologue/ }),
    });
    for (const colonne of [
      "Actes signés",
      "Délai médian",
      "Moyen",
      "90e centile",
      "Dans les délais",
      "Prise en charge",
      "Lecture",
      "Rendus sans signature",
      "Urgences prises",
      "En cours",
    ]) {
      await expect(
        tableau
          .getByRole("button", { name: `À propos de « ${colonne} »` })
          .first(),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("region", { name: "Ce que mesure chaque colonne" }),
    ).toHaveCount(0);

    // Au clavier : Tab depuis le bouton de tri ouvre la bulle, sans trier.
    const info = tableau.getByRole("button", {
      name: "À propos de « Délai médian »",
    });
    const bulle = page.getByRole("dialog", { name: "Délai médian" });
    const enSavoirPlus = bulle.getByRole("button", {
      name: "En savoir plus sur « Délai médian » dans le glossaire",
    });
    await tableau
      .getByRole("button", { name: "Trier par Délai médian" })
      .focus();
    await page.keyboard.press("Tab");
    await expect(info).toBeFocused();
    await expect(bulle).toContainText(
      "La moitié des examens est rendue plus vite",
    );
    // Tab entre dans la bulle, jusqu'au lien ; Échap la ferme et rend le
    // focus au bouton, sans la rouvrir.
    await page.keyboard.press("Tab");
    await expect(enSavoirPlus).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(bulle).toBeHidden();
    await expect(info).toBeFocused();

    // Au clic : la bulle s'ouvre, la colonne garde son tri.
    await info.click();
    await expect(bulle).toBeVisible();
    await expect(
      tableau.getByRole("columnheader", { name: /Trier par Délai médian/ }),
    ).toHaveAttribute("aria-sort", "ascending");
    // Une bulle qui dit tout ne mène nulle part.
    await page.keyboard.press("Escape");
    await tableau
      .getByRole("button", { name: "À propos de « Rendus sans signature »" })
      .click();
    const rendus = page.getByRole("dialog", { name: "Rendus sans signature" });
    await expect(rendus).toContainText("avant de les signer");
    await expect(rendus.getByRole("button")).toHaveCount(0);
    await page.keyboard.press("Escape");

    // « En savoir plus » ouvre l'aide sur le terme, sans quitter l'écran.
    await info.click();
    await enSavoirPlus.click();
    await expect(bulle).toBeHidden();
    const terme = page
      .getByRole("dialog", { name: "Aide", exact: true })
      .locator("#aide-terme-delaiMedian");
    await expect(terme).toBeInViewport();
    await expect(terme).toContainText(
      "Délai en deçà duquel la moitié des examens est rendue",
    );
    await expect(page).toHaveURL(/onglet=radiologues/);
    await page.keyboard.press("Escape");
    // Tous les radiologues, sans la mise en évidence.
    await page.getByRole("link", { name: "Tous les radiologues" }).click();
    await expect(page).not.toHaveURL(/radiologue=/);
    await expect(page).toHaveURL(/onglet=radiologues/);
  });

  test("dit qu’un mois est sans activité, et pourquoi", async ({ page }) => {
    // Le Cabinet Espérance vient d'être raccordé : aucun examen lu.
    await page.goto("/admin/activite?onglet=radiologues&clinique=org-esp");
    await expect(
      page.getByText("Aucune activité de radiologue ce mois-ci"),
    ).toBeVisible();
    await expect(
      page.getByText(/dès qu’un examen reçu dans le mois est confié/),
    ).toBeVisible();
  });

  test("passe d’une rubrique de l’activité à l’autre, adresse comprise", async ({
    page,
  }) => {
    await page.goto("/admin/organisations/org-stj");
    await page
      .getByRole("link", { name: "Performances des radiologues" })
      .click();
    await expect(page).toHaveURL(/onglet=radiologues.*clinique=org-stj/);
    const rubriques = page.getByRole("navigation", { name: "Rubriques" });
    await rubriques.getByRole("link", { name: "Par clinique" }).click();
    await expect(page).toHaveURL(/onglet=cliniques/);
    await expect(page).toHaveURL(/clinique=org-stj/);
    await rubriques.getByRole("link", { name: "Vue d’ensemble" }).click();
    await expect(page).not.toHaveURL(/onglet=/);
    await expect(
      page.getByRole("region", { name: "Totaux de la période" }),
    ).toBeVisible();
  });
});

test.describe("le responsable de la clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("va d’un clic aux performances et à la facturation", async ({
    page,
  }) => {
    await page.goto("/activite");
    const partie = page.getByRole("navigation", { name: "Sur cette page" });
    await partie
      .getByRole("link", { name: "Performances par radiologue" })
      .click();
    await expect(page).toHaveURL(/#performances$/);
    await expect(
      page.getByRole("heading", { name: "Performances par radiologue" }),
    ).toBeInViewport();
    // Les flèches de tendance s'expliquent dans la bulle du titre.
    await page
      .getByRole("button", {
        name: "À propos de « Performances par radiologue »",
      })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Flèches de tendance" }),
    ).toContainText("l’écart avec le mois précédent");
  });
});
