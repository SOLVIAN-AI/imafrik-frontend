"use server";

import { z } from "zod";

import { marketingCopy } from "@/content/marketing";
import { ApiError, apiSend } from "@/lib/api/client";
import type { ActionResult } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locale";

/**
 * Formulaire « demander une démonstration » du site public.
 *
 * La demande est enregistrée par le service, qui limite le débit par
 * adresse ; l'équipe IMAFRIK la retrouve dans le back-office. Le champ
 * `website` est un piège : invisible pour un humain, rempli par les
 * robots, il fait ignorer la demande sans le leur dire.
 */

const contactSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  organization: z.string().trim().max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50),
  message: z.string().trim().max(4000),
  website: z.string().max(200),
});

/** Champs du formulaire de contact. */
export type ContactInput = z.input<typeof contactSchema> & {
  /** Langue de la page, pour la langue des messages d'erreur. */
  locale?: Locale;
};

/**
 * Envoie une demande de contact.
 *
 * Les messages renvoyés sont écrits dans la langue de la page. Ceux du
 * service, en français, ne sont pas relayés tels quels : seul leur code
 * compte (trop de demandes, service indisponible).
 */
export async function submitContact(
  input: ContactInput,
): Promise<ActionResult> {
  const locale = isLocale(input?.locale) ? input.locale : DEFAULT_LOCALE;
  const errors = marketingCopy(locale).contactPage.errors;
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return {
      ok: false,
      error:
        field === "email"
          ? errors.email
          : field === "fullName"
            ? errors.name
            : errors.generic,
      status: 422,
    };
  }
  if (isDemoMode()) {
    return { ok: false, error: errors.unavailable, status: 503 };
  }

  const { fullName, organization, email, phone, message, website } =
    parsed.data;
  try {
    await apiSend("/contact", "POST", {
      full_name: fullName,
      organization: organization || null,
      email,
      phone: phone || null,
      message: message || null,
      website: website || null,
    });
    return { ok: true, data: undefined };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    if (!(error instanceof ApiError))
      console.error("Demande de contact en échec", error);
    return {
      ok: false,
      error:
        status === 429
          ? errors.rateLimited
          : status === 503
            ? errors.unavailable
            : errors.generic,
      status,
    };
  }
}
