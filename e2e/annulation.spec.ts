import { expect, test } from "./support/fixtures";

/**
 * Annulation d'un compte-rendu signé par erreur, par l'équipe IMAFRIK.
 *
 * Réservée à l'administration, depuis l'écran de lecture d'un examen
 * signé ; un motif d'au moins dix caractères est exigé. En démonstration,
 * le geste aboutit au message « indisponible en démonstration », ce qui
 * prouve qu'il a franchi les contrôles de l'écran.
 */

test.describe("équipe IMAFRIK", () => {
  test.use({ membership: "m-admin" });

  test("annule un compte-rendu signé, avec un motif", async ({ page }) => {
    await page.goto("/lecture/10");
    await page.getByRole("button", { name: "Annuler le compte-rendu" }).click();
    const dialogue = page.getByRole("dialog");
    await expect(dialogue).toContainText("retiré");
    const annuler = dialogue.getByRole("button", {
      name: "Annuler le compte-rendu",
    });
    await expect(annuler).toBeDisabled();
    await dialogue.getByLabel("Motif de l’annulation").fill("Essai");
    await expect(annuler).toBeDisabled();
    await dialogue
      .getByLabel("Motif de l’annulation")
      .fill("Essai signé sur un examen réel.");
    await annuler.click();
    await expect(dialogue.getByRole("alert")).toContainText(
      "pas disponible en démonstration",
    );
  });
});

test.describe("radiologue", () => {
  test.use({ membership: "m-radio" });

  test("n’a pas le geste d’annulation", async ({ page }) => {
    await page.goto("/lecture/10");
    await expect(
      page.getByRole("link", { name: "Corriger par un addendum" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Annuler le compte-rendu" }),
    ).toHaveCount(0);
  });
});
