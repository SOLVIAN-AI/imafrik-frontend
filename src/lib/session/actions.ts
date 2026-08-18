"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Cookie retenant l'appartenance choisie en mode démonstration. */
const DEMO_MEMBERSHIP_COOKIE = "imafrik-demo-membership";

/**
 * Change l'organisation active.
 *
 * **Ce n'est pas un simple filtre d'affichage.** L'appartenance active
 * alimente les claims `org_id` et `user_role` du jeton, donc toutes les
 * politiques RLS : après la bascule, la base elle-même ne renvoie plus
 * les mêmes lignes. C'est pourquoi l'opération passe par la fonction
 * `set_active_organization()` côté base, puis par un rafraîchissement de
 * session — sans lequel le jeton porterait encore l'ancienne
 * organisation.
 *
 * @param membershipId Appartenance à activer.
 */
export async function setActiveMembership(membershipId: string) {
  if (!isSupabaseConfigured()) {
    const store = await cookies();
    store.set(DEMO_MEMBERSHIP_COOKIE, membershipId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    revalidatePath("/", "layout");
    return;
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("set_active_organization", {
    p_membership_id: membershipId,
  });
  if (error) throw new Error(error.message);

  // Le jeton en cours porte encore l'ancienne organisation : il faut le
  // renouveler pour que les claims — et donc les droits — suivent.
  await supabase.auth.refreshSession();

  revalidatePath("/", "layout");
}

/**
 * Ferme la session.
 *
 * La redirection est laissée à l'appelant : selon l'endroit, on repart
 * vers la page d'accueil publique ou vers le formulaire de connexion.
 */
export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
}
