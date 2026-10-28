"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { apiGet, apiSend } from "@/lib/api/client";
import {
  assignmentRulesSchema,
  modalityGroupSchema,
} from "@/lib/api/contracts";
import {
  type AssignmentRules,
  type ModalityDesignation,
  type RuleSlot,
  toAssignmentRules,
} from "@/lib/assignment-rules";
import { demoAssignmentRules } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Règles d'attribution d'une clinique : le radiologue de chaque modalité
 * et le planning de la semaine.
 *
 * Le responsable règle celles de sa clinique active, avec ses propres
 * radiologues (`clinicId` nul) ; l'équipe IMAFRIK celles de toute
 * clinique, radiologues du réseau compris. Les règles se remplacent en
 * entier : le service refuse un enregistrement fait sur une version
 * dépassée (un autre responsable les a modifiées entre-temps).
 */

/**
 * Forme des règles reçues du navigateur : une action serveur est un point
 * d'entrée public, quel que soit le typage. Le service vérifie le reste
 * (jours, heures, radiologues).
 */
const rulesInput = z.object({
  version: z.string(),
  slots: z.array(
    z.object({
      radiologistId: z.string(),
      weekdays: z.array(z.number().int()),
      startsAt: z.string().nullable(),
      endsAt: z.string().nullable(),
    }),
  ),
  modalities: z.array(
    z.object({ group: modalityGroupSchema, radiologistId: z.string() }),
  ),
});

const path = (clinicId: string | null) =>
  clinicId === null
    ? "/organization/assignment-rules"
    : `/admin/clinics/${encodeURIComponent(clinicId)}/assignment-rules`;

/**
 * Les règles d'une clinique.
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour la
 *                 clinique active du responsable.
 */
export async function getAssignmentRules(
  clinicId: string | null,
): Promise<ActionResult<AssignmentRules>> {
  if (isDemoMode()) {
    return {
      ok: true,
      data: toAssignmentRules(demoAssignmentRules(clinicId, clinicId === null)),
    };
  }
  if (clinicId !== null) {
    const invalid = await rejectInvalidIds(clinicId);
    if (invalid) return invalid;
  }
  return run(async () =>
    toAssignmentRules(await apiGet(path(clinicId), assignmentRulesSchema)),
  );
}

/**
 * Remplace les règles d'une clinique.
 *
 * @param clinicId   Clinique, pour l'équipe IMAFRIK ; `null` pour la
 *                   clinique active du responsable.
 * @param version    Version lue avant la modification.
 * @param slots      Planning complet, dans l'ordre de l'écran.
 * @param modalities Radiologue de chaque modalité ; une modalité absente
 *                   n'en a plus.
 */
export async function saveAssignmentRules(
  clinicId: string | null,
  version: string,
  slots: RuleSlot[],
  modalities: ModalityDesignation[],
): Promise<ActionResult<AssignmentRules>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  if (!rulesInput.safeParse({ version, slots, modalities }).success) {
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  const invalid = await rejectInvalidIds(
    ...(clinicId === null ? [] : [clinicId]),
    ...slots.map((slot) => slot.radiologistId),
    ...modalities.map((rule) => rule.radiologistId),
  );
  if (invalid) return invalid;
  const result = await run(async () =>
    toAssignmentRules(
      await apiSend(
        path(clinicId),
        "PUT",
        {
          version,
          slots: slots.map((slot) => ({
            radiologist_id: slot.radiologistId,
            weekdays: slot.weekdays,
            starts_at: slot.startsAt,
            ends_at: slot.endsAt,
          })),
          modalities: modalities.map((rule) => ({
            group: rule.group,
            radiologist_id: rule.radiologistId,
          })),
        },
        assignmentRulesSchema,
      ),
    ),
  );
  if (result.ok) {
    revalidatePath(
      clinicId === null ? "/equipe/regles" : `/admin/organisations/${clinicId}`,
    );
  }
  return result;
}
