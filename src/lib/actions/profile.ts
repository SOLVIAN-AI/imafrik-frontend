"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import { type ActionResult, demoUnavailable, run } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { writeLanguageCookie } from "@/lib/i18n/cookie";
import { isLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/i18n/server";
import { firstBrokenRule, PASSWORD_MAX_LENGTH } from "@/lib/security/password";
import { passwordNeedsSecondFactor } from "@/lib/session/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Le profil de l'utilisateur et son mot de passe.
 *
 * Le nom, le titre et le numéro d'ordre sont imprimés sur les
 * comptes-rendus que l'on signera **ensuite** : ceux déjà signés gardent
 * l'identité figée au moment de la signature.
 */

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  title: z.string().trim().max(100),
  /**
   * Absent quand le formulaire ne montre pas le champ (personnel d'une
   * clinique) : le numéro enregistré n'est alors pas touché. Une personne
   * radiologue dans une autre organisation garde ainsi son numéro, et sa
   * validation.
   */
  licenseNumber: z.string().trim().max(50).optional(),
});

/** Champs modifiables du profil. */
export type ProfileInput = z.input<typeof profileSchema>;

/** Enregistre le profil. */
export async function updateProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: t.settings.profile.nameRequired, status: 422 };
  }
  if (isDemoMode()) return demoUnavailable(t.settings.profileDemoAction);

  const result = await run(async () => {
    // Une chaîne vide efface la valeur côté service ; un champ absent la
    // laisse inchangée.
    await apiSend("/me", "PATCH", {
      full_name: parsed.data.fullName,
      title: parsed.data.title,
      ...(parsed.data.licenseNumber === undefined
        ? {}
        : { license_number: parsed.data.licenseNumber }),
    });
    return undefined;
  });
  revalidatePath("/", "layout");
  return result;
}

/**
 * Change la langue de l'utilisateur.
 *
 * Enregistrée dans son profil, elle régit ses écrans, les messages du
 * service et ses courriels (le service la reporte sur le compte
 * d'authentification). Le cookie de langue suit, pour `<html lang>` dès
 * le prochain chargement. En démonstration, seul le cookie existe.
 *
 * @param locale Langue choisie : `fr` ou `en`.
 */
export async function setLanguage(locale: unknown): Promise<ActionResult> {
  if (!isLocale(locale)) {
    const { t } = await getMessages();
    return { ok: false, error: t.settings.language.unknown, status: 422 };
  }
  if (!isDemoMode()) {
    const result = await run(async () => {
      await apiSend("/me", "PATCH", { locale });
      return undefined;
    });
    if (!result.ok) return result;
  }
  await writeLanguageCookie(locale);
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

/**
 * Change le mot de passe de l'utilisateur connecté.
 *
 * Sert aussi au premier mot de passe d'une personne invitée et à la
 * réinitialisation : dans les deux cas, c'est le lien reçu par courriel
 * qui a ouvert la session — et lui seul, valable une fois.
 *
 * Les règles sont celles que le formulaire affiche (`lib/security/password.ts`),
 * revérifiées ici : un formulaire se contourne.
 */
export async function changePassword(
  password: string,
  confirmation: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const messages = t.settings.password;
  const broken = firstBrokenRule(password);
  if (broken) {
    const rule =
      broken === "tooLong"
        ? messages.rules.tooLong(PASSWORD_MAX_LENGTH)
        : messages.rules[broken];
    return { ok: false, error: messages.refused(rule), status: 422 };
  }
  if (password !== confirmation) {
    return { ok: false, error: messages.mismatch, status: 422 };
  }
  if (isDemoMode()) return demoUnavailable(messages.demoAction);
  if (await passwordNeedsSecondFactor()) {
    return { ok: false, error: messages.secondFactorFirst, status: 403 };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Les messages de Supabase sont en anglais et parfois techniques ; le
    // cas courant — même mot de passe qu'avant, ou trop faible — est
    // reformulé, le reste reste générique.
    const weak = /weak|short|same/i.test(error.message);
    return {
      ok: false,
      error: weak ? messages.weak : messages.failed,
      status: 422,
    };
  }
  // Les autres sessions de ce compte sont fermées, comme l'écran
  // l'annonce : un mot de passe changé parce qu'il a fuité ne doit pas
  // laisser ouverte la session de celui qui l'a utilisé.
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true, data: undefined };
}
