"use server";

import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { apiSend } from "@/lib/api/client";
import { API_URL } from "@/lib/api/config";
import { weasisLaunchSchema } from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { isWeasisLaunchUrl } from "@/lib/weasis";
import { getMessages } from "@/i18n/server";

/**
 * Adresse `weasis://` qui ouvre l'examen dans Weasis, sur le poste.
 *
 * Le service vérifie le droit de voir l'examen, trace l'ouverture et émet
 * un code à usage unique de cinq minutes : l'adresse est donc demandée au
 * clic, jamais au chargement de l'écran. Elle n'est remise au navigateur
 * que si elle est bien celle qu'émet le service (`isWeasisLaunchUrl`).
 *
 * @param studyId Examen ouvert.
 * @returns L'adresse à ouvrir, ou un échec affichable.
 */
export async function openInWeasis(
  studyId: string,
): Promise<ActionResult<string>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.reading.weasis.name);
  const invalid = await rejectInvalidIds(studyId);
  if (invalid) return invalid;
  const result = await run(async () => {
    const launch = await apiSend(
      `/studies/${encodeURIComponent(studyId)}/weasis-launch`,
      "POST",
      undefined,
      weasisLaunchSchema,
    );
    return launch.launch_url;
  });
  if (!result.ok) return result;
  if (!isWeasisLaunchUrl(result.data, API_URL, studyId)) {
    console.error(
      "Adresse Weasis renvoyée par le service hors de la forme attendue",
    );
    return { ok: false, error: t.common.errors.unexpected, status: 502 };
  }
  return result;
}
