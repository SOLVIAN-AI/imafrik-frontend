import "server-only";

import { z } from "zod";

import type {
  AssignmentPortal,
  PlannedRadiologist,
} from "@/lib/actions/assignment";
import { apiSend } from "@/lib/api/client";
import { studyPlanSchema } from "@/lib/api/contracts";
import { demoPlanned } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";

/** Examens d'une page, au plus, comme le service. */
const MAX_STUDIES = 200;

/**
 * Le radiologue que le planning de leur clinique prévoit, pour chacun de
 * ces examens à attribuer : les listes (« À lire », « Examens », vue des
 * cliniques) le nomment sur la ligne, avec « Confirmer ».
 *
 * Un appel pour toute la page, jamais un par ligne. Une panne du service
 * n'empêche pas la liste de s'afficher : les lignes n'ont alors personne
 * de prévu, et « Attribuer » reste.
 *
 * @param portal   Portail de l'appelant : le responsable ne lit que les
 *                 examens de sa clinique.
 * @param studyIds Examens à attribuer de la page.
 * @returns Les radiologues prévus de chaque examen qui en a : un seul, il
 *          est prévu ; plusieurs, le planning hésite.
 */
export async function getPlanned(
  portal: AssignmentPortal,
  studyIds: readonly string[],
): Promise<Record<string, PlannedRadiologist[]>> {
  const ids = [...new Set(studyIds)].slice(0, MAX_STUDIES);
  if (ids.length === 0) return {};
  if (isDemoMode()) return demoPlanned(ids);
  try {
    const rows = await apiSend(
      `/${portal === "clinic" ? "clinic" : "admin"}/studies/plan`,
      "POST",
      { study_ids: ids },
      z.array(studyPlanSchema),
    );
    return Object.fromEntries(
      rows
        .filter((row) => row.planned.length > 0)
        .map((row) => [
          row.study_id,
          row.planned.map((one) => ({
            profileId: one.profile_id,
            name: one.name,
          })),
        ]),
    );
  } catch (error) {
    console.error("Radiologues prévus indisponibles", error);
    return {};
  }
}
