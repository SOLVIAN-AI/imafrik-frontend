import type { BrowserContext, Page } from "@playwright/test";

import {
  DEMO_MEMBERSHIP_COOKIE,
  type DemoMembership,
  expect,
  test,
} from "./support/fixtures";

/**
 * Vue des cliniques (démonstration).
 *
 * L'équipe IMAFRIK choisit une clinique dans sa console et voit
 * exactement ce que voit son responsable, avec les données de la clinique
 * de démonstration (Clinique Saint-Joseph), en consultation : mêmes
 * chiffres, mêmes listes, aucun geste du responsable. La clinique est
 * dans l'adresse ; un bandeau dit en permanence laquelle on consulte.
 */

const VUE = "/admin/vue-clinique/org-stj";

/** Passe le navigateur sous une autre appartenance de démonstration. */
async function become(
  context: BrowserContext,
  baseURL: string | undefined,
  membership: DemoMembership,
): Promise<void> {
  await context.addCookies([
    { name: DEMO_MEMBERSHIP_COOKIE, value: membership, url: baseURL },
  ]);
}

/**
 * Ce qu'une zone de l'écran affiche : ses textes, sans ses dates ni ses
 * boutons. L'ancienneté d'un examen (« 8 min ») avance entre deux
 * chargements ; les boutons sont les gestes de chaque portail, que la
 * vue des cliniques ne partage pas avec le responsable (« Modalités et
 * urgences » d'un radiologue, par exemple). Rien d'autre ne doit différer.
 */
async function textOf(page: Page, path: string, selector: string) {
  await page.goto(path);
  const zone = page.locator(selector).first();
  await expect(zone).toBeVisible();
  return zone.evaluate((element) => {
    const copy = element.cloneNode(true) as HTMLElement;
    for (const node of copy.querySelectorAll("time, button")) node.remove();
    return copy.innerText ?? copy.textContent;
  });
}

test.describe("l’équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("choisit une clinique et parcourt les écrans de son responsable", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    // Repliée, comme les lectures ; aucune clinique choisie.
    const vue = nav.getByRole("button", { name: "Vue des cliniques" });
    await expect(vue).toHaveAttribute("aria-expanded", "false");
    await vue.click();
    await expect(vue).toHaveAttribute("aria-expanded", "true");
    const choix = nav.getByRole("button", { name: /Choisir une clinique/ });
    await expect(choix).toBeVisible();
    await expect(nav.locator(`a[href^="/admin/vue-clinique/"]`)).toHaveCount(0);

    await choix.click();
    await page.getByRole("option", { name: /Clinique Saint-Joseph/ }).click();
    await expect(page).toHaveURL(`${VUE}/tableau-de-bord`);

    // Le bandeau, permanent : la clinique consultée et le retour.
    const bandeau = page.getByRole("region", { name: "Vue des cliniques" });
    await expect(
      bandeau.getByText("Consultation de Clinique Saint-Joseph"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Tableau de bord" }),
    ).toBeVisible();
    // Envoyer un examen est un geste du responsable.
    await expect(
      page.getByRole("link", { name: "Envoyer un examen" }),
    ).toHaveCount(0);
    await checkA11y();

    // Les écrans du responsable, sous la clinique choisie.
    for (const [href, titre] of [
      [`${VUE}/examens`, "Examens"],
      [`${VUE}/comptes-rendus`, "Comptes-rendus"],
      [`${VUE}/equipe`, "Équipe"],
      [`${VUE}/activite`, "Activité et facturation"],
    ] as const) {
      await nav.locator(`a[href="${href}"]`).click();
      await expect(page).toHaveURL(href);
      await expect(
        page.getByRole("heading", { level: 1, name: titre }),
      ).toBeVisible();
      await expect(
        bandeau.getByText("Consultation de Clinique Saint-Joseph"),
      ).toBeVisible();
      await expect(nav.locator(`a[href="${href}"]`)).toHaveAttribute(
        "aria-current",
        "page",
      );
    }

    await bandeau.getByRole("link", { name: "Retour à la console" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(bandeau).toHaveCount(0);
  });

  test("voit les mêmes chiffres et les mêmes listes que le responsable", async ({
    page,
    context,
    baseURL,
  }) => {
    for (const [chezLui, vue, selector] of [
      [
        "/tableau-de-bord",
        `${VUE}/tableau-de-bord`,
        '[data-tour="clinic-stats"]',
      ],
      ["/examens", `${VUE}/examens`, "main table"],
      [
        "/examens?vue=a-attribuer",
        `${VUE}/examens?vue=a-attribuer`,
        "main table",
      ],
      ["/comptes-rendus", `${VUE}/comptes-rendus`, "main ul"],
      ["/activite", `${VUE}/activite`, "main table"],
      ["/equipe", `${VUE}/equipe`, "main ul"],
    ] as const) {
      await become(context, baseURL, "m-clinic");
      const attendu = await textOf(page, chezLui, selector);
      await become(context, baseURL, "m-admin");
      const lu = await textOf(page, vue, selector);
      // L'équipe n'est pas la responsable connectée : « (vous) » mis à part,
      // tout est identique.
      expect(lu, vue).toBe(attendu.replace(/\s?\(vous\)/, ""));
    }
  });

  test("n’a aucun geste du responsable, et garde les siens", async ({
    page,
  }) => {
    // Examens : ni envoi, mais l'attribution par le portail de l'équipe.
    await page.goto(`${VUE}/examens`);
    await expect(page.getByRole("link", { name: /Envoyer/ })).toHaveCount(0);
    await page
      .getByRole("button", { name: "Attribuer l’examen de KOFFI Ama" })
      .last()
      .click();
    const fenetre = page.getByRole("dialog", { name: "Attribuer l’examen" });
    // La fenêtre de l'équipe propose les radiologues du réseau.
    await expect(fenetre.getByText(/Réseau IMAFRIK/).first()).toBeVisible();
    await page.keyboard.press("Escape");

    // Fiche : l'attribution, sans le renseignement clinique du responsable.
    await page.goto(`${VUE}/examens/1`);
    await expect(
      page.getByRole("heading", { name: "Attribution" }),
    ).toBeVisible();
    await expect(
      page.getByText("Urgence et renseignement clinique"),
    ).toHaveCount(0);
    await expect(page.getByLabel("Examen urgent")).toHaveCount(0);

    // Équipe : ni invitation, ni retrait, ni réglage d'un radiologue ;
    // la liste d'urgence se règle depuis la fiche de la clinique.
    await page.goto(`${VUE}/equipe`);
    await expect(page.getByText("Dr Afi Mensah")).toBeVisible();
    await expect(page.getByRole("button", { name: "Inviter" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Modalités et urgences/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Actions pour/ }),
    ).toHaveCount(0);
    await expect(
      // Exact : la bascule « Sur la liste d’urgence » de la barre contient
      // aussi ces mots.
      page.getByRole("link", { name: "Liste d’urgence", exact: true }),
    ).toHaveAttribute("href", "/admin/organisations/org-stj#liste-urgence");

    // Règles : le formulaire de l'équipe, radiologues du réseau compris.
    await page.getByRole("link", { name: "Règles d’attribution" }).click();
    await expect(page).toHaveURL(`${VUE}/equipe/regles`);
    await expect(
      page.getByRole("button", { name: "Enregistrer les règles" }),
    ).toBeVisible();

    // Compte-rendu : ni annulation ni addendum ; le PDF de l'équipe n'est
    // pas remis à la clinique, et l'écran le dit.
    await page.goto(`${VUE}/comptes-rendus/r-4`);
    await expect(
      page.getByRole("button", { name: "Télécharger le PDF" }),
    ).toBeVisible();
    await expect(
      page.getByText(/ne marque pas le compte-rendu remis à la clinique/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Annuler le compte-rendu" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /addendum/i })).toHaveCount(
      0,
    );

    // Activité : la formule se renseigne depuis la fiche de la clinique.
    await page.goto(`${VUE}/activite`);
    await expect(
      page.getByRole("link", { name: "Formule d’abonnement" }),
    ).toHaveAttribute("href", "/admin/organisations/org-stj#abonnement");
  });

  test("change de clinique sans changer d’écran", async ({ page }) => {
    await page.goto(`${VUE}/equipe`);
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await nav.getByRole("button", { name: /Clinique Saint-Joseph/ }).click();
    await page.getByRole("option", { name: /Polyclinique de Kara/ }).click();
    await expect(page).toHaveURL("/admin/vue-clinique/org-pka/equipe");
    await expect(
      page.getByText("Consultation de Polyclinique de Kara"),
    ).toBeVisible();
    // Une clinique sans responsable le dit.
    await expect(
      page.getByText(/Cette clinique n’a aucun responsable/),
    ).toBeVisible();

    // La fiche d'un examen n'existe que dans sa clinique : on revient à la liste.
    await page.goto(`${VUE}/examens/1`);
    await nav.getByRole("button", { name: /Clinique Saint-Joseph/ }).click();
    await page.getByRole("option", { name: /Polyclinique de Kara/ }).click();
    await expect(page).toHaveURL("/admin/vue-clinique/org-pka/examens");
  });

  test("ouvre l’aide de chaque écran en consultation", async ({ page }) => {
    for (const [path, titre] of [
      [`${VUE}/tableau-de-bord`, "Tableau de bord de la clinique"],
      [`${VUE}/examens`, "Examens de la clinique"],
      [`${VUE}/examens/1`, "Fiche de l’examen"],
      [`${VUE}/comptes-rendus`, "Comptes-rendus de la clinique"],
      [`${VUE}/equipe`, "Équipe de la clinique"],
      [`${VUE}/equipe/regles`, "Règles d’attribution de la clinique"],
      [`${VUE}/activite`, "Activité et facturation de la clinique"],
    ] as const) {
      await page.goto(path);
      await page.keyboard.press("?");
      const aide = page.getByRole("dialog", { name: "Aide" });
      await expect(aide.getByText(titre, { exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });
});

test.describe("l’équipe IMAFRIK, en anglais", () => {
  test.use({ membership: "m-admin", langue: "en" });

  test("lit le bandeau et l’aide dans sa langue", async ({ page }) => {
    await page.goto(`${VUE}/examens`);
    await expect(page.getByText("Viewing Clinique Saint-Joseph")).toBeVisible();
    await page.keyboard.press("?");
    const aide = page.getByRole("dialog", { name: "Help" });
    await expect(
      aide.getByText("Clinic examinations", { exact: true }),
    ).toBeVisible();
  });
});

test.describe("une adresse de la vue des cliniques", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("ne mène à rien pour une clinique inconnue", async ({ page }) => {
    await page.goto("/admin/vue-clinique/org-inconnue/examens");
    await expect(
      page.getByRole("heading", { name: "Cette page n’existe pas" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Vue des cliniques" }),
    ).toHaveCount(0);
  });
});

test.describe("le responsable d’une clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("n’entre pas dans la vue des cliniques", async ({ page }) => {
    await page.goto(`${VUE}/examens`);
    await expect(page).toHaveURL("/tableau-de-bord");
  });
});
