import { INTL_LOCALE, type Locale } from "@/lib/i18n/locale";

/**
 * Le choix d'une clinique dans une liste déroulante (`ClinicDropdown`) :
 * l'ordre des cliniques, la recherche, le déplacement au clavier et
 * l'adresse du choix. Pur, sans navigateur : éprouvé par
 * `clinic-choice.test.ts`.
 */

/** Une clinique proposée, avec le nombre d'examens qu'elle retient. */
export interface ClinicChoice {
  id: string;
  name: string;
  /** Examens que la liste montrerait ; absent quand l'écran ne compte pas. */
  count?: number;
}

/** À partir de ce nombre de cliniques, la liste s'ouvre sur une recherche. */
export const SEARCH_FROM = 8;

/**
 * Les cliniques par ordre alphabétique, selon la langue : accents et
 * majuscules ne déplacent rien (« Élavagnon » se range avec les E), et
 * les nombres se comparent en nombres (« Centre 2 » avant « Centre 10 »).
 *
 * @param clinics Cliniques, dans n'importe quel ordre.
 * @param locale  Langue de l'utilisateur.
 * @returns Une nouvelle liste, triée.
 */
export function sortClinics<T extends { name: string }>(
  clinics: readonly T[],
  locale: Locale,
): T[] {
  const collator = new Intl.Collator(INTL_LOCALE[locale], {
    sensitivity: "base",
    numeric: true,
  });
  return [...clinics].sort((a, b) => collator.compare(a.name, b.name));
}

/** Un texte sans accents ni majuscules, pour la recherche. */
export function foldForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .trim();
}

/**
 * Les cliniques dont le nom contient chacun des mots cherchés, accents et
 * majuscules ignorés : « st jo » trouve « Clinique Saint-Joseph » par
 * « jo », « kara » trouve « Polyclinique de Kara ».
 *
 * @param clinics Cliniques, dans l'ordre d'affichage (gardé).
 * @param query   Saisie ; vide, toutes les cliniques.
 */
export function matchClinics<T extends { name: string }>(
  clinics: readonly T[],
  query: string,
): T[] {
  const words = foldForSearch(query)
    .split(/[\s'’-]+/)
    .filter(Boolean);
  if (words.length === 0) return [...clinics];
  return clinics.filter((clinic) => {
    const name = foldForSearch(clinic.name);
    return words.every((word) => name.includes(word));
  });
}

/** Lignes parcourues d'un coup par Page précédente / Page suivante. */
const PAGE_STEP = 10;

/**
 * La ligne mise en avant après une touche de déplacement, dans une liste
 * de `length` lignes : flèches, Origine, Fin, pages. Ne boucle pas : la
 * flèche du bas sur la dernière ligne y reste.
 *
 * @param current Ligne mise en avant, `-1` si aucune.
 * @param key     Touche (`KeyboardEvent.key`).
 * @param length  Nombre de lignes.
 * @returns La nouvelle ligne, ou `null` pour une touche qui ne déplace pas.
 */
export function moveActive(
  current: number,
  key: string,
  length: number,
): number | null {
  if (length === 0) return null;
  const last = length - 1;
  const clamp = (index: number) => Math.min(last, Math.max(0, index));
  switch (key) {
    case "ArrowDown":
      return current < 0 ? 0 : clamp(current + 1);
    case "ArrowUp":
      return current < 0 ? last : clamp(current - 1);
    case "Home":
      return 0;
    case "End":
      return last;
    case "PageDown":
      return clamp(current + PAGE_STEP);
    case "PageUp":
      return clamp(current - PAGE_STEP);
    default:
      return null;
  }
}

/**
 * Saisie au clavier d'une liste sans recherche : la touche d'une lettre
 * mène à la ligne suivante qui commence par elle, en repartant du début
 * après la dernière.
 *
 * @param labels  Libellés des lignes, dans l'ordre.
 * @param current Ligne mise en avant.
 * @param char    Caractère tapé.
 * @returns La ligne trouvée, ou `null`.
 */
export function typeAhead(
  labels: readonly string[],
  current: number,
  char: string,
): number | null {
  const wanted = foldForSearch(char);
  if (!wanted) return null;
  for (let step = 1; step <= labels.length; step += 1) {
    const index = (current + step + labels.length) % labels.length;
    if (foldForSearch(labels[index]).startsWith(wanted)) return index;
  }
  return null;
}

/**
 * Adresse de la liste pour une clinique choisie : les autres paramètres
 * gardés (modalité, urgences, période…), ceux qui n'ont plus de sens
 * retirés (la page de la liste, qui repart au début).
 *
 * @param pathname Adresse de la liste.
 * @param search   Paramètres de l'adresse courante.
 * @param param    Paramètre de la clinique (`clinique`).
 * @param id       Clinique choisie ; `null` pour toutes.
 * @param reset    Paramètres retirés au changement de clinique.
 */
export function clinicChoiceHref(
  pathname: string,
  search: URLSearchParams | string,
  param: string,
  id: string | null,
  reset: readonly string[],
): string {
  const next = new URLSearchParams(search);
  for (const key of reset) next.delete(key);
  if (id) next.set(param, id);
  else next.delete(param);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
