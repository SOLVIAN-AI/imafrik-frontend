import { expect, test } from "./support/fixtures";

/**
 * Formulaire de contact du site public.
 *
 * La première question, « Je suis », est obligatoire : un établissement
 * de santé ou un radiologue. Le numéro d'ordre d'un radiologue est
 * facultatif (un radiologue en cours de spécialisation n'en a pas), tout
 * comme l'établissement où il exerce. Les erreurs s'affichent sous chaque
 * champ, dans la langue de la page.
 *
 * En démonstration, aucun service n'enregistre la demande : une demande
 * valide aboutit au message « formulaire indisponible », ce qui prouve
 * qu'elle a franchi les contrôles de l'écran et de l'action serveur.
 */

test("un radiologue peut écrire sans numéro d’ordre", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(
    page.getByText(
      "Indiquez si vous écrivez pour un établissement de santé ou en tant que radiologue.",
    ),
  ).toBeVisible();
  // Le focus va au choix manquant.
  await expect(
    page.getByRole("radio", { name: /Un établissement de santé/ }),
  ).toBeFocused();

  await page.getByRole("radio", { name: /Un radiologue/ }).check();
  const numero = page.getByRole("textbox", { name: "Numéro d’ordre" });
  await expect(numero).toBeVisible();
  await expect(numero).not.toHaveAttribute("required");
  await expect(page.getByText(/Sinon, laissez ce champ vide/)).toBeVisible();
  // L'établissement devient facultatif, sous un autre intitulé.
  await expect(page.getByLabel("Établissement où vous exercez")).toBeVisible();
  await expect(page.getByLabel("Volume mensuel estimé")).toHaveCount(0);

  // Sans numéro, la demande franchit les contrôles de l'écran.
  await page.getByLabel("Nom complet").fill("Sena Akakpo");
  await page.getByLabel("Adresse électronique").fill("s.akakpo@exemple.tg");
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Le formulaire n’est pas disponible pour le moment.",
  );
});

test("un établissement doit se nommer", async ({ page }) => {
  await page.goto("/contact?profil=etablissement");
  await expect(
    page.getByRole("radio", { name: /Un établissement de santé/ }),
  ).toBeChecked();
  await page.getByLabel("Nom complet").fill("Komlan Adjavon");
  await page
    .getByLabel("Adresse électronique")
    .fill("direction@tsevie.example");
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(
    page.getByText("Indiquez le nom de votre établissement."),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Numéro d’ordre" }),
  ).toHaveCount(0);
});

test("le bouton « Rejoindre le réseau » présélectionne le radiologue", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Rejoindre le réseau" }).click();
  await expect(page).toHaveURL("/contact?profil=radiologue");
  await expect(
    page.getByRole("radio", { name: /Un radiologue/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("textbox", { name: "Numéro d’ordre" }),
  ).toBeVisible();
});

test("the English form explains what is missing", async ({ page }) => {
  await page.goto("/en/contact?profil=radiologue");
  await expect(
    page.getByRole("radio", { name: /A radiologist/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  // The registration number is optional.
  await expect(
    page.getByText(/registration number is 50 characters/),
  ).toHaveCount(0);
  await expect(page.getByLabel("Where you practise")).toBeVisible();
});
