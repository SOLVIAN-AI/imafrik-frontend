import type {
  ApiEnrollmentCodeInfo,
  ApiGatewayDetail,
  ApiGatewayOverview,
  ApiGatewaySummary,
  ApiPolicyComparison,
  ApiTailscaleConnection,
} from "@/lib/api/contracts";
import { DEMO_NETWORK } from "@/lib/demo/control";
import { messagesFor } from "@/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";

/**
 * Passerelles de démonstration de la tour de contrôle.
 *
 * Un réseau qui montre chaque situation qu'un exploitant rencontre : des
 * passerelles actives et bavardes, une qui se tait depuis la veille (la
 * clinique muette du cockpit), une au certificat proche de l'échéance,
 * une suspendue, une révoquée après remplacement, une reprise d'avant
 * l'enrôlement (sans signal de vie), et une qui attend l'approbation de
 * l'équipe. Les dates sont relatives à l'instant présent : la
 * démonstration ne vieillit pas.
 *
 * Les données ont la forme exacte des réponses de l'API ; elles passent
 * ensuite par la même traduction que les vraies (`lib/data/gateways.ts`).
 * Les identifiants ne sont pas des UUID : rien n'est à protéger ici, et
 * les actions de démonstration n'appellent aucun service.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const iso = (ms: number) => new Date(ms).toISOString();
const isoOrNull = (ms: number | null) => (ms === null ? null : iso(ms));

/** Empreinte de démonstration, stable pour une passerelle donnée. */
function fingerprint(seed: string): string {
  let hash = 2166136261;
  let out = "";
  while (out.length < 64) {
    for (const char of `${seed}${out.length}`) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    out += hash.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

interface DemoGateway {
  id: string;
  clinicIndex: number;
  hostname: string;
  status: ApiGatewaySummary["status"];
  origin?: ApiGatewaySummary["origin"];
  /** Jours depuis l'enrôlement (minutes si `enrolledMinutes`). */
  enrolledDays: number;
  enrolledMinutes?: number;
  address: string | null;
  publicIp: string;
  /** Minutes depuis le dernier signe de vie ; `null` : jamais. */
  heartbeatMinutes: number | null;
  pendingSeries?: number;
  oldestPendingSeconds?: number;
  /** Jours avant l'échéance du certificat en service. */
  certificateDays: number;
  keyProtection?: ApiGatewaySummary["key_protection"];
  reason?: string;
  /** Jours depuis la décision (suspension, révocation). */
  decidedDays?: number;
  online?: boolean;
}

/** Les passerelles du réseau de démonstration. */
const GATEWAYS: DemoGateway[] = [
  {
    id: "gw-stj-accueil",
    clinicIndex: 0,
    hostname: "PC-ACCUEIL-01",
    status: "active",
    enrolledDays: 61,
    address: "100.101.12.4",
    publicIp: "41.207.180.5",
    heartbeatMinutes: 2,
    pendingSeries: 0,
    oldestPendingSeconds: 0,
    certificateDays: 41,
  },
  {
    id: "gw-stj-scanner",
    clinicIndex: 0,
    hostname: "PC-SCANNER",
    status: "active",
    enrolledDays: 34,
    address: "100.101.12.9",
    publicIp: "41.207.180.5",
    heartbeatMinutes: 4,
    pendingSeries: 2,
    oldestPendingSeconds: 140,
    certificateDays: 68,
    keyProtection: "software_non_exportable",
  },
  {
    id: "gw-stj-ancien",
    clinicIndex: 0,
    hostname: "PC-ANCIEN",
    status: "revoked",
    enrolledDays: 140,
    address: "100.101.12.2",
    publicIp: "41.207.180.5",
    heartbeatMinutes: 20 * 24 * 60,
    certificateDays: -2,
    reason: "Poste remplacé par PC-ACCUEIL-01",
    decidedDays: 20,
    online: false,
  },
  {
    id: "gw-pka-radio",
    clinicIndex: 1,
    hostname: "KARA-RADIO-02",
    status: "active",
    enrolledDays: 81,
    address: "100.94.3.17",
    publicIp: "196.168.10.24",
    heartbeatMinutes: 3,
    pendingSeries: 5,
    oldestPendingSeconds: 900,
    certificateDays: 9,
  },
  {
    id: "gw-pka-console",
    clinicIndex: 1,
    hostname: "KARA-CONSOLE",
    status: "suspended",
    enrolledDays: 45,
    address: "100.94.3.21",
    publicIp: "196.168.10.24",
    heartbeatMinutes: 5,
    pendingSeries: 1,
    oldestPendingSeconds: 300,
    certificateDays: 52,
    reason: "Contrôle de sécurité en cours",
    decidedDays: 1,
  },
  {
    id: "gw-lum-reprise",
    clinicIndex: 2,
    hostname: "imafrik-centre-medical-lumiere",
    status: "active",
    origin: "adopted",
    enrolledDays: 12,
    address: "100.88.40.3",
    publicIp: "41.215.12.88",
    heartbeatMinutes: null,
    certificateDays: 3400,
    keyProtection: null,
  },
  {
    id: "gw-glf-pc",
    clinicIndex: 3,
    hostname: "GOLFE-PC",
    status: "active",
    enrolledDays: 110,
    address: "100.77.8.30",
    publicIp: "41.207.144.12",
    heartbeatMinutes: 27 * 60,
    pendingSeries: 14,
    oldestPendingSeconds: 3 * 3600,
    certificateDays: 33,
    online: false,
  },
  {
    id: "gw-esp-nouveau",
    clinicIndex: 4,
    hostname: "ESPERANCE-01",
    status: "awaiting_approval",
    enrolledDays: 0,
    enrolledMinutes: 42,
    address: "100.65.91.7",
    publicIp: "102.64.220.17",
    heartbeatMinutes: 1,
    pendingSeries: 0,
    oldestPendingSeconds: 0,
    certificateDays: 90,
  },
];

const ADMIN = "Edem Agbodjan";

function summary(gateway: DemoGateway, now: number): ApiGatewaySummary {
  const clinic = DEMO_NETWORK[gateway.clinicIndex];
  const enrolled =
    now -
    (gateway.enrolledMinutes !== undefined
      ? gateway.enrolledMinutes * MINUTE
      : gateway.enrolledDays * DAY);
  const decided =
    gateway.decidedDays !== undefined ? now - gateway.decidedDays * DAY : null;
  const adopted = gateway.origin === "adopted";
  const awaiting = gateway.status === "awaiting_approval";
  const approved = awaiting ? null : enrolled + 18 * MINUTE;
  const heartbeat =
    gateway.heartbeatMinutes === null
      ? null
      : now - gateway.heartbeatMinutes * MINUTE;
  const machine = fingerprint(`${gateway.id}-machine`);
  return {
    id: gateway.id,
    organization_id: clinic.id,
    clinic_name: clinic.name,
    origin: gateway.origin ?? "enrolled",
    status: gateway.status,
    hostname: gateway.hostname,
    machine_guid: adopted
      ? null
      : `${machine.slice(0, 8)}-${machine.slice(8, 12)}-${machine.slice(12, 16)}-${machine.slice(16, 20)}-${machine.slice(20, 32)}`,
    key_protection:
      gateway.keyProtection === undefined ? "tpm" : gateway.keyProtection,
    enrolled_from_ip: adopted ? null : gateway.publicIp,
    tailscale_hostname: `imafrik-${clinic.id.replace("org-", "")}-${machine.slice(0, 8)}`,
    network_address: gateway.address,
    address_source: "tailscale",
    created_at: iso(enrolled),
    approved_at: isoOrNull(approved),
    approved_by_name: approved && !adopted ? ADMIN : null,
    activated_at: awaiting ? null : iso(enrolled + 19 * MINUTE),
    rejected_at: null,
    rejection_reason: null,
    suspended_at: gateway.status === "suspended" ? isoOrNull(decided) : null,
    suspension_reason:
      gateway.status === "suspended" ? (gateway.reason ?? null) : null,
    revoked_at: gateway.status === "revoked" ? isoOrNull(decided) : null,
    revocation_reason:
      gateway.status === "revoked" ? (gateway.reason ?? null) : null,
    renewal_requested_at: null,
    certificate_fingerprint: fingerprint(`${gateway.id}-cert`),
    certificate_not_after: iso(now + gateway.certificateDays * DAY),
    certificate_applied:
      gateway.status === "active" || gateway.status === "suspended",
    last_heartbeat_at: isoOrNull(heartbeat),
    pending_series: gateway.pendingSeries ?? null,
    oldest_pending_seconds: gateway.oldestPendingSeconds ?? null,
    disk_free_bytes: adopted
      ? null
      : 182_000_000_000 - gateway.clinicIndex * 4e10,
    kit_version: adopted ? null : "1.0.0",
    orthanc_version: adopted ? null : "1.12.10",
    tailscale:
      gateway.status === "revoked"
        ? null
        : {
            online: gateway.online ?? true,
            last_seen: iso(
              now -
                (gateway.online === false
                  ? (gateway.heartbeatMinutes ?? 60) * MINUTE
                  : 30_000),
            ),
            address: gateway.address,
          },
  };
}

/**
 * Passerelles de démonstration, éventuellement d'une seule clinique.
 *
 * @param clinicId Clinique, ou `null` pour toutes.
 * @param now      Instant de référence.
 */
export function demoGateways(
  clinicId: string | null,
  now = Date.now(),
): ApiGatewaySummary[] {
  return GATEWAYS.filter(
    (gateway) =>
      clinicId === null || DEMO_NETWORK[gateway.clinicIndex].id === clinicId,
  )
    .map((gateway) => summary(gateway, now))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Vue d'ensemble de démonstration.
 *
 * @param status Statut retenu, ou `null` pour toutes.
 * @param now    Instant de référence.
 * @param locale Langue des alertes, comme le service les rédigerait.
 */
export function demoGatewayOverview(
  status: string | null,
  now = Date.now(),
  locale: Locale = DEFAULT_LOCALE,
): ApiGatewayOverview {
  const all = demoGateways(null, now);
  const alerts = messagesFor(locale).gateways.demo.alerts;
  const counts: Record<string, number> = {};
  for (const gateway of all)
    counts[gateway.status] = (counts[gateway.status] ?? 0) + 1;
  const label = (gateway: ApiGatewaySummary) =>
    `${gateway.clinic_name} · ${gateway.hostname}`;
  const byId = (id: string) => all.find((gateway) => gateway.id === id)!;
  return {
    gateways: status ? all.filter((g) => g.status === status) : all,
    counts,
    alerts: [
      {
        severity: "critical",
        code: "gateway_silent",
        message: alerts.silent(label(byId("gw-glf-pc")), "27 h"),
        href: "/admin/passerelles/gw-glf-pc",
      },
      {
        severity: "warning",
        code: "gateway_certificate_expiring",
        message: alerts.expiring(label(byId("gw-pka-radio")), 9),
        href: "/admin/passerelles/gw-pka-radio",
      },
      {
        severity: "warning",
        code: "gateway_awaiting_approval",
        message: alerts.awaiting(label(byId("gw-esp-nouveau"))),
        href: "/admin/passerelles/gw-esp-nouveau",
      },
    ],
    readiness: { ready: true, missing: [] },
    agent: {
      last_report_at: iso(now - 9_000),
      last_outcome: "unchanged",
      last_error: null,
      last_restart_at: iso(now - 26 * HOUR),
      applied_at: iso(now - 26 * HOUR),
      pending: [],
      cycles: [
        {
          reported_at: iso(now - 26 * HOUR),
          outcome: "applied",
          restarted: true,
          added: 0,
          removed: 1,
          error: null,
        },
        {
          reported_at: iso(now - 26 * HOUR - 40_000),
          outcome: "deferred",
          restarted: false,
          added: 0,
          removed: 1,
          error: null,
        },
        {
          reported_at: iso(now - 12 * DAY),
          outcome: "applied",
          restarted: true,
          added: 1,
          removed: 0,
          error: null,
        },
      ],
    },
    kit: {
      file_name: "kit-passerelle.zip",
      size_bytes: 4_381_204,
      sha256:
        "9b1c6e0d2f4a8b7c5e3d1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c",
      version: "1.0.0",
      built_at: iso(now - 3 * DAY),
      manifest_matches: true,
      signature_status: "signed",
      publisher: "CN=IMAFRIK SAS, O=IMAFRIK SAS, L=Lomé, C=TG",
      signature_expires_at: iso(now + 300 * DAY),
      timestamped: true,
    },
  };
}

/**
 * Fiche d'une passerelle de démonstration : certificats et historique.
 *
 * @param id  Passerelle.
 * @param now Instant de référence.
 */
export function demoGateway(
  id: string,
  now = Date.now(),
): ApiGatewayDetail | null {
  const gateway = GATEWAYS.find((candidate) => candidate.id === id);
  if (!gateway) return null;
  const base = summary(gateway, now);
  const enrolled = Date.parse(base.created_at);
  const current = {
    fingerprint: base.certificate_fingerprint!,
    origin:
      base.origin === "adopted" ? ("adoption" as const) : ("renewal" as const),
    not_before: iso(Date.parse(base.certificate_not_after!) - 90 * DAY),
    not_after: base.certificate_not_after!,
    created_at: iso(Date.parse(base.certificate_not_after!) - 90 * DAY),
    applied_at: base.certificate_applied
      ? iso(Date.parse(base.certificate_not_after!) - 90 * DAY + 2 * MINUTE)
      : null,
    first_used_at: base.last_heartbeat_at ? base.activated_at : null,
    retire_after: null,
    retired_at: base.revoked_at,
    retire_reason: base.revoked_at ? "revoked" : null,
    removal_applied_at: base.revoked_at
      ? iso(Date.parse(base.revoked_at) + MINUTE)
      : null,
  };
  const history: ApiGatewayDetail["history"] = [];
  const event = (
    at: number,
    action: string,
    actor: string | null,
    metadata: Record<string, unknown> | null = null,
  ) => history.push({ at: iso(at), action, actor_name: actor, metadata });
  if (base.origin === "adopted") {
    event(enrolled, "gateway.adopted", null, { address_source: "tailscale" });
  } else {
    event(enrolled - 6 * MINUTE, "gateway.enrollment_created", ADMIN);
    event(enrolled, "gateway.enrolled", null, {
      hostname: base.hostname,
      key_protection: base.key_protection,
    });
    if (base.approved_at)
      event(Date.parse(base.approved_at), "gateway.approved", ADMIN);
  }
  if (base.activated_at)
    event(Date.parse(base.activated_at), "gateway.activated", null);
  if (base.status === "active" && base.origin === "enrolled")
    event(Date.parse(current.created_at), "gateway.renewed", null, {
      fingerprint: current.fingerprint,
    });
  if (base.suspended_at)
    event(Date.parse(base.suspended_at), "gateway.suspended", ADMIN, {
      reason: base.suspension_reason,
    });
  if (base.revoked_at)
    event(Date.parse(base.revoked_at), "gateway.revoked", ADMIN, {
      reason: base.revocation_reason,
    });
  history.sort((a, b) => b.at.localeCompare(a.at));
  return { ...base, certificates: [current], history };
}

/**
 * Codes d'enrôlement en cours d'une clinique de démonstration : un seul,
 * émis il y a quelques minutes, pour le Centre médical Lumière.
 *
 * @param clinicId Clinique.
 * @param now      Instant de référence.
 */
export function demoEnrollments(
  clinicId: string,
  now = Date.now(),
): ApiEnrollmentCodeInfo[] {
  if (clinicId !== DEMO_NETWORK[2].id) return [];
  return [
    {
      id: "code-lum",
      created_at: iso(now - 4 * MINUTE),
      expires_at: iso(now + 11 * MINUTE),
      attempts: 0,
      created_by_name: ADMIN,
    },
  ];
}

/** Connexion Tailscale de démonstration : saisie en console, complète. */
export function demoTailscaleConnection(
  now = Date.now(),
): ApiTailscaleConnection {
  return {
    source: "console",
    client_id: "kT9xQ2CNTRL",
    secret_last4: "7Hq2",
    configured_at: iso(now - 12 * DAY),
    configured_by_name: ADMIN,
    scopes: ["auth_keys", "devices:core", "policy_file"],
    required_scopes: ["auth_keys", "devices:core"],
    encryption_available: true,
    policy_file_available: true,
  };
}

/** Comparaison de démonstration : un écart d'une ligne, à pousser. */
export function demoPolicyComparison(): ApiPolicyComparison {
  return {
    repository_available: true,
    tailnet_available: true,
    in_sync: false,
    diff: [
      "--- réseau Tailscale",
      "+++ deploy/tailscale/policy.hujson",
      "@@ -32,6 +32,7 @@",
      '     {"action": "accept", "src": ["tag:clinic-staging"],    "dst": ["tag:pacs-staging:4242"]},',
      '-    {"action": "accept", "src": ["autogroup:member"], "dst": ["tag:pacs-production:22"]},',
      "+    // Accès SSH réservé à autogroup:admin.",
      "",
    ].join("\n"),
    etag: "demo-etag",
  };
}
