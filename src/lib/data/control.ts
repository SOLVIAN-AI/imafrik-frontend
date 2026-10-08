import "server-only";

import { z } from "zod";

import { getLocale } from "@/i18n/server";
import { apiGet } from "@/lib/api/client";
import {
  type ApiAlert,
  type ApiClinicDetail,
  type ApiControlAnalytics,
  type ApiControlOverview,
  type ApiOpsRun,
  adminUserSchema,
  auditEntrySchema,
  billingLineSchema,
  clinicDetailSchema,
  controlAnalyticsSchema,
  controlOverviewSchema,
  pipelineStudySchema,
  platformSettingsSchema,
  systemStatusSchema,
} from "@/lib/api/contracts";
import {
  demoAnalytics,
  demoAudit,
  demoBilling,
  demoClinic,
  demoOverview,
  demoPipeline,
  demoSettings,
  demoSystem,
  demoUsers,
  isUnverifiedRadiologist,
} from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";
import type { Locale } from "@/lib/i18n/locale";
import type { OrgKind, UserRole } from "@/lib/session/types";

/**
 * Données de la tour de contrôle.
 *
 * Réservées à l'équipe IMAFRIK : le service vérifie le rôle
 * d'administrateur en base à chaque appel. Ce module ne fait que lire et
 * traduire — dates en `Date`, noms de champs dans le vocabulaire de
 * l'interface. En démonstration, les réponses synthétiques de
 * `lib/demo/control.ts` passent par **la même traduction** que les
 * vraies : un écran ne peut pas fonctionner en démonstration et casser
 * en production.
 *
 * Les textes que le service rédige — messages d'alerte, résumés
 * d'exploitation — arrivent dans la langue de l'utilisateur (le client
 * de l'API transmet `Accept-Language`) ; le jeu de démonstration reçoit
 * la même langue, explicitement.
 *
 * Aucune donnée de patient ne transite ici : la tour de contrôle mesure
 * des flux, pas des personnes.
 */

// ─── Types partagés ───────────────────────────────────────────────────

/** Gravité d'une alerte. */
export type AlertSeverity = ApiAlert["severity"];

/** Une alerte du cockpit, déduite de l'état de la plateforme par le service. */
export interface Alert {
  code: string;
  severity: AlertSeverity;
  message: string;
  /** Écran où agir, s'il y en a un. */
  href: string | null;
}

/** Nature d'une tâche d'exploitation. */
export type OpsKind = ApiOpsRun["kind"];

/** Une exécution de tâche d'exploitation. */
export interface OpsRun {
  kind: OpsKind;
  target: string | null;
  ok: boolean;
  finishedAt: Date;
  summary: string | null;
}

/** Respect du délai promis, pour une priorité. */
export interface PrioritySla {
  signed: number;
  /** Part des examens signés dans le délai, entre 0 et 1. */
  withinSla: number | null;
  medianMinutes: number | null;
  p90Minutes: number | null;
}

/** Respect des délais promis. */
export interface Sla {
  urgent: PrioritySla;
  routine: PrioritySla;
  withinSla: number | null;
}

/** Délais promis, en minutes. */
export interface SlaTargets {
  urgent: number;
  routine: number;
}

// ─── Cockpit ─────────────────────────────────────────────────────────

/** L'état de la plateforme à l'instant. */
export interface ControlOverview {
  generatedAt: Date;
  live: {
    waiting: number;
    urgentWaiting: number;
    inProgress: number;
    urgentOverdue: number;
    routineOverdue: number;
    oldestWaitingMinutes: number | null;
    receivedToday: number;
    signedToday: number;
    deliveredToday: number;
    received7d: number;
  };
  network: {
    clinicsActive: number;
    clinicsConnected: number;
    radiologistsActive: number;
    newRequests: number;
  };
  received14d: { day: Date; urgent: number; routine: number }[];
  sla30d: Sla;
  targets: SlaTargets;
  alerts: Alert[];
  ops: OpsRun[];
}

const toOpsRun = (run: ApiOpsRun): OpsRun => ({
  kind: run.kind,
  target: run.target,
  ok: run.ok,
  finishedAt: new Date(run.finished_at),
  summary: run.summary,
});

const toPrioritySla = (
  sla: ApiControlOverview["sla_30d"]["urgent"],
): PrioritySla => ({
  signed: sla.signed,
  withinSla: sla.within_sla,
  medianMinutes: sla.median_minutes,
  p90Minutes: sla.p90_minutes,
});

const toSla = (sla: ApiControlOverview["sla_30d"]): Sla => ({
  urgent: toPrioritySla(sla.urgent),
  routine: toPrioritySla(sla.routine),
  withinSla: sla.within_sla,
});

/** Une date de jour `AAAA-MM-JJ`, lue à minuit UTC. */
const utcDay = (day: string) => new Date(`${day}T00:00:00Z`);

/** Cockpit : volumes en cours, délais, alertes, exploitation. */
export async function getOverview(): Promise<ControlOverview> {
  const raw = isDemoMode()
    ? demoOverview(Date.now(), await getLocale())
    : await apiGet("/admin/overview", controlOverviewSchema);
  return {
    generatedAt: new Date(raw.generated_at),
    live: {
      waiting: raw.live.waiting,
      urgentWaiting: raw.live.urgent_waiting,
      inProgress: raw.live.in_progress,
      urgentOverdue: raw.live.urgent_overdue,
      routineOverdue: raw.live.routine_overdue,
      oldestWaitingMinutes: raw.live.oldest_waiting_minutes,
      receivedToday: raw.live.received_today,
      signedToday: raw.live.signed_today,
      deliveredToday: raw.live.delivered_today,
      received7d: raw.live.received_7d,
    },
    network: {
      clinicsActive: raw.network.clinics_active,
      clinicsConnected: raw.network.clinics_connected,
      radiologistsActive: raw.network.radiologists_active,
      newRequests: raw.network.new_requests,
    },
    received14d: raw.received_14d.map((row) => ({
      day: utcDay(row.day),
      urgent: row.urgent,
      routine: row.routine,
    })),
    sla30d: toSla(raw.sla_30d),
    targets: {
      urgent: raw.sla_urgent_minutes,
      routine: raw.sla_routine_minutes,
    },
    alerts: raw.alerts,
    ops: raw.ops.map(toOpsRun),
  };
}

// ─── Activité ────────────────────────────────────────────────────────

/** Activité d'une clinique sur la période. */
export interface ClinicActivity {
  id: string;
  name: string;
  received: number;
  signed: number;
  bytes: number;
  medianMinutes: number | null;
  withinSla: number | null;
  /** Débit médian de réception des images, en Mo/s. */
  medianMbPerSecond: number | null;
  lastReceivedAt: Date | null;
}

/** Activité d'un radiologue sur la période. */
export interface RadiologistActivity {
  id: string;
  fullName: string;
  title: string | null;
  signed: number;
  /** Réception → signature. */
  medianMinutes: number | null;
  /** Prise en charge → signature : le temps de lecture lui-même. */
  medianReadingMinutes: number | null;
}

/**
 * Médianes de chaque étape du parcours d'un examen, en minutes.
 *
 * C'est ce qui distingue une liaison lente d'une file engorgée ou d'un
 * radiologue débordé : le délai total ne dit pas où il se perd.
 */
export interface StageMedians {
  /** Acquisition → dernière image reçue par le PACS. */
  arrival: number | null;
  /** Première → dernière image reçue. */
  transfer: number | null;
  /** Réception → prise en charge. */
  queue: number | null;
  /** Prise en charge → signature. */
  reading: number | null;
  /** Signature → remise à la clinique. */
  delivery: number | null;
}

/** Activité d'une période. */
export interface ControlAnalytics {
  days: number;
  since: Date;
  until: Date;
  totals: { received: number; urgent: number; signed: number; bytes: number };
  sla: Sla;
  targets: SlaTargets;
  stages: StageMedians;
  daily: {
    day: Date;
    urgent: number;
    routine: number;
    signed: number;
    medianMinutes: number | null;
    p90Minutes: number | null;
  }[];
  /** 7 lignes (lundi → dimanche) × 24 heures UTC. */
  heatmap: number[][];
  byClinic: ClinicActivity[];
  byModality: {
    modality: string;
    received: number;
    medianMinutes: number | null;
  }[];
  byRadiologist: RadiologistActivity[];
}

function toAnalytics(raw: ApiControlAnalytics): ControlAnalytics {
  return {
    days: raw.days,
    since: new Date(raw.since),
    until: new Date(raw.until),
    totals: raw.totals,
    sla: toSla(raw.sla),
    targets: {
      urgent: raw.sla_urgent_minutes,
      routine: raw.sla_routine_minutes,
    },
    stages: raw.stages,
    daily: raw.daily.map((row) => ({
      day: utcDay(row.day),
      urgent: row.urgent,
      routine: row.routine,
      signed: row.signed,
      medianMinutes: row.median_minutes,
      p90Minutes: row.p90_minutes,
    })),
    heatmap: raw.heatmap,
    byClinic: raw.by_clinic.map((row) => ({
      id: row.id,
      name: row.name,
      received: row.received,
      signed: row.signed,
      bytes: row.bytes,
      medianMinutes: row.median_minutes,
      withinSla: row.within_sla,
      medianMbPerSecond: row.median_mb_per_s,
      lastReceivedAt: row.last_received_at
        ? new Date(row.last_received_at)
        : null,
    })),
    byModality: raw.by_modality.map((row) => ({
      modality: row.modality,
      received: row.received,
      medianMinutes: row.median_minutes,
    })),
    byRadiologist: raw.by_radiologist.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      title: row.title,
      signed: row.signed,
      medianMinutes: row.median_minutes,
      medianReadingMinutes: row.median_reading_minutes,
    })),
  };
}

/**
 * Activité sur une période, toutes cliniques ou une seule.
 *
 * @param days     Nombre de jours, aujourd'hui compris.
 * @param clinicId Clinique, ou `null` pour tout le réseau.
 */
export async function getAnalytics(
  days: number,
  clinicId: string | null = null,
): Promise<ControlAnalytics> {
  if (isDemoMode()) return toAnalytics(demoAnalytics(days, clinicId));
  const query = new URLSearchParams({ days: String(days) });
  if (clinicId) query.set("clinic_id", clinicId);
  return toAnalytics(
    await apiGet(`/admin/analytics?${query}`, controlAnalyticsSchema),
  );
}

// ─── Flux d'images ───────────────────────────────────────────────────

/** Un examen et les instants de son parcours — sans identité de patient. */
export interface PipelineStudy {
  id: string;
  clinic: string;
  modality: string | null;
  bodyPart: string | null;
  urgent: boolean;
  status: string;
  instanceCount: number;
  radiologist: string | null;
  acquiredAt: Date | null;
  firstInstanceAt: Date | null;
  lastInstanceAt: Date | null;
  receivedAt: Date;
  claimedAt: Date | null;
  signedAt: Date | null;
  deliveredAt: Date | null;
  transferBytes: number | null;
}

const toDate = (value: string | null) => (value ? new Date(value) : null);

/**
 * Derniers examens reçus, avec les instants de leur parcours.
 *
 * @param limit    Nombre d'examens.
 * @param clinicId Clinique, ou toutes.
 */
export async function getPipeline(
  limit = 100,
  clinicId: string | null = null,
): Promise<PipelineStudy[]> {
  let rows;
  if (isDemoMode()) {
    rows = demoPipeline(limit, clinicId);
  } else {
    const query = new URLSearchParams({ limit: String(limit) });
    if (clinicId) query.set("clinic_id", clinicId);
    rows = await apiGet(
      `/admin/pipeline?${query}`,
      z.array(pipelineStudySchema),
    );
  }
  return rows.map((row) => ({
    id: row.id,
    clinic: row.clinic,
    modality: row.modality,
    bodyPart: row.body_part,
    urgent: row.priority === "urgent",
    status: row.status,
    instanceCount: row.instance_count,
    radiologist: row.radiologist,
    acquiredAt: toDate(row.acquired_at),
    firstInstanceAt: toDate(row.first_instance_at),
    lastInstanceAt: toDate(row.last_instance_at),
    receivedAt: new Date(row.received_at),
    claimedAt: toDate(row.claimed_at),
    signedAt: toDate(row.signed_at),
    deliveredAt: toDate(row.delivered_at),
    transferBytes: row.transfer_bytes,
  }));
}

// ─── Facturation ─────────────────────────────────────────────────────

/** Actes d'une clinique, pour une modalité, sur un mois. */
export interface BillingLine {
  clinicId: string;
  clinic: string;
  modality: string;
  routine: number;
  urgent: number;
  /** Examens dont le compte-rendu est signé. */
  reported: number;
}

/**
 * Actes d'un mois.
 *
 * @param month Mois `AAAA-MM`.
 */
export async function getBilling(month: string): Promise<BillingLine[]> {
  const rows = isDemoMode()
    ? demoBilling(month)
    : await apiGet(
        `/admin/billing?month=${encodeURIComponent(month)}`,
        z.array(billingLineSchema),
      );
  return rows.map((row) => ({
    clinicId: row.clinic_id,
    clinic: row.clinic,
    modality: row.modality,
    routine: row.routine,
    urgent: row.urgent,
    reported: row.reported,
  }));
}

// ─── Système ─────────────────────────────────────────────────────────

/** État technique de la plateforme. */
export interface SystemStatus {
  environment: string;
  release: string | null;
  services: { name: string; ok: boolean; detail: string | null }[];
  orthancVersion: string | null;
  storedStudies: number | null;
  storedMegabytes: number | null;
  /** Dernière exécution de chaque tâche, et cible. */
  ops: OpsRun[];
  /** Historique récent, toutes tâches confondues. */
  recentRuns: OpsRun[];
  /** Instant de la lecture — référence pour juger la fraîcheur des tâches. */
  checkedAt: Date;
}

/** Dépendances, PACS, version déployée, exploitation. */
export async function getSystem(): Promise<SystemStatus> {
  const raw = isDemoMode()
    ? demoSystem(Date.now(), await getLocale())
    : await apiGet("/admin/system", systemStatusSchema);
  return {
    environment: raw.environment,
    release: raw.release,
    services: raw.services.map((service) => ({
      name: service.name,
      ok: service.ok,
      detail: service.detail ?? null,
    })),
    orthancVersion: raw.orthanc_version,
    storedStudies: raw.stored_studies,
    storedMegabytes: raw.stored_megabytes,
    ops: raw.ops.map(toOpsRun),
    recentRuns: raw.recent_runs.map(toOpsRun),
    checkedAt: new Date(),
  };
}

// ─── Réglages ────────────────────────────────────────────────────────

/** Réglages de la plateforme. */
export interface PlatformSettings {
  targets: SlaTargets;
  /** Bandeau affiché à tous les utilisateurs, ou `null`. */
  maintenanceMessage: string | null;
  updatedAt: Date;
}

/**
 * Réglages de la plateforme.
 *
 * Lisibles par **tout utilisateur connecté** (`GET /platform/settings`) :
 * le bandeau de maintenance s'affiche à tous. Un échec de lecture renvoie
 * `null` — un bandeau absent ne doit jamais empêcher de travailler.
 */
export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  try {
    const raw = isDemoMode()
      ? demoSettings()
      : await apiGet("/platform/settings", platformSettingsSchema);
    return {
      targets: {
        urgent: raw.sla_urgent_minutes,
        routine: raw.sla_routine_minutes,
      },
      maintenanceMessage: raw.maintenance_message,
      updatedAt: new Date(raw.updated_at),
    };
  } catch {
    return null;
  }
}

// ─── Comptes ─────────────────────────────────────────────────────────

/** Appartenance d'un compte à une organisation. */
export interface UserMembership {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationKind: OrgKind;
  role: UserRole;
}

/** Un compte, vu de l'administration. */
export interface AdminUser {
  id: string;
  fullName: string;
  title: string | null;
  licenseNumber: string | null;
  email: string | null;
  createdAt: Date;
  lastSignInAt: Date | null;
  /** `null` quand l'information n'est pas disponible. */
  mfaEnabled: boolean | null;
  /**
   * Validation du numéro d'ordre par l'équipe IMAFRIK ; `null` tant
   * qu'elle reste à faire, ou depuis un changement de numéro.
   */
  credentialsVerifiedAt: Date | null;
  memberships: UserMembership[];
}

/** Filtres de la liste des comptes. */
export interface UserFilters {
  /** Recherche sur le nom ou l'adresse. */
  query?: string;
  /** Seulement les comptes sans appartenance. */
  pending?: boolean;
  /** Seulement les radiologues dont le numéro d'ordre attend sa validation. */
  unverified?: boolean;
}

/** Comptes de la plateforme, appartenances et dernière connexion. */
export async function listUsers(
  filters: UserFilters = {},
): Promise<AdminUser[]> {
  const query = filters.query?.trim() ?? "";
  let rows;
  if (isDemoMode()) {
    const needle = query.toLocaleLowerCase("fr");
    rows = demoUsers().filter(
      (user) =>
        (!filters.pending || user.memberships.length === 0) &&
        (!filters.unverified || isUnverifiedRadiologist(user)) &&
        (!needle ||
          user.full_name.toLocaleLowerCase("fr").includes(needle) ||
          (user.email ?? "").toLocaleLowerCase("fr").includes(needle)),
    );
  } else {
    const params = new URLSearchParams();
    if (query) params.set("q", query.slice(0, 100));
    if (filters.pending) params.set("pending", "true");
    if (filters.unverified) params.set("unverified", "true");
    rows = await apiGet(`/admin/users?${params}`, z.array(adminUserSchema));
  }
  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    title: row.title,
    licenseNumber: row.license_number,
    email: row.email,
    createdAt: new Date(row.created_at),
    lastSignInAt: toDate(row.last_sign_in_at),
    mfaEnabled: row.mfa_enabled,
    credentialsVerifiedAt: toDate(row.credentials_verified_at ?? null),
    memberships: row.memberships.map((membership) => ({
      membershipId: membership.membership_id,
      organizationId: membership.organization_id,
      organizationName: membership.organization_name,
      organizationKind: membership.organization_kind,
      role: membership.role,
    })),
  }));
}

// ─── Mise en service d'une clinique ──────────────────────────────────

/** Clé d'une étape de la mise en service. */
export type OnboardingStepKey = ApiClinicDetail["onboarding"][number]["key"];

/**
 * Une étape de la mise en service.
 *
 * Le libellé rédigé par le service n'est pas repris : l'écran nomme
 * chaque étape par sa clé, dans la langue de l'utilisateur.
 */
export interface OnboardingStep {
  key: OnboardingStepKey;
  done: boolean;
  doneAt: Date | null;
}

/** Une clinique : mise en service et activité récente. */
export interface ClinicDetail {
  id: string;
  name: string;
  city: string | null;
  active: boolean;
  openToPool: boolean;
  received30d: number;
  lastReceivedAt: Date | null;
  /**
   * Conservation des images après remise du compte-rendu, en jours, fixée
   * par contrat ; `null` : conservées pour la durée du contrat.
   */
  imageRetentionDays: number | null;
  /** Examens dont les images ont été purgées du PACS central. */
  imagesPurged: number;
  /**
   * Langue des comptes-rendus PDF, fixée par contrat : intitulés et
   * mentions du document signé, page de vérification.
   */
  reportLanguage: Locale;
  /**
   * Fin du contrat ; `null` tant que la clinique est sous contrat. Une
   * clinique dont le contrat est terminé est suspendue, retirée du pool,
   * et sa fiche ne se lit plus qu'en lecture seule.
   */
  contractEndedAt: Date | null;
  onboarding: OnboardingStep[];
}

/**
 * Mise en service d'une clinique.
 *
 * @returns La clinique, ou `null` si elle n'existe pas — ou n'est pas une
 *          clinique.
 */
export async function getClinic(id: string): Promise<ClinicDetail | null> {
  // Une adresse tapée à la main n'est pas une erreur du service : un
  // identifiant mal formé est une clinique introuvable, pas un 422.
  if (!isDemoMode() && !z.string().uuid().safeParse(id).success) return null;
  const raw = isDemoMode()
    ? demoClinic(id, Date.now(), await getLocale())
    : await apiGet(
        `/admin/clinics/${encodeURIComponent(id)}`,
        clinicDetailSchema,
        { notFoundAsNull: true },
      );
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    city: raw.city,
    active: raw.is_active,
    openToPool: raw.open_to_pool,
    received30d: raw.received_30d,
    lastReceivedAt: toDate(raw.last_received_at),
    imageRetentionDays: raw.image_retention_days,
    imagesPurged: raw.images_purged,
    reportLanguage: raw.report_language,
    contractEndedAt: toDate(raw.contract_ended_at ?? null),
    onboarding: raw.onboarding.map((step) => ({
      key: step.key,
      done: step.done,
      doneAt: toDate(step.done_at),
    })),
  };
}

// ─── Journal d'audit ─────────────────────────────────────────────────

/** Une ligne du journal d'audit. */
export interface AuditEntry {
  id: number;
  at: Date;
  action: string;
  actorName: string | null;
  organizationName: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown>;
}

/** Filtres et curseur du journal. */
export interface AuditFilters {
  /** Action exacte, par exemple `report.signed`. */
  action?: string;
  /** Entrées strictement plus anciennes que cet identifiant. */
  beforeId?: number;
  limit?: number;
}

/**
 * Entrées du journal d'audit, des plus récentes aux plus anciennes.
 *
 * Pagination par curseur : un décalage reprendrait des lignes déjà vues à
 * mesure que le journal se remplit.
 */
export async function listAudit(
  filters: AuditFilters = {},
): Promise<AuditEntry[]> {
  const limit = filters.limit ?? 50;
  let rows;
  if (isDemoMode()) {
    rows = demoAudit()
      .filter(
        (row) =>
          (!filters.action || row.action === filters.action) &&
          (filters.beforeId === undefined || row.id < filters.beforeId),
      )
      .slice(0, limit);
  } else {
    const params = new URLSearchParams({ limit: String(limit) });
    if (filters.action) params.set("action", filters.action.slice(0, 64));
    if (filters.beforeId !== undefined)
      params.set("before_id", String(filters.beforeId));
    rows = await apiGet(`/admin/audit?${params}`, z.array(auditEntrySchema));
  }
  return rows.map((row) => ({
    id: row.id,
    at: new Date(row.at),
    action: row.action,
    actorName: row.actor_name,
    organizationName: row.organization_name,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    metadata: row.metadata ?? {},
  }));
}
