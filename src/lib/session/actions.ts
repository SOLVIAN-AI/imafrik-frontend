"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api/client";
import { type ActionResult } from "@/lib/actions/result";
import { getMessages } from "@/i18n/server";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_MEMBERSHIPS } from "@/lib/session/demo";
import { homeFor } from "@/lib/navigation";
import {
  DEMO_MEMBERSHIP_COOKIE,
  getAvailableMemberships,
} from "@/lib/session/server";
import type { UserRole } from "@/lib/session/types";
import {
  isSessionCookie,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/supabase/cookies";
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
  // Les appartenances viennent de la base, organisation active ou non :
  // depuis `/en-attente`, quand l'organisation active est suspendue, il
  // n'y a pas de session ouverte, et c'est justement là qu'il faut
  // pouvoir changer d'organisation.
  const memberships = await getAvailableMemberships();
  const target = memberships.find(
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
 * Rouvre l'accès quand le jeton est en retard sur la base.
 *
 * Le jeton porte l'organisation et le rôle au moment de son émission ;
 * la base peut avoir changé depuis (organisation basculée après une
 * suspension, bascule dont le rafraîchissement a échoué, appartenance
 * ajoutée). `/en-attente` l'appelle quand la base donne un accès que le
 * jeton n'a pas : le jeton est renouvelé (le hook relit la base), et la
 * destination dépend de ce qu'il porte **désormais**.
 *
 * @returns L'écran où aller, ou `null` si le jeton renouvelé n'ouvre
 *          toujours aucun portail : l'appelant reste alors où il est, ce
 *          qui exclut toute boucle de redirection.
 */
export async function resumeAccess(): Promise<string | null> {
  if (isDemoMode()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.refreshSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) return null;
  const { data: verified } = await supabase.auth.getClaims(accessToken);
  const claims = verified?.claims;
  if (!claims) return null;
  if (claims.mfa_required === true) return "/double-authentification";
  const role = claims.user_role as UserRole | null | undefined;
  return role ? homeFor(role) : null;
}

/**
 * Efface les cookies de session Supabase de la réponse.
 *
 * Mêmes options que celles qui les ont posés (`path` compris) : un cookie
 * effacé sous un autre chemin survivrait.
 */
async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (isSessionCookie(name))
      store.set(name, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  }
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
 *
 * **Les cookies de session sont effacés quoi qu'il arrive.** Quand le
 * jeton d'accès a expiré et que son rafraîchissement échoue (service
 * d'authentification injoignable), `signOut` de la bibliothèque renvoie
 * l'erreur sans rien effacer : sur un poste partagé, le verrouillage
 * d'inactivité laissait le jeton de rafraîchissement en place, et la
 * personne suivante retrouvait la session au retour du service.
 */
export async function signOut(): Promise<void> {
  if (!isDemoMode()) {
    try {
      await apiFetch("/me/logout", { method: "POST" });
    } catch (error) {
      console.error("Révocation des jetons de visualisation en échec", error);
    }
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Fermeture de session en échec", error);
    } catch (error) {
      console.error("Fermeture de session en échec", error);
    } finally {
      await clearSessionCookies();
    }
  }
  revalidatePath("/", "layout");
}
