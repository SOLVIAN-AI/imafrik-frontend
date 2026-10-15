"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/lib/api/client";
import { API_URL } from "@/lib/api/config";
import { documentTokenSchema, practiceStatusSchema } from "@/lib/api/contracts";
import { type ActionResult, demoUnavailable, run } from "@/lib/actions/result";
import type { UploadGrant } from "@/lib/actions/uploads";
import type { PracticeStatus } from "@/lib/credentials";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Gestes du radiologue sur son habilitation : déclarer son exercice,
 * déposer ses justificatifs.
 */

/**
 * Déclare l'exercice du radiologue : inscrit à l'Ordre, ou résident.
 *
 * Changer d'exercice défait l'habilitation : les justificatifs acceptés ne
 * valent que pour l'exercice déclaré. Redéclarer le même ne change rien.
 *
 * @param status Exercice choisi.
 */
export async function declarePractice(
  status: PracticeStatus,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = practiceStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: t.common.errors.invalidRequest, status: 422 };
  }
  if (isDemoMode()) return demoUnavailable(t.credentials.demoAction);
  const result = await run(async () => {
    await apiSend("/me", "PATCH", { practice_status: parsed.data });
    return undefined;
  });
  revalidatePath("/", "layout");
  return result;
}

/**
 * Obtient un jeton de dépôt de justificatif.
 *
 * Le navigateur envoie le fichier directement à l'API : un justificatif
 * peut peser 10 Mo, au-delà de ce que l'hébergement de l'application
 * accepte. Le jeton ne vaut que pour les justificatifs du radiologue, dix
 * minutes.
 */
export async function getDocumentGrant(): Promise<ActionResult<UploadGrant>> {
  if (isDemoMode() || !API_URL) {
    const { t } = await getMessages();
    return await demoUnavailable(t.credentials.demoAction);
  }
  return run(async () => {
    const grant = await apiSend(
      "/me/credential-documents/token",
      "POST",
      undefined,
      documentTokenSchema,
    );
    return {
      endpoint: `${API_URL}/me/credential-documents`,
      token: grant.token,
      expiresIn: grant.expires_in,
    };
  });
}

/**
 * Après un dépôt fait par le navigateur : les écrans qui affichent l'état
 * d'habilitation se relisent.
 */
export async function refreshCredentials(): Promise<void> {
  revalidatePath("/", "layout");
}
