import type { ApiPerformanceMonth } from "@/lib/api/contracts";
import { formatPersonName } from "@/lib/format";

/**
 * Performances des radiologues sur un mois, dans le vocabulaire de
 * l'interface : traduction de la réponse du service, tri des colonnes et
 * tendance par rapport au mois précédent.
 *
 * Module pur : ni rendu ni requête. Les mesures arrivent calculées du
 * service (`/organization/performance`, `/admin/performance`) ; rien n'est
 * recalculé ici, sinon la différence avec le mois précédent.
 */

/** Délais réception → signature d'une priorité. */
export interface PriorityDelays {
  medianMinutes: number | null;
  meanMinutes: number | null;
  p90Minutes: number | null;
  withinSla: number | null;
}

/** Les performances d'un radiologue sur un mois. */
export interface RadiologistPerformance {
  id: string;
  /** Titre et nom : « Dr Adjo Kponton ». */
  name: string;
  signedRoutine: number;
  signedUrgent: number;
  /** Délai médian réception → signature, toutes priorités. */
  medianMinutes: number | null;
  /** Part signée dans le délai promis, toutes priorités, de 0 à 1. */
  withinSla: number | null;
  routine: PriorityDelays;
  urgent: PriorityDelays;
  /** Délai médian attribution → début de lecture. */
  pickupMinutes: number | null;
  /** Durée médiane début de lecture → signature. */
  readingMinutes: number | null;
  /** Examens rendus sans être signés dans le mois. */
  released: number;
  /** Urgences prises sur la liste d'urgence dans le mois. */
  urgentClaimed: number;
  /** À l'instant : attribués, pas encore commencés. */
  assignedWaiting: number;
  /** À l'instant : en lecture. */
  inReading: number;
  previousMedianMinutes: number | null;
  previousWithinSla: number | null;
}

/** Les performances des radiologues sur un mois. */
export interface PerformanceMonth {
  /** Mois `AAAA-MM`. */
  month: string;
  slaRoutineMinutes: number;
  slaUrgentMinutes: number;
  radiologists: RadiologistPerformance[];
}

/** La réponse du service, dans le vocabulaire de l'interface. */
export function toPerformanceMonth(api: ApiPerformanceMonth): PerformanceMonth {
  const delays = (
    row: ApiPerformanceMonth["radiologists"][number]["routine"],
  ) => ({
    medianMinutes: row.median_minutes,
    meanMinutes: row.mean_minutes,
    p90Minutes: row.p90_minutes,
    withinSla: row.within_sla,
  });
  return {
    month: api.month.slice(0, 7),
    slaRoutineMinutes: api.sla_routine_minutes,
    slaUrgentMinutes: api.sla_urgent_minutes,
    radiologists: api.radiologists.map((row) => ({
      id: row.profile_id,
      name: formatPersonName(row.title, row.full_name),
      signedRoutine: row.signed_routine,
      signedUrgent: row.signed_urgent,
      medianMinutes: row.median_minutes,
      withinSla: row.within_sla,
      routine: delays(row.routine),
      urgent: delays(row.urgent),
      pickupMinutes: row.pickup_median_minutes,
      readingMinutes: row.reading_median_minutes,
      released: row.released,
      urgentClaimed: row.urgent_claimed,
      assignedWaiting: row.assigned_waiting,
      inReading: row.in_reading,
      previousMedianMinutes: row.previous_median_minutes,
      previousWithinSla: row.previous_within_sla,
    })),
  };
}

/** Colonnes triables du tableau. */
export const PERFORMANCE_SORT_KEYS = [
  "name",
  "signed",
  "median",
  "withinSla",
  "routineMedian",
  "routineMean",
  "routineP90",
  "routineWithinSla",
  "urgentMedian",
  "urgentMean",
  "urgentP90",
  "urgentWithinSla",
  "pickup",
  "reading",
  "released",
  "urgentClaimed",
  "open",
] as const;

/** Une colonne triable. */
export type PerformanceSortKey = (typeof PERFORMANCE_SORT_KEYS)[number];

/** Sens d'un tri. */
export type SortDirection = "ascending" | "descending";

/** Valeur d'une ligne pour une colonne ; `null` sans donnée. */
function valueOf(
  row: RadiologistPerformance,
  key: PerformanceSortKey,
): number | string | null {
  switch (key) {
    case "name":
      return row.name;
    case "signed":
      return row.signedRoutine + row.signedUrgent;
    case "median":
      return row.medianMinutes;
    case "withinSla":
      return row.withinSla;
    case "routineMedian":
      return row.routine.medianMinutes;
    case "routineMean":
      return row.routine.meanMinutes;
    case "routineP90":
      return row.routine.p90Minutes;
    case "routineWithinSla":
      return row.routine.withinSla;
    case "urgentMedian":
      return row.urgent.medianMinutes;
    case "urgentMean":
      return row.urgent.meanMinutes;
    case "urgentP90":
      return row.urgent.p90Minutes;
    case "urgentWithinSla":
      return row.urgent.withinSla;
    case "pickup":
      return row.pickupMinutes;
    case "reading":
      return row.readingMinutes;
    case "released":
      return row.released;
    case "urgentClaimed":
      return row.urgentClaimed;
    case "open":
      return row.assignedWaiting + row.inReading;
  }
}

/**
 * Sens du premier clic sur une colonne : un délai se lit du plus court au
 * plus long, un volume ou une part du plus grand au plus petit.
 */
export function defaultDirection(key: PerformanceSortKey): SortDirection {
  return key === "name" ||
    key === "median" ||
    key.endsWith("Median") ||
    key.endsWith("Mean") ||
    key.endsWith("P90") ||
    key === "pickup" ||
    key === "reading"
    ? "ascending"
    : "descending";
}

/**
 * Lignes triées sur une colonne. Une ligne sans donnée pour la colonne va
 * toujours en dernier, quel que soit le sens ; à égalité, l'ordre des noms.
 *
 * @param rows      Lignes.
 * @param key       Colonne.
 * @param direction Sens.
 * @param locale    Langue, pour l'ordre des noms.
 */
export function sortPerformance(
  rows: readonly RadiologistPerformance[],
  key: PerformanceSortKey,
  direction: SortDirection,
  locale = "fr",
): RadiologistPerformance[] {
  const sign = direction === "ascending" ? 1 : -1;
  const byName = (a: RadiologistPerformance, b: RadiologistPerformance) =>
    a.name.localeCompare(b.name, locale);
  return [...rows].sort((a, b) => {
    const left = valueOf(a, key);
    const right = valueOf(b, key);
    if (left === null || right === null) {
      if (left === right) return byName(a, b);
      return left === null ? 1 : -1;
    }
    const order =
      typeof left === "string"
        ? left.localeCompare(String(right), locale)
        : left - (right as number);
    return order === 0 ? byName(a, b) : sign * order;
  });
}

/** Évolution d'une mesure par rapport au mois précédent. */
export interface Trend {
  /** `better` : délai plus court, ou part dans les délais plus grande. */
  direction: "better" | "worse" | "same";
  /** Écart absolu : minutes pour un délai, points (0 à 1) pour une part. */
  delta: number;
  /** Vrai si la mesure a augmenté, quel que soit le sens souhaité. */
  rising: boolean;
}

/**
 * Tendance d'une mesure. Sous le seuil, l'écart ne compte pas : une
 * minute de plus sur un délai médian n'est pas une dégradation.
 *
 * @param current      Mesure du mois.
 * @param previous     Mesure du mois précédent.
 * @param lowerIsBetter Vrai pour un délai, faux pour une part.
 * @param threshold    Écart en deçà duquel la mesure est stable.
 * @returns La tendance, ou `null` si l'un des deux mois n'a pas de mesure.
 */
export function trendOf(
  current: number | null,
  previous: number | null,
  lowerIsBetter: boolean,
  threshold: number,
): Trend | null {
  if (current === null || previous === null) return null;
  const delta = Math.abs(current - previous);
  const rising = current > previous;
  if (delta < threshold) return { direction: "same", delta, rising };
  return {
    direction: rising === lowerIsBetter ? "worse" : "better",
    delta,
    rising,
  };
}

/** Écart en deçà duquel un délai médian est stable, en minutes. */
export const MEDIAN_TREND_THRESHOLD = 1;
/** Écart en deçà duquel une part dans les délais est stable (1 point). */
export const SLA_TREND_THRESHOLD = 0.01;
