"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import { memberSchema, organizationSchema } from "@/lib/api/contracts";
import { type ActionResult, demoUnavailable, run } from "@/lib/actions/result";
import { type Member, toMember } from "@/lib/data/organization";
import { isDemoMode } from "@/lib/demo/mode";
import type { UserRole } from "@/lib/session/types";

/**
 * Réglages et équipe de l'organisation active.
 *
 * Le service vérifie en base, à chaque appel, que l'utilisateur est
 * toujours membre et qu'il a le rôle requis : ce que l'interface affiche
 * ou masque n'y change rien.
 */

/** Champs du formulaire d'invitation, validés avant tout appel. */
const invitationSchema = z.object({
  email: z.string().trim().email("Adresse invalide"),
  fullName: z.string().trim().min(1, "Le nom est requis").max(200),
  role: z.enum(["clinic_staff", "radiologist"]),
});

/** Données d'une invitation, telles que le formulaire les envoie. */
export interface InvitationInput {
  email: string;
  fullName: string;
  role: Extract<UserRole, "clinic_staff" | "radiologist">;
}

/**
 * Invite une personne dans la clinique active.
 *
 * Une personne qui a déjà un compte est rattachée directement ; les
 * autres reçoivent un courriel et choisissent elles-mêmes leur mot de
 * passe — personne d'autre ne le connaît jamais.
 */
export async function inviteMember(
  input: InvitationInput,
): Promise<ActionResult<Member>> {
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return demoUnavailable("L’invitation");

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
  if (isDemoMode()) return demoUnavailable("Le retrait d’un membre");
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
  if (isDemoMode()) return demoUnavailable("Ce réglage");
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
