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
import { CLINIC_VIEW_ROOT } from "@/lib/clinic-view";
import {
  type ApiAssignmentState,
  type ApiPriorCandidate,
  assignmentStateSchema,
  priorCandidateSchema,
} from "@/lib/api/contracts";
import { demoAssignment, demoPriorCandidates } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Attribution d'un examen à un radiologue.
 *
 * Deux portails, une même fenêtre : le responsable de la clinique
 * attribue à ses propres radiologues (`/clinic/studies/…`), l'équipe
 * IMAFRIK aux radiologues du réseau (`/admin/studies/…`). Le service ne
 * propose et n'accepte que les radiologues qui peuvent recevoir l'examen
 * (habilités, rattachés, lecteurs de sa modalité) et vérifie le portail
 * de l'appelant : le choix du portail ici ne décide que de l'adresse.
 *
 * L'examen est réservé au radiologue choisi : lui seul le voit et peut le
 * prendre en charge, et il est prévenu par courriel. Les antériorités du
 * patient cochées dans la fenêtre lui sont partagées, en lecture seule ;
 * rien ne l'est d'office. Le service exige une confirmation avant
 * d'effacer un brouillon commencé (409).
 */

/** Portail d'où l'on attribue. */
export type AssignmentPortal = "clinic" | "team";

/** Radiologue à qui l'examen peut être attribué. */
export interface AssignmentCandidate {
  profileId: string;
  name: string;
  organizationName: string;
  /** Radiologue du réseau : lit la clinique par un groupe sous contrat. */
  viaPool: boolean;
  /** Examens qu'il détient déjà sans les avoir signés. */
  openStudies: number;
}

/** Antériorité partagée avec le titulaire, pour cet examen. */
export interface PriorShare {
  id: string;
  priorStudyId: string;
  profileId: string;
  studyDate: string;
  modality: string | null;
  bodyPart: string | null;
  hasSignedReport: boolean;
  sharedAt: string;
}

/** Attribution d'un examen, telle qu'elle est. */
export interface AssignmentState {
  status: "received" | "assigned" | "in_progress" | "reported" | "delivered";
  urgent: boolean;
  modality: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  /** Instant de l'attribution ; `null` sans titulaire. */
  assignedAt: string | null;
  /** Règle d'attribution qui l'a confié ; `null` pour une personne. */
  assignedByRule: "modality" | "schedule" | null;
  /** Le titulaire a commencé à rédiger : le réattribuer efface son texte. */
  draftInProgress: boolean;
  candidates: AssignmentCandidate[];
  priorShares: PriorShare[];
  /** Après une attribution : le radiologue a-t-il été prévenu ? */
  notified: boolean | null;
}

/** Examen antérieur du patient, proposé au partage. */
export interface PriorCandidate {
  studyId: string;
  /** `certain` : même identifiant ; `probable` : même nom et naissance, à vérifier. */
  match: "certain" | "probable";
  studyDate: string;
  modality: string | null;
  bodyPart: string | null;
  patientName: string | null;
  patientId: string | null;
  patientBirthDate: string | null;
  hasSignedReport: boolean;
  /** Déjà partagé, pour cet examen, avec le radiologue considéré. */
  shared: boolean;
}

function toState(row: ApiAssignmentState): AssignmentState {
  return {
    status: row.status,
    urgent: row.priority === "urgent",
    modality: row.modality,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    assignedAt: row.assigned_at,
    assignedByRule: row.assigned_by_rule ?? null,
    draftInProgress: row.draft_in_progress,
    candidates: row.candidates.map((candidate) => ({
      profileId: candidate.profile_id,
      name: candidate.name,
      organizationName: candidate.organization_name,
      viaPool: candidate.via_pool,
      openStudies: candidate.open_studies,
    })),
    priorShares: row.prior_shares.map((share) => ({
      id: share.id,
      priorStudyId: share.prior_study_id,
      profileId: share.profile_id,
      studyDate: share.study_date,
      modality: share.modality,
      bodyPart: share.body_part,
      hasSignedReport: share.has_signed_report,
      sharedAt: share.shared_at,
    })),
    notified: row.notified ?? null,
  };
}

function toCandidate(row: ApiPriorCandidate): PriorCandidate {
  return {
    studyId: row.study_id,
    match: row.match,
    studyDate: row.study_date,
    modality: row.modality,
    bodyPart: row.body_part,
    patientName: row.patient_name,
    patientId: row.patient_id_local,
    patientBirthDate: row.patient_birthdate,
    hasSignedReport: row.has_signed_report,
    shared: row.shared,
  };
}

const base = (portal: AssignmentPortal, studyId: string) =>
  `/${portal === "clinic" ? "clinic" : "admin"}/studies/${encodeURIComponent(studyId)}`;

/** Les écrans où l'attribution d'un examen se voit. */
function revalidateScreens(studyId: string) {
  revalidatePath("/admin/examens");
  revalidatePath("/examens");
  revalidatePath(`/examens/${studyId}`);
  revalidatePath(`/lecture/${studyId}`);
  revalidatePath("/tableau-de-bord");
  // La file de répartition de l'équipe (« Lectures › À lire »).
  revalidatePath("/worklist");
  // La vue des cliniques, où l'équipe IMAFRIK attribue aussi : tous ses
  // écrans, quelle que soit la clinique.
  revalidatePath(`${CLINIC_VIEW_ROOT}/[clinicId]`, "layout");
}

/**
 * Titulaire de l'examen, radiologues à qui l'attribuer, antériorités partagées.
 *
 * @param portal  Portail de l'appelant.
 * @param studyId Examen.
 */
export async function getAssignment(
  portal: AssignmentPortal,
  studyId: string,
): Promise<ActionResult<AssignmentState>> {
  const { t } = await getMessages();
  // En démonstration, la fenêtre montre le titulaire et les radiologues
  // du jeu ; attribuer reste indisponible.
  if (isDemoMode()) {
    const demo = demoAssignment(studyId);
    return demo
      ? { ok: true, data: toState(demo) }
      : { ok: false, error: t.common.errors.unexpected, status: 404 };
  }
  const invalid = await rejectInvalidIds(studyId);
  if (invalid) return invalid;
  return run(async () =>
    toState(
      await apiGet(
        `${base(portal, studyId)}/assignment`,
        assignmentStateSchema,
      ),
    ),
  );
}

/**
 * Examens antérieurs du patient dans la clinique : certains, puis probables.
 *
 * @param portal        Portail de l'appelant.
 * @param studyId       Examen à attribuer.
 * @param radiologistId Radiologue considéré : marque ce qui lui est déjà partagé.
 */
export async function getPriorCandidates(
  portal: AssignmentPortal,
  studyId: string,
  radiologistId: string | null,
): Promise<ActionResult<PriorCandidate[]>> {
  if (isDemoMode()) {
    return { ok: true, data: demoPriorCandidates(studyId).map(toCandidate) };
  }
  const invalid = await rejectInvalidIds(
    studyId,
    ...(radiologistId ? [radiologistId] : []),
  );
  if (invalid) return invalid;
  const query = radiologistId
    ? `?radiologist_id=${encodeURIComponent(radiologistId)}`
    : "";
  return run(async () =>
    (
      await apiGet(
        `${base(portal, studyId)}/prior-candidates${query}`,
        z.array(priorCandidateSchema),
      )
    ).map(toCandidate),
  );
}

/**
 * Attribue l'examen au radiologue choisi, ou le lui réattribue, et lui
 * partage les antériorités cochées.
 *
 * @param portal        Portail de l'appelant.
 * @param studyId       Examen.
 * @param radiologistId Radiologue choisi.
 * @param discardDraft  Confirme l'effacement du brouillon du titulaire.
 * @param priorIds      Antériorités cochées.
 */
export async function assignStudy(
  portal: AssignmentPortal,
  studyId: string,
  radiologistId: string,
  discardDraft: boolean,
  priorIds: string[] = [],
): Promise<ActionResult<AssignmentState>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  const invalid = await rejectInvalidIds(studyId, radiologistId, ...priorIds);
  if (invalid) return invalid;
  const result = await run(async () =>
    toState(
      await apiSend(
        `${base(portal, studyId)}/assignment`,
        "PUT",
        {
          radiologist_id: radiologistId,
          discard_draft: discardDraft,
          share_prior_ids: priorIds,
        },
        assignmentStateSchema,
      ),
    ),
  );
  if (result.ok) revalidateScreens(studyId);
  return result;
}

/**
 * Retire l'attribution : l'examen attend une nouvelle attribution.
 *
 * @param portal       Portail de l'appelant.
 * @param studyId      Examen.
 * @param discardDraft Confirme l'effacement du brouillon du titulaire.
 */
export async function unassignStudy(
  portal: AssignmentPortal,
  studyId: string,
  discardDraft: boolean,
): Promise<ActionResult<AssignmentState>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  const invalid = await rejectInvalidIds(studyId);
  if (invalid) return invalid;
  const result = await run(async () =>
    toState(
      await apiSend(
        `${base(portal, studyId)}/assignment${discardDraft ? "?discard_draft=true" : ""}`,
        "DELETE",
        undefined,
        assignmentStateSchema,
      ),
    ),
  );
  if (result.ok) revalidateScreens(studyId);
  return result;
}

/**
 * Partage des antériorités avec le titulaire actuel de l'examen.
 *
 * @param portal   Portail de l'appelant.
 * @param studyId  Examen.
 * @param priorIds Antériorités cochées.
 */
export async function sharePriors(
  portal: AssignmentPortal,
  studyId: string,
  priorIds: string[],
): Promise<ActionResult<AssignmentState>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  const invalid = await rejectInvalidIds(studyId, ...priorIds);
  if (invalid) return invalid;
  const result = await run(async () =>
    toState(
      await apiSend(
        `${base(portal, studyId)}/prior-shares`,
        "POST",
        { prior_ids: priorIds },
        assignmentStateSchema,
      ),
    ),
  );
  if (result.ok) revalidateScreens(studyId);
  return result;
}

/**
 * Retire une antériorité partagée : le radiologue ne la voit plus, et le
 * viewer qu'il tenait ouvert dessus se ferme.
 *
 * @param portal  Portail de l'appelant.
 * @param studyId Examen.
 * @param shareId Partage à retirer.
 */
export async function revokePriorShare(
  portal: AssignmentPortal,
  studyId: string,
  shareId: string,
): Promise<ActionResult<AssignmentState>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  const invalid = await rejectInvalidIds(studyId, shareId);
  if (invalid) return invalid;
  const result = await run(async () =>
    toState(
      await apiSend(
        `${base(portal, studyId)}/prior-shares/${encodeURIComponent(shareId)}`,
        "DELETE",
        undefined,
        assignmentStateSchema,
      ),
    ),
  );
  if (result.ok) revalidateScreens(studyId);
  return result;
}
