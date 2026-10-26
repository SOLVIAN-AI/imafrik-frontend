import { expect, test } from "./support/fixtures";

/**
 * Habilitation des radiologues par l'équipe IMAFRIK.
 *
 * - tour de contrôle : l'alerte du cockpit mène aux dossiers à examiner ;
 *   l'examen montre le justificatif et le numéro exact, puis accepte ou
 *   refuse avec un motif ;
 * - demandes reçues : la nature du demandeur et le numéro déclaré ;
 * - paramètres du radiologue : son exercice, ses justificatifs, et la
 *   confirmation qu'exige un changement de numéro ;
 * - parcours d'accueil : exercice, justificatif, profil, validation.
 *
 * Le jeu de démonstration n'enregistre rien : les gestes aboutissent au
 * message « indisponible en démonstration », ce qui prouve qu'ils ont
 * franchi les contrôles de l'écran et atteint l'action serveur. Le
 * bandeau d'un radiologue non validé, que la démonstration (radiologue
 * validée) ne montre pas, est couvert par un test de composant
 * (`credentials-banner.test.ts`).
 */

test.describe("tour de contrôle", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("l’alerte du cockpit ouvre les dossiers à examiner", async ({
    page,
  }) => {
    await page.goto("/admin");
    const alerte = page.getByRole("link", {
      name: /3 radiologues attendent la vérification de leur justificatif/,
    });
    await alerte.click();
    await expect(page).toHaveURL("/admin/utilisateurs?validation=attente");

    const filtre = page.getByRole("navigation", { name: "Filtre" });
    await expect(
      filtre.getByRole("link", { name: "À valider · 3" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByText("Dossiers à examiner", { exact: true }),
    ).toBeVisible();
    // « À valider » : un justificatif en attente. Le compte du filtre égale
    // celui du cockpit.
    const lignes = page.locator("[data-credentials-row]");
    await expect(lignes).toHaveCount(3);
    await expect(page.locator('[data-credentials-row="pending"]')).toHaveCount(
      3,
    );
    await expect(page.getByText("Dr Kossi Amegah")).toBeVisible();
    // Dossier incomplet, rien à examiner : hors de ce filtre.
    await expect(page.getByText("Dr Afi Lawson")).toHaveCount(0);
    // Une radiologue habilitée n'y apparaît pas non plus.
    await expect(page.getByText("Dr Adjo Kponton")).toHaveCount(0);

    // L'examen montre le justificatif et le numéro exact à vérifier.
    await page
      .locator('[data-credentials-row="pending"]')
      .filter({ hasText: "TG-RAD-0263" })
      .getByRole("button", { name: "Examiner le dossier" })
      .click();
    const dialogue = page.getByRole("dialog");
    await expect(
      dialogue.getByRole("heading", { name: "Dossier de Dr Kossi Amegah" }),
    ).toBeVisible();
    await expect(dialogue.getByTestId("document-under-review")).toContainText(
      "diplome-radiologie.pdf",
    );
    await expect(dialogue.getByTestId("license-to-verify")).toHaveText(
      "TG-RAD-0263",
    );
    await expect(dialogue).toContainText("Ordre des médecins");
    await dialogue
      .getByRole("button", { name: "Accepter et habiliter" })
      .click();
    await expect(dialogue.getByRole("alert")).toContainText(
      "pas disponible en démonstration",
    );
  });

  test("un refus exige un motif", async ({ page }) => {
    await page.goto("/admin/utilisateurs?validation=attente");
    await page
      .locator('[data-credentials-row="pending"]')
      .filter({ hasText: "TG-RAD-0263" })
      .getByRole("button", { name: "Examiner le dossier" })
      .click();
    const dialogue = page.getByRole("dialog");
    await dialogue
      .getByRole("button", { name: "Refuser", exact: true })
      .click();
    const envoyer = dialogue.getByRole("button", {
      name: "Refuser ce justificatif",
    });
    await expect(envoyer).toBeDisabled();
    await dialogue
      .getByLabel("Motif du refus")
      .fill("Document illisible : photographiez-le à plat.");
    await envoyer.click();
    await expect(dialogue.getByRole("alert")).toContainText(
      "pas disponible en démonstration",
    );
  });

  test("le filtre « Tous » montre l’état de chaque radiologue", async ({
    page,
  }) => {
    await page.goto("/admin/utilisateurs?validation=attente");
    await page
      .getByRole("navigation", { name: "Filtre" })
      .getByRole("link", { name: "Tous" })
      .click();
    await expect(page).toHaveURL("/admin/utilisateurs");
    const kponton = page.locator("li", { hasText: "Dr Adjo Kponton" });
    await expect(kponton.getByText("Habilité", { exact: true })).toBeVisible();
    await expect(kponton.getByText("TG-RAD-0142")).toBeVisible();
    await expect(
      page
        .locator("li", { hasText: "Dr Afi Lawson" })
        .getByText("Dossier incomplet"),
    ).toBeVisible();

    // Retirer l'habilitation prévient que les examens retournent au pool.
    await kponton
      .getByRole("button", { name: "Retirer l’habilitation" })
      .click();
    const dialogue = page.getByRole("dialog");
    await expect(dialogue).toContainText("retournent au pool");
    await dialogue.getByRole("button", { name: "Annuler" }).click();
    await expect(dialogue).toHaveCount(0);
  });

  test("les demandes distinguent établissements et radiologues", async ({
    page,
  }) => {
    await page.goto("/admin/demandes?etat=all");
    await page
      .getByRole("navigation", { name: "Demandeur" })
      .getByRole("link", { name: /^Radiologues/ })
      .click();
    await expect(page).toHaveURL(
      "/admin/demandes?etat=all&demandeur=radiologue",
    );
    await expect(page.getByText("Dr Sena Akakpo")).toBeVisible();
    await expect(page.getByText("TG-RAD-0318")).toBeVisible();
    await expect(page.getByText("Komlan Adjavon")).toHaveCount(0);
  });
});

test.describe("tour de contrôle en anglais", () => {
  test.use({ membership: "m-admin", langue: "en" });

  test("the filter and badges are translated", async ({ page }) => {
    await page.goto("/admin/utilisateurs?validation=attente");
    await expect(
      page.getByText("Files to review", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Review the file" }).first(),
    ).toBeVisible();
    // Dossier incomplet, hors du filtre : le badge se lit dans la liste.
    await page.goto("/admin/utilisateurs");
    await expect(page.getByText("File incomplete").first()).toBeVisible();
  });
});

test.describe("paramètres du radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("un nouveau numéro d’ordre demande confirmation", async ({ page }) => {
    await page.goto("/parametres");
    await expect(page.getByText("Validé par IMAFRIK")).toBeVisible();
    const numero = page.getByRole("textbox", { name: "Numéro d’ordre" });
    await expect(numero).toHaveValue("TG-RAD-0142");
    await expect(page.getByText(/doit être vérifié de nouveau/)).toHaveCount(0);

    await numero.fill("TG-RAD-9999");
    await expect(page.getByText(/doit être vérifié de nouveau/)).toBeVisible();
    await page
      .locator("form")
      .filter({ has: numero })
      .getByRole("button", { name: "Enregistrer" })
      .click();
    const dialogue = page.getByRole("dialog");
    await expect(
      dialogue.getByRole("heading", { name: "Changer de numéro d’ordre ?" }),
    ).toBeVisible();
    await expect(dialogue).toContainText("TG-RAD-0142");
    await expect(dialogue).toContainText("TG-RAD-9999");
    await dialogue.getByRole("button", { name: "Annuler" }).click();
    await expect(dialogue).toHaveCount(0);
  });

  test("un nouveau nom demande confirmation, lui aussi", async ({ page }) => {
    await page.goto("/parametres");
    const nom = page.getByLabel("Nom complet");
    await nom.fill("Un Autre Nom");
    await page
      .locator("form")
      .filter({ has: nom })
      .getByRole("button", { name: "Enregistrer" })
      .click();
    const dialogue = page.getByRole("dialog");
    await expect(
      dialogue.getByRole("heading", {
        name: "Modifier votre identité de signataire ?",
      }),
    ).toBeVisible();
    await dialogue.getByRole("button", { name: "Annuler" }).click();
    await expect(dialogue).toHaveCount(0);
  });
});

test.describe("dossier du radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("les paramètres montrent l’exercice et le justificatif", async ({
    page,
  }) => {
    await page.goto("/parametres#justificatifs");
    const dossier = page.locator("#justificatifs");
    await expect(
      dossier.getByRole("heading", { name: "Exercice et justificatifs" }),
    ).toBeVisible();
    await expect(
      dossier.getByLabel("Inscrit à l’Ordre des médecins"),
    ).toBeChecked();
    // Inscrit et habilité : rien à redéposer, pas de zone de dépôt.
    await expect(dossier.getByText("Validé par IMAFRIK")).toBeVisible();
    await expect(dossier.getByRole("button", { name: "Envoyer" })).toHaveCount(
      0,
    );

    // Changer d'exercice prévient de la suspension avant d'enregistrer.
    await dossier.getByLabel("En cours de spécialisation").check();
    await expect(dossier).toContainText("suspend votre accès");
    await dossier
      .getByRole("button", { name: "Enregistrer mon exercice" })
      .click();
    await expect(
      page.getByText(/pas disponible en démonstration/),
    ).toBeVisible();
  });

  test("le parcours d’accueil compte cinq étapes, contrat en tête", async ({
    page,
  }) => {
    await page.goto("/bienvenue");
    await expect(page).toHaveURL("/bienvenue/engagement");
    await expect(
      page.getByRole("heading", { name: "Votre contrat", level: 1 }),
    ).toBeVisible();
    // La démonstration n'engage personne : aucun contrat n'y est dû.
    await expect(
      page.getByText("Aucun engagement n’est à accepter pour le moment."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page).toHaveURL("/bienvenue/exercice");
    await expect(
      page.getByRole("heading", { name: "Votre exercice", level: 1 }),
    ).toBeVisible();
    for (const titre of ["Votre justificatif", "Votre profil", "Validation"]) {
      await expect(
        page.getByText(titre, { exact: true }).first(),
      ).toBeVisible();
    }
    // L'exercice déclaré est déjà enregistré : continuer ne réécrit rien.
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page).toHaveURL("/bienvenue/justificatifs");
    await expect(page.getByText("Diplôme", { exact: true })).toBeVisible();
  });
});

test.describe("engagements en démonstration", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("l’écran des engagements renvoie au portail quand rien n’est dû", async ({
    page,
  }) => {
    await page.goto("/engagements");
    await expect(page).toHaveURL("/worklist");
  });
});
