/**
 * Vue des cliniques : l'équipe IMAFRIK voit une clinique comme son
 * responsable.
 *
 * Depuis la console, l'équipe choisit une clinique et ouvre en
 * consultation les écrans de son responsable, avec les vraies données de
 * cette clinique : tableau de bord, examens, comptes-rendus, équipe et
 * règles d'attribution, activité et facturation. Ce sont **les mêmes
 * écrans** que ceux du responsable, nourris par des lectures qui nomment
 * la clinique (`/admin/clinics/{id}/view/...`) et reprennent son calcul.
 *
 * **La clinique choisie est dans l'adresse**, et rien d'autre :
 * `/admin/vue-clinique/{clinique}/examens`. Un lien se partage dans
 * l'équipe, un rechargement garde la clinique, et aucune donnée patient
 * n'y figure : des identifiants opaques, jamais un nom ni une recherche
 * (celle-ci reste dans un cookie, voir `lib/search/list-search.ts`).
 *
 * Module pur : ni rendu ni requête.
 */

/** Racine de la vue des cliniques. */
export const CLINIC_VIEW_ROOT = "/admin/vue-clinique";

/** Écran d'arrivée dans une clinique. */
export const CLINIC_VIEW_HOME = "/tableau-de-bord";

/**
 * La clinique consultée, telle que la vue l'affiche.
 *
 * Le responsable n'en a pas : ses écrans montrent sa clinique active.
 */
export interface ClinicConsultation {
  clinicId: string;
  name: string;
  city: string | null;
  /** Suspendue : son responsable n'y a plus accès, l'équipe la voit encore. */
  isActive: boolean;
}

/** Une clinique proposée par le sélecteur de la navigation. */
export interface ViewableClinic {
  id: string;
  name: string;
  city: string | null;
}

/**
 * Adresse d'un écran de la vue d'une clinique.
 *
 * @param clinicId Clinique consultée.
 * @param screen   Adresse de l'écran chez le responsable, `/examens` par
 *                 exemple ; le tableau de bord à défaut.
 */
export function clinicViewPath(
  clinicId: string,
  screen: string = CLINIC_VIEW_HOME,
): string {
  return `${CLINIC_VIEW_ROOT}/${encodeURIComponent(clinicId)}${screen}`;
}

/**
 * Adresse d'un écran du responsable, ou de la vue de sa clinique.
 *
 * Les écrans partagés écrivent leurs liens comme le responsable les suit
 * (`/examens/{id}`) ; la vue les replace sous la clinique consultée.
 *
 * @param consultation Clinique consultée, `null` pour le responsable.
 * @param path         Adresse chez le responsable.
 */
export function clinicHref(
  consultation: Pick<ClinicConsultation, "clinicId"> | null,
  path: string,
): string {
  return consultation ? clinicViewPath(consultation.clinicId, path) : path;
}

/**
 * Racine des lectures de l'API pour la vue d'une clinique : réservées à
 * l'équipe IMAFRIK, elles reprennent le calcul du responsable.
 *
 * @param clinicId Clinique consultée.
 */
export function clinicViewApi(clinicId: string): string {
  return `/admin/clinics/${encodeURIComponent(clinicId)}/view`;
}

/** Les deux premiers segments d'une adresse de la vue : clinique et écran. */
function parse(pathname: string): { clinicId: string; rest: string } | null {
  if (!pathname.startsWith(`${CLINIC_VIEW_ROOT}/`)) return null;
  const [segment, ...rest] = pathname
    .slice(CLINIC_VIEW_ROOT.length + 1)
    .split("/");
  if (!segment) return null;
  try {
    return { clinicId: decodeURIComponent(segment), rest: rest.join("/") };
  } catch {
    // Un segment mal encodé, tapé à la main : aucune clinique.
    return null;
  }
}

/**
 * La clinique d'une adresse de la vue.
 *
 * @param pathname Adresse courante.
 * @returns L'identifiant de la clinique, ou `null` hors de la vue.
 */
export function clinicIdOf(pathname: string): string | null {
  return parse(pathname)?.clinicId ?? null;
}

/** Écrans dont les sous-pages désignent une fiche propre à la clinique. */
const RECORD_SCREENS = ["examens", "comptes-rendus"];

/**
 * L'écran à garder quand on passe d'une clinique à une autre.
 *
 * La liste des examens reste la liste des examens ; la fiche d'un examen,
 * qui n'existe que dans la première clinique, ramène à la liste.
 *
 * @param pathname Adresse courante.
 * @returns L'adresse de l'écran chez le responsable ; le tableau de bord
 *          hors de la vue.
 */
export function clinicScreenOf(pathname: string): string {
  const parsed = parse(pathname);
  if (!parsed?.rest) return CLINIC_VIEW_HOME;
  const [screen, ...below] = parsed.rest.split("/");
  if (RECORD_SCREENS.includes(screen) && below.length > 0) return `/${screen}`;
  return `/${parsed.rest}`;
}
