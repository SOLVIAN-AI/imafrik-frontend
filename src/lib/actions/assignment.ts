"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { apiGet, apiSend } from "@/lib/api/client";
import {
  type ApiAssignmentState,
  assignmentStateSchema,
} from "@/lib/api/contracts";
import { demoAssignment } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Attribution d'un examen à un radiologue par l'équipe IMAFRIK.
 *
 * L'examen est réservé au radiologue choisi : lui seul peut le prendre en
 * charge, et il est prévenu par courriel. Le service ne propose et
 * n'accepte que les radiologues qui verraient l'examen ; il exige une
 * confirmation avant d'effacer un brouillon commencé (409).
 */

/** Radiologue à qui l'examen peut être attribué. */
export interface AssignmentCandidate {
  profileId: string;
  name: string;
  organizationName: string;
  /** Libéral : lit la clinique par un groupe sous contrat. */
  viaPool: boolean;
  /** Examens qu'il détient déjà sans les avoir signés. */
  openStudies: number;
}

/** Attribution d'un examen, telle qu'elle est. */
export interface AssignmentState {
  status: "received" | "assigned" | "in_progress" | "reported" | "delivered";
  assignedTo: string | null;
  assignedToName: string | null;
  /** Attribution par l'équipe ; `null` si le radiologue l'a prise lui-même. */
  assignedAt: string | null;
  /** Le titulaire a commencé à rédiger : le réattribuer efface son texte. */
  draftInProgress: boolean;
  candidates: AssignmentCandidate[];
  /** Après une attribution : le radiologue a-t-il été prévenu ? */
  notified: boolean | null;
}

function toState(row: ApiAssignmentState): AssignmentState {
  return {
    status: row.status,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    assignedAt: row.assigned_at,
    draftInProgress: row.draft_in_progress,
    candidates: row.candidates.map((candidate) => ({
      profileId: candidate.profile_id,
      name: candidate.name,
      organizationName: candidate.organization_name,
      viaPool: candidate.via_pool,
      openStudies: candidate.open_studies,
    })),
    notified: row.notified ?? null,
  };
}

const path = (studyId: string) =>
  `/admin/studies/${encodeURIComponent(studyId)}/assignment`;

/** Les listes où l'attribution d'un examen se voit. */
function revalidateLists(studyId: string) {
  revalidatePath("/admin/examens");
  revalidatePath(`/lecture/${studyId}`);
}

/**
 * Titulaire de l'examen et radiologues à qui l'attribuer.
 *
 * @param studyId Examen.
 */
export async function getAssignment(
  studyId: string,
): Promise<ActionResult<AssignmentState>> {
  const { t } = await getMessages();
  // En démonstration, la fenêtre montre le titulaire et les radiologues
  // du jeu ; attribuer reste indisponible, comme tout geste de l'équipe.
  if (isDemoMode()) {
    const demo = demoAssignment(studyId);
    return demo
      ? { ok: true, data: toState(demo) }
      : { ok: false, error: t.common.errors.unexpected, status: 404 };
  }
  const invalid = await rejectInvalidIds(studyId);
  if (invalid) return invalid;
  return run(async () =>
    toState(await apiGet(path(studyId), assignmentStateSchema)),
  );
}

/**
 * Attribue l'examen au radiologue choisi, ou le lui réattribue.
 *
 * @param studyId       Examen.
 * @param radiologistId Radiologue choisi.
 * @param discardDraft  Confirme l'effacement du brouillon du titulaire.
 */
export async function assignStudy(
  studyId: string,
  radiologistId: string,
  discardDraft: boolean,
): Promise<ActionResult<AssignmentState>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.admin.demoActions.assignment);
  const invalid = await rejectInvalidIds(studyId, radiologistId);
  if (invalid) return invalid;
  const result = await run(async () =>
    toState(
      await apiSend(
        path(studyId),
        "PUT",
        { radiologist_id: radiologistId, discard_draft: discardDraft },
        assignmentStateSchema,
      ),
    ),
  );
  if (result.ok) revalidateLists(studyId);
  return result;
}

/**
 * Remet l'examen dans la file commune.
 *
 * @param studyId      Examen.
 * @param discardDraft Confirme l'effacement du brouillon du titulaire.
 */
export async function unassignStudy(
  studyId: string,
  discardDraft: boolean,
): Promise<ActionResult<AssignmentState>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.admin.demoActions.assignment);
  const invalid = await rejectInvalidIds(studyId);
  if (invalid) return invalid;
  const result = await run(async () =>
    toState(
      await apiSend(
        `${path(studyId)}${discardDraft ? "?discard_draft=true" : ""}`,
        "DELETE",
        undefined,
        assignmentStateSchema,
      ),
    ),
  );
  if (result.ok) revalidateLists(studyId);
  return result;
}
