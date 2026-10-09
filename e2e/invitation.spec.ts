import { DEMO_DATA_PHRASES, FRENCH_UI_WORDS, without } from "./support/donnees";
import { expect, test } from "./support/fixtures";

/**
 * Accueil d'une personne invitée (`/invitation`).
 *
 * Le lien du courriel d'invitation y conduit après `/auth/callback`. La
 * démonstration sert une invitation fixe : personnel de l'accueil de la
 * Clinique Saint-Joseph, invité par la gestionnaire de la clinique.
 * L'enregistrement du mot de passe aboutit au message « indisponible en
 * démonstration », ce qui prouve que le formulaire a franchi ses
 * contrôles et atteint l'action serveur.
 */

/** Mot de passe conforme aux règles affichées. */
const PASSWORD = "Bienvenue-Lome-2026";

test.describe("en français", () => {
  test.use({ langue: "fr" });

  test("présente l’établissement, le rôle et qui invite", async ({ page }) => {
    await page.goto("/invitation");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page).toHaveTitle(/Invitation/);
    await expect(
      page.getByRole("heading", {
        name: "Bienvenue chez Clinique Saint-Joseph",
      }),
    ).toBeVisible();

    const carte = page.getByRole("region", { name: "Votre invitation" });
    await expect(carte).toContainText("Établissement de santé");
    await expect(carte).toContainText("Personnel de l’établissement");
    await expect(carte).toContainText("Lomé");
    await expect(carte).toContainText("Invitation de");
    await expect(carte).toContainText("Akouvi Mensah");

    // À qui écrire si l'invitation était inattendue.
    await expect(
      page.getByRole("link", { name: "contact@imafrik.tech" }),
    ).toHaveAttribute("href", "mailto:contact@imafrik.tech");

    // Personnel de clinique : pas de double authentification à l'étape suivante.
    const etapes = page.getByRole("list", { name: "Étapes de votre arrivée" });
    await expect(etapes.getByRole("listitem")).toHaveText([
      /Mot de passe/,
      /Prise en main/,
    ]);
  });

  test("le mot de passe suit les règles avant l’envoi", async ({ page }) => {
    await page.goto("/invitation");
    await expect(
      page.getByRole("heading", { name: "Choisissez votre mot de passe" }),
    ).toBeVisible();
    const envoyer = page.getByRole("button", {
      name: "Enregistrer et continuer",
    });
    await expect(envoyer).toBeDisabled();

    await page.getByLabel("Nouveau mot de passe").fill(PASSWORD);
    await page.getByLabel("Confirmation").fill(`${PASSWORD}x`);
    await expect(page.getByText("Les deux saisies diffèrent.")).toBeVisible();
    await expect(envoyer).toBeDisabled();

    await page.getByLabel("Confirmation").fill(PASSWORD);
    await expect(envoyer).toBeEnabled();
    await envoyer.click();
    // Le message du formulaire, pas l'annonceur de navigation de Next.
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "pas disponible en démonstration",
    );
    await expect(page).toHaveURL("/invitation");
  });

  test("le sélecteur passe l’écran en anglais", async ({ page }) => {
    await page.goto("/invitation");
    await page.getByRole("link", { name: /^en/i }).click();
    await expect(page).toHaveURL("/invitation");
    await expect(
      page.getByRole("heading", { name: "Welcome to Clinique Saint-Joseph" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("en anglais", () => {
  test.use({ langue: "en" });

  test("est entièrement en anglais", async ({ page }) => {
    await page.goto("/invitation");
    await expect(
      page.getByRole("heading", { name: "Welcome to Clinique Saint-Joseph" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const carte = page.getByRole("region", { name: "Your invitation" });
    await expect(carte).toContainText("Facility staff");
    await expect(carte).toContainText("Invited by");
    await expect(
      page.getByRole("heading", { name: "Choose your password" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save and continue" }),
    ).toBeDisabled();

    const texte = await page.locator("body").innerText();
    const francais = without(texte, DEMO_DATA_PHRASES).match(FRENCH_UI_WORDS);
    expect([...new Set(francais ?? [])]).toEqual([]);
  });
});
