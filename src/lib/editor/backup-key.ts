import "server-only";

import { createHmac } from "node:crypto";

import { isDemoMode } from "@/lib/demo/mode";
import { hasReportBackupSecret } from "@/lib/deployment";

/**
 * Clé de chiffrement des copies de secours d'un compte.
 *
 * Les copies de secours d'un brouillon (`lib/editor/backup.ts`) sont
 * chiffrées dans le navigateur avec une clé **propre au compte**, que seul
 * le serveur sait produire et qu'il ne remet qu'à une session valide, sur
 * l'écran de rédaction. La clé vit ensuite dans la mémoire de l'onglet,
 * jamais dans le stockage du navigateur.
 *
 * Ce qui en découle sur un poste partagé : après une déconnexion ou un
 * verrouillage pour inactivité, la copie reste — c'est son rôle, la
 * coupure a pu empêcher l'envoi — mais illisible. Le suivant n'en tire
 * rien, ni en ouvrant les outils du navigateur, ni en se connectant avec
 * son propre compte ; seul son auteur la retrouve, en se reconnectant.
 *
 * La clé est dérivée, non stockée : HMAC-SHA-256 du secret
 * `REPORT_BACKUP_SECRET` et de l'identifiant du compte. Changer le secret
 * rend illisibles les copies en cours — elles sont alors écartées, sans
 * autre effet : le texte de référence reste celui du service.
 */

/** Contexte de dérivation : versionné, pour pouvoir en changer un jour. */
const DERIVATION_CONTEXT = "imafrik/report-backup/v1/";

/** Secret de démonstration : le jeu de données y est fictif. */
const DEMO_SECRET = "imafrik-demo-report-backup";

/**
 * Secret de dérivation, s'il est configuré et assez long — une production
 * qui en est privée refuse de servir (`lib/deployment.ts`).
 */
function reportBackupSecret(): string | null {
  return hasReportBackupSecret()
    ? (process.env.REPORT_BACKUP_SECRET ?? null)
    : null;
}

/**
 * Clé de chiffrement des copies de secours d'un compte.
 *
 * @param userId Compte de la session.
 * @returns 32 octets en base64, ou `null` si aucun secret n'est configuré
 *          hors démonstration — l'éditeur renonce alors à toute copie
 *          locale plutôt que d'écrire du texte médical en clair.
 */
export function reportBackupKey(userId: string): string | null {
  const secret = isDemoMode() ? DEMO_SECRET : reportBackupSecret();
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(DERIVATION_CONTEXT + userId)
    .digest("base64");
}
