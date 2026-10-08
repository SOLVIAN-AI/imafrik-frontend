/**
 * Lecture des paramètres d'adresse de la tour de contrôle.
 *
 * Une adresse se tape, se modifie, se colle : tout ce qui en vient est
 * validé ici et ramené à une valeur sûre, plutôt que transmis tel quel au
 * service — qui le revaliderait, mais répondrait par une erreur là où
 * l'écran peut simplement retomber sur la valeur par défaut.
 */

type Param = string | string[] | undefined;

/** Périodes d'analyse proposées, en jours. */
export const ANALYTICS_PERIODS = [7, 30, 90, 365] as const;

/** Une période d'analyse. */
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

/** Première valeur d'un paramètre répété. */
const first = (value: Param) => (Array.isArray(value) ? value[0] : value);

/**
 * Période d'analyse, parmi celles proposées.
 *
 * @param value Paramètre `jours`.
 * @returns La période, ou trente jours.
 */
export function parsePeriod(value: Param): AnalyticsPeriod {
  const days = Number(first(value));
  return (ANALYTICS_PERIODS as readonly number[]).includes(days)
    ? (days as AnalyticsPeriod)
    : 30;
}

/**
 * Identifiant de clinique, s'il fait partie des cliniques connues.
 *
 * @param value   Paramètre `clinique`.
 * @param known   Identifiants valides.
 * @returns L'identifiant, ou `null` pour tout le réseau.
 */
export function parseClinic(value: Param, known: string[]): string | null {
  const id = first(value);
  return id && known.includes(id) ? id : null;
}

/**
 * Mois `AAAA-MM`, borné au mois courant.
 *
 * @param value Paramètre `mois`.
 * @param now   Instant de référence.
 * @returns Le mois demandé, ou le mois courant (UTC).
 */
export function parseMonth(value: Param, now = new Date()): string {
  const current = now.toISOString().slice(0, 7);
  const month = first(value);
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return current;
  return month > current ? current : month;
}

/**
 * Mois voisin.
 *
 * @param month  Mois `AAAA-MM`.
 * @param offset Décalage en mois, négatif vers le passé.
 */
export function shiftMonth(month: string, offset: number): string {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}

/**
 * Curseur de pagination : un identifiant entier positif.
 *
 * @param value Paramètre `avant`.
 */
export function parseCursor(value: Param): number | undefined {
  const raw = first(value);
  if (!raw || !/^\d{1,18}$/.test(raw)) return undefined;
  const cursor = Number(raw);
  return Number.isSafeInteger(cursor) && cursor > 0 ? cursor : undefined;
}

/**
 * Filtre de la liste des comptes :
 *
 * - `all` — tous les comptes ;
 * - `pending` — rattachés à aucune organisation (`?attente=1`) ;
 * - `unverified` — radiologues dont le numéro d'ordre attend la
 *   validation de l'équipe IMAFRIK (`?validation=attente`, l'adresse que
 *   l'alerte du cockpit ouvre).
 */
export type UserListFilter = "all" | "pending" | "unverified";

/**
 * Filtre de la liste des comptes, lu dans l'adresse.
 *
 * @param params Paramètres `attente` et `validation`.
 * @returns Le filtre ; la validation l'emporte si les deux sont posés.
 */
export function parseUserFilter(params: {
  attente?: Param;
  validation?: Param;
}): UserListFilter {
  if (first(params.validation) === "attente") return "unverified";
  if (first(params.attente) === "1") return "pending";
  return "all";
}

/**
 * Adresse de la liste des comptes pour un filtre, recherche conservée.
 *
 * @param filter Filtre voulu.
 * @param query  Recherche en cours.
 */
export function userListHref(filter: UserListFilter, query?: string): string {
  const next = new URLSearchParams();
  if (query) next.set("q", query);
  if (filter === "pending") next.set("attente", "1");
  if (filter === "unverified") next.set("validation", "attente");
  const search = next.toString();
  return search ? `/admin/utilisateurs?${search}` : "/admin/utilisateurs";
}
