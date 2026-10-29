/**
 * Les filtres d'une liste d'examens, entre l'adresse, le service et la
 * barre : la requête que les filtres lus imposent, et les dimensions de la
 * barre tirées des nombres que compte le service.
 *
 * Chaque liste d'examens passe par ici : un filtre ajouté au registre
 * (`dimensions.ts`) se transmet au service et se compte au même endroit
 * pour toutes.
 */

import type { ModalityGroup } from "@/lib/api/contracts";
import type {
  ClinicCounts,
  ModalityCounts,
  StudyQuery,
} from "@/lib/data/studies";
import type { ActiveFilters, BarDimension } from "@/lib/filters/dimensions";
import { MODALITY_GROUPS } from "@/lib/modalities";

/**
 * La part de la requête au service que les filtres imposent.
 *
 * @param filters Filtres lus dans l'adresse (`readFilters`).
 */
export function studyQuery(
  filters: ActiveFilters,
): Pick<StudyQuery, "clinic" | "modalityGroup" | "priority"> {
  return {
    ...(filters.clinic && { clinic: filters.clinic }),
    ...(filters.modality && {
      modalityGroup: filters.modality as ModalityGroup,
    }),
    ...(filters.urgency && { priority: "urgent" as const }),
  };
}

/**
 * La dimension « clinique » de la barre : chaque clinique avec son nombre
 * d'examens, compté par le service avec les autres filtres.
 *
 * @param counts Comptes par clinique (`getClinicCounts`).
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
 * La dimension « modalité » de la barre : chaque groupe, dans l'ordre de
 * l'écran, avec son nombre d'examens, zéro compris.
 *
 * @param counts Comptes par groupe (`getModalityCounts`).
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
