import type { Page } from "@playwright/test";

import { expect } from "../../support/fixtures";
import type { Compte } from "./pile";
import { totpNow } from "./totp";

/**
 * Gestes de session dans l'interface, contre le vrai Supabase.
 *
 * Contrairement à la démonstration, rien n'est posé par cookie : la
 * session naît du formulaire de connexion, et la double authentification
 * d'un vrai facteur TOTP, enrôlé auprès de GoTrue.
 */

/**
 * Remplit et envoie le formulaire de connexion.
 *
 * @param page   Page sur laquelle se connecter.
 * @param compte Compte créé pour le parcours.
 */
export async function seConnecter(page: Page, compte: Compte): Promise<void> {
  await page.goto("/connexion");
  await page.getByLabel("Adresse électronique").fill(compte.email);
  await page.locator("#password").fill(compte.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

/**
 * Enrôle un second facteur depuis l'écran de double authentification, et
 * le vérifie avec un code calculé depuis la clé affichée.
 *
 * @param page Page arrêtée sur `/double-authentification`.
 * @returns La clé du facteur, pour une vérification ultérieure.
 */
export async function enrolerSecondFacteur(page: Page): Promise<string> {
  await expect(page).toHaveURL(/\/double-authentification/);
  await page
    .getByRole("button", { name: "Configurer mon application" })
    .click();
  // La clé de secours, groupée par quatre caractères, sous le QR code.
  const cle = page.locator("code").filter({ hasText: /^[A-Z2-7 ]{16,}$/ });
  await expect(cle).toBeVisible();
  const secret = (await cle.innerText()).replace(/\s/g, "");
  await saisirCode(page, secret);
  return secret;
}

/**
 * Saisit le code courant d'un facteur déjà connu et le fait vérifier.
 *
 * @param page   Page affichant le champ du code.
 * @param secret Clé Base32 du facteur.
 */
export async function saisirCode(page: Page, secret: string): Promise<void> {
  await page.getByLabel("Code à six chiffres").fill(await totpNow(secret));
  await page.getByRole("button", { name: "Vérifier" }).click();
}

/**
 * Ouvre la session d'un compte neuf : mot de passe, puis enrôlement du
 * second facteur, exigé de tous les rôles à la première connexion.
 *
 * @param page   Page sur laquelle se connecter.
 * @param compte Compte créé pour le parcours, sans facteur enrôlé.
 * @returns La clé du facteur enrôlé.
 */
export async function ouvrirSession(
  page: Page,
  compte: Compte,
): Promise<string> {
  await seConnecter(page, compte);
  return enrolerSecondFacteur(page);
}
