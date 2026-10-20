"use server";

import { TOUR_IDS, type TourId } from "@/components/tour/tours";
import { getMessages } from "@/i18n/server";
import type { ActionResult } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { createClient } from "@/lib/supabase/server";

/**
 * Note qu'une visite guidée est faite, sur le profil de l'utilisateur.
 *
 * Passe par la fonction `mark_tour_completed` de la base, seule à pouvoir
 * écrire `profiles.tours_completed` : elle n'ajoute qu'à la ligne de
 * l'appelant, sans doublon. La visite ne revient alors sur aucun de ses
 * appareils. En démonstration, rien n'est écrit : l'appareil seul retient
 * la visite (`components/tour/storage.ts`).
 *
 * @param tour Identifiant de la visite : l'une de celles que l'application
 *             connaît, rien d'autre.
 * @returns Les visites faites, telles que la base les tient désormais.
 */
export async function completeTour(
  tour: unknown,
): Promise<ActionResult<string[]>> {
  if (typeof tour !== "string" || !TOUR_IDS.includes(tour as TourId)) {
    const { t } = await getMessages();
    return { ok: false, error: t.common.errors.invalidId, status: 422 };
  }
  if (isDemoMode()) return { ok: true, data: [tour] };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_tour_completed", {
    p_tour: tour,
  });
  if (error) {
    console.error("Visite guidée non enregistrée", error);
    const { t } = await getMessages();
    return { ok: false, error: t.common.errors.unexpected, status: 503 };
  }
  return {
    ok: true,
    data: Array.isArray(data)
      ? data.filter((entry): entry is string => typeof entry === "string")
      : [tour],
  };
}
