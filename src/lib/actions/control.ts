"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiGet, apiSend } from "@/lib/api/client";
import {
  type ApiAnonymizationRequest,
  type ApiContractEnd,
  anonymizationResultSchema,
  aiFeaturesSchema,
  clinicDetailSchema,
  contactTrackingSchema,
  contractEndResultSchema,
  credentialsStateSchema,
  documentViewSchema,
  reportVoidResultSchema,
  mfaResetSchema,
  platformSettingsSchema,
} from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  run,
  rejectInvalidIds,
} from "@/lib/actions/result";
import { unreportedCount } from "@/lib/contract-end";
import {
  type CredentialDocument,
  getUserCredentialDocuments,
} from "@/lib/data/credentials";
import { isDemoMode } from "@/lib/demo/mode";
import { isLocale, type Locale } from "@/lib/i18n/locale";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

/**
 * Gestes de la tour de contrôle.
 *
 * Chaque entrée est validée ici avec les **mêmes bornes que le service**
 * — un message clair avant l'aller-retour —, puis revalidée par le
 * service, qui vérifie le rôle d'administrateur en base et trace le geste
 * dans le journal d'audit. La validation de l'interface est un confort ;
 * celle du service est la protection.
 *
 * Les messages de validation viennent des textes de l'utilisateur : les
 * schémas sont donc construits à chaque appel, dans sa langue.
 */

/** Messages de validation de la tour de contrôle. */
type Validation = AppMessages["admin"]["validation"];

/**
 * Schéma des réglages de la plateforme.
 *
 * @param m Messages de validation, dans la langue de l'utilisateur.
 */
const settingsSchema = (m: Validation) =>
  z
    .object({
      urgentMinutes: z.coerce
        .number({ invalid_type_error: m.urgentInvalid })
        .int(m.urgentInteger)
        .min(5, m.urgentMin)
        .max(720, m.urgentMax),
      routineMinutes: z.coerce
        .number({ invalid_type_error: m.routineInvalid })
        .int(m.routineInteger)
        .min(15, m.routineMin)
        .max(2880, m.routineMax),
      maintenanceMessage: z.string().trim().max(280, m.bannerMax),
    })
    .refine((value) => value.urgentMinutes <= value.routineMinutes, {
      message: m.urgentAboveRoutine,
    });

/** Réglages saisis dans l'écran d'administration. */
export type SettingsInput = z.input<ReturnType<typeof settingsSchema>>;

/**
 * Change les délais promis et le bandeau de maintenance.
 *
 * Un bandeau vide l'efface. Le changement s'applique à tous les écrans à
 * leur prochain affichage — d'où la revalidation de toute l'application.
 */
export async function updatePlatformSettings(
  input: SettingsInput,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = settingsSchema(t.admin.validation).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(t.admin.demoActions.settings);

  const { urgentMinutes, routineMinutes, maintenanceMessage } = parsed.data;
  const result = await run(async () => {
    await apiSend(
      "/admin/settings",
      "PATCH",
      {
        sla_urgent_minutes: urgentMinutes,
        sla_routine_minutes: routineMinutes,
        // Chaîne vide : le service efface le bandeau.
        maintenance_message: maintenanceMessage,
      },
      platformSettingsSchema,
    );
    return undefined;
  });
  revalidatePath("/", "layout");
  return result;
}

/**
 * Schéma d'un rattachement.
 *
 * @param m Messages de validation, dans la langue de l'utilisateur.
 */
const grantSchema = (m: Validation) =>
  z.object({
    profileId: z.string().min(1),
    organizationId: z.string().uuid(m.organisationInvalid),
    role: z.enum(["clinic_staff", "radiologist", "platform_admin"]),
  });

/** Rattachement d'un compte à une organisation. */
export type GrantInput = z.input<ReturnType<typeof grantSchema>>;

/**
 * Rattache un compte existant à une organisation — un radiologue dont le
 * dossier vient d'être validé, typiquement.
 *
 * Le service refuse un rôle incompatible avec la nature de
 * l'organisation, et une appartenance qui existe déjà.
 */
export async function grantMembership(
  input: GrantInput,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = grantSchema(t.admin.validation).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(t.admin.demoActions.grant);

  const { profileId, organizationId, role } = parsed.data;
  const invalid = await rejectInvalidIds(profileId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/users/${encodeURIComponent(profileId)}/memberships`,
      "POST",
      { organization_id: organizationId, role },
    );
    return undefined;
  });
  revalidatePath("/admin/utilisateurs");
  return result;
}

/**
 * Schéma du suivi d'une demande.
 *
 * @param m Messages de validation, dans la langue de l'utilisateur.
 */
const trackingSchema = (m: Validation) =>
  z.object({
    requestId: z.string().min(1),
    status: z.enum(["new", "contacted", "converted", "dismissed"]),
    notes: z.string().trim().max(4000, m.notesMax),
  });

/** Suivi d'une demande reçue. */
export type TrackingInput = z.input<ReturnType<typeof trackingSchema>>;

/** Change l'état d'une demande reçue par le site, et ses notes. */
export async function trackContactRequest(
  input: TrackingInput,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = trackingSchema(t.admin.validation).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(t.admin.demoActions.tracking);

  const { requestId, status, notes } = parsed.data;
  const invalid = await rejectInvalidIds(requestId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/contact-requests/${encodeURIComponent(requestId)}`,
      "PATCH",
      { status, notes: notes || null },
      contactTrackingSchema,
    );
    return undefined;
  });
  revalidatePath("/admin/demandes");
  revalidatePath("/admin");
  return result;
}

/**
 * Réinitialise la double authentification d'un compte — téléphone perdu
 * ou changé.
 *
 * L'exigence demeure : à sa connexion suivante, la personne enrôle un
 * nouveau facteur avant de revoir le moindre examen. Le service trace le
 * geste dans le journal d'audit.
 *
 * @returns Le nombre de facteurs supprimés.
 */
export async function resetUserMfa(
  profileId: string,
): Promise<ActionResult<number>> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.admin.demoActions.mfaReset);
  }
  const invalid = await rejectInvalidIds(profileId);
  if (invalid) return invalid;
  const result = await run(async () => {
    const body = await apiSend(
      `/admin/users/${encodeURIComponent(profileId)}/mfa-reset`,
      "POST",
      undefined,
      mfaResetSchema,
    );
    return body.removed_factors;
  });
  revalidatePath("/admin/utilisateurs");
  return result;
}

/**
 * Schéma d'une anonymisation.
 *
 * Mêmes bornes que le service pour le nom saisi (1 à 200 caractères) ; la
 * correspondance avec le nom du compte, elle, est vérifiée par le
 * service, seul à faire foi.
 *
 * @param m Messages de validation, dans la langue de l'utilisateur.
 */
const anonymizationSchema = (m: Validation) =>
  z.object({
    confirmName: z
      .string()
      .trim()
      .min(1, m.confirmAccountNameRequired)
      .max(200, m.confirmAccountNameRequired),
    removeMemberships: z.boolean(),
  });

/** Confirmation d'une anonymisation, telle que l'écran la saisit. */
export type AnonymizationInput = z.input<
  ReturnType<typeof anonymizationSchema>
>;

/**
 * Issue d'une anonymisation : `kept` quand un profil minimal reste (nom,
 * titre, numéro d'ordre, attachés aux documents signés et au journal
 * d'audit), `deleted` quand le profil a été supprimé entièrement.
 */
export type AnonymizationOutcome = "kept" | "deleted";

/**
 * Anonymise un compte, à la demande de la personne (droit à
 * l'effacement).
 *
 * Le service supprime le compte de connexion (adresse, mot de passe,
 * double authentification, sessions), rend au pool les examens en cours,
 * retire les appartenances, puis réduit le profil au nom, au titre et au
 * numéro d'ordre s'il est référencé, ou le supprime. Le geste est tracé
 * (`user.anonymization_requested`, puis `user.anonymized`). Il refuse :
 *
 * - son propre compte (403) ;
 * - un nom qui ne correspond pas au compte (422) ;
 * - un compte déjà anonymisé, ou encore membre d'une organisation active
 *   sans confirmation du retrait de ses appartenances (409) ;
 * - quand le service d'authentification est injoignable (503) : rien
 *   n'est alors modifié, le geste peut être refait.
 *
 * @param profileId Compte visé.
 * @param input     Nom saisi, et la confirmation du retrait des
 *                  appartenances.
 */
export async function anonymizeUser(
  profileId: string,
  input: AnonymizationInput,
): Promise<ActionResult<AnonymizationOutcome>> {
  const { t } = await getMessages();
  const parsed = anonymizationSchema(t.admin.validation).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(t.admin.demoActions.anonymize);
  const invalid = await rejectInvalidIds(profileId);
  if (invalid) return invalid;

  const body: ApiAnonymizationRequest = {
    confirm_name: parsed.data.confirmName,
    remove_memberships: parsed.data.removeMemberships,
  };
  const result = await run(async () => {
    const done = await apiSend(
      `/admin/users/${encodeURIComponent(profileId)}/anonymize`,
      "POST",
      body,
      anonymizationResultSchema,
    );
    return done.outcome;
  });
  // Après un succès, ou un compte anonymisé entre-temps par une autre
  // session : la liste change.
  if (result.ok || result.status === 409) {
    revalidatePath("/admin/utilisateurs");
  }
  return result;
}

/** Décision de l'équipe IMAFRIK sur l'habilitation d'un radiologue. */
export type CredentialsDecision =
  | {
      kind: "verify";
      /** Justificatif examiné, tel qu'affiché. */
      documentId: string;
      /** Inscrit à l'Ordre : numéro affiché, celui qui a été vérifié. */
      licenseNumber?: string;
      /** Résident : date de fin lue sur l'attestation (`AAAA-MM-JJ`). */
      validUntil?: string;
    }
  | { kind: "reject"; documentId: string; reason: string }
  | { kind: "revoke" };

/** Forme d'une décision reçue du navigateur : rien n'y est cru sur parole. */
const decisionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("verify"),
    documentId: z.string().uuid(),
    licenseNumber: z.string().max(50).optional(),
    validUntil: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
  z.object({
    kind: z.literal("reject"),
    documentId: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
  }),
  z.object({ kind: z.literal("revoke") }),
]);

/**
 * Accepte le justificatif d'un radiologue et l'habilite, le refuse avec un
 * motif, ou retire l'habilitation.
 *
 * La vérification (inscription à l'Ordre, diplôme, attestation) se fait
 * sur le justificatif consulté ; ce geste en enregistre le résultat. Le
 * service le trace dans le journal d'audit, refuse une décision sur un
 * justificatif remplacé ou un numéro changé depuis l'affichage, et, au
 * retrait, rend au pool les examens que le radiologue avait pris en charge.
 *
 * @param profileId Compte du radiologue.
 * @param decision  La décision, avec ce qui a été examiné.
 * @returns Le nombre d'examens rendus au pool (0 hors retrait).
 */
export async function decideCredentials(
  profileId: string,
  decision: CredentialsDecision,
): Promise<ActionResult<number>> {
  const { t } = await getMessages();
  if (isDemoMode()) {
    return await demoUnavailable(t.admin.demoActions.credentials);
  }
  const parsed = decisionSchema.safeParse(decision);
  if (!parsed.success) {
    return { ok: false, error: t.common.errors.invalidRequest, status: 422 };
  }
  const invalid = await rejectInvalidIds(profileId);
  if (invalid) return invalid;
  const chosen = parsed.data;
  const body =
    chosen.kind === "verify"
      ? {
          decision: "verify",
          document_id: chosen.documentId,
          ...(chosen.licenseNumber
            ? { expected_license_number: chosen.licenseNumber.trim() }
            : {}),
          ...(chosen.validUntil ? { valid_until: chosen.validUntil } : {}),
        }
      : chosen.kind === "reject"
        ? {
            decision: "reject",
            document_id: chosen.documentId,
            reason: chosen.reason,
          }
        : { decision: "revoke" };
  const result = await run(async () => {
    const state = await apiSend(
      `/admin/users/${encodeURIComponent(profileId)}/credentials`,
      "POST",
      body,
      credentialsStateSchema,
    );
    return state.released_studies;
  });
  revalidatePath("/admin/utilisateurs");
  // L'alerte du cockpit compte les justificatifs à examiner.
  revalidatePath("/admin");
  return result;
}

/**
 * Annule un compte-rendu signé par erreur : un essai signé sur un examen
 * réel, un document rédigé sur le mauvais examen.
 *
 * Le service archive le document tel quel (PDF compris), avec le motif,
 * le retire des comptes-rendus en vigueur, remet l'examen dans la file et
 * trace le geste. La vérification publique le dit annulé.
 *
 * @param reportId Compte-rendu à annuler.
 * @param reason   Motif, de 10 à 500 caractères, conservé avec l'archive.
 */
export async function voidReport(
  reportId: string,
  reason: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  if (isDemoMode()) {
    return await demoUnavailable(t.admin.voidReport.demoAction);
  }
  const motif = typeof reason === "string" ? reason.trim() : "";
  if (motif.length < 10 || motif.length > 500) {
    return { ok: false, error: t.admin.voidReport.reasonInvalid, status: 422 };
  }
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/reports/${encodeURIComponent(reportId)}/void`,
      "POST",
      { reason: motif },
      reportVoidResultSchema,
    );
    return undefined;
  });
  revalidatePath("/admin/examens");
  revalidatePath("/admin");
  return result;
}

/**
 * Justificatifs d'un radiologue, pour l'examen de son dossier.
 *
 * @param profileId Compte examiné.
 * @returns Ses justificatifs, du plus récent au plus ancien, sans adresse
 *          de fichier.
 */
export async function loadCredentialDocuments(
  profileId: string,
): Promise<ActionResult<CredentialDocument[]>> {
  // Les comptes de démonstration n'ont pas d'identifiant UUID.
  if (!isDemoMode()) {
    const invalid = await rejectInvalidIds(profileId);
    if (invalid) return invalid;
  }
  return run(() => getUserCredentialDocuments(profileId));
}

/**
 * Ouvre un justificatif pour l'équipe IMAFRIK : une adresse valable cinq
 * minutes, que le navigateur ouvre aussitôt. Le service trace chaque
 * consultation au journal d'audit.
 *
 * @param documentId Justificatif à consulter.
 * @returns L'adresse du fichier.
 */
export async function viewCredentialDocument(
  documentId: string,
): Promise<ActionResult<string>> {
  const { t } = await getMessages();
  if (isDemoMode()) {
    return await demoUnavailable(t.admin.demoActions.credentials);
  }
  const invalid = await rejectInvalidIds(documentId);
  if (invalid) return invalid;
  return run(async () => {
    const view = await apiGet(
      `/admin/credential-documents/${encodeURIComponent(documentId)}/view`,
      documentViewSchema,
    );
    return view.url;
  });
}

/**
 * Schéma d'une durée de conservation.
 *
 * @param m Messages de validation, dans la langue de l'utilisateur.
 */
const retentionSchema = (m: Validation) =>
  z.object({
    clinicId: z.string().min(1),
    days: z
      .number({ invalid_type_error: m.retentionInvalid })
      .int(m.retentionInteger)
      .min(30, m.retentionMin)
      .max(7300, m.retentionMax)
      .nullable(),
  });

/**
 * Applique la durée de conservation des images prévue au contrat d'une
 * clinique ; `null` supprime toute purge automatique : les images sont
 * conservées sans limite, y compris après la fin du contrat.
 *
 * Au-delà, la tâche quotidienne du service purge du PACS central les
 * images des examens remis — la fiche et le compte-rendu restent. Le
 * changement est tracé dans le journal d'audit.
 */
export async function setClinicRetention(
  clinicId: string,
  days: number | null,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = retentionSchema(t.admin.validation).safeParse({
    clinicId,
    days,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return await demoUnavailable(t.admin.demoActions.retention);
  const invalid = await rejectInvalidIds(parsed.data.clinicId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/clinics/${encodeURIComponent(parsed.data.clinicId)}/retention`,
      "PUT",
      { image_retention_days: parsed.data.days },
      clinicDetailSchema,
    );
    return undefined;
  });
  revalidatePath(`/admin/organisations/${clinicId}`);
  return result;
}

/**
 * Fixe la langue des comptes-rendus PDF d'une clinique, telle que son
 * contrat la prévoit.
 *
 * Elle régit les intitulés et les mentions du document signé, ainsi que
 * la page de vérification vers laquelle mène son QR code ; l'éditeur
 * l'affiche au radiologue, qui rédige dans cette langue. Les
 * comptes-rendus déjà signés ne changent pas. Le service trace le
 * changement dans le journal d'audit
 * (`organization.report_language_changed`).
 *
 * @param clinicId Clinique.
 * @param language Langue des comptes-rendus : `fr` ou `en`.
 */
export async function setClinicReportLanguage(
  clinicId: string,
  language: Locale,
): Promise<ActionResult> {
  const { t } = await getMessages();
  // Un argument d'action serveur vient du navigateur, quel que soit son
  // type TypeScript : la langue est revérifiée ici.
  if (!isLocale(language)) {
    return {
      ok: false,
      error: t.admin.validation.languageUnknown,
      status: 422,
    };
  }
  if (isDemoMode())
    return await demoUnavailable(t.admin.demoActions.reportLanguage);
  const invalid = await rejectInvalidIds(clinicId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/clinics/${encodeURIComponent(clinicId)}/report-language`,
      "PUT",
      { report_language: language },
      clinicDetailSchema,
    );
    return undefined;
  });
  revalidatePath(`/admin/organisations/${clinicId}`);
  return result;
}

/**
 * Schéma d'une fin de contrat.
 *
 * Mêmes bornes que le service pour le nom saisi (1 à 200 caractères) ; la
 * correspondance avec le nom de la clinique, elle, est vérifiée par le
 * service, seul à faire foi.
 *
 * @param m Messages de validation, dans la langue de l'utilisateur.
 */
const contractEndSchema = (m: Validation) =>
  z.object({
    confirmName: z
      .string()
      .trim()
      .min(1, m.confirmNameRequired)
      .max(200, m.confirmNameRequired),
    abandonUnreported: z.boolean(),
  });

/** Confirmation d'une fin de contrat, telle que l'écran la saisit. */
export type ContractEndInput = z.input<ReturnType<typeof contractEndSchema>>;

/** Effet d'une fin de contrat, pour l'écran qui l'a demandée. */
export interface ContractEnded {
  /** Date de fin, ISO 8601. */
  endedAt: string;
  /** Examens non rendus abandonnés avec la fin de contrat. */
  abandonedStudies: number;
  /** Commande d'export à lancer sur le serveur. */
  exportCommand: string;
}

/**
 * Résultat d'une fin de contrat.
 *
 * Aux cas habituels s'ajoute un refus particulier : des examens ne sont
 * pas encore rendus (409). L'écran le distingue d'un contrat déjà
 * terminé, lui aussi en 409, pour proposer leur abandon explicite.
 */
export type EndContractResult =
  | ActionResult<ContractEnded>
  | { ok: false; error: string; status: 409; unreported: number };

/**
 * Met fin au contrat d'une clinique.
 *
 * Le service enchaîne, dans une seule transaction : clinique suspendue
 * (ses membres perdent l'accès à leur requête suivante), retirée du pool,
 * contrats de service fermés, geste tracé dans le journal d'audit
 * (`organization.contract_ended`). Les comptes-rendus signés restent
 * conservés et vérifiables. Il refuse :
 *
 * - un nom qui ne correspond pas à la clinique (422) ;
 * - un contrat déjà terminé (409) ;
 * - tant que des examens ne sont pas rendus, sauf abandon confirmé
 *   (409, avec leur nombre : voir {@link EndContractResult}).
 *
 * @param clinicId Clinique.
 * @param input    Nom saisi, et l'abandon éventuel des examens non rendus.
 * @returns La date de fin, les examens abandonnés et la commande d'export.
 */
export async function endClinicContract(
  clinicId: string,
  input: ContractEndInput,
): Promise<EndContractResult> {
  const { t } = await getMessages();
  const parsed = contractEndSchema(t.admin.validation).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode())
    return await demoUnavailable(t.admin.demoActions.contractEnd);
  const invalid = await rejectInvalidIds(clinicId);
  if (invalid) return invalid;

  const body: ApiContractEnd = {
    confirm_name: parsed.data.confirmName,
    abandon_unreported: parsed.data.abandonUnreported,
  };
  const result = await run(async () => {
    const ended = await apiSend(
      `/admin/clinics/${encodeURIComponent(clinicId)}/end-contract`,
      "POST",
      body,
      contractEndResultSchema,
    );
    return {
      endedAt: ended.contract_ended_at,
      abandonedStudies: ended.abandoned_studies,
      exportCommand: ended.export_command,
    };
  });

  if (!result.ok && result.status === 409) {
    const unreported = unreportedCount(result.error);
    if (unreported !== null)
      return { ok: false, error: result.error, status: 409, unreported };
  }
  // Après un succès, ou un contrat qu'une autre session vient de
  // terminer : la fiche, la liste et le cockpit changent.
  if (result.ok || result.status === 409) {
    revalidatePath(`/admin/organisations/${clinicId}`);
    revalidatePath("/admin/organisations");
    revalidatePath("/admin");
  }
  return result;
}

/** Fonctions d'IA d'une organisation. */
export interface AiFeatures {
  /** Relecture d'un brouillon avant signature. */
  review: boolean;
  /** Dictée vocale dans l'éditeur. */
  dictation: boolean;
}

/**
 * Lit les fonctions d'IA activées pour une organisation.
 *
 * Lu à l'ouverture du réglage, pas avec la liste des organisations : la
 * réponse doit être celle du moment où l'administrateur décide.
 *
 * @param organizationId Organisation.
 */
export async function readAiFeatures(
  organizationId: string,
): Promise<ActionResult<AiFeatures>> {
  if (isDemoMode()) {
    return { ok: true, data: { review: false, dictation: false } };
  }
  const invalid = await rejectInvalidIds(organizationId);
  if (invalid) return invalid;
  return await run(() =>
    apiGet(
      `/admin/organizations/${encodeURIComponent(organizationId)}/ai-features`,
      aiFeaturesSchema,
    ),
  );
}

/**
 * Active ou coupe les fonctions d'IA d'une organisation.
 *
 * L'organisation concernée est celle où le radiologue travaille : son
 * groupe de radiologie, ou sa clinique quand elle lit avec ses propres
 * radiologues. Le service trace le changement. Activer ici ne suffit pas
 * si l'IA est coupée pour toute la plateforme.
 *
 * @param organizationId Organisation.
 * @param features       État voulu de chaque fonction.
 */
export async function setAiFeatures(
  organizationId: string,
  features: AiFeatures,
): Promise<ActionResult<AiFeatures>> {
  const { t } = await getMessages();
  // Un argument d'action serveur vient du navigateur : revérifié ici.
  const parsed = aiFeaturesSchema.safeParse(features);
  if (!parsed.success) {
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  if (isDemoMode())
    return await demoUnavailable(t.admin.demoActions.aiFeatures);
  const invalid = await rejectInvalidIds(organizationId);
  if (invalid) return invalid;
  return await run(() =>
    apiSend(
      `/admin/organizations/${encodeURIComponent(organizationId)}/ai-features`,
      "PUT",
      parsed.data,
      aiFeaturesSchema,
    ),
  );
}
