"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import { adminOrganizationSchema, memberSchema } from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

/**
 * Gestes du back-office IMAFRIK.
 *
 * Le service vérifie le rôle d'administrateur en base à chaque appel, et
 * trace chacun de ces gestes dans le journal d'audit.
 */

/**
 * Active ou suspend une organisation. Suspendue, tous ses membres
 * perdent l'accès à leur requête suivante.
 */
export async function setOrganizationActive(
  organizationId: string,
  active: boolean,
): Promise<ActionResult> {
  const { t } = await getMessages();
  if (isDemoMode())
    return await demoUnavailable(t.admin.demoActions.suspension);
  const invalid = await rejectInvalidIds(organizationId);
  if (invalid) return invalid;
  if (typeof active !== "boolean")
    return { ok: false, error: t.admin.validation.stateInvalid, status: 422 };
  const result = await run(async () => {
    await apiSend(
      `/admin/organizations/${encodeURIComponent(organizationId)}`,
      "PATCH",
      { is_active: active },
      adminOrganizationSchema,
    );
    return undefined;
  });
  revalidatePath("/admin/organisations");
  return result;
}

/**
 * Schéma d'une invitation depuis le back-office.
 *
 * @param m Messages de validation, dans la langue de l'utilisateur.
 */
const adminInvitationSchema = (m: AppMessages["admin"]["validation"]) =>
  z.object({
    organizationId: z.string().uuid(),
    email: z.string().trim().email(m.emailInvalid),
    fullName: z.string().trim().min(1, m.nameRequired).max(200),
    role: z.enum(["clinic_staff", "radiologist", "platform_admin"]),
  });

/** Données d'une invitation depuis le back-office. */
export type AdminInvitationInput = z.input<
  ReturnType<typeof adminInvitationSchema>
>;

/**
 * Invite une personne dans n'importe quelle organisation — seul chemin
 * pour ajouter un radiologue à un groupe du pool.
 */
export async function inviteIntoOrganization(
  input: AdminInvitationInput,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = adminInvitationSchema(t.admin.validation).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode())
    return await demoUnavailable(t.admin.demoActions.invitation);

  const { organizationId, email, fullName, role } = parsed.data;
  const result = await run(async () => {
    await apiSend(
      `/admin/organizations/${encodeURIComponent(organizationId)}/invitations`,
      "POST",
      { email, full_name: fullName, role },
      memberSchema,
    );
    return undefined;
  });
  revalidatePath("/admin/organisations");
  return result;
}
