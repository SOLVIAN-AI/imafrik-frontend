import { execSync } from "node:child_process";

import { expect, test } from "../support/fixtures";
import { creerCompte, ORGANISATIONS, rattacher } from "./support/pile";
import { ouvrirSession } from "./support/session";

/**
 * L'API arrêtée : l'interface annonce une panne, pas un défaut.
 *
 * Ce projet tourne en dernier (`playwright.reel.config.ts`) : il arrête
 * l'API pour de bon, avec la commande de `E2E_ARRET_API` fournie par la
 * pile. Supabase reste en service : la connexion aboutit, et c'est le
 * premier écran qui demande l'API qui doit dire « Service momentanément
 * indisponible », plutôt que « Quelque chose s’est mal passé » avec un
 * code à transmettre au support.
 */

test.use({
  langue: "fr",
  // Une seule expression : un tableau de deux éléments serait lu par
  // `test.use` comme une valeur suivie de ses options.
  //  - l'écran d'erreur journalise la panne côté navigateur, c'est voulu ;
  //  - React rapporte l'erreur du composant serveur que cet écran a
  //    recueillie (message omis en production) : c'est la panne elle-même.
  ignoredErrors: [
    /\[imafrik\] IMAFRIK_SERVICE_UNAVAILABLE|Minified React error #441/,
  ],
});

test.beforeAll(() => {
  const commande = process.env.E2E_ARRET_API;
  if (!commande)
    throw new Error(
      "E2E_ARRET_API manquant : voir tools/parcours-reels/pile.sh",
    );
  execSync(commande, { stdio: "inherit" });
});

test("l’API arrêtée, l’écran annonce une interruption de service", async ({
  page,
}) => {
  const compte = await creerCompte("panne", "Sena Amegah");
  rattacher(compte, ORGANISATIONS.clinique, "clinic_staff");

  await ouvrirSession(page, compte);
  await expect(page).toHaveURL("/tableau-de-bord");
  await expect(
    page.getByRole("heading", { name: "Service momentanément indisponible" }),
  ).toBeVisible();
  // Pas de référence à transmettre : le support ne pourrait que constater.
  await expect(page.getByText(/^Référence :/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible();
});
