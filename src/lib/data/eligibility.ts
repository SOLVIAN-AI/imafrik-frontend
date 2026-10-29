import "server-only";

import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import type { Eligibility } from "@/lib/assignment-blocker";
import { studyEligibilitySchema } from "@/lib/api/contracts";
import { demoEligibility } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";

export type { Eligibility, NoCandidateReason } from "@/lib/assignment-blocker";

/** Examens d'une page, au plus, comme le service. */
const MAX_STUDIES = 200;

/**
 * Qui peut recevoir chacun de ces examens : les listes de l'équipe
 * IMAFRIK (« À lire », « Examens », vue des cliniques) disent sur la ligne
 * d'un examen que personne ne peut le recevoir, et pourquoi ; sa fenêtre
 * d'attribution le lit aussi, pour dire quoi faire. Le bouton
 * « Attribuer » reste dans tous les cas.
 *
 * Un appel pour toute la page, jamais un par ligne. Une panne du service
 * n'empêche pas la liste de s'afficher : les lignes n'ont alors pas de
 * mention, et la fenêtre, qui voit la liste vide des radiologues, le dit.
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
