"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiSend } from "@/lib/api/client";
import { type ActionResult, demoUnavailable, run } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { firstBrokenRule } from "@/lib/security/password";
import { createClient } from "@/lib/supabase/server";

/**
 * Le profil de l'utilisateur et son mot de passe.
 *
 * Le nom, le titre et le numéro d'ordre sont imprimés sur les
 * comptes-rendus que l'on signera **ensuite** : ceux déjà signés gardent
 * l'identité figée au moment de la signature.
 */

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Le nom est requis").max(200),
  title: z.string().trim().max(100),
  licenseNumber: z.string().trim().max(50),
});

/** Champs modifiables du profil. */
export type ProfileInput = z.input<typeof profileSchema>;

/** Enregistre le profil. */
export async function updateProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, status: 422 };
  }
  if (isDemoMode()) return demoUnavailable("L’enregistrement du profil");

  const result = await run(async () => {
    await apiSend("/me", "PATCH", {
      full_name: parsed.data.fullName,
      title: parsed.data.title || null,
      license_number: parsed.data.licenseNumber || null,
    });
    return undefined;
  });
  revalidatePath("/", "layout");
  return result;
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
  const broken = firstBrokenRule(password);
  if (broken) {
    return {
      ok: false,
      error: `Mot de passe refusé : ${broken.toLowerCase()}.`,
      status: 422,
    };
  }
  if (password !== confirmation) {
    return { ok: false, error: "Les deux saisies diffèrent.", status: 422 };
  }
  if (isDemoMode()) return demoUnavailable("Le changement de mot de passe");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Les messages de Supabase sont en anglais et parfois techniques ; le
    // cas courant — même mot de passe qu'avant, ou trop faible — est
    // reformulé, le reste reste générique.
    const weak = /weak|short|same/i.test(error.message);
    return {
      ok: false,
      error: weak
        ? "Ce mot de passe est refusé : choisissez-en un plus long, différent du précédent."
        : "Le mot de passe n’a pas pu être changé. Le lien a peut-être expiré.",
      status: 422,
    };
  }
  // Les autres sessions de ce compte sont fermées, comme l'écran
  // l'annonce : un mot de passe changé parce qu'il a fuité ne doit pas
  // laisser ouverte la session de celui qui l'a utilisé.
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true, data: undefined };
}
