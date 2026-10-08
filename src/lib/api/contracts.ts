import { z } from "zod";

import type { components } from "@/lib/api/schema";
import { isSafeBrowserUrl } from "@/lib/security/urls";

/**
 * Le contrat avec l'API, vérifié deux fois.
 *
 * **À la compilation.** Chaque schéma est confronté au type généré depuis
 * `openapi.json` (`npm run api:types`) par {@link Matches}. Un champ
 * ajouté, retiré ou renommé côté service fait échouer `npm run
 * typecheck` — et la CI, qui vérifie aussi que le type généré est à jour
 * (`npm run api:check`). Une rupture de contrat se voit donc avant le
 * déploiement, pas devant un radiologue.
 *
 * **À l'exécution.** Un type TypeScript est effacé à la compilation : si
 * le service déployé ne correspond pas à la version du contrat — un
 * déploiement dans le désordre, par exemple — seul un schéma le détecte,
 * avec une erreur nette à la frontière plutôt qu'un `undefined` au milieu
 * d'un écran.
 *
 * Les dates restent des chaînes ISO ici ; leur conversion en `Date` a lieu
 * dans `lib/data/*`, avec le reste de la traduction vers le vocabulaire
 * de l'interface.
 */

type Schemas = components["schemas"];

/**
 * Vrai si deux types sont mutuellement assignables.
 *
 * Utilisé uniquement en position de type : `const _: Matches<A, B> =
 * true` ne compile que si le schéma et le contrat généré concordent
 * exactement, dans les deux sens.
 */
type Matches<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const uuid = z.string().uuid();
const isoDate = z.string();

/** Adresse que le navigateur ouvrira : `https`, jamais `javascript:` — voir `lib/security/urls.ts`. */
const browserUrl = z
  .string()
  .url()
  // Message technique : une adresse refusée fait échouer la lecture du
  // contrat, que l'écran présente comme une réponse inattendue.
  .refine(isSafeBrowserUrl, "unsafe URL returned by the service");

export const studyStatusSchema = z.enum([
  "received",
  "assigned",
  "in_progress",
  "reported",
  "delivered",
]);

export const studySchema = z.object({
  id: uuid,
  organization_id: uuid,
  clinic_name: z.string(),
  study_instance_uid: z.string(),
  patient_name: z.string().nullable(),
  patient_id_local: z.string().nullable(),
  patient_birthdate: isoDate.nullable(),
  patient_sex: z.string().nullable(),
  modality: z.string().nullable(),
  body_part: z.string().nullable(),
  study_date: isoDate.nullable(),
  instance_count: z.number().int(),
  series_count: z.number().int(),
  status: studyStatusSchema,
  priority: z.enum(["routine", "urgent"]),
  assigned_to: uuid.nullable(),
  assigned_to_name: z.string().nullable(),
  clinical_info: z.string().nullable(),
  received_at: isoDate,
  reported_at: isoDate.nullable(),
  reported_by_name: z.string().nullable(),
  // Absent d'une réponse antérieure à la conservation contractuelle.
  images_purged_at: isoDate.nullable().optional(),
  report_id: uuid.nullable(),
  report_language: z.enum(["fr", "en"]),
  due_at: isoDate,
});
const _study: Matches<z.input<typeof studySchema>, Schemas["Study"]> = true;

export const studyPageSchema = z.object({
  items: z.array(studySchema),
  total: z.number().int(),
});
const _studyPage: Matches<
  z.input<typeof studyPageSchema>,
  Schemas["StudyPage"]
> = true;

export const addendumSchema = z.object({
  id: uuid,
  report_id: uuid,
  author_id: uuid,
  body: z.string(),
  author_name: z.string(),
  author_title: z.string().nullable(),
  author_license: z.string().nullable(),
  created_at: isoDate,
});
const _addendum: Matches<
  z.input<typeof addendumSchema>,
  Schemas["Addendum"]
> = true;

export const reportSchema = z.object({
  id: uuid,
  study_id: uuid,
  author_id: uuid,
  status: z.enum(["draft", "signed"]),
  sections: z.record(z.string(), z.string()),
  version: z.number().int(),
  signed_at: isoDate.nullable(),
  signed_by: uuid.nullable(),
  signer_name: z.string().nullable(),
  signer_title: z.string().nullable(),
  signer_license: z.string().nullable(),
  pdf_sha256: z.string().nullable(),
  verify_token: z.string().nullable(),
  addenda: z.array(addendumSchema),
  created_at: isoDate,
  updated_at: isoDate,
});
const _report: Matches<z.input<typeof reportSchema>, Schemas["Report"]> = true;

export const viewerTokenSchema = z.object({
  token: z.string(),
  viewer_url: browserUrl,
  expires_in: z.number().int(),
});
const _viewer: Matches<
  z.input<typeof viewerTokenSchema>,
  Schemas["ViewerToken"]
> = true;

export const pdfLinkSchema = z.object({
  url: browserUrl,
  expires_in: z.number().int(),
});
const _pdf: Matches<z.input<typeof pdfLinkSchema>, Schemas["PdfLink"]> = true;

export const templateSchema = z.object({
  id: uuid,
  organization_id: uuid.nullable(),
  name: z.string(),
  modality: z.string().nullable(),
  body_part: z.string().nullable(),
  sections: z.record(z.string(), z.string()),
});
const _template: Matches<
  z.input<typeof templateSchema>,
  Schemas["ReportTemplate"]
> = true;

export const verificationSchema = z.object({
  valid: z.boolean(),
  patient_initial: z.string().nullable(),
  clinic: z.string(),
  modality: z.string().nullable(),
  study_date: isoDate.nullable(),
  signed_at: isoDate,
  radiologist: z.string(),
  license_number: z.string().nullable(),
  sha256: z.string().nullable(),
  addenda_count: z.number().int(),
});
const _verification: Matches<
  z.input<typeof verificationSchema>,
  Schemas["VerificationResult"]
> = true;

export const metricsSchema = z.object({
  by_status: z.record(z.string(), z.number().int()),
  urgent_open: z.number().int(),
  assigned_to_me: z.number().int(),
  received_last_30_days: z.number().int(),
  median_turnaround_minutes: z.number().nullable(),
  reports_to_download: z.number().int(),
});
const _metrics: Matches<
  z.input<typeof metricsSchema>,
  Schemas["Metrics"]
> = true;

export const profileSchema = z.object({
  id: uuid,
  full_name: z.string(),
  title: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
  locale: z.enum(["fr", "en"]),
  // Validation du numéro d'ordre par l'équipe IMAFRIK : sans elle, un
  // radiologue n'accède à aucun examen.
  credentials_verified: z.boolean(),
});
const _profile: Matches<
  z.input<typeof profileSchema>,
  Schemas["Profile"]
> = true;

export const sessionInfoSchema = z.object({
  profile: profileSchema.nullable(),
  active_organization_id: uuid.nullable(),
  role: z.string().nullable(),
  organizations: z.array(
    z.object({
      organization_id: uuid,
      name: z.string(),
      kind: z.string(),
      role: z.string(),
      is_active: z.boolean(),
    }),
  ),
});
const _sessionInfo: Matches<
  z.input<typeof sessionInfoSchema>,
  Schemas["SessionInfo"]
> = true;

export const uploadTokenSchema = z.object({
  token: z.string(),
  expires_in: z.number().int(),
});
const _uploadToken: Matches<
  z.input<typeof uploadTokenSchema>,
  Schemas["UploadToken"]
> = true;

export const uploadResultSchema = z.object({
  status: z.enum(["stored", "duplicate", "ignored"]),
  study_instance_uid: z.string().nullable(),
});
const _uploadResult: Matches<
  z.input<typeof uploadResultSchema>,
  Schemas["UploadResult"]
> = true;

const roleSchema = z.enum(["platform_admin", "radiologist", "clinic_staff"]);
const kindSchema = z.enum(["clinic", "radiology_group"]);

export const organizationSchema = z.object({
  id: uuid,
  name: z.string(),
  kind: kindSchema,
  city: z.string().nullable(),
  open_to_pool: z.boolean(),
  member_count: z.number().int(),
});
const _organization: Matches<
  z.input<typeof organizationSchema>,
  Schemas["Organization"]
> = true;

export const memberSchema = z.object({
  membership_id: uuid,
  profile_id: uuid,
  full_name: z.string(),
  title: z.string().nullable(),
  email: z.string().nullable(),
  role: roleSchema,
  joined_at: isoDate,
  is_me: z.boolean(),
});
const _member: Matches<z.input<typeof memberSchema>, Schemas["Member"]> = true;

export const adminOrganizationSchema = z.object({
  id: uuid,
  name: z.string(),
  kind: kindSchema,
  city: z.string().nullable(),
  is_active: z.boolean(),
  open_to_pool: z.boolean(),
  has_dicom_aet: z.boolean(),
  study_count: z.number().int(),
  member_count: z.number().int(),
  received_30d: z.number().int(),
  last_received_at: isoDate.nullable(),
  created_at: isoDate,
});
const _adminOrganization: Matches<
  z.input<typeof adminOrganizationSchema>,
  Schemas["AdminOrganization"]
> = true;

export const contactRequestSchema = z.object({
  id: uuid,
  full_name: z.string(),
  organization: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  message: z.string().nullable(),
  // Nul pour les demandes antérieures à la question « Je suis ».
  requester_kind: z.enum(["clinic", "radiologist"]).nullable().optional(),
  license_number: z.string().nullable().optional(),
  status: z.enum(["new", "contacted", "converted", "dismissed"]),
  notes: z.string().nullable(),
  handled_at: isoDate.nullable(),
  created_at: isoDate,
});
const _contactRequest: Matches<
  z.input<typeof contactRequestSchema>,
  Schemas["ContactRequest"]
> = true;

// ─── Tour de contrôle ─────────────────────────────────────────────────

const count = z.number().int();
const minutes = z.number().nullable();
const ratio = z.number().nullable();
const priority = z.enum(["routine", "urgent"]);

const opsRunSchema = z.object({
  kind: z.enum([
    "backup",
    "restore_drill",
    "reconciliation",
    "host_watch",
    "retention",
  ]),
  target: z.string().nullable(),
  ok: z.boolean(),
  finished_at: isoDate,
  summary: z.string().nullable(),
});
const _opsRun: Matches<z.input<typeof opsRunSchema>, Schemas["OpsRun"]> = true;

const alertSchema = z.object({
  code: z.string(),
  severity: z.enum(["critical", "warning", "info"]),
  message: z.string(),
  href: z.string().nullable(),
});
const _alert: Matches<z.input<typeof alertSchema>, Schemas["Alert"]> = true;

const prioritySlaSchema = z.object({
  signed: count,
  within_sla: ratio,
  median_minutes: minutes,
  p90_minutes: minutes,
});
const _prioritySla: Matches<
  z.input<typeof prioritySlaSchema>,
  Schemas["PrioritySla"]
> = true;

const slaSchema = z.object({
  urgent: prioritySlaSchema,
  routine: prioritySlaSchema,
  within_sla: ratio,
});
const _sla: Matches<z.input<typeof slaSchema>, Schemas["Sla"]> = true;

export const controlOverviewSchema = z.object({
  generated_at: isoDate,
  live: z.object({
    waiting: count,
    urgent_waiting: count,
    in_progress: count,
    urgent_overdue: count,
    routine_overdue: count,
    oldest_waiting_minutes: minutes,
    received_today: count,
    signed_today: count,
    delivered_today: count,
    received_7d: count,
  }),
  network: z.object({
    clinics_active: count,
    clinics_connected: count,
    radiologists_active: count,
    new_requests: count,
  }),
  received_14d: z.array(
    z.object({ day: z.string(), urgent: count, routine: count }),
  ),
  sla_30d: slaSchema,
  sla_urgent_minutes: count,
  sla_routine_minutes: count,
  alerts: z.array(alertSchema),
  ops: z.array(opsRunSchema),
});
const _controlOverview: Matches<
  z.input<typeof controlOverviewSchema>,
  Schemas["ControlOverview"]
> = true;

export const controlAnalyticsSchema = z.object({
  days: count,
  since: isoDate,
  until: isoDate,
  totals: z.object({
    received: count,
    urgent: count,
    signed: count,
    bytes: count,
  }),
  sla: slaSchema,
  sla_urgent_minutes: count,
  sla_routine_minutes: count,
  stages: z.object({
    transfer: minutes,
    arrival: minutes,
    queue: minutes,
    reading: minutes,
    delivery: minutes,
  }),
  daily: z.array(
    z.object({
      day: z.string(),
      urgent: count,
      routine: count,
      signed: count,
      median_minutes: minutes,
      p90_minutes: minutes,
    }),
  ),
  heatmap: z.array(z.array(z.number())),
  by_clinic: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      received: count,
      signed: count,
      bytes: count,
      median_minutes: minutes,
      within_sla: ratio,
      median_mb_per_s: z.number().nullable(),
      last_received_at: isoDate.nullable(),
    }),
  ),
  by_modality: z.array(
    z.object({
      modality: z.string(),
      received: count,
      median_minutes: minutes,
    }),
  ),
  by_radiologist: z.array(
    z.object({
      id: uuid,
      full_name: z.string(),
      title: z.string().nullable(),
      signed: count,
      median_minutes: minutes,
      median_reading_minutes: minutes,
    }),
  ),
});
const _controlAnalytics: Matches<
  z.input<typeof controlAnalyticsSchema>,
  Schemas["ControlAnalytics"]
> = true;

export const pipelineStudySchema = z.object({
  id: uuid,
  clinic: z.string(),
  modality: z.string().nullable(),
  body_part: z.string().nullable(),
  priority,
  status: z.string(),
  instance_count: count,
  radiologist: z.string().nullable(),
  acquired_at: isoDate.nullable(),
  first_instance_at: isoDate.nullable(),
  last_instance_at: isoDate.nullable(),
  received_at: isoDate,
  claimed_at: isoDate.nullable(),
  signed_at: isoDate.nullable(),
  delivered_at: isoDate.nullable(),
  transfer_bytes: z.number().int().nullable(),
});
const _pipelineStudy: Matches<
  z.input<typeof pipelineStudySchema>,
  Schemas["PipelineStudy"]
> = true;

export const billingLineSchema = z.object({
  clinic_id: uuid,
  clinic: z.string(),
  modality: z.string(),
  reported: count,
  urgent: count,
  routine: count,
});
const _billingLine: Matches<
  z.input<typeof billingLineSchema>,
  Schemas["BillingLine"]
> = true;

const serviceHealthSchema = z.object({
  name: z.string(),
  ok: z.boolean(),
  detail: z.string().nullable().optional(),
});
const _serviceHealth: Matches<
  z.input<typeof serviceHealthSchema>,
  Schemas["ServiceHealth"]
> = true;

export const systemStatusSchema = z.object({
  environment: z.string(),
  release: z.string().nullable(),
  services: z.array(serviceHealthSchema),
  orthanc_version: z.string().nullable(),
  stored_studies: z.number().int().nullable(),
  stored_megabytes: z.number().nullable(),
  ops: z.array(opsRunSchema),
  recent_runs: z.array(opsRunSchema),
});
const _systemStatus: Matches<
  z.input<typeof systemStatusSchema>,
  Schemas["SystemStatus"]
> = true;

export const platformSettingsSchema = z.object({
  sla_urgent_minutes: count,
  sla_routine_minutes: count,
  maintenance_message: z.string().nullable(),
  updated_at: isoDate,
});
const _platformSettings: Matches<
  z.input<typeof platformSettingsSchema>,
  Schemas["PlatformSettings"]
> = true;

export const auditEntrySchema = z.object({
  id: z.number().int(),
  at: isoDate,
  action: z.string(),
  actor_id: z.string().nullable(),
  actor_name: z.string().nullable(),
  organization_id: z.string().nullable(),
  organization_name: z.string().nullable(),
  resource_type: z.string().nullable(),
  resource_id: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
const _auditEntry: Matches<
  z.input<typeof auditEntrySchema>,
  Schemas["AuditEntry"]
> = true;

const userMembershipSchema = z.object({
  membership_id: uuid,
  organization_id: uuid,
  organization_name: z.string(),
  organization_kind: kindSchema,
  role: roleSchema,
});
const _userMembership: Matches<
  z.input<typeof userMembershipSchema>,
  Schemas["UserMembership"]
> = true;

export const adminUserSchema = z.object({
  id: uuid,
  full_name: z.string(),
  title: z.string().nullable(),
  license_number: z.string().nullable(),
  email: z.string().nullable(),
  created_at: isoDate,
  last_sign_in_at: isoDate.nullable(),
  mfa_enabled: z.boolean().nullable(),
  // Validation du numéro d'ordre ; nul tant qu'elle reste à faire.
  credentials_verified_at: isoDate.nullable().optional(),
  memberships: z.array(userMembershipSchema),
});
const _adminUser: Matches<
  z.input<typeof adminUserSchema>,
  Schemas["AdminUser"]
> = true;

export const clinicDetailSchema = z.object({
  id: uuid,
  name: z.string(),
  city: z.string().nullable(),
  is_active: z.boolean(),
  open_to_pool: z.boolean(),
  received_30d: count,
  last_received_at: isoDate.nullable(),
  image_retention_days: z.number().int().nullable(),
  images_purged: count,
  report_language: z.enum(["fr", "en"]),
  // Absent d'une réponse antérieure à la fin de contrat encadrée.
  contract_ended_at: isoDate.nullable().optional(),
  onboarding: z.array(
    z.object({
      key: z.enum([
        "created",
        "connected",
        "team",
        "first_study",
        "first_report",
        "first_delivery",
      ]),
      label: z.string(),
      done: z.boolean(),
      done_at: isoDate.nullable(),
    }),
  ),
});
const _clinicDetail: Matches<
  z.input<typeof clinicDetailSchema>,
  Schemas["ClinicDetail"]
> = true;

/**
 * Effet de la fin de contrat d'une clinique : date, examens abandonnés,
 * et commande d'export à lancer sur le serveur.
 */
export const contractEndResultSchema = z.object({
  contract_ended_at: isoDate,
  abandoned_studies: count,
  export_command: z.string(),
});
const _contractEndResult: Matches<
  z.input<typeof contractEndResultSchema>,
  Schemas["ContractEndResult"]
> = true;

/**
 * Accueil d'un invité : l'organisation qui l'accueille, son rôle, et qui
 * l'a invité. Lisible avant la double authentification.
 */
export const invitationWelcomeSchema = z.object({
  organization_name: z.string(),
  organization_kind: kindSchema,
  city: z.string().nullable(),
  role: roleSchema,
  invited_by_name: z.string().nullable(),
  invited_at: isoDate,
});
const _invitationWelcome: Matches<
  z.input<typeof invitationWelcomeSchema>,
  Schemas["InvitationWelcome"]
> = true;

export const contactTrackingSchema = z.object({
  id: uuid,
  status: z.string(),
  notes: z.string().nullable(),
});
const _contactTracking: Matches<
  z.input<typeof contactTrackingSchema>,
  Schemas["ContactRequestTracking"]
> = true;

export const mfaResetSchema = z.object({
  removed_factors: z.number().int(),
});
const _mfaReset: Matches<
  z.input<typeof mfaResetSchema>,
  Schemas["MfaReset"]
> = true;

export const credentialsStateSchema = z.object({
  license_number: z.string().nullable(),
  credentials_verified_at: isoDate.nullable(),
  released_studies: z.number().int(),
});
const _credentialsState: Matches<
  z.input<typeof credentialsStateSchema>,
  Schemas["CredentialsState"]
> = true;

/**
 * Les vérifications de type ci-dessus n'ont aucun effet à l'exécution ;
 * cette référence évite seulement qu'un outil les signale comme mortes.
 */
export const CONTRACT_CHECKS = [
  _uploadToken,
  _uploadResult,
  _addendum,
  _profile,
  _sessionInfo,
  _study,
  _studyPage,
  _report,
  _viewer,
  _pdf,
  _template,
  _verification,
  _metrics,
  _organization,
  _member,
  _adminOrganization,
  _contactRequest,
  _opsRun,
  _alert,
  _prioritySla,
  _sla,
  _controlOverview,
  _controlAnalytics,
  _pipelineStudy,
  _billingLine,
  _serviceHealth,
  _systemStatus,
  _platformSettings,
  _auditEntry,
  _userMembership,
  _adminUser,
  _clinicDetail,
  _contractEndResult,
  _invitationWelcome,
  _contactTracking,
  _mfaReset,
  _credentialsState,
] as const;

export type ApiStudy = z.output<typeof studySchema>;
export type ApiReport = z.output<typeof reportSchema>;
export type ApiAddendum = z.output<typeof addendumSchema>;
export type ApiMember = z.output<typeof memberSchema>;
export type ApiAdminOrganization = z.output<typeof adminOrganizationSchema>;
export type ApiContactRequest = z.output<typeof contactRequestSchema>;
export type ApiMetrics = z.output<typeof metricsSchema>;
export type ApiOrganization = z.output<typeof organizationSchema>;
export type ApiControlOverview = z.output<typeof controlOverviewSchema>;
export type ApiControlAnalytics = z.output<typeof controlAnalyticsSchema>;
export type ApiPipelineStudy = z.output<typeof pipelineStudySchema>;
export type ApiBillingLine = z.output<typeof billingLineSchema>;
export type ApiSystemStatus = z.output<typeof systemStatusSchema>;
export type ApiPlatformSettings = z.output<typeof platformSettingsSchema>;
export type ApiAuditEntry = z.output<typeof auditEntrySchema>;
export type ApiAdminUser = z.output<typeof adminUserSchema>;
export type ApiClinicDetail = z.output<typeof clinicDetailSchema>;
export type ApiContractEndResult = z.output<typeof contractEndResultSchema>;
export type ApiInvitationWelcome = z.output<typeof invitationWelcomeSchema>;
/** Corps de `POST /admin/clinics/{id}/end-contract`, tel que le contrat le décrit. */
export type ApiContractEnd = Schemas["ContractEnd"];
export type ApiOpsRun = z.output<typeof opsRunSchema>;
export type ApiAlert = z.output<typeof alertSchema>;
