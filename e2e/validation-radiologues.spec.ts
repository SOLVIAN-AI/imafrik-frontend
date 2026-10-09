import { expect, test } from "./support/fixtures";

/**
 * Validation des numéros d'ordre des radiologues par l'équipe IMAFRIK.
 *
 * - tour de contrôle : l'alerte du cockpit mène à la liste filtrée des
 *   radiologues à valider ; la validation confirme le numéro exact, et
 *   reste impossible sans numéro ;
 * - demandes reçues : la nature du demandeur et le numéro déclaré ;
 * - paramètres du radiologue : l'état de sa validation, et la
 *   confirmation qu'exige un changement de numéro.
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

  test("l’alerte du cockpit ouvre les radiologues à valider", async ({
    page,
  }) => {
    await page.goto("/admin");
    const alerte = page.getByRole("link", {
      name: /2 radiologues attendent la validation de leur numéro d’ordre/,
    });
    await alerte.click();
    await expect(page).toHaveURL("/admin/utilisateurs?validation=attente");

    const filtre = page.getByRole("navigation", { name: "Filtre" });
    await expect(
      filtre.getByRole("link", { name: "À valider · 2" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByText("Numéros d’ordre à valider", { exact: true }),
    ).toBeVisible();
    const lignes = page.locator("[data-credentials-row]");
    await expect(lignes).toHaveCount(2);
    await expect(page.getByText("Dr Kossi Amegah")).toBeVisible();
    await expect(page.getByText("Dr Afi Lawson")).toBeVisible();
    // Une radiologue validée n'apparaît pas dans ce filtre.
    await expect(page.getByText("Dr Adjo Kponton")).toHaveCount(0);

    // Sans numéro, rien à valider : le bouton est inactif.
    await expect(
      page
        .locator('[data-credentials-row="missing"]')
        .getByRole("button", { name: "Valider le numéro d’ordre" }),
    ).toBeDisabled();

    // Avec un numéro, la confirmation montre le numéro exact à vérifier.
    await page
      .locator('[data-credentials-row="pending"]')
      .getByRole("button", { name: "Valider le numéro d’ordre" })
      .click();
    const dialogue = page.getByRole("dialog");
    await expect(
      dialogue.getByRole("heading", {
        name: "Valider le numéro d’ordre de Dr Kossi Amegah",
      }),
    ).toBeVisible();
    await expect(dialogue.getByTestId("license-to-verify")).toHaveText(
      "TG-RAD-0263",
    );
    await expect(dialogue).toContainText("Ordre des médecins");
    await dialogue.getByRole("button", { name: "Valider ce numéro" }).click();
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
    await expect(kponton.getByText("Numéro validé")).toBeVisible();
    await expect(kponton.getByText("TG-RAD-0142")).toBeVisible();

    // Retirer la validation prévient que les examens retournent au pool.
    await kponton
      .getByRole("button", { name: "Retirer la validation" })
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
      page.getByText("Registration numbers to verify", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Number missing")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Verify registration number" }).first(),
    ).toBeVisible();
  });
});

test.describe("paramètres du radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("un nouveau numéro d’ordre demande confirmation", async ({ page }) => {
    await page.goto("/parametres");
    await expect(page.getByText("Validé par IMAFRIK")).toBeVisible();
    const numero = page.getByLabel("Numéro d’ordre");
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
