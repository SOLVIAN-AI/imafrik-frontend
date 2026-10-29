/**
 * Les listes de comptes-rendus, une par rôle : leurs dimensions, les
 * statuts qu'elles peuvent montrer et les états qu'elles proposent.
 *
 * La liste part des examens rendus : c'est l'examen qui porte le
 * contexte (patient, modalité, établissement), et le service le renvoie
 * avec le résumé de son compte-rendu.
 */

import type { StudyStatus } from "@/components/domain/study-status";
import type { DimensionKey, StudyState } from "@/lib/filters/dimensions";
import { LIST_FILTERS } from "@/lib/filters/screens";

/** Une liste de comptes-rendus. */
export interface ReportList {
  keys: readonly DimensionKey[];
  /** Statuts d'examen que la liste peut montrer. */
  statuses: readonly StudyStatus[];
  /** États proposés, s'il y en a. */
  states?: readonly StudyState[];
}

/**
 * - **Le responsable** (et la vue des cliniques) : les comptes-rendus
 *   signés de sa clinique, à télécharger puis téléchargés ;
 * - **le radiologue** : ceux qu'il a signés, par clinique ;
 * - **l'équipe IMAFRIK** : tous, en cours de rédaction compris.
 */
export const REPORT_LISTS = {
  clinic: {
    keys: LIST_FILTERS["comptes-rendus-clinique"],
    statuses: ["reported", "delivered"],
    states: ["ready", "delivered"],
  },
  radiologist: {
    keys: LIST_FILTERS["comptes-rendus-radiologue"],
    statuses: ["reported", "delivered"],
  },
  team: {
    keys: LIST_FILTERS["comptes-rendus-equipe"],
    statuses: ["in_progress", "reported", "delivered"],
    states: ["reading", "ready", "delivered"],
  },
} as const satisfies Record<string, ReportList>;

/** Un rôle qui lit des comptes-rendus. */
export type ReportReader = keyof typeof REPORT_LISTS;
