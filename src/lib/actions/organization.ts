"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import { type ClinicRole, ROLES_BY_KIND } from "@/lib/roles";
import { memberSchema, organizationSchema } from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  run,
  rejectInvalidIds,
} from "@/lib/actions/result";
import { type Member, toMember } from "@/lib/data/organization";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Réglages et équipe de l'organisation active.
 *
 * Le service vérifie en base, à chaque appel, que l'utilisateur est
 * toujours membre et qu'il a le rôle requis : ce que l'interface affiche
 * ou masque n'y change rien.
 */

/**
 * Champs du formulaire d'invitation, validés avant tout appel.
 *
 * Sans messages : ceux de zod sont en anglais et techniques. Le premier
 * champ en défaut est traduit par `invitationError`.
 */
const invitationSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1).max(200),
  role: z.enum(ROLES_BY_KIND.clinic),
});

/**
 * Message d'un champ d'invitation refusé, dans la langue de l'utilisateur.
 *
 * @param issue Premier défaut relevé par zod.
 */
async function invitationError(issue: z.ZodIssue): Promise<string> {
  const { t } = await getMessages();
  const messages = t.clinic.team;
  switch (issue.path[0]) {
    case "email":
      return messages.invalidEmail;
    case "fullName":
      return issue.code === "too_big"
        ? messages.nameTooLong
        : messages.nameRequired;
    default:
      return t.common.errors.invalidRequest;
  }
}

/** Données d'une invitation, telles que le formulaire les envoie. */
export interface InvitationInput {
  email: string;
  fullName: string;
  role: ClinicRole;
}

/**
 * Invite une personne dans la clinique active.
 *
 * Une personne sans compte reçoit un courriel et choisit elle-même son
 * mot de passe : personne d'autre ne le connaît jamais. Une adresse qui a
 * **déjà** un compte est refusée (409) : une clinique ne rattache pas
 * d'office un compte existant, c'est l'équipe IMAFRIK qui le fait, après
 * avoir recueilli l'accord de la personne.
 */
export async function inviteMember(
  input: InvitationInput,
): Promise<ActionResult<Member>> {
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: await invitationError(parsed.error.issues[0]),
      status: 422,
    };
  }
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.clinic.team.inviteDemoAction);
  }

  const result = await run(async () => {
    const row = await apiSend(
      "/organization/invitations",
      "POST",
      {
        email: parsed.data.email,
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      },
      memberSchema,
    );
    return toMember(row);
  });
  revalidatePath("/equipe");
  return result;
}

/**
 * Retire un membre de la clinique active.
 *
 * Son compte n'est pas supprimé : il perd l'accès à cette clinique, à sa
 * requête suivante, et garde ses autres appartenances.
 */
export async function removeMember(
  membershipId: string,
): Promise<ActionResult> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.clinic.team.removeDemoAction);
  }
  const invalid = await rejectInvalidIds(membershipId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/organization/members/${encodeURIComponent(membershipId)}`,
      "DELETE",
    );
    return undefined;
  });
  revalidatePath("/equipe");
  return result;
}

/**
 * Ouvre ou ferme les examens de la clinique au pool de radiologues.
 *
 * Fermé, seuls les radiologues employés par la clinique les voient — dans
 * la worklist comme dans les recherches d'images.
 */
export async function setOpenToPool(
  openToPool: boolean,
): Promise<ActionResult> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.clinic.team.poolDemoAction);
  }
  const result = await run(async () => {
    await apiSend(
      "/organization",
      "PATCH",
      { open_to_pool: openToPool },
      organizationSchema,
    );
    return undefined;
  });
  revalidatePath("/parametres");
  return result;
}
