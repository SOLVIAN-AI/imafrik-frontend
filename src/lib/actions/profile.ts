"use server";

import {
  createClient as createSupabaseClient,
  isAuthRetryableFetchError,
} from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import { type ActionResult, demoUnavailable, run } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { writeLanguageCookie } from "@/lib/i18n/cookie";
import { isLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/i18n/server";
import { firstBrokenRule, PASSWORD_MAX_LENGTH } from "@/lib/security/password";
import { openedByRecentEmailLink } from "@/lib/security/password-change";
import { passwordNeedsSecondFactor } from "@/lib/session/server";
import { supabaseEnv } from "@/lib/supabase/env";
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

/** Messages du changement de mot de passe, dans la langue de la requête. */
type PasswordMessages = Awaited<
  ReturnType<typeof getMessages>
>["t"]["settings"]["password"];

/**
 * Contrôles communs aux deux chemins : règles, confirmation, démonstration,
 * second facteur.
 *
 * @returns Un refus prêt à renvoyer, ou `null` si l'on peut poursuivre.
 */
async function precheck(
  messages: PasswordMessages,
  password: string,
  confirmation: string,
): Promise<ActionResult | null> {
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
  return null;
}

/**
 * Enregistre le nouveau mot de passe, puis ferme les autres sessions.
 *
 * Les autres sessions de ce compte sont fermées, comme l'écran
 * l'annonce : un mot de passe changé parce qu'il a fuité ne doit pas
 * laisser ouverte la session de celui qui l'a utilisé.
 */
async function applyNewPassword(
  messages: PasswordMessages,
  password: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Les messages de Supabase sont en anglais et parfois techniques ; le
    // cas courant (même mot de passe qu'avant, ou trop faible) est
    // reformulé, le reste reste générique.
    const weak = /weak|short|same/i.test(error.message);
    return {
      ok: false,
      error: weak ? messages.weak : messages.failed,
      status: 422,
    };
  }
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true, data: undefined };
}

/** Issue de la vérification du mot de passe actuel. */
type CurrentPasswordCheck = "ok" | "invalid" | "rate-limited" | "unavailable";

/**
 * Vérifie le mot de passe actuel, sans toucher à la session en cours.
 *
 * Une connexion est tentée sur un client **jetable** : sans cookies ni
 * stockage, il ne remplace pas la session de la requête. La session qu'il
 * ouvre en cas de succès est aussitôt fermée (portée `local` : elle seule,
 * pas celles du titulaire). `reauthenticate()` aurait imposé l'envoi d'un
 * code par courriel à chaque changement, pour la même garantie.
 *
 * @param email    Adresse du compte, lue dans la session vérifiée.
 * @param password Mot de passe saisi comme « actuel ».
 */
async function verifyCurrentPassword(
  email: string,
  password: string,
): Promise<CurrentPasswordCheck> {
  const { url, anonKey } = supabaseEnv();
  const probe = createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  try {
    const { error } = await probe.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 429) return "rate-limited";
      if (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500)
        return "unavailable";
      return "invalid";
    }
    await probe.auth.signOut({ scope: "local" });
    return "ok";
  } catch (error) {
    console.error("Vérification du mot de passe actuel en échec", error);
    return "unavailable";
  }
}

/**
 * Change le mot de passe depuis les paramètres : le mot de passe actuel
 * est exigé, et vérifié côté serveur.
 *
 * Une session ouverte ne suffit pas : sur un poste partagé, quiconque la
 * trouvait ouverte pouvait changer le mot de passe, fermer les autres
 * sessions du titulaire et garder l'accès aux examens de la clinique.
 *
 * Les règles sont celles que le formulaire affiche (`lib/security/password.ts`),
 * revérifiées ici : un formulaire se contourne.
 *
 * @param currentPassword Mot de passe actuel.
 * @param password        Nouveau mot de passe.
 * @param confirmation    Sa confirmation.
 */
export async function changePassword(
  currentPassword: string,
  password: string,
  confirmation: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const messages = t.settings.password;
  if (!currentPassword) {
    return { ok: false, error: messages.currentRequired, status: 422 };
  }
  const refused = await precheck(messages, password, confirmation);
  if (refused) return refused;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, error: t.common.errors.sessionExpired, status: 401 };
  }
  switch (await verifyCurrentPassword(user.email, currentPassword)) {
    case "invalid":
      return { ok: false, error: messages.currentInvalid, status: 403 };
    case "rate-limited":
      return { ok: false, error: messages.tooManyAttempts, status: 429 };
    case "unavailable":
      return { ok: false, error: messages.unavailable, status: 503 };
    case "ok":
      break;
  }
  return applyNewPassword(messages, password);
}

/**
 * Choisit un mot de passe après un lien reçu par courriel : premier mot
 * de passe d'une personne invitée, ou réinitialisation.
 *
 * Pas de mot de passe actuel à ressaisir (il n'existe pas, ou il est
 * oublié) : la preuve est le lien, qui a ouvert la session. Elle est lue
 * dans le jeton vérifié (claim `amr`) et ne vaut qu'une heure après le
 * clic ; une session ouverte par mot de passe passe par les paramètres.
 *
 * @param password     Nouveau mot de passe.
 * @param confirmation Sa confirmation.
 */
export async function setPasswordFromLink(
  password: string,
  confirmation: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const messages = t.settings.password;
  const refused = await precheck(messages, password, confirmation);
  if (refused) return refused;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return { ok: false, error: t.common.errors.sessionExpired, status: 401 };
  }
  if (
    !openedByRecentEmailLink(data.claims.amr, Math.floor(Date.now() / 1000))
  ) {
    return { ok: false, error: messages.linkRequired, status: 403 };
  }
  return applyNewPassword(messages, password);
}
