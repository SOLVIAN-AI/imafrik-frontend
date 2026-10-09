"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import {
  type ApiContractEnd,
  clinicDetailSchema,
  contactTrackingSchema,
  contractEndResultSchema,
  credentialsStateSchema,
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

/** Décision de l'équipe IMAFRIK sur un numéro d'ordre. */
export type CredentialsDecision = "verify" | "revoke";

/**
 * Valide le numéro d'ordre d'un radiologue, ou retire la validation.
 *
 * La vérification (inscription à l'Ordre, droit d'exercer) se fait hors
 * de la plateforme ; ce geste en enregistre le résultat. Le service le
 * trace dans le journal d'audit avec le numéro vérifié, refuse de valider
 * un compte sans numéro (422) et, au retrait, rend au pool les examens
 * que le radiologue avait pris en charge.
 *
 * @param profileId Compte du radiologue.
 * @param decision  `verify` ou `revoke`.
 * @returns Le nombre d'examens rendus au pool (toujours 0 à la validation).
 */
export async function decideCredentials(
  profileId: string,
  decision: CredentialsDecision,
): Promise<ActionResult<number>> {
  const { t } = await getMessages();
  if (isDemoMode()) {
    return await demoUnavailable(t.admin.demoActions.credentials);
  }
  if (decision !== "verify" && decision !== "revoke") {
    return { ok: false, error: t.common.errors.invalidRequest, status: 422 };
  }
  const invalid = await rejectInvalidIds(profileId);
  if (invalid) return invalid;
  const result = await run(async () => {
    const body = await apiSend(
      `/admin/users/${encodeURIComponent(profileId)}/credentials`,
      "POST",
      { decision },
      credentialsStateSchema,
    );
    return body.released_studies;
  });
  revalidatePath("/admin/utilisateurs");
  // L'alerte du cockpit compte les radiologues à valider.
  revalidatePath("/admin");
  return result;
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
 * clinique ; `null` revient à la conservation pour la durée du contrat.
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
