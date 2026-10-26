import "server-only";

import { z } from "zod";

import { getLocale } from "@/i18n/server";
import { apiGet } from "@/lib/api/client";
import {
  type ApiGatewayDetail,
  type ApiGatewaySummary,
  enrollmentCodeInfoSchema,
  gatewayDetailSchema,
  gatewayOverviewSchema,
  gatewaySummarySchema,
  policyComparisonSchema,
  tailscaleConnectionSchema,
} from "@/lib/api/contracts";
import type { Alert } from "@/lib/data/control";
import {
  demoEnrollments,
  demoGateway,
  demoGatewayOverview,
  demoGateways,
  demoPolicyComparison,
  demoTailscaleConnection,
} from "@/lib/demo/gateways";
import { isDemoMode } from "@/lib/demo/mode";
import type { GatewayStatus } from "@/lib/gateways";

/**
 * Passerelles des cliniques, pour la tour de contrôle.
 *
 * Même principe que `lib/data/control.ts` : ce module lit et traduit
 * (dates en `Date`, noms dans le vocabulaire de l'interface), et le jeu de
 * démonstration passe par la même traduction que les vraies réponses.
 *
 * Aucune donnée ici n'est un secret : ni AE Title, ni clé, ni code
 * d'enrôlement (sa valeur n'est montrée qu'au geste qui l'émet). Les
 * adresses et identifiants de poste sont ceux que l'équipe vérifie avant
 * d'approuver une passerelle.
 */

const toDate = (value: string | null | undefined): Date | null =>
  value ? new Date(value) : null;

/** Le nœud Tailscale d'une passerelle, tel que l'API Tailscale le décrit. */
export interface TailscaleNode {
  online: boolean;
  lastSeen: Date | null;
  address: string | null;
}

/** Une passerelle. */
export interface Gateway {
  id: string;
  clinicId: string;
  clinicName: string;
  origin: "enrolled" | "adopted";
  status: GatewayStatus;
  hostname: string;
  machineGuid: string | null;
  keyProtection: "tpm" | "software_non_exportable" | null;
  enrolledFromIp: string | null;
  tailscaleHostname: string | null;
  address: string | null;
  addressSource: "tailscale" | "fixed";
  enrolledAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  activatedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  suspendedAt: Date | null;
  suspensionReason: string | null;
  revokedAt: Date | null;
  revocationReason: string | null;
  renewalRequestedAt: Date | null;
  certificateFingerprint: string | null;
  certificateNotAfter: Date | null;
  certificateApplied: boolean;
  lastHeartbeatAt: Date | null;
  pendingSeries: number | null;
  oldestPendingSeconds: number | null;
  diskFreeBytes: number | null;
  kitVersion: string | null;
  orthancVersion: string | null;
  /** État du nœud ; `null` s'il est inconnu (Tailscale muet, nœud absent). */
  node: TailscaleNode | null;
}

/** Un certificat épinglé. */
export interface GatewayCertificate {
  fingerprint: string;
  origin: "enrollment" | "renewal" | "adoption";
  notBefore: Date;
  notAfter: Date;
  createdAt: Date;
  appliedAt: Date | null;
  firstUsedAt: Date | null;
  retireAfter: Date | null;
  retiredAt: Date | null;
  retireReason: string | null;
}

/** Une entrée du journal d'audit d'une passerelle. */
export interface GatewayEvent {
  at: Date;
  action: string;
  actor: string | null;
  metadata: Record<string, unknown> | null;
}

/** Une passerelle, ses certificats et son historique. */
export interface GatewayDetail extends Gateway {
  certificates: GatewayCertificate[];
  history: GatewayEvent[];
}

/** Élément manquant au serveur pour enrôler. */
export type MissingPiece =
  "tailscale_credentials" | "pacs_host" | "pacs_certificate";

/** Tâche d'hôte qui applique la confiance au PACS. */
export interface PkiAgent {
  lastReportAt: Date | null;
  lastOutcome:
    "unchanged" | "applied" | "deferred" | "refused" | "failed" | null;
  lastError: string | null;
  lastRestartAt: Date | null;
  appliedAt: Date | null;
  pending: {
    gatewayId: string;
    clinicName: string;
    hostname: string;
    change: "add" | "remove";
  }[];
  cycles: {
    reportedAt: Date;
    outcome: "applied" | "deferred" | "refused" | "failed";
    restarted: boolean;
    added: number;
    removed: number;
    error: string | null;
  }[];
}

/** Kit d'installation présent sur le serveur. */
export interface GatewayKit {
  fileName: string;
  sizeBytes: number;
  sha256: string;
  version: string | null;
  builtAt: Date;
  /** L'empreinte du manifeste est celle du fichier ; `null` sans manifeste. */
  manifestMatches: boolean | null;
  signatureStatus: "signed" | "unsigned" | null;
  publisher: string | null;
  signatureExpiresAt: Date | null;
  timestamped: boolean | null;
}

/** Vue d'ensemble des passerelles. */
export interface GatewayOverview {
  gateways: Gateway[];
  counts: Partial<Record<GatewayStatus, number>>;
  alerts: Alert[];
  ready: boolean;
  missing: MissingPiece[];
  agent: PkiAgent;
  kit: GatewayKit | null;
}

/** Code d'enrôlement en cours, sans sa valeur. */
export interface EnrollmentCode {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  createdBy: string | null;
}

/** Connexion Tailscale de la plateforme, sans son secret. */
export interface TailscaleConnection {
  source: "console" | "environment" | null;
  clientId: string | null;
  secretLast4: string | null;
  configuredAt: Date | null;
  configuredBy: string | null;
  scopes: string[];
  requiredScopes: string[];
  encryptionAvailable: boolean;
  policyFileAvailable: boolean;
}

/** Politique d'accès versionnée, comparée à celle du réseau. */
export interface PolicyComparison {
  repositoryAvailable: boolean;
  tailnetAvailable: boolean;
  inSync: boolean | null;
  diff: string;
  etag: string | null;
  error: string | null;
}

const toGateway = (raw: ApiGatewaySummary): Gateway => ({
  id: raw.id,
  clinicId: raw.organization_id,
  clinicName: raw.clinic_name,
  origin: raw.origin,
  status: raw.status,
  hostname: raw.hostname,
  machineGuid: raw.machine_guid,
  keyProtection: raw.key_protection,
  enrolledFromIp: raw.enrolled_from_ip,
  tailscaleHostname: raw.tailscale_hostname,
  address: raw.network_address,
  addressSource: raw.address_source,
  enrolledAt: new Date(raw.created_at),
  approvedAt: toDate(raw.approved_at),
  approvedBy: raw.approved_by_name,
  activatedAt: toDate(raw.activated_at),
  rejectedAt: toDate(raw.rejected_at),
  rejectionReason: raw.rejection_reason,
  suspendedAt: toDate(raw.suspended_at),
  suspensionReason: raw.suspension_reason,
  revokedAt: toDate(raw.revoked_at),
  revocationReason: raw.revocation_reason,
  renewalRequestedAt: toDate(raw.renewal_requested_at),
  certificateFingerprint: raw.certificate_fingerprint,
  certificateNotAfter: toDate(raw.certificate_not_after),
  certificateApplied: raw.certificate_applied,
  lastHeartbeatAt: toDate(raw.last_heartbeat_at),
  pendingSeries: raw.pending_series,
  oldestPendingSeconds: raw.oldest_pending_seconds,
  diskFreeBytes: raw.disk_free_bytes,
  kitVersion: raw.kit_version,
  orthancVersion: raw.orthanc_version,
  node: raw.tailscale
    ? {
        online: raw.tailscale.online,
        lastSeen: toDate(raw.tailscale.last_seen),
        address: raw.tailscale.address,
      }
    : null,
});

const toDetail = (raw: ApiGatewayDetail): GatewayDetail => ({
  ...toGateway(raw),
  certificates: raw.certificates.map((certificate) => ({
    fingerprint: certificate.fingerprint,
    origin: certificate.origin,
    notBefore: new Date(certificate.not_before),
    notAfter: new Date(certificate.not_after),
    createdAt: new Date(certificate.created_at),
    appliedAt: toDate(certificate.applied_at),
    firstUsedAt: toDate(certificate.first_used_at),
    retireAfter: toDate(certificate.retire_after),
    retiredAt: toDate(certificate.retired_at),
    retireReason: certificate.retire_reason,
  })),
  history: raw.history.map((event) => ({
    at: new Date(event.at),
    action: event.action,
    actor: event.actor_name,
    metadata: event.metadata,
  })),
});

/**
 * Vue d'ensemble : toutes les passerelles (ou celles d'un statut), leurs
 * alertes, la tâche d'hôte et le kit d'installation.
 *
 * @param status Statut retenu, ou `null` pour toutes.
 */
export async function getGatewayOverview(
  status: GatewayStatus | null,
): Promise<GatewayOverview> {
  const raw = isDemoMode()
    ? demoGatewayOverview(status, Date.now(), await getLocale())
    : await apiGet(
        status
          ? `/admin/gateways?status=${encodeURIComponent(status)}`
          : "/admin/gateways",
        gatewayOverviewSchema,
      );
  return {
    gateways: raw.gateways.map(toGateway),
    counts: raw.counts as Partial<Record<GatewayStatus, number>>,
    alerts: raw.alerts.map((alert) => ({
      code: alert.code,
      severity: alert.severity,
      message: alert.message,
      href: alert.href,
    })),
    ready: raw.readiness.ready,
    missing: raw.readiness.missing,
    agent: {
      lastReportAt: toDate(raw.agent.last_report_at),
      lastOutcome: raw.agent.last_outcome,
      lastError: raw.agent.last_error,
      lastRestartAt: toDate(raw.agent.last_restart_at),
      appliedAt: toDate(raw.agent.applied_at),
      pending: raw.agent.pending.map((change) => ({
        gatewayId: change.gateway_id,
        clinicName: change.clinic_name,
        hostname: change.hostname,
        change: change.change,
      })),
      cycles: raw.agent.cycles.map((cycle) => ({
        reportedAt: new Date(cycle.reported_at),
        outcome: cycle.outcome,
        restarted: cycle.restarted,
        added: cycle.added,
        removed: cycle.removed,
        error: cycle.error,
      })),
    },
    kit: raw.kit
      ? {
          fileName: raw.kit.file_name,
          sizeBytes: raw.kit.size_bytes,
          sha256: raw.kit.sha256,
          version: raw.kit.version,
          builtAt: new Date(raw.kit.built_at),
          manifestMatches: raw.kit.manifest_matches,
          signatureStatus: raw.kit.signature_status,
          publisher: raw.kit.publisher,
          signatureExpiresAt: toDate(raw.kit.signature_expires_at),
          timestamped: raw.kit.timestamped,
        }
      : null,
  };
}

/**
 * Passerelles d'une clinique, des plus récentes aux plus anciennes.
 *
 * @param clinicId Clinique.
 */
export async function getClinicGateways(clinicId: string): Promise<Gateway[]> {
  if (isDemoMode()) return demoGateways(clinicId).map(toGateway);
  if (!z.guid().safeParse(clinicId).success) return [];
  const raw = await apiGet(
    `/admin/clinics/${encodeURIComponent(clinicId)}/gateways`,
    z.array(gatewaySummarySchema),
  );
  return raw.map(toGateway);
}

/**
 * Codes d'enrôlement en cours d'une clinique, sans leur valeur.
 *
 * @param clinicId Clinique.
 */
export async function getEnrollmentCodes(
  clinicId: string,
): Promise<EnrollmentCode[]> {
  const raw = isDemoMode()
    ? demoEnrollments(clinicId)
    : z.guid().safeParse(clinicId).success
      ? await apiGet(
          `/admin/clinics/${encodeURIComponent(clinicId)}/gateway-enrollments`,
          z.array(enrollmentCodeInfoSchema),
        )
      : [];
  return raw.map((code) => ({
    id: code.id,
    createdAt: new Date(code.created_at),
    expiresAt: new Date(code.expires_at),
    attempts: code.attempts,
    createdBy: code.created_by_name,
  }));
}

/**
 * Une passerelle, ses certificats et son historique.
 *
 * @param id Passerelle.
 * @returns La passerelle, ou `null` si elle n'existe pas.
 */
export async function getGateway(id: string): Promise<GatewayDetail | null> {
  if (isDemoMode()) {
    const raw = demoGateway(id);
    return raw ? toDetail(raw) : null;
  }
  if (!z.guid().safeParse(id).success) return null;
  const raw = await apiGet(
    `/admin/gateways/${encodeURIComponent(id)}`,
    gatewayDetailSchema,
    { notFoundAsNull: true },
  );
  return raw ? toDetail(raw) : null;
}

/** La connexion Tailscale de la plateforme, sans son secret. */
export async function getTailscaleConnection(): Promise<TailscaleConnection> {
  const raw = isDemoMode()
    ? demoTailscaleConnection()
    : await apiGet("/admin/platform/tailscale", tailscaleConnectionSchema);
  return {
    source: raw.source,
    clientId: raw.client_id,
    secretLast4: raw.secret_last4,
    configuredAt: toDate(raw.configured_at),
    configuredBy: raw.configured_by_name,
    scopes: raw.scopes,
    requiredScopes: raw.required_scopes,
    encryptionAvailable: raw.encryption_available,
    policyFileAvailable: raw.policy_file_available,
  };
}

/** La politique d'accès versionnée, comparée à celle du réseau. */
export async function getPolicyComparison(): Promise<PolicyComparison> {
  const raw = isDemoMode()
    ? demoPolicyComparison()
    : await apiGet("/admin/platform/tailscale/policy", policyComparisonSchema);
  return toPolicyComparison(raw);
}

/**
 * Traduit une comparaison de politique (lecture ou résultat d'une poussée).
 *
 * @param raw Réponse du service.
 */
export function toPolicyComparison(
  raw: z.output<typeof policyComparisonSchema>,
): PolicyComparison {
  return {
    repositoryAvailable: raw.repository_available,
    tailnetAvailable: raw.tailnet_available,
    inSync: raw.in_sync,
    diff: raw.diff,
    etag: raw.etag,
    error: raw.error ?? null,
  };
}
