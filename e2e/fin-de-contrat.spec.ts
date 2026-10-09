import { expect, test } from "./support/fixtures";

/**
 * Fin de contrat d'une clinique, depuis sa fiche dans la tour de contrôle.
 *
 * La démonstration ne termine aucun contrat : le geste aboutit au message
 * « indisponible en démonstration ». Le test vérifie donc ce que l'écran
 * garantit seul : la zone de danger, l'explication de ce que le geste
 * enclenche, et le bouton de confirmation inactif tant que le nom exact
 * de la clinique n'est pas saisi (casse et espaces de bord mis à part).
 * Le repli de casse est couvert par `src/lib/contract-end.test.ts`.
 */

test.use({ membership: "m-admin", langue: "fr" });

test("la zone de danger exige le nom exact de la clinique", async ({
  page,
}) => {
  await page.goto("/admin/organisations/org-stj");
  await expect(page.getByText("Sous contrat").first()).toBeVisible();

  const zone = page.getByRole("region", { name: "Zone de danger" });
  await zone.getByRole("button", { name: "Mettre fin au contrat" }).click();

  const dialogue = page.getByRole("dialog");
  await expect(
    dialogue.getByRole("heading", {
      name: "Mettre fin au contrat de Clinique Saint-Joseph",
    }),
  ).toBeVisible();
  await expect(dialogue).toContainText("perdent l’accès");
  await expect(dialogue).toContainText("vingt ans");
  await expect(dialogue).toContainText("canal chiffré");

  const confirmer = dialogue.getByRole("button", {
    name: "Mettre fin au contrat",
  });
  const nom = dialogue.getByLabel("Nom de la clinique");
  await expect(confirmer).toBeDisabled();

  for (const partiel of [
    "Clinique",
    "Clinique Saint-Josep",
    "Clinique Saint Joseph",
  ]) {
    await nom.fill(partiel);
    await expect(confirmer).toBeDisabled();
  }

  await nom.fill("  clinique SAINT-JOSEPH ");
  await expect(confirmer).toBeEnabled();
  await confirmer.click();
  await expect(dialogue.getByRole("alert")).toContainText(
    "pas disponible en démonstration",
  );

  // Annuler referme la boîte et efface la saisie.
  await dialogue.getByRole("button", { name: "Annuler" }).click();
  await expect(dialogue).toBeHidden();
  await zone.getByRole("button", { name: "Mettre fin au contrat" }).click();
  await expect(
    page.getByRole("dialog").getByLabel("Nom de la clinique"),
  ).toHaveValue("");
});

test("le journal d’audit sait nommer la fin de contrat", async ({ page }) => {
  await page.goto("/admin/audit?action=organization.contract_ended");
  await expect(
    page.getByText("Aucune entrée pour cette action."),
  ).toBeVisible();
});
