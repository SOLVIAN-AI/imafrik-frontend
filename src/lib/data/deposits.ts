import "server-only";

import { ApiError, apiGet } from "@/lib/api/client";
import {
  type ApiDeposit,
  type ApiDepositReport,
  type DepositRefusal,
  type DepositStatus,
  depositLimitsSchema,
  depositListSchema,
  depositReportSchema,
  type IgnoredReason,
} from "@/lib/api/contracts";
import { type DepositState, depositStateOf } from "@/lib/deposits";
import { DEMO_DEPOSITS } from "@/lib/demo/deposits";
import { isDemoMode } from "@/lib/demo/mode";
import { getSession } from "@/lib/session/server";

/**
 * Dépôts d'archives ZIP : la liste et le compte rendu de chacun.
 *
 * Le responsable lit ceux de sa clinique (`/deposits`), l'équipe IMAFRIK
 * ceux du réseau (`/admin/deposits`). Le jeu de démonstration passe par la
 * même traduction que les vraies réponses.
 */

const toDate = (value: string | null): Date | null =>
  value ? new Date(value) : null;

/** Un dépôt, tel que la liste l'affiche. */
export interface Deposit {
  id: string;
  clinicId: string;
  clinicName: string;
  fileName: string;
  headSha256: string | null;
  sizeBytes: number;
  receivedBytes: number;
  status: DepositStatus;
  state: DepositState;
  refusal: DepositRefusal | null;
  onBehalf: boolean;
  /** Qui a déposé ; absent chez le responsable quand l'équipe a déposé. */
  authorName: string | null;
  studiesCount: number;
  seriesCount: number;
  instancesCount: number;
  duplicatesCount: number;
  ignoredCount: number;
  createdAt: Date;
  receivedAt: Date | null;
  processedAt: Date | null;
  /** Envoi en cours : instant où il sera abandonné sans nouvel octet. */
  expiresAt: Date | null;
}

/** Un examen trouvé dans l'archive. */
export interface DepositStudy {
  studyInstanceUid: string;
  accepted: boolean;
  seriesCount: number;
  instancesCount: number;
  duplicatesCount: number;
  /** L'examen de la clinique, une fois créé par l'ingestion. */
  studyId: string | null;
  patientName: string | null;
  modality: string | null;
  studyDate: Date | null;
}

/** Le compte rendu d'un dépôt. */
export interface DepositReport extends Deposit {
  entriesCount: number;
  studies: DepositStudy[];
  ignored: { name: string; reason: IgnoredReason }[];
}

/** Les dépôts d'une liste. */
export interface DepositList {
  deposits: Deposit[];
  /** La liste s'arrête aux 500 plus récents. */
  limited: boolean;
}

/** Les limites d'un dépôt, annoncées avant l'envoi. */
export interface DepositLimits {
  maxArchiveBytes: number;
  maxEntries: number;
  maxTotalUncompressedBytes: number;
  maxEntryBytes: number;
  expiryHours: number;
}

/** Limites du service (`app/services/deposits.py`), pour la démonstration. */
const DEMO_LIMITS: DepositLimits = {
  maxArchiveBytes: 2 * 1024 ** 3,
  maxEntries: 10_000,
  maxTotalUncompressedBytes: 8 * 1024 ** 3,
  maxEntryBytes: 512 * 1024 ** 2,
  expiryHours: 72,
};

function toDeposit(row: ApiDeposit): Deposit {
  return {
    id: row.id,
    clinicId: row.organization_id,
    clinicName: row.clinic_name,
    fileName: row.file_name,
    headSha256: row.head_sha256,
    sizeBytes: row.size_bytes,
    receivedBytes: row.received_bytes,
    status: row.status,
    state: depositStateOf(row.status),
    refusal: row.refusal,
    onBehalf: row.on_behalf,
    authorName: row.author_name,
    studiesCount: row.studies_count,
    seriesCount: row.series_count,
    instancesCount: row.instances_count,
    duplicatesCount: row.duplicates_count,
    ignoredCount: row.ignored_count,
    createdAt: new Date(row.created_at),
    receivedAt: toDate(row.received_at),
    processedAt: toDate(row.processed_at),
    expiresAt: toDate(row.expires_at),
  };
}

function toReport(row: ApiDepositReport): DepositReport {
  return {
    ...toDeposit(row),
    entriesCount: row.entries_count,
    studies: row.studies.map((study) => ({
      studyInstanceUid: study.study_instance_uid,
      accepted: study.accepted,
      seriesCount: study.series_count,
      instancesCount: study.instances_count,
      duplicatesCount: study.duplicates_count,
      studyId: study.study_id,
      patientName: study.patient_name,
      modality: study.modality,
      studyDate: toDate(study.study_date),
    })),
    ignored: row.ignored,
  };
}

/**
 * Un dépôt de la démonstration, tel que le lirait la clinique : le nom du
 * membre de l'équipe IMAFRIK n'y figure pas.
 */
function asClinic(row: ApiDepositReport): ApiDepositReport {
  return row.on_behalf ? { ...row, author_name: null } : row;
}

async function demoClinic(): Promise<string> {
  const session = await getSession();
  return session!.active.organizationId;
}

/** Les dépôts de la clinique active, les plus récents d'abord. */
export async function listDeposits(): Promise<DepositList> {
  if (isDemoMode()) {
    const clinic = await demoClinic();
    return {
      deposits: DEMO_DEPOSITS.filter((row) => row.organization_id === clinic)
        .map(asClinic)
        .map(toDeposit),
      limited: false,
    };
  }
  const list = await apiGet("/deposits", depositListSchema);
  return { deposits: list.deposits.map(toDeposit), limited: list.limited };
}

/**
 * Le compte rendu d'un dépôt de la clinique active.
 *
 * @param depositId Dépôt.
 * @returns Le compte rendu, ou `null` si le dépôt n'est pas de la clinique.
 */
export async function getDeposit(
  depositId: string,
): Promise<DepositReport | null> {
  if (isDemoMode()) {
    const clinic = await demoClinic();
    const row = DEMO_DEPOSITS.find(
      (item) => item.id === depositId && item.organization_id === clinic,
    );
    return row ? toReport(asClinic(row)) : null;
  }
  try {
    return toReport(
      await apiGet(
        `/deposits/${encodeURIComponent(depositId)}`,
        depositReportSchema,
      ),
    );
  } catch (error) {
    if (error instanceof ApiError && [404, 422].includes(error.status)) {
      return null;
    }
    throw error;
  }
}

/**
 * Les dépôts du réseau, pour l'équipe IMAFRIK, ou ceux d'une clinique.
 *
 * @param clinicId Clinique consultée (vue des cliniques) : le service ne
 *                 rend que ses dépôts, 500 au plus comme pour le réseau.
 */
export async function listTeamDeposits(
  clinicId?: string,
): Promise<DepositList> {
  if (isDemoMode()) {
    return {
      deposits: DEMO_DEPOSITS.filter(
        (row) => clinicId === undefined || row.organization_id === clinicId,
      ).map(toDeposit),
      limited: false,
    };
  }
  const query = clinicId
    ? `?${new URLSearchParams({ clinic_id: clinicId })}`
    : "";
  const list = await apiGet(`/admin/deposits${query}`, depositListSchema);
  return { deposits: list.deposits.map(toDeposit), limited: list.limited };
}

/**
 * Le compte rendu d'un dépôt, quelle que soit sa clinique.
 *
 * @param depositId Dépôt.
 * @returns Le compte rendu, ou `null` s'il n'existe pas.
 */
export async function getTeamDeposit(
  depositId: string,
): Promise<DepositReport | null> {
  if (isDemoMode()) {
    const row = DEMO_DEPOSITS.find((item) => item.id === depositId);
    return row ? toReport(row) : null;
  }
  try {
    return toReport(
      await apiGet(
        `/admin/deposits/${encodeURIComponent(depositId)}`,
        depositReportSchema,
      ),
    );
  } catch (error) {
    if (error instanceof ApiError && [404, 422].includes(error.status)) {
      return null;
    }
    throw error;
  }
}

/**
 * Les limites du service, annoncées avant l'envoi.
 *
 * @param team `true` pour l'équipe IMAFRIK.
 */
export async function getDepositLimits(team = false): Promise<DepositLimits> {
  if (isDemoMode()) return DEMO_LIMITS;
  const limits = await apiGet(
    team ? "/admin/deposits/limits" : "/deposits/limits",
    depositLimitsSchema,
  );
  return {
    maxArchiveBytes: limits.max_archive_bytes,
    maxEntries: limits.max_entries,
    maxTotalUncompressedBytes: limits.max_total_uncompressed_bytes,
    maxEntryBytes: limits.max_entry_bytes,
    expiryHours: limits.expiry_hours,
  };
}
