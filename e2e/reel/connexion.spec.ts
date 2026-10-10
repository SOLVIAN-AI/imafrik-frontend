import { expect, test } from "../support/fixtures";
import {
  creerCompte,
  habiliterRadiologue,
  ORGANISATIONS,
  rattacher,
} from "./support/pile";
import {
  enrolerSecondFacteur,
  ouvrirSession,
  saisirCode,
  seConnecter,
} from "./support/session";

/**
 * Connexion réelle : GoTrue, le hook des jetons et la double
 * authentification du Supabase local.
 *
 * Chaque test crée ses comptes par l'API d'administration de GoTrue : ils
 * n'existent nulle part ailleurs, et aucun test ne dépend d'un autre.
 */

test.use({ langue: "fr" });

test("le personnel d’une clinique enrôle son second facteur et arrive sur son tableau de bord", async ({
  page,
}) => {
  const compte = await creerCompte("accueil", "Kossi Agbeko");
  rattacher(compte, ORGANISATIONS.clinique, "clinic_staff");

  await seConnecter(page, { ...compte, password: `${compte.password}-faux` });
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Adresse ou mot de passe incorrect.",
  );
  await expect(page).toHaveURL("/connexion");

  // La double authentification vaut aussi pour le personnel des
  // cliniques : rien ne s'ouvre avant l'enrôlement.
  await ouvrirSession(page, compte);
  await expect(page).toHaveURL("/tableau-de-bord");
  await expect(page.locator("h1").first()).toBeVisible();
  // L'organisation active vient du hook du jeton : sans lui, aucun écran
  // ne nommerait la clinique.
  await expect(page.getByText("Clinique Saint-Joseph").first()).toBeVisible();
});

test("un radiologue enrôle son second facteur, puis le présente à la connexion suivante", async ({
  page,
}) => {
  const compte = await creerCompte("radiologue", "Yawa Lawson");
  rattacher(compte, ORGANISATIONS.groupe, "radiologist");
  habiliterRadiologue(compte);

  // Première connexion : le second facteur est exigé, et s'enrôle.
  await seConnecter(page, compte);
  await expect(page).toHaveURL(/\/double-authentification/);
  // Rien d'autre n'est accessible tant qu'il n'est pas vérifié.
  await page.goto("/worklist");
  await expect(page).toHaveURL(/\/double-authentification/);
  const secret = await enrolerSecondFacteur(page);
  await expect(page).toHaveURL("/worklist");
  await expect(page.locator("h1").first()).toBeVisible();

  // Déconnexion, puis retour : le facteur est connu, seul le code est demandé.
  await page.context().clearCookies();
  await seConnecter(page, compte);
  await expect(page).toHaveURL(/\/double-authentification/);
  await expect(
    page.getByRole("button", { name: "Configurer mon application" }),
  ).toHaveCount(0);
  await saisirCode(page, secret);
  await expect(page).toHaveURL("/worklist");
});
