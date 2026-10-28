import { expect, test } from "./support/fixtures";

/**
 * Écran « Équipe » d'une clinique (démonstration).
 *
 * Les responsables (rôle `clinic_staff`, affiché « Responsable ») invitent
 * et retirent responsables et radiologues. L'invitation propose les deux
 * rôles et rappelle ce que chacun pourra faire ; elle s'arrête, en
 * démonstration, sur le message qui le dit, après ses contrôles.
 */

test.use({ membership: "m-clinic" });

test.describe("en français", () => {
  test.use({ langue: "fr" });

  test("les rôles se disent « Responsable » et « Radiologue »", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/equipe");
    await expect(
      page.getByRole("heading", { level: 1, name: "Équipe" }),
    ).toBeVisible();
    const rows = page.getByRole("listitem");
    await expect(rows.filter({ hasText: "Yawa Doe" })).toContainText(
      "Responsable",
    );
    await expect(rows.filter({ hasText: "Afi Mensah" })).toContainText(
      "Radiologue",
    );
    // Quatre responsables : aucun n'est seul à tenir la clinique.
    await expect(page.getByText(/seul responsable/)).toHaveCount(0);
    await checkA11y();
  });

  test("un responsable invite un responsable ou un radiologue", async ({
    page,
  }) => {
    await page.goto("/equipe");
    await page.getByRole("button", { name: "Inviter" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Inviter dans Clinique Saint-Joseph",
    });
    const role = dialog.getByLabel("Rôle");
    await expect(role.locator("option")).toHaveText([
      "Responsable",
      "Radiologue",
    ]);
    await expect(dialog).toContainText("gère l’équipe");

    await role.selectOption({ label: "Radiologue" });
    await expect(dialog).toContainText("numéro d’ordre");
    await expect(dialog).not.toContainText("gère l’équipe");

    await role.selectOption({ label: "Responsable" });
    await dialog.getByLabel("Nom complet").fill("Esi Kpodar");
    await dialog
      .getByLabel("Adresse électronique")
      .fill("e.kpodar@cliniquesaintjoseph.tg");
    await dialog.getByRole("button", { name: "Envoyer l’invitation" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(
      /L’invitation n’est pas disponible en démonstration/,
    );
  });
});

test.describe("in English", () => {
  test.use({ langue: "en" });

  test("roles read “Manager” and “Radiologist”", async ({ page }) => {
    await page.goto("/equipe");
    const rows = page.getByRole("listitem");
    await expect(rows.filter({ hasText: "Yawa Doe" })).toContainText("Manager");
    await page.getByRole("button", { name: "Invite" }).click();
    const role = page.getByRole("dialog").getByLabel("Role");
    await expect(role.locator("option")).toHaveText(["Manager", "Radiologist"]);
    await expect(page.getByRole("dialog")).toContainText("manages the team");
  });
});
