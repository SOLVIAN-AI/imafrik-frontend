"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api/client";
import { type ActionResult } from "@/lib/actions/result";
import { getMessages } from "@/i18n/server";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_MEMBERSHIPS } from "@/lib/session/demo";
import { DEMO_MEMBERSHIP_COOKIE, getSession } from "@/lib/session/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Change l'organisation active.
 *
 * **Ce n'est pas un simple filtre d'affichage.** L'appartenance active
 * alimente les claims `org_id` et `user_role` du jeton, donc toutes les
 * politiques RLS : après la bascule, la base elle-même ne renvoie plus
 * les mêmes lignes. L'opération passe par `set_active_organization()`,
 * qui vérifie l'appartenance en base, puis par un rafraîchissement de
 * session — sans lequel le jeton porterait encore l'ancienne organisation.
 *
 * @param membershipId Appartenance à activer, parmi celles de l'utilisateur.
 */
export async function setActiveMembership(
  membershipId: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  if (isDemoMode()) {
    if (
      !DEMO_MEMBERSHIPS.some((membership) => membership.id === membershipId)
    ) {
      return { ok: false, error: t.session.membership.unknown, status: 404 };
    }
    const store = await cookies();
    store.set(DEMO_MEMBERSHIP_COOKIE, membershipId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  }

  // La fonction en base prend une organisation, pas une appartenance :
  // l'appel transmettait l'identifiant de l'appartenance sous un nom de
  // paramètre qu'elle ne connaît pas, et la bascule échouait toujours.
  const session = await getSession();
  const target = session?.memberships.find(
    (membership) => membership.id === membershipId,
  );
  if (!target)
    return { ok: false, error: t.session.membership.unknown, status: 404 };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_active_organization", {
    p_organization_id: target.organizationId,
  });
  if (error) {
    return {
      ok: false,
      error: t.session.membership.switchRefused,
      status: 403,
    };
  }

  // Le jeton en cours porte encore l'ancienne organisation : il faut le
  // renouveler pour que les claims — et donc les droits — suivent.
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

/**
 * Ferme la session.
 *
 * **D'abord les jetons de visualisation, ensuite la session.** Un jeton
 * de visualisation vit quinze minutes, indépendamment de la session : sans
 * cette révocation, un onglet du viewer resté ouvert continuerait à
 * recevoir des images après la déconnexion. L'appel au service doit
 * précéder `signOut`, qui efface le jeton qui l'autorise.
 *
 * Un échec de la révocation n'empêche pas la déconnexion : mieux vaut une
 * session fermée et des jetons qui expirent d'eux-mêmes qu'une session
 * qu'on ne peut plus fermer.
 */
export async function signOut(): Promise<void> {
  if (!isDemoMode()) {
    try {
      await apiFetch("/me/logout", { method: "POST" });
    } catch (error) {
      console.error("Révocation des jetons de visualisation en échec", error);
    }
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
}
