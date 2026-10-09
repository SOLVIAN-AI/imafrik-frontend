/**
 * Qui peut changer un mot de passe, et sur quelle preuve.
 *
 * Deux chemins, deux preuves :
 *
 * - **depuis les paramètres**, la personne connaît son mot de passe :
 *   elle le ressaisit, et le serveur le vérifie. Sans cela, quiconque
 *   trouvait une session ouverte (poste partagé d'un accueil de clinique,
 *   dans la fenêtre du verrouillage d'inactivité) pouvait changer le mot
 *   de passe, fermer les autres sessions du titulaire et garder l'accès ;
 * - **depuis un lien reçu par courriel** (invitation, réinitialisation),
 *   la personne n'a pas, ou plus, de mot de passe : la preuve est le lien
 *   lui-même, qui a ouvert la session. Elle se lit dans le jeton (claim
 *   `amr`), et ne vaut que peu de temps après le clic.
 */

/**
 * Méthodes d'authentification qui prouvent la maîtrise de la boîte aux
 * lettres du compte.
 *
 * GoTrue inscrit `otp` pour un lien vérifié par `token_hash` (constaté sur
 * le service local, invitation comme réinitialisation), `recovery` ou
 * `invite` pour un lien échangé par code (PKCE), `magiclink` pour un lien
 * de connexion. Toutes reviennent à la même preuve : avoir reçu le
 * courriel.
 */
const EMAIL_LINK_METHODS: ReadonlySet<string> = new Set([
  "otp",
  "recovery",
  "invite",
  "magiclink",
]);

/**
 * Durée pendant laquelle une session ouverte par un lien permet de choisir
 * un mot de passe sans ressaisir l'ancien, en secondes. Une heure : le
 * temps de lire l'accueil, de vérifier un second facteur et de choisir.
 * Au-delà, « Mot de passe oublié » envoie un nouveau lien.
 */
export const EMAIL_LINK_PASSWORD_WINDOW_SECONDS = 60 * 60;

/** Entrée du claim `amr`, sous ses deux formes possibles. */
type AmrEntry = string | { method?: unknown; timestamp?: unknown };

/**
 * Indique si la session a été ouverte par un lien reçu par courriel, il y
 * a moins de {@link EMAIL_LINK_PASSWORD_WINDOW_SECONDS}.
 *
 * Le claim est lu dans un jeton **vérifié** (`getClaims()`). La forme
 * courte (chaînes, sans horodatage) est refusée : sans date, rien ne
 * borne la validité de la preuve.
 *
 * @param amr        Claim `amr` du jeton.
 * @param nowSeconds Instant présent, en secondes depuis l'époque Unix.
 */
export function openedByRecentEmailLink(
  amr: unknown,
  nowSeconds: number,
): boolean {
  if (!Array.isArray(amr)) return false;
  return (amr as AmrEntry[]).some((entry) => {
    if (typeof entry !== "object" || entry === null) return false;
    const { method, timestamp } = entry;
    return (
      typeof method === "string" &&
      EMAIL_LINK_METHODS.has(method) &&
      typeof timestamp === "number" &&
      timestamp <= nowSeconds + 60 &&
      nowSeconds - timestamp <= EMAIL_LINK_PASSWORD_WINDOW_SECONDS
    );
  });
}
