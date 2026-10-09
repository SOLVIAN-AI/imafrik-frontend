/**
 * Recherche d'une liste d'examens, hors de l'adresse.
 *
 * Une recherche dans une liste d'examens porte presque toujours un nom de
 * patient. Placée dans l'adresse (`?q=KOFFI`), elle finissait dans
 * l'historique du navigateur — sur un poste partagé de clinique, lisible
 * du suivant —, dans les journaux d'accès de l'hébergeur et dans tout
 * lien copié. Elle vit donc dans un cookie :
 *
 * - **httpOnly** — aucun script de la page ne le lit ;
 * - **court** — trente minutes, le temps d'une recherche ;
 * - **lié au compte et à l'organisation active** — la valeur commence par
 *   leurs identifiants, et n'est relue que s'ils correspondent : un autre
 *   compte sur le même navigateur, ou la même personne après une bascule
 *   d'organisation, part d'une liste vierge ;
 * - **un par liste** — chercher dans « Examens » ne filtre pas « À lire ».
 *
 * Ce module est pur : ni cookie ni requête, seulement les règles. La
 * lecture vit dans `server.ts`, l'écriture dans l'action `setListSearch`.
 */

/** Listes d'examens dont la recherche est tenue hors de l'adresse. */
export const LIST_SEARCH_SCOPES = [
  "worklist",
  "examens",
  "admin-examens",
  "comptes-rendus",
] as const;

/** Une liste d'examens recherchable. */
export type ListSearchScope = (typeof LIST_SEARCH_SCOPES)[number];

/** Longueur maximale d'une recherche, alignée sur la limite du service. */
export const LIST_SEARCH_MAX_LENGTH = 100;

/** Durée de vie du cookie, en secondes. */
export const LIST_SEARCH_MAX_AGE = 30 * 60;

/** Propriétaire d'une recherche : un compte, dans une organisation. */
export interface SearchOwner {
  userId: string;
  membershipId: string;
}

/**
 * Indique si une valeur désigne une liste recherchable.
 *
 * @param value Valeur reçue du navigateur — donc à vérifier.
 */
export function isListSearchScope(value: unknown): value is ListSearchScope {
  return (
    typeof value === "string" &&
    (LIST_SEARCH_SCOPES as readonly string[]).includes(value)
  );
}

/**
 * Nom du cookie d'une liste.
 *
 * @param scope Liste concernée.
 */
export function listSearchCookie(scope: ListSearchScope): string {
  return `imafrik-recherche-${scope}`;
}

/**
 * Normalise une saisie : espaces réduits, longueur bornée, caractères de
 * contrôle retirés.
 *
 * @param raw Saisie brute.
 * @returns La recherche, chaîne vide si rien ne reste.
 */
export function normalizeListSearch(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIST_SEARCH_MAX_LENGTH)
    .trim();
}

/**
 * Valeur du cookie : le propriétaire, puis la recherche.
 *
 * @param owner  Compte et organisation active.
 * @param search Recherche normalisée.
 */
export function encodeListSearch(owner: SearchOwner, search: string): string {
  return [owner.userId, owner.membershipId, encodeURIComponent(search)].join(
    ".",
  );
}

/**
 * Relit la valeur d'un cookie, pour son seul propriétaire.
 *
 * @param value Valeur du cookie, si présent.
 * @param owner Compte et organisation active de la requête.
 * @returns La recherche, ou `undefined` si le cookie est absent, illisible
 *          ou appartient à quelqu'un d'autre.
 */
export function decodeListSearch(
  value: string | undefined,
  owner: SearchOwner,
): string | undefined {
  if (!value) return undefined;
  // Seuls les deux premiers points séparent : `encodeURIComponent` laisse
  // passer le point, qu'une recherche peut contenir.
  const prefix = `${owner.userId}.${owner.membershipId}.`;
  if (!value.startsWith(prefix)) return undefined;
  const encoded = value.slice(prefix.length);
  try {
    return normalizeListSearch(decodeURIComponent(encoded)) || undefined;
  } catch {
    return undefined;
  }
}
