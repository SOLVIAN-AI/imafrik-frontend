"use server";

import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import { type ActionResult, run } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";

/**
 * Formulaire « demander une démonstration » du site public.
 *
 * La demande est enregistrée par le service, qui limite le débit par
 * adresse ; l'équipe IMAFRIK la retrouve dans le back-office. Le champ
 * `website` est un piège : invisible pour un humain, rempli par les
 * robots, il fait ignorer la demande sans le leur dire.
 */

const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Indiquez votre nom").max(200),
  organization: z.string().trim().max(200),
  email: z.string().trim().email("Adresse invalide"),
  phone: z.string().trim().max(50),
  message: z.string().trim().max(4000),
  website: z.string().max(200),
});

/** Champs du formulaire de contact. */
export type ContactInput = z.input<typeof contactSchema>;

/** Envoie une demande de contact. */
export async function submitContact(
  input: ContactInput,
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) {
    return {
      ok: false,
      error:
        "Le formulaire n’est pas branché sur cet aperçu. Écrivez-nous : contact@imafrik.tech",
      status: 503,
    };
  }

  const { fullName, organization, email, phone, message, website } =
    parsed.data;
  return run(async () => {
    await apiSend("/contact", "POST", {
      full_name: fullName,
      organization: organization || null,
      email,
      phone: phone || null,
      message: message || null,
      website: website || null,
    });
    return undefined;
  });
}
