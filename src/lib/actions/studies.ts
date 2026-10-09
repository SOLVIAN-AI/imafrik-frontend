"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { apiSend } from "@/lib/api/client";
import { studySchema } from "@/lib/api/contracts";
import { CLINICAL_INFO_MAX_LENGTH } from "@/lib/clinical-info";
import { isDemoMode } from "@/lib/demo/mode";
import { formatCount } from "@/lib/format";
import { getMessages } from "@/i18n/server";

/**
 * Ce que la clinique complète sur un examen après l'envoi.
 *
 * La clinique est la seule à savoir qu'un scanner cérébral est une
 * suspicion d'AVC : sans ce geste, chaque examen arrive en routine et
 * sans indication. Le service n'accepte la modification que du personnel
 * de la clinique émettrice, et seulement tant que le compte-rendu n'est
 * pas signé ; il la trace au journal d'audit.
 */

const clinicalSchema = z.object({
  urgent: z.boolean(),
  clinicalInfo: z.string().trim().max(CLINICAL_INFO_MAX_LENGTH),
});

/** Saisie du formulaire de la fiche d'examen. */
export type ClinicalInput = z.input<typeof clinicalSchema>;

/** Ce que la fiche affiche après l'enregistrement. */
export interface ClinicalSaved {
  urgent: boolean;
  clinicalInfo: string | null;
}

/**
 * Signale une urgence et enregistre le renseignement clinique d'un examen.
 *
 * Les deux champs sont toujours envoyés : le formulaire les montre
 * ensemble, et ce qui est enregistré doit être ce qui est affiché. Un
 * renseignement vidé est effacé (le service enregistre `NULL`).
 *
 * @param studyId Examen concerné.
 * @param input   Urgence et renseignement saisis.
 */
export async function updateStudyClinicalInfo(
  studyId: string,
  input: ClinicalInput,
): Promise<ActionResult<ClinicalSaved>> {
  const { t, locale } = await getMessages();
  const messages = t.clinic.study.clinical;
  const parsed = clinicalSchema.safeParse(input);
  if (!parsed.success) {
    const tooLong =
      typeof input?.clinicalInfo === "string" &&
      input.clinicalInfo.trim().length > CLINICAL_INFO_MAX_LENGTH;
    return {
      ok: false,
      error: tooLong
        ? messages.tooLong(formatCount(CLINICAL_INFO_MAX_LENGTH, locale))
        : t.common.errors.invalidRequest,
      status: 422,
    };
  }
  if (isDemoMode()) return await demoUnavailable(messages.demoAction);
  const invalid = await rejectInvalidIds(studyId);
  if (invalid) return invalid;

  const result = await run(async () => {
    const study = await apiSend(
      `/studies/${encodeURIComponent(studyId)}`,
      "PATCH",
      {
        priority: parsed.data.urgent ? "urgent" : "routine",
        clinical_info: parsed.data.clinicalInfo,
      },
      studySchema,
    );
    return {
      urgent: study.priority === "urgent",
      clinicalInfo: study.clinical_info,
    };
  });
  // L'urgence change l'ordre et l'échéance partout où l'examen s'affiche.
  revalidatePath(`/examens/${studyId}`);
  revalidatePath("/examens");
  revalidatePath("/tableau-de-bord");
  revalidatePath("/worklist");
  return result;
}
