import "server-only";

import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import { studyEligibilitySchema } from "@/lib/api/contracts";
import { demoEligibility } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";

/** Pourquoi aucun radiologue ne peut recevoir un examen. */
export type NoCandidateReason = NonNullable<
  z.output<typeof studyEligibilitySchema>["reason"]
>;

/** Qui peut recevoir un examen de la file de répartition. */
export interface Eligibility {
  /** Radiologues qui peuvent le recevoir : ceux de la fenêtre d'attribution. */
  candidates: number;
  /** Sans aucun candidat, pourquoi. */
  reason: NoCandidateReason | null;
}

/** Examens d'une page, au plus, comme le service. */
const MAX_STUDIES = 200;

/**
 * Qui peut recevoir chacun de ces examens : la file de répartition de
 * l'équipe IMAFRIK dit sur la ligne d'un examen qu'aucun radiologue ne
 * peut le recevoir, et pourquoi, sans ouvrir la fenêtre d'attribution.
 *
 * Un appel pour toute la page, jamais un par ligne. Une panne du service
 * n'empêche pas la file de s'afficher : les lignes gardent alors leur
 * bouton « Attribuer », et la fenêtre dit le reste.
 *
 * @param studyIds Examens à attribuer de la page.
 * @returns L'éligibilité de chaque examen connu, par identifiant.
 */
export async function getEligibility(
  studyIds: readonly string[],
): Promise<Record<string, Eligibility>> {
  const ids = [...new Set(studyIds)].slice(0, MAX_STUDIES);
  if (ids.length === 0) return {};
  if (isDemoMode()) {
    return Object.fromEntries(
      ids.flatMap((id) => {
        const found = demoEligibility(id);
        return found ? [[id, found]] : [];
      }),
    );
  }
  try {
    const rows = await apiSend(
      "/admin/studies/eligibility",
      "POST",
      { study_ids: ids },
      z.array(studyEligibilitySchema),
    );
    return Object.fromEntries(
      rows.map((row) => [
        row.study_id,
        { candidates: row.candidates, reason: row.reason },
      ]),
    );
  } catch (error) {
    console.error("Éligibilité de la file indisponible", error);
    return {};
  }
}
