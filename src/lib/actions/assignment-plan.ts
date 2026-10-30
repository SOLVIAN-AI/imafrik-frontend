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
  assignmentPlanSchema,
  modalityGroupSchema,
  weekCopySchema,
} from "@/lib/api/contracts";
import {
  type AssignmentPlan,
  type PlanLineInput,
  isCalendarDay,
  toAssignmentPlan,
} from "@/lib/assignment-plan";
import { clinicViewPath } from "@/lib/clinic-view";
import { demoAssignmentPlan } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Planning d'attribution d'une clinique : il propose le radiologue de
 * chaque examen à attribuer, une personne confirme.
 *
 * Le responsable règle celui de sa clinique active, avec ses propres
 * radiologues (`clinicId` nul) ; l'équipe IMAFRIK celui de toute
 * clinique, radiologues du réseau compris. Le planning se modifie ligne
 * par ligne ; chaque geste rend le planning entier, tel qu'il est devenu.
 */

/**
 * Forme d'une ligne reçue du navigateur : une action serveur est un point
 * d'entrée public, quel que soit le typage. Le service vérifie le reste
 * (radiologue, modalité lue, période).
 */
const day = z.string().refine(isCalendarDay);
const lineInput = z.object({
  radiologistId: z.string(),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  modality: modalityGroupSchema.nullable(),
  startsOn: day.nullable(),
  endsOn: day.nullable(),
});

const base = (clinicId: string | null) =>
  clinicId === null
    ? "/organization/assignment-plan"
    : `/admin/clinics/${encodeURIComponent(clinicId)}/assignment-plan`;

const body = (line: PlanLineInput) => ({
  radiologist_id: line.radiologistId,
  weekdays: line.weekdays,
  starts_at: line.startsAt,
  ends_at: line.endsAt,
  modality_group: line.modality,
  starts_on: line.startsOn,
  ends_on: line.endsOn,
});

/** Les écrans qui montrent le planning, ou le radiologue prévu des examens. */
function revalidate(clinicId: string | null) {
  if (clinicId === null) {
    revalidatePath("/equipe/regles");
    revalidatePath("/examens");
  } else {
    revalidatePath(`/admin/organisations/${clinicId}`);
    // La vue de la clinique, où l'équipe règle aussi son planning.
    revalidatePath(clinicViewPath(clinicId, "/equipe/regles"));
    revalidatePath(clinicViewPath(clinicId, "/examens"));
    revalidatePath("/admin/examens");
    revalidatePath("/worklist");
  }
}

/**
 * Le planning d'une clinique.
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour la
 *                 clinique active du responsable.
 */
export async function getAssignmentPlan(
  clinicId: string | null,
): Promise<ActionResult<AssignmentPlan>> {
  if (isDemoMode()) {
    return {
      ok: true,
      data: toAssignmentPlan(demoAssignmentPlan(clinicId, clinicId === null)),
    };
  }
  if (clinicId !== null) {
    const invalid = await rejectInvalidIds(clinicId);
    if (invalid) return invalid;
  }
  return run(async () =>
    toAssignmentPlan(await apiGet(base(clinicId), assignmentPlanSchema)),
  );
}

async function checked(
  clinicId: string | null,
  line: PlanLineInput,
  ...ids: string[]
): Promise<ActionResult<never> | null> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  if (!lineInput.safeParse(line).success) {
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  return rejectInvalidIds(
    ...(clinicId === null ? [] : [clinicId]),
    line.radiologistId,
    ...ids,
  );
}

/**
 * Ajoute une ligne au planning.
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour le
 *                 responsable.
 * @param line     Ligne à ajouter.
 */
export async function addPlanLine(
  clinicId: string | null,
  line: PlanLineInput,
): Promise<ActionResult<AssignmentPlan>> {
  const refused = await checked(clinicId, line);
  if (refused) return refused;
  const result = await run(async () =>
    toAssignmentPlan(
      await apiSend(
        `${base(clinicId)}/lines`,
        "POST",
        body(line),
        assignmentPlanSchema,
      ),
    ),
  );
  if (result.ok) revalidate(clinicId);
  return result;
}

/**
 * Modifie une ligne du planning.
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour le
 *                 responsable.
 * @param lineId   Ligne à modifier.
 * @param line     Son nouveau contenu.
 */
export async function updatePlanLine(
  clinicId: string | null,
  lineId: string,
  line: PlanLineInput,
): Promise<ActionResult<AssignmentPlan>> {
  const refused = await checked(clinicId, line, lineId);
  if (refused) return refused;
  const result = await run(async () =>
    toAssignmentPlan(
      await apiSend(
        `${base(clinicId)}/lines/${encodeURIComponent(lineId)}`,
        "PUT",
        body(line),
        assignmentPlanSchema,
      ),
    ),
  );
  if (result.ok) revalidate(clinicId);
  return result;
}

/**
 * Retire une ligne du planning.
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour le
 *                 responsable.
 * @param lineId   Ligne à retirer.
 */
export async function removePlanLine(
  clinicId: string | null,
  lineId: string,
): Promise<ActionResult<AssignmentPlan>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  const invalid = await rejectInvalidIds(
    ...(clinicId === null ? [] : [clinicId]),
    lineId,
  );
  if (invalid) return invalid;
  const result = await run(async () =>
    toAssignmentPlan(
      await apiSend(
        `${base(clinicId)}/lines/${encodeURIComponent(lineId)}`,
        "DELETE",
        undefined,
        assignmentPlanSchema,
      ),
    ),
  );
  if (result.ok) revalidate(clinicId);
  return result;
}

/** Ce qu'a donné la recopie d'une semaine. */
export interface WeekCopyResult {
  copied: number;
  skipped: number;
  replaced: number;
  plan: AssignmentPlan;
}

/**
 * Recopie sur une semaine les lignes datées de la semaine précédente.
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour le
 *                 responsable.
 * @param week     Lundi de la semaine visée.
 * @param replace  Confirme le remplacement des lignes datées qu'elle a.
 */
export async function copyPlanWeek(
  clinicId: string | null,
  week: string,
  replace: boolean,
): Promise<ActionResult<WeekCopyResult>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  if (!isCalendarDay(week)) {
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  if (clinicId !== null) {
    const invalid = await rejectInvalidIds(clinicId);
    if (invalid) return invalid;
  }
  const result = await run(async () => {
    const done = await apiSend(
      `${base(clinicId)}/copy-week`,
      "POST",
      { week, replace },
      weekCopySchema,
    );
    return {
      copied: done.copied,
      skipped: done.skipped,
      replaced: done.replaced,
      plan: toAssignmentPlan(done.plan),
    };
  });
  if (result.ok) revalidate(clinicId);
  return result;
}
