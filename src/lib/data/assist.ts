import "server-only";

import { apiGet } from "@/lib/api/client";
import { sessionInfoSchema } from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";

/**
 * Dit si la relecture par IA est offerte à l'utilisateur.
 *
 * C'est le service qui tranche (`GET /me`) : l'IA doit être active pour
 * la plateforme **et** pour l'organisation active. L'éditeur n'affiche la
 * fonction que dans ce cas, plutôt qu'un bouton voué au refus.
 *
 * Une fonction facultative ne doit jamais empêcher d'ouvrir un examen :
 * si le service ne répond pas, la réponse est non. La démonstration n'a
 * pas de modèle derrière elle : non également.
 */
export async function isAiReviewAvailable(): Promise<boolean> {
  if (isDemoMode()) return false;
  try {
    return (await apiGet("/me", sessionInfoSchema)).ai_review;
  } catch {
    return false;
  }
}
