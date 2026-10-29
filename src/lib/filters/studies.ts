/**
 * Les filtres d'une liste d'examens, entre l'adresse, le service et la
 * barre : la requête que les filtres lus imposent, et les dimensions de la
 * barre tirées des nombres que compte le service.
 *
 * Chaque liste d'examens passe par ici : un filtre ajouté au registre
 * (`dimensions.ts`) se transmet au service et se compte au même endroit
 * pour toutes.
 */

import type { StudyStatus } from "@/components/domain/study-status";
import type { ModalityGroup, StudyFacet } from "@/lib/api/contracts";
import type {
  ClinicCounts,
  ModalityCounts,
  StudyFacets,
  StudyQuery,
} from "@/lib/data/studies";
import {
  type ActiveFilters,
  type BarDimension,
  type DimensionKey,
  PERIODS,
  STUDY_STATES,
  type StudyState,
} from "@/lib/filters/dimensions";
import { MODALITY_GROUPS } from "@/lib/modalities";

/** Les statuts du service derrière chaque état d'une liste. */
export const STATE_STATUSES: Readonly<Record<StudyState, StudyStatus[]>> = {
  to_assign: ["received"],
  reading: ["assigned", "in_progress"],
  ready: ["reported"],
  delivered: ["delivered"],
};

/** Un jour, en millisecondes. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * La part de la requête au service que les filtres imposent.
 *
 * @param filters Filtres lus dans l'adresse (`readFilters`).
 * @param now     Instant de référence de la période.
 */
export function studyQuery(
  filters: ActiveFilters,
  now: Date = new Date(),
): Pick<
  StudyQuery,
  | "clinic"
  | "radiologist"
  | "modalityGroup"
  | "status"
  | "priority"
  | "receivedAfter"
> {
  return {
    ...(filters.clinic && { clinic: filters.clinic }),
    ...(filters.radiologist && { radiologist: filters.radiologist }),
    ...(filters.modality && {
      modalityGroup: filters.modality as ModalityGroup,
    }),
    ...(filters.state && {
      status: STATE_STATUSES[filters.state as StudyState],
    }),
    ...(filters.urgency && { priority: "urgent" as const }),
    ...(filters.period && {
      receivedAfter: new Date(now.getTime() - Number(filters.period) * DAY_MS),
    }),
  };
}

/** La dimension du service qui compte chaque dimension de la barre. */
const FACET_OF: Partial<Record<DimensionKey, StudyFacet>> = {
  clinic: "clinic",
  radiologist: "radiologist",
  modality: "modality",
  state: "status",
  urgency: "priority",
};

/**
 * Les dimensions du service à compter pour une barre.
 *
 * @param keys Dimensions de l'écran.
 */
export function facetsFor(keys: readonly DimensionKey[]): StudyFacet[] {
  return keys.flatMap((key) => {
    const facet = FACET_OF[key];
    return facet ? [facet] : [];
  });
}

/**
 * Les états qu'une liste propose, quand elle ne les propose pas tous : ses
 * statuts possibles, et le nom de chaque état sur cet écran.
 */
export interface ScreenStates {
  /** États proposés, dans l'ordre du registre. */
  values: readonly StudyState[];
  /** Statuts que la liste peut montrer ; les autres ne se comptent pas. */
  statuses: readonly StudyStatus[];
  /** Nom de chaque état sur cet écran (« À télécharger »). */
  labels?: Partial<Record<StudyState, string>>;
}

/**
 * Les statuts d'un état, parmi ceux que la liste peut montrer.
 *
 * @param state   État retenu, ou aucun.
 * @param allowed Statuts de la liste.
 */
export function stateStatuses(
  state: string | undefined,
  allowed: readonly StudyStatus[],
): StudyStatus[] {
  if (!state) return [...allowed];
  return STATE_STATUSES[state as StudyState].filter((status) =>
    allowed.includes(status),
  );
}

/**
 * Les dimensions de la barre, tirées des comptes du service.
 *
 * @param keys    Dimensions de l'écran, dans l'ordre du registre.
 * @param counts  Comptes du service (`getStudyFacets`).
 * @param options Nom propre à l'écran d'une bascule (« Urgences en
 *                cours ») ; états de l'écran, s'il ne les propose pas tous.
 */
export function facetDimensions(
  keys: readonly DimensionKey[],
  counts: StudyFacets,
  options: { urgency?: string; states?: ScreenStates } = {},
): BarDimension[] {
  const sum = (rows: { count: number }[] = []) =>
    rows.reduce((total, row) => total + row.count, 0);
  const byValue = (facet: StudyFacet) =>
    new Map((counts.facets[facet] ?? []).map((row) => [row.value, row.count]));
  return keys.map((key): BarDimension => {
    switch (key) {
      case "clinic":
        return {
          key,
          options: (counts.facets.clinic ?? []).map((row) => ({
            value: row.value,
            label: row.label,
            count: row.count,
          })),
          total: sum(counts.facets.clinic),
        };
      case "radiologist":
        // « Tous les radiologues » ne se compte pas : un examen à
        // attribuer n'a encore aucun radiologue.
        return {
          key,
          options: (counts.facets.radiologist ?? []).map((row) => ({
            value: row.value,
            label: row.label,
            count: row.count,
          })),
        };
      case "modality": {
        const groups = byValue("modality");
        return {
          key,
          options: MODALITY_GROUPS.map((group) => ({
            value: group,
            count: groups.get(group) ?? 0,
          })),
          total: sum(counts.facets.modality),
        };
      }
      case "state": {
        const statuses = byValue("status");
        const screen = options.states;
        const allowed = (status: StudyStatus) =>
          !screen || screen.statuses.includes(status);
        const countOf = (list: readonly StudyStatus[]) =>
          list
            .filter(allowed)
            .reduce((total, status) => total + (statuses.get(status) ?? 0), 0);
        return {
          key,
          options: (screen?.values ?? STUDY_STATES).map((state) => ({
            value: state,
            label: screen?.labels?.[state],
            count: countOf(STATE_STATUSES[state]),
          })),
          total: countOf([...statuses.keys()] as StudyStatus[]),
        };
      }
      case "urgency":
        return { key, label: options.urgency };
      case "period":
        return { key, options: PERIODS.map((value) => ({ value })) };
      // Dimensions d'autres listes (les comptes) : rien à compter ici.
      default:
        return { key };
    }
  });
}

/**
 * La dimension « clinique » de la barre, depuis les comptes par clinique
 * (`getClinicCounts`) : chaque clinique avec son nombre d'examens.
 *
 * @param counts Comptes par clinique.
 */
export function clinicDimension(counts: ClinicCounts): BarDimension {
  return {
    key: "clinic",
    options: counts.clinics.map((row) => ({
      value: row.id,
      label: row.name,
      count: row.count,
    })),
    total: counts.total,
  };
}

/**
 * La dimension « modalité » de la barre, depuis les comptes par groupe
 * (`getModalityCounts`) : chaque groupe, dans l'ordre de l'écran, zéro
 * compris.
 *
 * @param counts Comptes par groupe.
 */
export function modalityDimension(counts: ModalityCounts): BarDimension {
  return {
    key: "modality",
    options: MODALITY_GROUPS.map((group) => ({
      value: group,
      count: counts.byGroup[group],
    })),
    total: counts.total,
  };
}
