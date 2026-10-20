/**
 * Visites faites, retenues sur l'appareil.
 *
 * Le profil (`profiles.tours_completed`) est la référence : une visite
 * faite sur un poste ne revient pas sur un autre. Cette copie locale
 * couvre deux cas où il ne suffit pas :
 *
 * - **la démonstration**, qui n'a pas de profil en base ;
 * - **un enregistrement en échec** (réseau coupé au mauvais moment) : la
 *   visite ne doit pas revenir au rechargement suivant pour autant.
 *
 * Une clé par compte, pour qu'un poste partagé à l'accueil d'une clinique
 * garde les visites de chacun. Seuls des identifiants de visite y sont
 * écrits, jamais une donnée de la personne. Le stockage peut être refusé
 * (navigation privée, données du site bloquées) : la lecture rend alors
 * une liste vide, l'écriture ne fait rien.
 */

/** Préfixe de la clé, suivi de l'identifiant du compte. */
export const STORAGE_PREFIX = "imafrik-visites:";

/** Forme d'un identifiant de visite, la même que celle qu'impose la base. */
const TOUR_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function key(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * Visites retenues pour ce compte sur cet appareil.
 *
 * @param userId Identifiant du compte.
 * @returns Les identifiants retenus ; une valeur illisible est ignorée.
 */
export function readLocalTours(userId: string): string[] {
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is string =>
            typeof entry === "string" && TOUR_ID.test(entry),
        )
      : [];
  } catch {
    return [];
  }
}

/**
 * Retient les visites faites par ce compte sur cet appareil.
 *
 * @param userId Identifiant du compte.
 * @param tours  Identifiants à retenir, remplaçant les précédents.
 */
export function writeLocalTours(userId: string, tours: Iterable<string>): void {
  try {
    window.localStorage.setItem(key(userId), JSON.stringify([...tours].sort()));
  } catch {
    // Stockage refusé : le profil reste la référence.
  }
}
