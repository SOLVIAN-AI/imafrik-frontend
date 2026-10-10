import { expect, test } from "../support/fixtures";
import {
  api,
  courrielPour,
  creerCompte,
  jetonDe,
  ORGANISATIONS,
  rattacher,
  suffixe,
} from "./support/pile";
import { enrolerSecondFacteur, saisirCode } from "./support/session";

/**
 * Invitation réelle, du clic de la clinique au tableau de bord de l'invité.
 *
 * L'invitation part de l'API (`POST /organization/invitations`), qui la
 * confie à GoTrue ; le courriel arrive dans le Mailpit du Supabase local,
 * rendu par le vrai modèle (`supabase/templates/invite.html` du backend).
 * Le lien qu'il porte est suivi tel quel : c'est précisément ce chemin
 * (courriel, `/auth/callback`, `/invitation`) que la démonstration ne
 * peut pas parcourir.
 */

test.use({ langue: "fr" });

/** Mot de passe choisi par l'invité, conforme aux règles affichées. */
const MOT_DE_PASSE = "Bienvenue-Lome-2026";

test("l’invité suit le lien du courriel, choisit son mot de passe et arrive sur son tableau de bord", async ({
  page,
  baseURL,
}) => {
  const gestionnaire = await creerCompte("gestion", "Akouvi Mensah");
  rattacher(gestionnaire, ORGANISATIONS.clinique, "clinic_staff");
  const invite = `invite-${suffixe()}@parcours.imafrik.tech`;

  await api(
    "/organization/invitations",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${await jetonDe(gestionnaire)}` },
      body: JSON.stringify({
        email: invite,
        full_name: "Edem Kpodar",
        role: "clinic_staff",
      }),
    },
    201,
  );

  const courriel = await courrielPour(invite);
  expect(courriel.subject).toBe(
    "IMAFRIK : invitation à rejoindre Clinique Saint-Joseph",
  );
  const lien = courriel.html.match(
    /href="([^"]*\/auth\/callback\?token_hash=[^"]+)"/,
  )?.[1];
  expect(lien, "lien d’invitation dans le courriel").toBeTruthy();
  const adresse = new URL((lien ?? "").replaceAll("&amp;", "&"));
  // Le lien mène à l'application elle-même (adresse du site déclarée à
  // GoTrue), pas à une adresse de GoTrue ni à celle de l'API.
  expect(adresse.origin).toBe(new URL(baseURL ?? "").origin);
  expect(adresse.searchParams.get("type")).toBe("invite");

  await page.goto(adresse.href);
  await expect(page).toHaveURL("/invitation");
  await expect(
    page.getByRole("heading", { name: "Bienvenue chez Clinique Saint-Joseph" }),
  ).toBeVisible();
  const carte = page.getByRole("region", { name: "Votre invitation" });
  await expect(carte).toContainText("Personnel de l’établissement");
  await expect(carte).toContainText("Akouvi Mensah");

  await page.getByLabel("Nouveau mot de passe").fill(MOT_DE_PASSE);
  await page.getByLabel("Confirmation").fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: "Enregistrer et continuer" }).click();

  // Second facteur, exigé de tous, puis prise en main et tableau de bord.
  const secret = await enrolerSecondFacteur(page);
  await expect(page).toHaveURL(/\/bienvenue\//);
  await page.goto("/bienvenue/termine");
  await page.getByRole("button", { name: "Ouvrir le tableau de bord" }).click();
  await expect(page).toHaveURL("/tableau-de-bord");
  await expect(page.getByText("Clinique Saint-Joseph").first()).toBeVisible();

  // Le mot de passe choisi est bien celui du compte : une nouvelle
  // session s'ouvre avec lui, et le facteur enrôlé.
  await page.context().clearCookies();
  await page.goto("/connexion");
  await page.getByLabel("Adresse électronique").fill(invite);
  await page.locator("#password").fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await saisirCode(page, secret);
  await expect(page).toHaveURL("/tableau-de-bord");
});
