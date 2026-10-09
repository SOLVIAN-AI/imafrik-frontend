/**
 * Pagination des listes d'examens.
 *
 * Le service pagine par curseur : chaque page renvoie, avec ses lignes et
 * le total exact, un `next_cursor` opaque qui désigne la position juste
 * après sa dernière ligne. Une arrivée pendant le parcours ne fait ainsi
 * ni répéter ni sauter d'examen, ce qu'un numéro de page ne garantit pas
 * dans une liste triée du plus récent au plus ancien.
 *
 * Le curseur voyage dans l'adresse (`?apres=`) : il ne contient rien de
 * nominatif (un instant de réception, un identifiant d'examen), et l'on
 * peut ainsi revenir à une page par l'historique du navigateur. Ce module
 * est pur : il lit et écrit l'adresse, sans requête.
 */

/** Paramètre d'adresse du curseur. */
export const CURSOR_PARAM = "apres";

/** Longueur maximale d'un curseur, alignée sur la limite du service. */
const CURSOR_MAX_LENGTH = 512;

/** Alphabet d'un curseur : base64url, plus le tiret des curseurs de démonstration. */
const CURSOR_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Paramètres d'adresse, tels que Next les fournit à une page. */
export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/**
 * Relit le curseur de l'adresse. Une valeur mal formée est ignorée : la
 * liste repart du début plutôt que d'envoyer n'importe quoi au service.
 *
 * @param params Paramètres de la page.
 * @returns Le curseur, ou `undefined` pour la première page.
 */
export function readCursor(params: SearchParamsRecord): string | undefined {
  const raw = params[CURSOR_PARAM];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value.length > CURSOR_MAX_LENGTH) return undefined;
  return CURSOR_PATTERN.test(value) ? value : undefined;
}

/**
 * Adresse d'une page de la liste : les autres paramètres sont gardés
 * (filtre des urgences, par exemple), seul le curseur change.
 *
 * @param pathname Chemin de l'écran.
 * @param params   Paramètres actuels.
 * @param cursor   Curseur de la page voulue ; `null` pour la première.
 */
export function pageHref(
  pathname: string,
  params: SearchParamsRecord,
  cursor: string | null,
): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === CURSOR_PARAM || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      next.append(key, item);
    }
  }
  if (cursor) next.set(CURSOR_PARAM, cursor);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
