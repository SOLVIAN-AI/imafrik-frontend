"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiGet, apiSend } from "@/lib/api/client";
import {
  type ApiClinicCreate,
  clinicCreatedSchema,
  enrollmentCodeIssuedSchema,
  gatewayDetailSchema,
  policyComparisonSchema,
  tailscaleTestSchema,
} from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { confirmSecondFactor } from "@/lib/actions/second-factor";
import { type PolicyComparison, toPolicyComparison } from "@/lib/data/gateways";
import { isDemoMode } from "@/lib/demo/mode";
import {
  ACTIONS_WITH_REASON,
  type GatewayAction,
  demoEnrollmentCode,
  reasonProblem,
} from "@/lib/gateways";
import {
  MAX_CLINIC_MANAGERS,
  MAX_CLINIC_RADIOLOGISTS,
  duplicateEmail,
} from "@/lib/clinic-team";
import { isLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/i18n/server";

/**
 * Gestes de la tour de contrôle sur les passerelles des cliniques.
 *
 * Même règle que `lib/actions/control.ts` : chaque entrée est vérifiée ici
 * avec les bornes du service, pour un message clair avant l'aller-retour,
 * puis revérifiée par le service, qui contrôle le rôle en base et trace
 * chaque geste au journal d'audit. La vérification de l'interface est un
 * confort ; celle du service est la protection.
 *
 * Les gestes les plus sensibles (connexion Tailscale, politique d'accès)
 * exigent en plus le code de l'application d'authentification : voir
 * `lib/actions/second-factor.ts`.
 */

/** Code d'enrôlement émis : montré une fois, avec son échéance. */
export interface IssuedCode {
  id: string;
  code: string;
  /** Échéance, ISO 8601. */
  expiresAt: string;
  /** Code de démonstration : il ne raccorde rien. */
  demo: boolean;
}

/** Validité d'un code, en millisecondes : celle du service. */
const CODE_LIFETIME_MS = 15 * 60_000;

/**
 * Émet un code d'enrôlement pour une clinique ; le précédent encore
 * valable est annulé par le service.
 *
 * En démonstration, un code au bon format, qui ne raccorde rien, montre
 * le geste jusqu'au bout : affichage unique, compte à rebours, copie.
 *
 * @param clinicId Clinique.
 */
export async function issueEnrollmentCode(
  clinicId: string,
): Promise<ActionResult<IssuedCode>> {
  if (isDemoMode()) {
    return {
      ok: true,
      data: {
        id: "demo",
        code: demoEnrollmentCode(),
        expiresAt: new Date(Date.now() + CODE_LIFETIME_MS).toISOString(),
        demo: true,
      },
    };
  }
  const invalid = await rejectInvalidIds(clinicId);
  if (invalid) return invalid;
  const result = await run(async () => {
    const issued = await apiSend(
      `/admin/clinics/${encodeURIComponent(clinicId)}/gateway-enrollments`,
      "POST",
      undefined,
      enrollmentCodeIssuedSchema,
    );
    return {
      id: issued.id,
      code: issued.code,
      expiresAt: issued.expires_at,
      demo: false,
    };
  });
  revalidatePath(`/admin/organisations/${clinicId}`);
  return result;
}

/**
 * Annule un code d'enrôlement encore valable.
 *
 * @param codeId   Code.
 * @param clinicId Clinique, pour rafraîchir sa fiche.
 */
export async function cancelEnrollmentCode(
  codeId: string,
  clinicId: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  if (isDemoMode())
    return await demoUnavailable(t.gateways.demoActions.cancelCode);
  const invalid = await rejectInvalidIds(codeId, clinicId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/gateway-enrollments/${encodeURIComponent(codeId)}/cancel`,
      "POST",
    );
    return undefined;
  });
  revalidatePath(`/admin/organisations/${clinicId}`);
  return result;
}

/** Chemin du service pour chaque geste. */
const ACTION_PATHS: Record<GatewayAction, string> = {
  approve: "approve",
  reject: "reject",
  suspend: "suspend",
  resume: "resume",
  revoke: "revoke",
  renew: "renewal",
};

/**
 * Applique un geste à une passerelle : approuver, rejeter, suspendre,
 * reprendre, révoquer, forcer le renouvellement de son certificat.
 *
 * Rejeter, suspendre et révoquer exigent un motif (3 à 500 caractères),
 * conservé au journal d'audit.
 *
 * @param gatewayId Passerelle.
 * @param action    Geste.
 * @param reason    Motif, pour les gestes qui en exigent un.
 */
export async function applyGatewayAction(
  gatewayId: string,
  action: GatewayAction,
  reason?: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  // Un argument d'action serveur vient du navigateur : le geste est
  // revérifié ici, quel que soit son type TypeScript.
  if (!Object.hasOwn(ACTION_PATHS, action)) {
    return { ok: false, error: t.common.errors.invalidRequest, status: 422 };
  }
  const needsReason = ACTIONS_WITH_REASON.has(action);
  if (needsReason) {
    const problem = reasonProblem(typeof reason === "string" ? reason : "");
    if (problem) {
      return {
        ok: false,
        error:
          problem === "short"
            ? t.gateways.dialogs.reasonTooShort
            : t.gateways.dialogs.reasonTooLong,
        status: 422,
      };
    }
  }
  if (isDemoMode())
    return await demoUnavailable(t.gateways.demoActions[action]);
  const invalid = await rejectInvalidIds(gatewayId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/admin/gateways/${encodeURIComponent(gatewayId)}/${ACTION_PATHS[action]}`,
      "POST",
      needsReason ? { reason: (reason ?? "").trim() } : undefined,
      gatewayDetailSchema,
    );
    return undefined;
  });
  revalidatePath("/admin/passerelles");
  revalidatePath(`/admin/passerelles/${gatewayId}`);
  revalidatePath("/admin/organisations", "layout");
  return result;
}

type CreateClinicMessages = Awaited<
  ReturnType<typeof getMessages>
>["t"]["gateways"]["createClinic"];

/**
 * Une personne de l'équipe, telle que le service la reçoit.
 *
 * @param m Textes de la création, dans la langue de l'utilisateur.
 */
const personSchema = (m: CreateClinicMessages) =>
  z.object({
    fullName: z
      .string()
      .trim()
      .min(1, m.personNameRequired)
      .max(200, m.personNameTooLong),
    email: z.string().trim().email(m.personEmailInvalid),
  });

/**
 * Schéma d'une nouvelle clinique : mêmes règles que le service.
 *
 * Un responsable au moins ; ses propres radiologues, ou les radiologues
 * du réseau IMAFRIK avec le groupe qui lit pour lui ; chaque adresse une
 * seule fois.
 *
 * @param m Textes de la création, dans la langue de l'utilisateur.
 */
const clinicSchema = (m: CreateClinicMessages) =>
  z
    .object({
      name: z.string().trim().min(2, m.nameRequired).max(200, m.nameTooLong),
      city: z.string().trim().max(100, m.cityTooLong),
      reportLanguage: z.string().refine(isLocale),
      managers: z
        .array(personSchema(m))
        .min(1, m.managerRequired)
        .max(MAX_CLINIC_MANAGERS),
      readers: z.enum(["own", "network"]),
      radiologists: z.array(personSchema(m)).max(MAX_CLINIC_RADIOLOGISTS),
      radiologyGroupId: z.string().nullable(),
    })
    .superRefine((value, context) => {
      if (value.readers === "own" && value.radiologists.length === 0) {
        context.addIssue({ code: "custom", message: m.radiologistRequired });
      }
      if (value.readers === "network" && !value.radiologyGroupId) {
        context.addIssue({ code: "custom", message: m.groupRequired });
      }
      const twice = duplicateEmail([
        ...value.managers,
        ...(value.readers === "own" ? value.radiologists : []),
      ]);
      if (twice) {
        context.addIssue({ code: "custom", message: m.duplicateEmail(twice) });
      }
    });

/** Nouvelle clinique, telle que l'écran la saisit. */
export type ClinicInput = z.input<ReturnType<typeof clinicSchema>>;

/** Issue de l'invitation d'une personne de l'équipe. */
export interface ClinicInvitationOutcome {
  email: string;
  fullName: string;
  role: "clinic_staff" | "radiologist";
  /** `invited` : courriel envoyé ; `attached` : compte existant rattaché. */
  status: "invited" | "attached" | "failed";
  /** Raison de l'échec, dans la langue de l'utilisateur. */
  error: string | null;
}

/** Clinique créée, et l'issue de chaque invitation. */
export interface ClinicCreation {
  id: string;
  invitations: ClinicInvitationOutcome[];
}

/**
 * Crée une clinique et invite son équipe : ses responsables, puis ses
 * radiologues ou, à leur place, le contrat de service avec le groupe qui
 * lit pour le réseau IMAFRIK.
 *
 * Aucun AE Title n'est saisi ni montré : chaque passerelle reçoit le sien
 * à son enrôlement. Le geste est tracé (`organization.created`), chaque
 * invitation aussi (`membership.created`). Une invitation en échec
 * n'empêche ni la création ni les autres : son issue le dit.
 *
 * @param input Nom, ville, langue, équipe et lecture.
 * @returns La clinique, pour ouvrir sa fiche, et l'issue des invitations.
 */
export async function createClinic(
  input: ClinicInput,
): Promise<ActionResult<ClinicCreation>> {
  const { t } = await getMessages();
  const parsed = clinicSchema(t.gateways.createClinic).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode())
    return await demoUnavailable(t.gateways.demoActions.createClinic);
  const { readers, radiologyGroupId } = parsed.data;
  const network = readers === "network";
  if (network && radiologyGroupId) {
    const invalid = await rejectInvalidIds(radiologyGroupId);
    if (invalid) return invalid;
  }
  const person = ({
    fullName,
    email,
  }: {
    fullName: string;
    email: string;
  }) => ({
    full_name: fullName,
    email,
  });
  const body: ApiClinicCreate = {
    name: parsed.data.name,
    city: parsed.data.city || null,
    report_language: parsed.data
      .reportLanguage as ApiClinicCreate["report_language"],
    managers: parsed.data.managers.map(person),
    radiologists: network ? [] : parsed.data.radiologists.map(person),
    open_to_pool: network,
    radiology_group_id: network ? radiologyGroupId : null,
  };
  const result = await run(async () => {
    const created = await apiSend(
      "/admin/clinics",
      "POST",
      body,
      clinicCreatedSchema,
    );
    return {
      id: created.id,
      invitations: created.invitations.map((invitation) => ({
        email: invitation.email,
        fullName: invitation.full_name,
        role: invitation.role,
        status: invitation.status,
        error: invitation.error ?? null,
      })),
    };
  });
  if (result.ok) revalidatePath("/admin/organisations");
  return result;
}

/** Résultat d'un test de la connexion Tailscale. */
export interface TailscaleTestResult {
  ok: boolean;
  scopes: string[];
  missingScopes: string[];
  policyAvailable: boolean;
  /** Motif d'un échec, rédigé par le service. */
  error: string | null;
}

const toTest = (
  raw: z.output<typeof tailscaleTestSchema>,
): TailscaleTestResult => ({
  ok: raw.ok,
  scopes: raw.scopes,
  missingScopes: raw.missing_scopes,
  policyAvailable: raw.policy_available,
  error: raw.error ?? null,
});

/** Éprouve la connexion Tailscale en service, sans rien enregistrer. */
export async function testTailscaleConnection(): Promise<
  ActionResult<TailscaleTestResult>
> {
  if (isDemoMode()) {
    return {
      ok: true,
      data: {
        ok: true,
        scopes: ["auth_keys", "devices:core", "policy_file"],
        missingScopes: [],
        policyAvailable: true,
        error: null,
      },
    };
  }
  return await run(async () =>
    toTest(
      await apiSend(
        "/admin/platform/tailscale/test",
        "POST",
        undefined,
        tailscaleTestSchema,
      ),
    ),
  );
}

/** Nouvelle connexion Tailscale, telle que l'écran la saisit. */
export interface TailscaleInput {
  clientId: string;
  clientSecret: string;
  /** Code de l'application d'authentification. */
  otp: string;
}

/**
 * Éprouve puis enregistre, chiffrée, une connexion Tailscale.
 *
 * Le service n'enregistre rien si le test échoue ou si une portée
 * indispensable manque : il renvoie alors le résultat du test, que
 * l'écran affiche. Le secret n'est jamais renvoyé.
 *
 * @param input Identifiant, secret, et code du second facteur.
 */
export async function saveTailscaleConnection(
  input: TailscaleInput,
): Promise<ActionResult<TailscaleTestResult>> {
  const { t } = await getMessages();
  const text = t.gateways.tailscale;
  const clientId =
    typeof input.clientId === "string" ? input.clientId.trim() : "";
  const clientSecret =
    typeof input.clientSecret === "string" ? input.clientSecret.trim() : "";
  if (clientId.length < 4 || clientId.length > 200)
    return { ok: false, error: text.clientIdTooShort, status: 422 };
  if (clientSecret.length < 8 || clientSecret.length > 500)
    return { ok: false, error: text.secretTooShort, status: 422 };
  if (isDemoMode())
    return await demoUnavailable(t.gateways.demoActions.tailscale);
  const refused = await confirmSecondFactor(String(input.otp ?? ""));
  if (refused) return refused;
  const result = await run(async () =>
    toTest(
      await apiSend(
        "/admin/platform/tailscale",
        "PUT",
        { client_id: clientId, client_secret: clientSecret },
        tailscaleTestSchema,
      ),
    ),
  );
  revalidatePath("/admin/reglages");
  revalidatePath("/admin/passerelles");
  return result;
}

/**
 * Retire la connexion saisie en console ; le fichier de valeurs du
 * serveur reprend la main, s'il en porte une.
 *
 * @param otp Code de l'application d'authentification.
 */
export async function removeTailscaleConnection(
  otp: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  if (isDemoMode())
    return await demoUnavailable(t.gateways.demoActions.tailscale);
  const refused = await confirmSecondFactor(String(otp ?? ""));
  if (refused) return refused;
  const result = await run(async () => {
    await apiSend("/admin/platform/tailscale", "DELETE");
    return undefined;
  });
  revalidatePath("/admin/reglages");
  revalidatePath("/admin/passerelles");
  return result;
}

/**
 * Pousse au réseau la politique d'accès versionnée, après validation et
 * exécution de ses tests par Tailscale.
 *
 * @param etag Version comparée : la poussée échoue si la politique du
 *             réseau a changé depuis.
 * @param otp  Code de l'application d'authentification.
 * @returns La nouvelle comparaison.
 */
export async function pushTailscalePolicy(
  etag: string,
  otp: string,
): Promise<ActionResult<PolicyComparison>> {
  const { t } = await getMessages();
  if (typeof etag !== "string" || etag.length < 1 || etag.length > 200)
    return { ok: false, error: t.common.errors.invalidRequest, status: 422 };
  if (isDemoMode()) return await demoUnavailable(t.gateways.demoActions.policy);
  const refused = await confirmSecondFactor(String(otp ?? ""));
  if (refused) return refused;
  const result = await run(async () =>
    toPolicyComparison(
      await apiSend(
        "/admin/platform/tailscale/policy",
        "POST",
        { etag },
        policyComparisonSchema,
      ),
    ),
  );
  revalidatePath("/admin/reglages");
  return result;
}

/** Relit la comparaison de la politique d'accès, à la demande. */
export async function comparePolicy(): Promise<ActionResult<PolicyComparison>> {
  if (isDemoMode()) {
    const { demoPolicyComparison } = await import("@/lib/demo/gateways");
    return { ok: true, data: toPolicyComparison(demoPolicyComparison()) };
  }
  return await run(async () =>
    toPolicyComparison(
      await apiGet("/admin/platform/tailscale/policy", policyComparisonSchema),
    ),
  );
}
