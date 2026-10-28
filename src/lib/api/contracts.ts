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

// Le format qu'accepte le type `uuid` de Postgres, sans exiger de version
// RFC 9562 : `z.uuid()` refuserait les identifiants fixes du jeu de départ.
const uuid = z.guid();
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
  // Absent d'une réponse antérieure à l'attribution par l'équipe.
  assigned_at: isoDate.nullable().optional(),
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

/** Groupe de modalités qu'un radiologue lit (`ModalityGroup` du service). */
export const modalityGroupSchema = z.enum([
  "radiography",
  "mammography",
  "ultrasound",
  "ct",
  "mri",
  "other",
]);

export const priorShareSchema = z.object({
  id: uuid,
  prior_study_id: uuid,
  profile_id: uuid,
  study_date: isoDate,
  modality: z.string().nullable(),
  body_part: z.string().nullable(),
  has_signed_report: z.boolean(),
  shared_at: isoDate,
});
const _priorShare: Matches<
  z.input<typeof priorShareSchema>,
  Schemas["PriorShareOut"]
> = true;

export const priorCandidateSchema = z.object({
  study_id: uuid,
  match: z.enum(["certain", "probable"]),
  study_date: isoDate,
  modality: z.string().nullable(),
  body_part: z.string().nullable(),
  patient_name: z.string().nullable(),
  patient_id_local: z.string().nullable(),
  patient_birthdate: isoDate.nullable(),
  has_signed_report: z.boolean(),
  shared: z.boolean(),
});
const _priorCandidate: Matches<
  z.input<typeof priorCandidateSchema>,
  Schemas["PriorCandidateOut"]
> = true;

export const assignmentStateSchema = z.object({
  study_id: uuid,
  status: studyStatusSchema,
  priority: z.enum(["routine", "urgent"]),
  modality: z.string().nullable(),
  assigned_to: uuid.nullable(),
  assigned_to_name: z.string().nullable(),
  assigned_at: isoDate.nullable(),
  assigned_by_rule: z.enum(["modality", "schedule"]).nullable().optional(),
  draft_in_progress: z.boolean(),
  candidates: z.array(
    z.object({
      profile_id: uuid,
      name: z.string(),
      organization_name: z.string(),
      via_pool: z.boolean(),
      open_studies: z.number().int(),
    }),
  ),
  prior_shares: z.array(priorShareSchema),
  notified: z.boolean().nullable().optional(),
});
const _assignment: Matches<
  z.input<typeof assignmentStateSchema>,
  Schemas["AssignmentState"]
> = true;

export const studyPageSchema = z.object({
  items: z.array(studySchema),
  total: z.number().int(),
  next_cursor: z.string().nullable().optional(),
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

export const viewerTokenRenewedSchema = z.object({
  expires_in: z.number().int(),
});
const _viewerRenewed: Matches<
  z.input<typeof viewerTokenRenewedSchema>,
  Schemas["ViewerTokenRenewed"]
> = true;

export const pdfLinkSchema = z.object({
  url: browserUrl,
  expires_in: z.number().int(),
});
const _pdf: Matches<z.input<typeof pdfLinkSchema>, Schemas["PdfLink"]> = true;

// ─── Espace de formation (docs/formation.md du backend) ─────────────

export const trainingSourceSchema = z.object({
  name: z.string(),
  license: z.string(),
  // Lien ouvert depuis l'écran du cas : https uniquement.
  url: browserUrl,
  doi: z.string().nullable(),
});
const _trainingSource: Matches<
  z.input<typeof trainingSourceSchema>,
  Schemas["TrainingSource"]
> = true;

export const trainingStateSchema = z.enum(["todo", "draft", "submitted"]);

export const trainingCaseSchema = z.object({
  id: uuid,
  slug: z.string(),
  position: z.number().int(),
  modality: z.string(),
  body_part: z.string().nullable(),
  series_count: z.number().int().nullable(),
  instance_count: z.number().int().nullable(),
  title: z.string(),
  indication: z.string(),
  instructions: z.string().nullable(),
  source: trainingSourceSchema,
  state: trainingStateSchema,
  attempt_id: uuid.nullable(),
  submitted_at: isoDate.nullable(),
  has_reference: z.boolean(),
  reviewed_by: z.string().nullable(),
  published: z.boolean(),
});
const _trainingCase: Matches<
  z.input<typeof trainingCaseSchema>,
  Schemas["TrainingCase"]
> = true;

export const trainingAddendumSchema = z.object({
  body: z.string(),
  created_at: isoDate,
});
const _trainingAddendum: Matches<
  z.input<typeof trainingAddendumSchema>,
  Schemas["TrainingAddendum"]
> = true;

export const trainingReferenceSchema = z.object({
  sections: z.record(z.string(), z.string()),
  points: z.array(z.string()),
  basis: z.string(),
  author: z.string(),
  validated_at: isoDate,
});
const _trainingReference: Matches<
  z.input<typeof trainingReferenceSchema>,
  Schemas["TrainingReference"]
> = true;

export const trainingAttemptSchema = z.object({
  id: uuid,
  case_id: uuid,
  sections: z.record(z.string(), z.string()),
  version: z.number().int(),
  submitted_at: isoDate.nullable(),
  addenda: z.array(trainingAddendumSchema),
  reference: trainingReferenceSchema.nullable(),
  created_at: isoDate,
  updated_at: isoDate,
});
const _trainingAttempt: Matches<
  z.input<typeof trainingAttemptSchema>,
  Schemas["TrainingAttempt"]
> = true;

export const trainingCaseDetailSchema = z.object({
  case: trainingCaseSchema,
  attempt: trainingAttemptSchema.nullable(),
});
const _trainingCaseDetail: Matches<
  z.input<typeof trainingCaseDetailSchema>,
  Schemas["TrainingCaseDetail"]
> = true;

export const traineeProgressSchema = z.object({
  profile_id: uuid,
  submitted: z.array(z.string()),
  in_progress: z.array(z.string()),
  last_activity_at: isoDate,
});
const _traineeProgress: Matches<
  z.input<typeof traineeProgressSchema>,
  Schemas["TraineeProgress"]
> = true;

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
  // Document annulé par l'équipe IMAFRIK : à ne pas utiliser.
  voided_at: isoDate.nullable().optional(),
});
const _verification: Matches<
  z.input<typeof verificationSchema>,
  Schemas["VerificationResult"]
> = true;

export const metricsSchema = z.object({
  by_status: z.record(z.string(), z.number().int()),
  urgent_open: z.number().int(),
  assigned_to_me: z.number().int(),
  assigned_new: z.number().int(),
  to_assign: z.number().int(),
  urgent_to_take: z.number().int(),
  received_last_30_days: z.number().int(),
  median_turnaround_minutes: z.number().nullable(),
  reports_to_download: z.number().int(),
});
const _metrics: Matches<
  z.input<typeof metricsSchema>,
  Schemas["Metrics"]
> = true;

/** État d'habilitation d'un radiologue, calculé par la base (`credential_state`). */
export const credentialStateSchema = z.enum([
  "undeclared",
  "license_missing",
  "documents_missing",
  "pending",
  "expired",
  "verified",
]);

/** Exercice déclaré : inscrit à l'Ordre, ou résident. */
export const practiceStatusSchema = z.enum(["registered", "resident"]);

/** Un justificatif déposé par un radiologue, et la décision prise. */
export const credentialDocumentSchema = z.object({
  id: uuid,
  kind: z.enum(["diploma", "enrollment_certificate"]),
  file_name: z.string(),
  content_type: z.string(),
  size_bytes: z.number().int(),
  valid_until: isoDate.nullable().optional(),
  status: z.enum(["pending", "accepted", "rejected"]),
  rejection_reason: z.string().nullable().optional(),
  uploaded_at: isoDate,
  reviewed_at: isoDate.nullable().optional(),
});
const _credentialDocument: Matches<
  z.input<typeof credentialDocumentSchema>,
  Schemas["CredentialDocument"]
> = true;

/** Jeton de dépôt de justificatif, remis au navigateur. */
export const documentTokenSchema = z.object({
  token: z.string(),
  expires_in: z.number().int(),
});
const _documentToken: Matches<
  z.input<typeof documentTokenSchema>,
  Schemas["DocumentToken"]
> = true;

/** URL de consultation d'un justificatif, valable quelques minutes. */
export const documentViewSchema = z.object({
  url: browserUrl,
  expires_in: z.number().int(),
});
const _documentView: Matches<
  z.input<typeof documentViewSchema>,
  Schemas["DocumentView"]
> = true;

/** Nature d'un engagement contractuel (voir `lib/agreements.ts`). */
export const agreementKindSchema = z.enum([
  "radiologist_agreement",
  "clinic_agreement",
]);

// Empreinte et version : un format strict, pour qu'un texte altéré en
// transit ne puisse pas se présenter comme la version en vigueur.
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const agreementVersion = z.string().regex(/^\d{1,3}\.\d{1,3}$/);

/** Un engagement dû par le compte connecté, et son acceptation. */
export const agreementStatusSchema = z.object({
  kind: agreementKindSchema,
  version: agreementVersion,
  title: z.string(),
  effective_date: isoDate,
  sha256,
  accepted_at: isoDate.nullable().optional(),
  accepted_by: z.string().nullable().optional(),
  can_accept: z.boolean(),
});
const _agreementStatus: Matches<
  z.input<typeof agreementStatusSchema>,
  Schemas["AgreementStatus"]
> = true;

/** Texte d'une version d'engagement, dans une langue. */
export const agreementDocumentSchema = z.object({
  kind: agreementKindSchema,
  version: agreementVersion,
  title: z.string(),
  effective_date: isoDate,
  sha256,
  locale: z.enum(["fr", "en"]),
  authoritative: z.boolean(),
  body_markdown: z.string(),
});
const _agreementDocument: Matches<
  z.input<typeof agreementDocumentSchema>,
  Schemas["AgreementDocument"]
> = true;

/** Acceptation enregistrée. */
export const agreementAcceptanceSchema = z.object({
  id: uuid,
  kind: agreementKindSchema,
  version: agreementVersion,
  sha256,
  accepted_at: isoDate,
});
const _agreementAcceptance: Matches<
  z.input<typeof agreementAcceptanceSchema>,
  Schemas["AgreementAcceptance"]
> = true;

/** Corps de `POST /me/agreements`, tel que le contrat le décrit. */
export type AgreementAcceptanceBody = Schemas["AgreementAcceptanceCreate"];

export const profileSchema = z.object({
  id: uuid,
  full_name: z.string(),
  title: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
  locale: z.enum(["fr", "en"]),
  // Habilitation enregistrée par l'équipe IMAFRIK.
  credentials_verified: z.boolean(),
  practice_status: practiceStatusSchema.nullable().optional(),
  credentials_valid_until: isoDate.nullable().optional(),
  // État calculé par la base : seul « verified » ouvre l'accès aux examens.
  credential_state: credentialStateSchema,
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
  ai_review: z.boolean(),
});
const _sessionInfo: Matches<
  z.input<typeof sessionInfoSchema>,
  Schemas["SessionInfo"]
> = true;

/** Types de signalement de la relecture par IA : liste fermée par le service. */
export const aiFindingKindSchema = z.enum([
  "contradiction",
  "omission",
  "laterality",
  "context_mismatch",
  "measurement",
  "question_unanswered",
  "critical_finding",
]);

/** Où un passage cité se trouve : une section, ou la demande de la clinique. */
export const aiSourceSchema = z.enum([
  "indication",
  "technique",
  "comparatif",
  "resultats",
  "conclusion",
  "clinical_info",
]);

export const aiReviewSchema = z.object({
  run_id: uuid.nullable(),
  available: z.boolean(),
  findings: z.array(
    z.object({
      kind: aiFindingKindSchema,
      section: aiSourceSchema,
      quote: z.string(),
      related_section: aiSourceSchema.nullish(),
      related_quote: z.string().nullish(),
      note: z.string(),
    }),
  ),
});
const _aiReview: Matches<
  z.input<typeof aiReviewSchema>,
  Schemas["ReviewResponse"]
> = true;

export const aiFeaturesSchema = z.object({
  review: z.boolean(),
  dictation: z.boolean(),
});
const _aiFeatures: Matches<
  z.input<typeof aiFeaturesSchema>,
  Schemas["AiFeatures"]
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
  // Radiologue : modalités lues (nul = toutes) et liste d'urgence.
  read_modalities: z.array(modalityGroupSchema).nullable().optional(),
  urgent_reader: z.boolean(),
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
    // Radiologues dont le numéro d’ordre attend la validation d’IMAFRIK.
    unverified_radiologists: count,
    // Images de signature ou de cachet déposées, à vérifier par l’équipe.
    signing_reviews_due: count,
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

// ─── Activité et facturation d'une clinique (P1, étape 4) ────────────

const monthPrioritySchema = z.object({
  received: count,
  signed: count,
  median_minutes: minutes,
  within_sla: ratio,
});
const _monthPriority: Matches<
  z.input<typeof monthPrioritySchema>,
  Schemas["PriorityActivity"]
> = true;

const monthModalitySchema = z.object({
  modality_group: modalityGroupSchema,
  routine: count,
  urgent: count,
  signed: count,
  median_minutes: minutes,
  within_sla: ratio,
});
const _monthModality: Matches<
  z.input<typeof monthModalitySchema>,
  Schemas["ClinicModalityActivity"]
> = true;

const priorityDelaysSchema = z.object({
  median_minutes: minutes,
  mean_minutes: minutes,
  p90_minutes: minutes,
  within_sla: ratio,
});
const _priorityDelays: Matches<
  z.input<typeof priorityDelaysSchema>,
  Schemas["PriorityDelays"]
> = true;

const radiologistPerformanceSchema = z.object({
  profile_id: uuid,
  full_name: z.string(),
  title: z.string().nullable(),
  signed_routine: count,
  signed_urgent: count,
  median_minutes: minutes,
  within_sla: ratio,
  routine: priorityDelaysSchema,
  urgent: priorityDelaysSchema,
  pickup_median_minutes: minutes,
  reading_median_minutes: minutes,
  released: count,
  urgent_claimed: count,
  assigned_waiting: count,
  in_reading: count,
  previous_median_minutes: minutes,
  previous_within_sla: ratio,
});
const _radiologistPerformance: Matches<
  z.input<typeof radiologistPerformanceSchema>,
  Schemas["RadiologistPerformance"]
> = true;

export const performanceMonthSchema = z.object({
  month: isoDate,
  clinic_id: uuid.nullable(),
  sla_routine_minutes: count,
  sla_urgent_minutes: count,
  radiologists: z.array(radiologistPerformanceSchema),
});
const _performanceMonth: Matches<
  z.input<typeof performanceMonthSchema>,
  Schemas["RadiologistPerformanceMonth"]
> = true;

export const clinicMonthActivitySchema = z.object({
  clinic_id: uuid,
  month: isoDate,
  sla_routine_minutes: count,
  sla_urgent_minutes: count,
  received: count,
  signed: count,
  pending: count,
  median_minutes: minutes,
  within_sla: ratio,
  routine: monthPrioritySchema,
  urgent: monthPrioritySchema,
  by_modality: z.array(monthModalitySchema),
});
const _clinicMonthActivity: Matches<
  z.input<typeof clinicMonthActivitySchema>,
  Schemas["ClinicMonthActivity"]
> = true;

/** Type d'examen de la grille des forfaits techniques (`FeeClass` du service). */
export const feeClassSchema = z.enum([
  "radiography",
  "complex_radiography",
  "hysterosalpingography",
  "ct",
  "complex_ct",
  "mri",
]);

/** Formule d'abonnement d'une clinique (`Plan` du service). */
export const planSchema = z.enum(["essential", "pro", "facility"]);

const statementLineSchema = z.object({
  fee_class: feeClassSchema,
  routine: count,
  urgent: count,
  routine_fee: count,
  urgent_fee: count,
  amount: count,
});
const _statementLine: Matches<
  z.input<typeof statementLineSchema>,
  Schemas["StatementLine"]
> = true;

const outOfGridSchema = z.object({
  modality_group: modalityGroupSchema,
  routine: count,
  urgent: count,
});
const _outOfGrid: Matches<
  z.input<typeof outOfGridSchema>,
  Schemas["OutOfGridActs"]
> = true;

const radiologistActsSchema = z.object({
  profile_id: uuid,
  full_name: z.string(),
  title: z.string().nullable(),
  routine: count,
  urgent: count,
});
const _radiologistActs: Matches<
  z.input<typeof radiologistActsSchema>,
  Schemas["RadiologistActs"]
> = true;

export const clinicStatementSchema = z.object({
  clinic_id: uuid,
  clinic: z.string(),
  month: isoDate,
  closed_at: isoDate.nullable(),
  plan: planSchema.nullable(),
  subscription: count.nullable(),
  lines: z.array(statementLineSchema),
  out_of_grid: z.array(outOfGridSchema),
  acts: count,
  unreported: count,
  radiologists: z.array(radiologistActsSchema),
  technical_total: count,
  total: count.nullable(),
});
const _clinicStatement: Matches<
  z.input<typeof clinicStatementSchema>,
  Schemas["ClinicStatement"]
> = true;

export const billingMonthSchema = z.object({
  month: isoDate,
  closed_at: isoDate.nullable(),
  closable: z.boolean(),
  statements: z.array(clinicStatementSchema),
});
const _billingMonth: Matches<
  z.input<typeof billingMonthSchema>,
  Schemas["BillingMonth"]
> = true;

export const clinicPlanSchema = z.object({
  plan: planSchema,
  monthly_fee: count,
  set_at: isoDate,
});
const _clinicPlan: Matches<
  z.input<typeof clinicPlanSchema>,
  Schemas["ClinicPlan"]
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

export const userMembershipSchema = z.object({
  membership_id: uuid,
  organization_id: uuid,
  organization_name: z.string(),
  organization_kind: kindSchema,
  role: roleSchema,
  read_modalities: z.array(modalityGroupSchema).nullable().optional(),
});
const _userMembership: Matches<
  z.input<typeof userMembershipSchema>,
  Schemas["UserMembership"]
> = true;

export const urgentReaderSchema = z.object({
  profile_id: uuid,
  name: z.string(),
  organization_name: z.string(),
  via_pool: z.boolean(),
  read_modalities: z.array(modalityGroupSchema).nullable(),
  urgent_reader: z.boolean(),
});
const _urgentReader: Matches<
  z.input<typeof urgentReaderSchema>,
  Schemas["UrgentReader"]
> = true;

/** Heure d'un créneau du planning, `HH:MM`. */
const clockTime = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/);

export const assignmentSlotSchema = z.object({
  radiologist_id: uuid,
  weekdays: z.array(z.number().int().min(1).max(7)),
  starts_at: clockTime.nullable().optional(),
  ends_at: clockTime.nullable().optional(),
});
const _assignmentSlot: Matches<
  z.input<typeof assignmentSlotSchema>,
  Schemas["AssignmentSlot"]
> = true;

export const assignmentRulesSchema = z.object({
  clinic_id: uuid,
  time_zone: z.string(),
  version: z.string(),
  slots: z.array(assignmentSlotSchema),
  modalities: z.array(
    z.object({ group: modalityGroupSchema, radiologist_id: uuid }),
  ),
  radiologists: z.array(
    z.object({
      profile_id: uuid,
      name: z.string(),
      organization_name: z.string(),
      via_pool: z.boolean(),
      read_modalities: z.array(modalityGroupSchema).nullable(),
      can_receive: z.boolean(),
    }),
  ),
});
const _assignmentRules: Matches<
  z.input<typeof assignmentRulesSchema>,
  Schemas["AssignmentRules"]
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
  // Habilitation enregistrée ; nulle tant qu'elle reste à faire.
  credentials_verified_at: isoDate.nullable().optional(),
  practice_status: practiceStatusSchema.nullable().optional(),
  credentials_valid_until: isoDate.nullable().optional(),
  credential_state: credentialStateSchema,
  // Fin de la relation : plus aucune appartenance à une organisation
  // active depuis cette date ; nulle tant qu'il en reste une.
  inactive_since: isoDate.nullable().optional(),
  // Images de signature ou de cachet en attente de l’équipe IMAFRIK.
  signing_review_due: count,
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
  // Absent d'une réponse antérieure au logo en filigrane.
  logo_updated_at: isoDate.nullable().optional(),
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

/** Logo d'une clinique, tel qu'il s'imprime en filigrane des comptes-rendus. */
export const clinicLogoSchema = z.object({
  image_base64: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  updated_at: isoDate,
});
const _clinicLogo: Matches<
  z.input<typeof clinicLogoSchema>,
  Schemas["ClinicLogo"]
> = true;

/** Image de signature ou de cachet d'un radiologue, sans son contenu. */
export const signingAssetSchema = z.object({
  id: uuid,
  kind: z.enum(["signature", "stamp"]),
  source: z.enum(["drawn", "uploaded", "legacy"]),
  version: z.number().int().positive(),
  // Nulles pour l'image historique reprise telle quelle.
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  review_state: z.enum(["pending_review", "accepted", "rejected"]),
  rejection_reason: z.string().nullable().optional(),
  created_at: isoDate,
  reviewed_at: isoDate.nullable().optional(),
});
const _signingAsset: Matches<
  z.input<typeof signingAssetSchema>,
  Schemas["SigningAsset"]
> = true;

/** Où en est le radiologue : images acceptées, en attente, refusées ; code. */
export const signingSetupSchema = z.object({
  signature: signingAssetSchema.nullable().optional(),
  signature_pending: signingAssetSchema.nullable().optional(),
  signature_rejected: signingAssetSchema.nullable().optional(),
  stamp: signingAssetSchema.nullable().optional(),
  stamp_pending: signingAssetSchema.nullable().optional(),
  stamp_rejected: signingAssetSchema.nullable().optional(),
  pin_set: z.boolean(),
  pin_locked_until: isoDate.nullable().optional(),
});
const _signingSetup: Matches<
  z.input<typeof signingSetupSchema>,
  Schemas["SigningSetup"]
> = true;

/** Contenu d'une image, pour l'aperçu de son titulaire ou de l'équipe. */
export const signingAssetImageSchema = z.object({
  image_base64: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/),
  media_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});
const _signingAssetImage: Matches<
  z.input<typeof signingAssetImageSchema>,
  Schemas["SigningAssetImage"]
> = true;

/** Corps de `POST /reports/{id}/sign`, tel que le contrat le décrit. */
export type ApiSignRequest = Schemas["SignRequest"];
/** Corps de `POST /reports/{id}/addenda`, tel que le contrat le décrit. */
export type ApiAddendumCreate = Schemas["AddendumCreate"];
/** Corps de `PUT /me/signing/{kind}`. */
export type ApiSigningAssetUpload = Schemas["SigningAssetUpload"];
/** Corps de `PUT /me/signing/pin`. */
export type ApiSigningPinSet = Schemas["SigningPinSet"];
/** Corps de `POST /admin/users/{id}/signing/assets/{asset_id}/review`. */
export type ApiSigningAssetReview = Schemas["SigningAssetReview"];

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

/**
 * Issue d'une anonymisation : profil minimal gardé (des documents signés
 * ou le journal d'audit le référencent), ou supprimé entièrement.
 */
export const anonymizationResultSchema = z.object({
  outcome: z.enum(["kept", "deleted"]),
});
const _anonymizationResult: Matches<
  z.input<typeof anonymizationResultSchema>,
  Schemas["AnonymizationResult"]
> = true;

/** Issue de l'annulation d'un compte-rendu signé par erreur. */
export const reportVoidResultSchema = z.object({ study_id: uuid });
const _reportVoidResult: Matches<
  z.input<typeof reportVoidResultSchema>,
  Schemas["ReportVoidResult"]
> = true;

export const credentialsStateSchema = z.object({
  license_number: z.string().nullable(),
  credentials_verified_at: isoDate.nullable(),
  credentials_valid_until: isoDate.nullable().optional(),
  credential_state: credentialStateSchema,
  released_studies: z.number().int(),
});
const _credentialsState: Matches<
  z.input<typeof credentialsStateSchema>,
  Schemas["CredentialsState"]
> = true;

// ─── Passerelles des cliniques ──────────────────────────────────────
//
// Enrôlement par code, approbation, révocation, confiance du PACS : voir
// la décision du service, `docs/plan/enrolement-passerelle.md`. Aucune
// de ces réponses ne porte d'AE Title ni de clé : le service ne les rend
// qu'au poste qui s'enrôle.

// Empreinte SHA-256 d'un certificat, ou d'un fichier : `sha256`, le même
// format strict que celui des engagements, plus haut.

export const gatewayStatusSchema = z.enum([
  "awaiting_approval",
  "pending",
  "active",
  "suspended",
  "rejected",
  "revoked",
]);

/** Issue de l'invitation d'une personne à la création d'une clinique. */
export const clinicInvitationSchema = z.object({
  email: z.string(),
  full_name: z.string(),
  role: z.enum(["clinic_staff", "radiologist"]),
  status: z.enum(["invited", "attached", "failed"]),
  error: z.string().nullable().optional(),
  membership_id: uuid.nullable().optional(),
});
const _clinicInvitation: Matches<
  z.input<typeof clinicInvitationSchema>,
  Schemas["ClinicInvitation"]
> = true;

/** Une clinique créée depuis la console, et l'issue des invitations de son équipe. */
export const clinicCreatedSchema = z.object({
  id: uuid,
  slug: z.string(),
  invitations: z.array(clinicInvitationSchema),
});
const _clinicCreated: Matches<
  z.input<typeof clinicCreatedSchema>,
  Schemas["ClinicCreated"]
> = true;

/** Code d'enrôlement, montré une seule fois. */
export const enrollmentCodeIssuedSchema = z.object({
  id: uuid,
  code: z.string().regex(/^IMF(-[A-Z2-9]{4}){4}$/),
  created_at: isoDate,
  expires_at: isoDate,
});
const _enrollmentCodeIssued: Matches<
  z.input<typeof enrollmentCodeIssuedSchema>,
  Schemas["EnrollmentCodeIssued"]
> = true;

/** Code d'enrôlement en cours, sans sa valeur. */
export const enrollmentCodeInfoSchema = z.object({
  id: uuid,
  created_at: isoDate,
  expires_at: isoDate,
  attempts: count,
  created_by_name: z.string().nullable(),
});
const _enrollmentCodeInfo: Matches<
  z.input<typeof enrollmentCodeInfoSchema>,
  Schemas["EnrollmentCodeInfo"]
> = true;

const tailscaleNodeSchema = z.object({
  online: z.boolean(),
  last_seen: isoDate.nullable(),
  address: z.string().nullable(),
});
const _tailscaleNode: Matches<
  z.input<typeof tailscaleNodeSchema>,
  Schemas["TailscaleNode"]
> = true;

/** Une passerelle, vue de la tour de contrôle. */
export const gatewaySummarySchema = z.object({
  id: uuid,
  organization_id: uuid,
  clinic_name: z.string(),
  origin: z.enum(["enrolled", "adopted"]),
  status: gatewayStatusSchema,
  hostname: z.string(),
  machine_guid: uuid.nullable(),
  key_protection: z.enum(["tpm", "software_non_exportable"]).nullable(),
  enrolled_from_ip: z.string().nullable(),
  tailscale_hostname: z.string().nullable(),
  network_address: z.string().nullable(),
  address_source: z.enum(["tailscale", "fixed"]),
  created_at: isoDate,
  approved_at: isoDate.nullable(),
  approved_by_name: z.string().nullable(),
  activated_at: isoDate.nullable(),
  rejected_at: isoDate.nullable(),
  rejection_reason: z.string().nullable(),
  suspended_at: isoDate.nullable(),
  suspension_reason: z.string().nullable(),
  revoked_at: isoDate.nullable(),
  revocation_reason: z.string().nullable(),
  renewal_requested_at: isoDate.nullable(),
  certificate_fingerprint: sha256.nullable(),
  certificate_not_after: isoDate.nullable(),
  certificate_applied: z.boolean(),
  last_heartbeat_at: isoDate.nullable(),
  pending_series: count.nullable(),
  oldest_pending_seconds: count.nullable(),
  disk_free_bytes: z.number().nullable(),
  kit_version: z.string().nullable(),
  orthanc_version: z.string().nullable(),
  tailscale: tailscaleNodeSchema.nullable().optional(),
});
const _gatewaySummary: Matches<
  z.input<typeof gatewaySummarySchema>,
  Schemas["GatewaySummary"]
> = true;

const gatewayCertificateSchema = z.object({
  fingerprint: sha256,
  origin: z.enum(["enrollment", "renewal", "adoption"]),
  not_before: isoDate,
  not_after: isoDate,
  created_at: isoDate,
  applied_at: isoDate.nullable(),
  first_used_at: isoDate.nullable(),
  retire_after: isoDate.nullable(),
  retired_at: isoDate.nullable(),
  retire_reason: z.string().nullable(),
  removal_applied_at: isoDate.nullable(),
});
const _gatewayCertificate: Matches<
  z.input<typeof gatewayCertificateSchema>,
  Schemas["GatewayCertificateInfo"]
> = true;

const gatewayEventSchema = z.object({
  at: isoDate,
  action: z.string(),
  actor_name: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
const _gatewayEvent: Matches<
  z.input<typeof gatewayEventSchema>,
  Schemas["GatewayEvent"]
> = true;

/** Une passerelle, ses certificats et son historique. */
export const gatewayDetailSchema = gatewaySummarySchema.extend({
  certificates: z.array(gatewayCertificateSchema),
  history: z.array(gatewayEventSchema),
});
const _gatewayDetail: Matches<
  z.input<typeof gatewayDetailSchema>,
  Schemas["GatewayDetail"]
> = true;

const pkiCycleSchema = z.object({
  reported_at: isoDate,
  outcome: z.enum(["applied", "deferred", "refused", "failed"]),
  restarted: z.boolean(),
  added: count,
  removed: count,
  error: z.string().nullable(),
});
const _pkiCycle: Matches<
  z.input<typeof pkiCycleSchema>,
  Schemas["PkiCycle"]
> = true;

const pendingChangeSchema = z.object({
  gateway_id: uuid,
  clinic_name: z.string(),
  hostname: z.string(),
  change: z.enum(["add", "remove"]),
});
const _pendingChange: Matches<
  z.input<typeof pendingChangeSchema>,
  Schemas["PendingChange"]
> = true;

const pkiAgentSchema = z.object({
  last_report_at: isoDate.nullable(),
  last_outcome: z
    .enum(["unchanged", "applied", "deferred", "refused", "failed"])
    .nullable(),
  last_error: z.string().nullable(),
  last_restart_at: isoDate.nullable(),
  applied_at: isoDate.nullable(),
  pending: z.array(pendingChangeSchema),
  cycles: z.array(pkiCycleSchema),
});
const _pkiAgent: Matches<
  z.input<typeof pkiAgentSchema>,
  Schemas["PkiAgent"]
> = true;

const kitInfoSchema = z.object({
  file_name: z.string(),
  size_bytes: count,
  sha256,
  version: z.string().nullable(),
  built_at: isoDate,
  manifest_matches: z.boolean().nullable(),
  signature_status: z.enum(["signed", "unsigned"]).nullable(),
  publisher: z.string().nullable(),
  signature_expires_at: isoDate.nullable(),
  timestamped: z.boolean().nullable(),
});
const _kitInfo: Matches<
  z.input<typeof kitInfoSchema>,
  Schemas["KitInfo"]
> = true;

const readinessSchema = z.object({
  ready: z.boolean(),
  missing: z.array(
    z.enum(["tailscale_credentials", "pacs_host", "pacs_certificate"]),
  ),
});
const _readiness: Matches<
  z.input<typeof readinessSchema>,
  Schemas["Readiness"]
> = true;

/** Vue d'ensemble des passerelles. */
export const gatewayOverviewSchema = z.object({
  gateways: z.array(gatewaySummarySchema),
  counts: z.record(z.string(), count),
  alerts: z.array(alertSchema),
  readiness: readinessSchema,
  agent: pkiAgentSchema,
  kit: kitInfoSchema.nullable(),
});
const _gatewayOverview: Matches<
  z.input<typeof gatewayOverviewSchema>,
  Schemas["GatewayOverview"]
> = true;

/** Connexion Tailscale de la plateforme, sans son secret. */
export const tailscaleConnectionSchema = z.object({
  source: z.enum(["console", "environment"]).nullable(),
  client_id: z.string().nullable(),
  secret_last4: z.string().nullable(),
  configured_at: isoDate.nullable(),
  configured_by_name: z.string().nullable(),
  scopes: z.array(z.string()),
  required_scopes: z.array(z.string()),
  encryption_available: z.boolean(),
  policy_file_available: z.boolean(),
});
const _tailscaleConnection: Matches<
  z.input<typeof tailscaleConnectionSchema>,
  Schemas["TailscaleConnection"]
> = true;

/** Résultat d'un test de la connexion Tailscale. */
export const tailscaleTestSchema = z.object({
  ok: z.boolean(),
  scopes: z.array(z.string()),
  missing_scopes: z.array(z.string()),
  policy_available: z.boolean(),
  error: z.string().nullable().optional(),
});
const _tailscaleTest: Matches<
  z.input<typeof tailscaleTestSchema>,
  Schemas["TailscaleTest"]
> = true;

/** Politique d'accès versionnée, comparée à celle du réseau. */
export const policyComparisonSchema = z.object({
  repository_available: z.boolean(),
  tailnet_available: z.boolean(),
  in_sync: z.boolean().nullable(),
  diff: z.string(),
  etag: z.string().nullable(),
  error: z.string().nullable().optional(),
});
const _policyComparison: Matches<
  z.input<typeof policyComparisonSchema>,
  Schemas["PolicyComparison"]
> = true;

/** Corps de `POST /admin/clinics`, tel que le contrat le décrit. */
export type ApiClinicCreate = Schemas["ClinicCreate"];
export type ApiGatewaySummary = z.output<typeof gatewaySummarySchema>;
export type ApiGatewayDetail = z.output<typeof gatewayDetailSchema>;
export type ApiGatewayOverview = z.output<typeof gatewayOverviewSchema>;
export type ApiEnrollmentCodeInfo = z.output<typeof enrollmentCodeInfoSchema>;
export type ApiTailscaleConnection = z.output<typeof tailscaleConnectionSchema>;
export type ApiTailscaleTest = z.output<typeof tailscaleTestSchema>;
export type ApiPolicyComparison = z.output<typeof policyComparisonSchema>;

/**
 * Les vérifications de type ci-dessus n'ont aucun effet à l'exécution ;
 * cette référence évite seulement qu'un outil les signale comme mortes.
 */
export const CONTRACT_CHECKS = [
  _clinicInvitation,
  _clinicCreated,
  _enrollmentCodeIssued,
  _enrollmentCodeInfo,
  _tailscaleNode,
  _gatewaySummary,
  _gatewayCertificate,
  _gatewayEvent,
  _gatewayDetail,
  _pkiCycle,
  _pendingChange,
  _pkiAgent,
  _kitInfo,
  _readiness,
  _gatewayOverview,
  _tailscaleConnection,
  _tailscaleTest,
  _policyComparison,
  _uploadToken,
  _reportVoidResult,
  _credentialDocument,
  _documentToken,
  _documentView,
  _agreementStatus,
  _agreementDocument,
  _agreementAcceptance,
  _uploadResult,
  _addendum,
  _profile,
  _sessionInfo,
  _aiReview,
  _aiFeatures,
  _study,
  _priorShare,
  _priorCandidate,
  _assignment,
  _studyPage,
  _report,
  _viewer,
  _viewerRenewed,
  _pdf,
  _trainingSource,
  _trainingCase,
  _trainingAddendum,
  _trainingReference,
  _trainingAttempt,
  _trainingCaseDetail,
  _traineeProgress,
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
  _monthPriority,
  _monthModality,
  _priorityDelays,
  _radiologistPerformance,
  _performanceMonth,
  _clinicMonthActivity,
  _statementLine,
  _outOfGrid,
  _radiologistActs,
  _clinicStatement,
  _billingMonth,
  _clinicPlan,
  _serviceHealth,
  _systemStatus,
  _platformSettings,
  _auditEntry,
  _userMembership,
  _urgentReader,
  _assignmentSlot,
  _assignmentRules,
  _adminUser,
  _clinicDetail,
  _clinicLogo,
  _signingAsset,
  _signingSetup,
  _signingAssetImage,
  _contractEndResult,
  _invitationWelcome,
  _contactTracking,
  _mfaReset,
  _anonymizationResult,
  _credentialsState,
] as const;

export type ApiStudy = z.output<typeof studySchema>;
export type ApiAssignmentState = z.output<typeof assignmentStateSchema>;
export type ApiPriorCandidate = z.output<typeof priorCandidateSchema>;
export type ApiPriorShare = z.output<typeof priorShareSchema>;
export type ApiUrgentReader = z.output<typeof urgentReaderSchema>;
export type ApiAssignmentRules = z.output<typeof assignmentRulesSchema>;
export type ApiUserMembership = z.output<typeof userMembershipSchema>;
export type ModalityGroup = z.output<typeof modalityGroupSchema>;
export type ApiReport = z.output<typeof reportSchema>;
export type ApiAddendum = z.output<typeof addendumSchema>;
export type ApiTrainingCase = z.output<typeof trainingCaseSchema>;
export type ApiTrainingAttempt = z.output<typeof trainingAttemptSchema>;
export type ApiMember = z.output<typeof memberSchema>;
export type ApiAdminOrganization = z.output<typeof adminOrganizationSchema>;
export type ApiContactRequest = z.output<typeof contactRequestSchema>;
export type ApiMetrics = z.output<typeof metricsSchema>;
export type ApiOrganization = z.output<typeof organizationSchema>;
export type ApiControlOverview = z.output<typeof controlOverviewSchema>;
export type ApiControlAnalytics = z.output<typeof controlAnalyticsSchema>;
export type ApiPipelineStudy = z.output<typeof pipelineStudySchema>;
export type ApiClinicMonthActivity = z.output<typeof clinicMonthActivitySchema>;
export type ApiClinicStatement = z.output<typeof clinicStatementSchema>;
export type ApiPerformanceMonth = z.output<typeof performanceMonthSchema>;
export type ApiBillingMonth = z.output<typeof billingMonthSchema>;
export type ApiClinicPlan = z.output<typeof clinicPlanSchema>;
export type FeeClass = z.output<typeof feeClassSchema>;
export type Plan = z.output<typeof planSchema>;
export type ApiSystemStatus = z.output<typeof systemStatusSchema>;
export type ApiPlatformSettings = z.output<typeof platformSettingsSchema>;
export type ApiAuditEntry = z.output<typeof auditEntrySchema>;
export type ApiAdminUser = z.output<typeof adminUserSchema>;
export type ApiSigningAsset = z.output<typeof signingAssetSchema>;
export type ApiSigningSetup = z.output<typeof signingSetupSchema>;
export type ApiSigningAssetImage = z.output<typeof signingAssetImageSchema>;
export type ApiCredentialDocument = z.output<typeof credentialDocumentSchema>;
export type ApiClinicDetail = z.output<typeof clinicDetailSchema>;
export type ApiContractEndResult = z.output<typeof contractEndResultSchema>;
export type ApiInvitationWelcome = z.output<typeof invitationWelcomeSchema>;
/** Corps de `POST /admin/clinics/{id}/end-contract`, tel que le contrat le décrit. */
export type ApiContractEnd = Schemas["ContractEnd"];
/** Corps de `POST /admin/users/{id}/anonymize`, tel que le contrat le décrit. */
export type ApiAnonymizationRequest = Schemas["AnonymizationRequest"];
export type ApiOpsRun = z.output<typeof opsRunSchema>;
export type ApiAlert = z.output<typeof alertSchema>;
