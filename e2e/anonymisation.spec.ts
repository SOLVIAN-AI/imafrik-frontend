import { expect, test } from "./support/fixtures";

/**
 * Droit à l'effacement : anonymisation d'un compte depuis la liste des
 * comptes de la tour de contrôle, et durée de conservation annoncée par
 * la politique de confidentialité.
 *
 * La démonstration n'anonymise aucun compte : le geste aboutit au message
 * « indisponible en démonstration », ce qui prouve qu'il a franchi les
 * contrôles de l'écran et atteint l'action serveur. Le test vérifie donc
 * ce que l'écran garantit seul : l'explication de ce que le geste
 * enclenche, le bouton inactif tant que le nom exact n'est pas saisi, et,
 * pour un membre d'une organisation active, tant que le retrait de ses
 * appartenances n'est pas confirmé. Le repli de casse est couvert par
 * `src/lib/account-anonymization.test.ts`, les règles du service par ses
 * propres tests.
 */

test.describe("tour de contrôle", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("un membre actif exige son nom et le retrait de ses appartenances", async ({
    page,
  }) => {
    await page.goto("/admin/utilisateurs");
    const ligne = page
      .getByRole("listitem")
      .filter({ hasText: "a.lawson@exemple.tg" });
    await ligne.getByRole("button", { name: "Anonymiser" }).click();

    const dialogue = page.getByRole("dialog");
    await expect(
      dialogue.getByRole("heading", {
        name: "Anonymiser le compte de Dr Afi Lawson",
      }),
    ).toBeVisible();
    await expect(dialogue).toContainText("compte de connexion est supprimé");
    await expect(dialogue).toContainText("numéro d’ordre restent attachés");

    const confirmer = dialogue.getByRole("button", {
      name: "Anonymiser définitivement",
    });
    const nom = dialogue.getByLabel("Nom du compte");
    await expect(confirmer).toBeDisabled();

    // Le titre affiché ne fait pas partie du nom à saisir.
    for (const partiel of ["Afi", "Dr Afi Lawson", "Afi Lawso"]) {
      await nom.fill(partiel);
      await expect(confirmer).toBeDisabled();
    }
    await nom.fill("  afi LAWSON ");
    await expect(confirmer).toBeDisabled();

    await expect(dialogue).toContainText(
      "Ce compte est encore membre d’une organisation active",
    );
    await dialogue
      .getByRole("checkbox", { name: /Retirer ses appartenances/ })
      .check();
    await expect(confirmer).toBeEnabled();
    await confirmer.click();
    await expect(dialogue.getByRole("alert")).toContainText(
      "L’anonymisation n’est pas disponible en démonstration",
    );

    // Annuler referme la boîte et efface la saisie.
    await dialogue.getByRole("button", { name: "Annuler" }).click();
    await expect(dialogue).toBeHidden();
    await ligne.getByRole("button", { name: "Anonymiser" }).click();
    await expect(
      page.getByRole("dialog").getByLabel("Nom du compte"),
    ).toHaveValue("");
  });

  test("un compte sans organisation active n’exige que son nom", async ({
    page,
  }) => {
    await page.goto("/admin/utilisateurs?attente=1");
    const ligne = page
      .getByRole("listitem")
      .filter({ hasText: "m.traore@exemple.ml" });
    await ligne.getByRole("button", { name: "Anonymiser" }).click();

    const dialogue = page.getByRole("dialog");
    await expect(dialogue.getByRole("checkbox")).toHaveCount(0);
    await dialogue.getByLabel("Nom du compte").fill("Moussa Traoré");
    await expect(
      dialogue.getByRole("button", { name: "Anonymiser définitivement" }),
    ).toBeEnabled();
  });

  test("le journal d’audit sait nommer l’anonymisation", async ({ page }) => {
    for (const action of ["user.anonymized", "user.anonymization_requested"]) {
      await page.goto(`/admin/audit?action=${action}`);
      await expect(
        page.getByText("Aucune entrée pour cette action."),
      ).toBeVisible();
    }
  });
});

test.describe("in English", () => {
  test.use({ membership: "m-admin", langue: "en" });

  test("the dialog speaks British English", async ({ page }) => {
    await page.goto("/admin/utilisateurs");
    await page
      .getByRole("listitem")
      .filter({ hasText: "a.lawson@exemple.tg" })
      .getByRole("button", { name: "Anonymise" })
      .click();
    const dialogue = page.getByRole("dialog");
    await expect(
      dialogue.getByRole("heading", {
        name: "Anonymise Dr Afi Lawson’s account",
      }),
    ).toBeVisible();
    await expect(
      dialogue.getByRole("checkbox", { name: /Remove their memberships/ }),
    ).toBeVisible();
  });
});

test.describe("politique de confidentialité", () => {
  test("annonce la suppression du compte et ce qui reste attaché aux preuves", async ({
    page,
  }) => {
    await page.goto("/confidentialite");
    await expect(
      page.getByText(
        "Compte de connexion (adresse électronique, accès) : pendant la relation contractuelle, puis cinq ans à des fins de preuve, puis supprimé.",
        { exact: false },
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/L’effacement\s+supprime aussitôt/),
    ).toBeVisible();

    await page.goto("/en/privacy");
    await expect(
      page.getByText(
        "Login account (email address, access): for the duration of the contractual relationship, then five years for evidential purposes, after which it is deleted.",
        { exact: false },
      ),
    ).toBeVisible();
  });
});
