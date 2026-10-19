import "server-only";

import {
  EMPTY_REPORT_SECTIONS,
  type ReportSections,
} from "@/components/editor/sections";
import { getMessages } from "@/i18n/server";
import { ApiError, apiFetch, apiGet } from "@/lib/api/client";
import {
  trainingCaseDetailSchema,
  trainingCaseSchema,
  traineeProgressSchema,
  viewerTokenSchema,
  type ApiTrainingAttempt,
  type ApiTrainingCase,
} from "@/lib/api/contracts";
import { pickSections } from "@/lib/data/reports";
import type { Study } from "@/lib/data/studies";
import {
  DEMO_TRAINING_ATTEMPTS,
  DEMO_TRAINING_CASES,
} from "@/lib/demo/training";
import { isDemoMode } from "@/lib/demo/mode";
import type { Locale } from "@/lib/i18n/locale";
import { isConfiguredViewer } from "@/lib/security/urls";

/**
 * L'espace de formation, tel que l'interface le manipule.
 *
 * Trois examens réels anonymisés, ouverts dans le vrai écran de lecture :
 * on y prend en charge, rédige, signe et télécharge un PDF spécimen, sans
 * jamais toucher un patient (docs/formation.md du backend). Rien ici ne
 * lit ni n'écrit un examen ou un compte-rendu réels : le service garde
 * les exercices dans leurs propres tables.
 */

/** État d'un exercice pour son auteur. */
export type TrainingState = "todo" | "draft" | "submitted";

/** Un cas du catalogue, avec l'état de l'exercice de l'utilisateur. */
export interface TrainingCase {
  id: string;
  slug: string;
  position: number;
  modality: string;
  bodyPart: string | null;
  /** Séries et images de l'étude, relevées à son dépôt dans le PACS. */
  seriesCount: number;
  instanceCount: number;
  title: string;
  indication: string;
  source: { name: string; license: string; url: string; doi: string | null };
  state: TrainingState;
  attemptId: string | null;
  submittedAt: Date | null;
  hasReference: boolean;
  /** Radiologue qui a relu le contexte clinique. */
  reviewedBy: string | null;
  /** Visible de tous ; sinon, en relecture, pour l'équipe IMAFRIK seule. */
  published: boolean;
}

/** Addendum d'exercice. */
export interface TrainingAddendum {
  body: string;
  createdAt: Date;
}

/** Exercice de l'utilisateur sur un cas. */
export interface TrainingAttempt {
  id: string;
  caseId: string;
  sections: ReportSections;
  version: number;
  submittedAt: Date | null;
  addenda: TrainingAddendum[];
  /** Corrigé, montré une fois l'exercice signé, s'il existe. */
  reference: {
    sections: ReportSections;
    author: string;
    validatedAt: Date;
  } | null;
}

/** Avancement d'un utilisateur, pour l'équipe IMAFRIK. */
export interface TraineeProgress {
  submitted: string[];
  inProgress: string[];
}

/** Traduit un cas depuis la forme de l'API. */
export function toTrainingCase(row: ApiTrainingCase): TrainingCase {
  return {
    id: row.id,
    slug: row.slug,
    position: row.position,
    modality: row.modality,
    bodyPart: row.body_part,
    seriesCount: row.series_count ?? 0,
    instanceCount: row.instance_count ?? 0,
    title: row.title,
    indication: row.indication,
    source: row.source,
    state: row.state,
    attemptId: row.attempt_id,
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : null,
    hasReference: row.has_reference,
    reviewedBy: row.reviewed_by,
    published: row.published,
  };
}

/** Traduit un exercice depuis la forme de l'API. */
export function toTrainingAttempt(row: ApiTrainingAttempt): TrainingAttempt {
  return {
    id: row.id,
    caseId: row.case_id,
    sections: { ...EMPTY_REPORT_SECTIONS, ...pickSections(row.sections) },
    version: row.version,
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : null,
    addenda: row.addenda.map((item) => ({
      body: item.body,
      createdAt: new Date(item.created_at),
    })),
    reference: row.reference
      ? {
          sections: {
            ...EMPTY_REPORT_SECTIONS,
            ...pickSections(row.reference.sections),
          },
          author: row.reference.author,
          validatedAt: new Date(row.reference.validated_at),
        }
      : null,
  };
}

/** Exercices de l'utilisateur, dans l'ordre de la liste. */
export async function listTrainingCases(): Promise<TrainingCase[]> {
  if (isDemoMode()) return DEMO_TRAINING_CASES;
  const rows = await apiGet("/training/cases", trainingCaseSchema.array());
  return rows.map(toTrainingCase);
}

/**
 * Un cas et l'exercice de l'utilisateur.
 *
 * @returns `null` si le cas n'existe pas ou n'est pas à sa portée.
 */
export async function getTrainingCase(slug: string): Promise<{
  trainingCase: TrainingCase;
  attempt: TrainingAttempt | null;
} | null> {
  if (isDemoMode()) {
    const trainingCase = DEMO_TRAINING_CASES.find((c) => c.slug === slug);
    if (!trainingCase) return null;
    return {
      trainingCase,
      attempt: trainingCase.attemptId
        ? (DEMO_TRAINING_ATTEMPTS[trainingCase.attemptId] ?? null)
        : null,
    };
  }
  const detail = await apiGet(
    `/training/cases/${encodeURIComponent(slug)}`,
    trainingCaseDetailSchema,
    { notFoundAsNull: true },
  );
  if (!detail) return null;
  return {
    trainingCase: toTrainingCase(detail.case),
    attempt: detail.attempt ? toTrainingAttempt(detail.attempt) : null,
  };
}

/**
 * Adresse du viewer pour l'étude d'un cas, avec un jeton de quinze
 * minutes limité à cette étude.
 *
 * @returns L'adresse, ou `null` en démonstration ou si le jeton n'a pu
 *          être obtenu : le volet d'images le dit.
 */
export async function getTrainingViewerUrl(
  slug: string,
): Promise<string | null> {
  if (isDemoMode()) return null;
  try {
    const response = await apiFetch(
      `/training/cases/${encodeURIComponent(slug)}/viewer-token`,
      { method: "POST" },
    );
    const url = viewerTokenSchema.parse(await response.json()).viewer_url;
    if (!isConfiguredViewer(url, process.env.NEXT_PUBLIC_VIEWER_URL)) {
      console.error(
        "Viewer renvoyé par le service hors de l’origine configurée",
      );
      return null;
    }
    return url;
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404))
      console.error("Jeton de visualisation d’un exercice indisponible", error);
    return null;
  }
}

/**
 * Avancement de chacun, par profil, pour l'équipe IMAFRIK.
 *
 * Une panne de ce seul relevé ne prive pas la page des comptes : il est
 * alors absent, et la ligne « Formation » ne s'affiche pas.
 */
export async function listTrainingProgress(): Promise<
  Map<string, TraineeProgress>
> {
  if (isDemoMode()) {
    return new Map([
      [
        "demo-lawson",
        { submitted: ["radio-thorax"], inProgress: ["scanner-thorax"] },
      ],
    ]);
  }
  try {
    const rows = await apiGet("/admin/training", traineeProgressSchema.array());
    return new Map(
      rows.map((row) => [
        row.profile_id,
        { submitted: row.submitted, inProgress: row.in_progress },
      ]),
    );
  } catch (error) {
    console.error("Avancement de la formation indisponible", error);
    return new Map();
  }
}

/**
 * Le cas sous la forme d'un examen, pour l'écran de lecture réel.
 *
 * L'écran n'a pas de forme à lui : il affiche un `Study`. Le cas en
 * prend les traits utiles (titre, identifiant de formation, modalité,
 * contexte clinique), jamais ceux d'un vrai patient. L'échéance et le
 * statut ne servent pas : le mode formation les masque.
 */
export async function trainingStudy(
  trainingCase: TrainingCase,
  attempt: TrainingAttempt | null,
  locale: Locale,
): Promise<Study> {
  const { t } = await getMessages();
  const received = attempt?.submittedAt ?? new Date(0);
  return {
    id: trainingCase.slug,
    studyInstanceUid: trainingCase.id,
    patientName: trainingCase.title,
    patientId: t.training.caseId(trainingCase.position),
    patientSex: null,
    patientBirthDate: null,
    modality: trainingCase.modality,
    bodyPart: trainingCase.bodyPart,
    clinicalInfo: trainingCase.indication,
    clinic: t.training.facility,
    clinicId: "formation",
    status: attempt?.submittedAt
      ? "reported"
      : attempt
        ? "in_progress"
        : "received",
    urgent: false,
    seriesCount: trainingCase.seriesCount,
    instanceCount: trainingCase.instanceCount,
    receivedAt: received,
    assignedTo: null,
    assignedToName: null,
    reportId: attempt?.id ?? null,
    reportedAt: attempt?.submittedAt ?? null,
    reportedBy: null,
    reportLanguage: locale,
    dueAt: received,
  };
}
