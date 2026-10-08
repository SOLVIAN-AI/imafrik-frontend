"use server";

import { z } from "zod";

import { marketingCopy } from "@/content/marketing";
import { ApiError, apiSend } from "@/lib/api/client";
import type { ActionResult } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import {
  type ContactFieldError,
  LICENSE_NUMBER_MAX_LENGTH,
  validateContactForm,
} from "@/lib/contact-form";
import { REQUESTER_KINDS } from "@/lib/contact-status";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locale";

/**
 * Formulaire de contact du site public.
 *
 * La demande est enregistrée par le service, qui limite le débit par
 * adresse ; l'équipe IMAFRIK la retrouve dans le back-office. Le champ
 * `website` est un piège : invisible pour un humain, rempli par les
 * robots, il fait ignorer la demande sans le leur dire.
 *
 * Le demandeur dit qui il est : un établissement de santé, qui se nomme,
 * ou un radiologue, qui déclare son numéro d'ordre (exigé par le service,
 * vérifié ensuite par l'équipe IMAFRIK). Les règles sont celles du
 * formulaire (`lib/contact-form.ts`), revérifiées ici.
 */

const contactSchema = z.object({
  requesterKind: z.enum(REQUESTER_KINDS),
  fullName: z.string().trim().min(1).max(200),
  organization: z.string().trim().max(200),
  licenseNumber: z.string().trim().max(LICENSE_NUMBER_MAX_LENGTH),
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
  // Mêmes règles que le formulaire, pour le même message.
  const broken = parsed.success
    ? validateContactForm({
        requesterKind: parsed.data.requesterKind,
        name: parsed.data.fullName,
        organization: parsed.data.organization,
        email: parsed.data.email,
        licenseNumber: parsed.data.licenseNumber,
      })[0]
    : schemaField(parsed.error.issues[0]?.path[0]);
  if (!parsed.success || broken) {
    return {
      ok: false,
      error: broken ? errors[broken] : errors.generic,
      status: 422,
    };
  }
  if (isDemoMode()) {
    return { ok: false, error: errors.unavailable, status: 503 };
  }

  const {
    requesterKind,
    fullName,
    organization,
    licenseNumber,
    email,
    phone,
    message,
    website,
  } = parsed.data;
  try {
    await apiSend("/contact", "POST", {
      requester_kind: requesterKind,
      full_name: fullName,
      organization: organization || null,
      // Le service l'ignore pour un établissement ; il n'est donc envoyé
      // que pour un radiologue.
      license_number: requesterKind === "radiologist" ? licenseNumber : null,
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

/**
 * Champ du formulaire correspondant à un champ du schéma refusé.
 *
 * @param field Premier élément du chemin de l'erreur zod.
 * @returns Le champ, ou `undefined` pour un refus sans message dédié.
 */
function schemaField(field: unknown): ContactFieldError | undefined {
  const fields: Partial<Record<string, ContactFieldError>> = {
    requesterKind: "requesterKind",
    fullName: "name",
    organization: "organization",
    licenseNumber: "licenseNumber",
    email: "email",
  };
  return typeof field === "string" ? fields[field] : undefined;
}
