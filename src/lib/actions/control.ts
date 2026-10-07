"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import {
  contactTrackingSchema,
  mfaResetSchema,
  platformSettingsSchema,
} from "@/lib/api/contracts";
import { type ActionResult, demoUnavailable, run } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";

/**
 * Gestes de la tour de contrôle.
 *
 * Chaque entrée est validée ici avec les **mêmes bornes que le service**
 * — un message clair avant l'aller-retour —, puis revalidée par le
 * service, qui vérifie le rôle d'administrateur en base et trace le geste
 * dans le journal d'audit. La validation de l'interface est un confort ;
 * celle du service est la protection.
 */

const settingsSchema = z
  .object({
    urgentMinutes: z.coerce
      .number({ invalid_type_error: "Délai d’urgence invalide" })
      .int("Délai d’urgence : un nombre entier de minutes")
      .min(5, "Délai d’urgence : 5 minutes au moins")
      .max(720, "Délai d’urgence : 12 heures au plus"),
    routineMinutes: z.coerce
      .number({ invalid_type_error: "Délai de routine invalide" })
      .int("Délai de routine : un nombre entier de minutes")
      .min(15, "Délai de routine : 15 minutes au moins")
      .max(2880, "Délai de routine : 48 heures au plus"),
    maintenanceMessage: z
      .string()
      .trim()
      .max(280, "Bandeau : 280 caractères au plus"),
  })
  .refine((value) => value.urgentMinutes <= value.routineMinutes, {
    message: "Le délai d’urgence ne peut dépasser le délai de routine",
  });

/** Réglages saisis dans l'écran d'administration. */
export type SettingsInput = z.input<typeof settingsSchema>;

/**
 * Change les délais promis et le bandeau de maintenance.
 *
 * Un bandeau vide l'efface. Le changement s'applique à tous les écrans à
 * leur prochain affichage — d'où la revalidation de toute l'application.
 */
export async function updatePlatformSettings(
  input: SettingsInput,
): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return demoUnavailable("La modification des réglages");

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

const grantSchema = z.object({
  profileId: z.string().min(1),
  organizationId: z.string().uuid("Organisation invalide"),
  role: z.enum(["clinic_staff", "radiologist", "platform_admin"]),
});

/** Rattachement d'un compte à une organisation. */
export type GrantInput = z.input<typeof grantSchema>;

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
  const parsed = grantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return demoUnavailable("Le rattachement");

  const { profileId, organizationId, role } = parsed.data;
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

const trackingSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["new", "contacted", "converted", "dismissed"]),
  notes: z.string().trim().max(4000, "Notes : 4 000 caractères au plus"),
});

/** Suivi d'une demande reçue. */
export type TrackingInput = z.input<typeof trackingSchema>;

/** Change l'état d'une demande reçue par le site, et ses notes. */
export async function trackContactRequest(
  input: TrackingInput,
): Promise<ActionResult> {
  const parsed = trackingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return demoUnavailable("Le suivi des demandes");

  const { requestId, status, notes } = parsed.data;
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
  if (!profileId) {
    return { ok: false, error: "Compte invalide", status: 422 };
  }
  if (isDemoMode()) return demoUnavailable("La réinitialisation");
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
