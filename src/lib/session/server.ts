import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isDemoMode } from "@/lib/demo/mode";
import { homeFor, isRouteAllowed } from "@/lib/navigation";
import { demoSession } from "@/lib/session/demo";
import { needsSecondFactor } from "@/lib/session/mfa";
import type { Membership, Session, UserRole } from "@/lib/session/types";
import { createClient } from "@/lib/supabase/server";

/** Cookie retenant l'appartenance choisie en mode démonstration. */
export const DEMO_MEMBERSHIP_COOKIE = "imafrik-demo-membership";

/**
 * Forme d'une ligne d'appartenance telle que la requête la renvoie.
 *
 * Supabase imbrique la table jointe ; le type le reflète pour éviter un
 * `any` qui masquerait un changement de schéma.
 */
interface MembershipRow {
  id: string;
  role: Membership["role"];
  organizations: {
    id: string;
    name: string;
    kind: Membership["organizationKind"];
    city: string | null;
    is_active: boolean;
  } | null;
}

/**
 * État d'authentification de la requête courante.
 *
 * Trois cas, que l'interface traite différemment :
 *
 * - `"anonymous"` — personne n'est connecté : direction la connexion ;
 * - `"mfa-required"` — un compte qui doit encore enrôler ou vérifier son
 *   second facteur : radiologue, administrateur, ou quiconque l'a
 *   activé. Son jeton n'ouvre aucune donnée tant qu'il ne l'a pas fait ;
 * - `"no-membership"` — un compte valide, rattaché à aucune organisation
 *   active : c'est un radiologue dont le dossier attend sa validation, ou
 *   le membre d'une organisation suspendue. Il n'ouvre aucun portail, mais
 *   ce n'est pas une erreur de connexion — le renvoyer vers la connexion
 *   produisait une boucle, la connexion le renvoyant aussitôt ailleurs ;
 * - une {@link Session} — tout le reste.
 */
export type AuthState =
  "anonymous" | "mfa-required" | "no-membership" | Session;

/**
 * État d'authentification, résolu une fois par requête.
 *
 * `cache` partage le résultat entre la disposition, la page et la
 * navigation d'un même rendu : sans lui, chacune refaisait la vérification
 * du jeton et les deux requêtes de lecture.
 *
 * `getUser()` plutôt que `getSession()` : le second lit le cookie sans le
 * vérifier. Ici, la réponse décide d'un accès à des images médicales.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  if (isDemoMode()) {
    const store = await cookies();
    return demoSession(store.get(DEMO_MEMBERSHIP_COOKIE)?.value);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "anonymous";

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, title, active_membership_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("memberships")
      .select("id, role, organizations(id, name, kind, city, is_active)")
      .eq("profile_id", user.id)
      .overrideTypes<MembershipRow[]>(),
  ]);

  const memberships: Membership[] = (rows ?? []).flatMap((row) =>
    row.organizations?.is_active
      ? [
          {
            id: row.id,
            organizationId: row.organizations.id,
            organizationName: row.organizations.name,
            organizationKind: row.organizations.kind,
            role: row.role,
            city: row.organizations.city ?? "",
          },
        ]
      : [],
  );
  if (memberships.length === 0) return "no-membership";

  const active =
    memberships.find(
      (membership) => membership.id === profile?.active_membership_id,
    ) ?? memberships[0];

  // Niveau d'assurance lu dans le jeton de session, déjà vérifié par
  // `getUser()` ci-dessus. Même règle que le hook qui l'a émis.
  const { data: level } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (
    needsSecondFactor(active.role, {
      current: level?.currentLevel ?? null,
      next: level?.nextLevel ?? null,
    })
  )
    return "mfa-required";

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name ?? user.email ?? "",
      title: profile?.title ?? "",
    },
    memberships,
    active,
    isDemo: false,
  };
});

/**
 * Session de l'utilisateur courant, si elle ouvre un portail.
 *
 * @returns La session, ou `null` si personne n'est connecté ou si le
 *          compte n'est rattaché à aucune organisation active.
 */
export async function getSession(): Promise<Session | null> {
  const state = await getAuthState();
  return typeof state === "string" ? null : state;
}

/**
 * Session exigée par un écran : redirige sinon.
 *
 * - personne de connecté → `/connexion` ;
 * - second facteur à enrôler ou vérifier → `/double-authentification` ;
 * - compte sans organisation → `/en-attente` ;
 * - rôles autorisés précisés et rôle actif absent de la liste → l'accueil
 *   de son propre portail.
 *
 * **Contrôle côté serveur, avant le moindre rendu.** Le proxy fait déjà
 * ce tri sur les claims du jeton ; ce second contrôle repose sur la
 * session relue en base, et protège un écran même si le proxy était
 * contourné ou mal configuré. Les données, elles, restent protégées par
 * le service et RLS quoi qu'il arrive.
 *
 * @param roles Rôles autorisés ; tous si omis.
 */
export async function requireSession(
  roles?: readonly UserRole[],
): Promise<Session> {
  const state = await getAuthState();
  if (state === "anonymous") redirect("/connexion");
  if (state === "mfa-required") redirect("/double-authentification");
  if (state === "no-membership") redirect("/en-attente");
  if (roles && !roles.includes(state.active.role))
    redirect(homeFor(state.active.role));
  return state;
}

/**
 * Vérifie qu'une adresse appartient au portail de l'utilisateur, ou le
 * renvoie chez lui. Pour les écrans partagés entre plusieurs rôles.
 *
 * @param pathname Adresse de l'écran.
 */
export async function requireRouteAccess(pathname: string): Promise<Session> {
  const session = await requireSession();
  if (!isRouteAllowed(session.active.role, pathname))
    redirect(homeFor(session.active.role));
  return session;
}
