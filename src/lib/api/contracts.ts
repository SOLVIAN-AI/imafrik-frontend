import { z } from "zod";

import type { components } from "@/lib/api/schema";

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
  report_id: uuid.nullable(),
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
  viewer_url: z.string().url(),
  expires_in: z.number().int(),
});
const _viewer: Matches<
  z.input<typeof viewerTokenSchema>,
  Schemas["ViewerToken"]
> = true;

export const pdfLinkSchema = z.object({
  url: z.string().url(),
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
  locale: z.string(),
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
  handled_at: isoDate.nullable(),
  created_at: isoDate,
});
const _contactRequest: Matches<
  z.input<typeof contactRequestSchema>,
  Schemas["ContactRequest"]
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
] as const;

export type ApiStudy = z.output<typeof studySchema>;
export type ApiReport = z.output<typeof reportSchema>;
export type ApiAddendum = z.output<typeof addendumSchema>;
export type ApiMember = z.output<typeof memberSchema>;
export type ApiAdminOrganization = z.output<typeof adminOrganizationSchema>;
export type ApiContactRequest = z.output<typeof contactRequestSchema>;
export type ApiMetrics = z.output<typeof metricsSchema>;
export type ApiOrganization = z.output<typeof organizationSchema>;
