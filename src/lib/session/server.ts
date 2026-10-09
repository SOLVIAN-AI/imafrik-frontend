import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isDemoMode } from "@/lib/demo/mode";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locale";
import { LANGUAGE_COOKIE } from "@/lib/i18n/routes";
import { homeFor } from "@/lib/navigation";
import { demoSession } from "@/lib/session/demo";
import {
  needsSecondFactor,
  passwordChangeNeedsSecondFactor,
} from "@/lib/session/mfa";
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
    report_language: string;
    is_active: boolean;
  } | null;
}

/**
 * État d'authentification de la requête courante.
 *
 * Quatre cas, que l'interface traite différemment :
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
    // La démonstration n'a pas de profil en base : sa langue est celle du
    // cookie de langue, réglée depuis les paramètres ou le site public.
    const chosen = store.get(LANGUAGE_COOKIE)?.value;
    return demoSession(
      store.get(DEMO_MEMBERSHIP_COOKIE)?.value,
      isLocale(chosen) ? chosen : DEFAULT_LOCALE,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "anonymous";

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, title, license_number, credentials_verified_at, active_membership_id, locale",
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("memberships")
      .select(
        "id, role, organizations(id, name, kind, city, report_language, is_active)",
      )
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
            reportLanguage: isLocale(row.organizations.report_language)
              ? row.organizations.report_language
              : DEFAULT_LOCALE,
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
      hasLicenseNumber: Boolean(profile?.license_number?.trim()),
      credentialsVerified: Boolean(profile?.credentials_verified_at),
    },
    memberships,
    active,
    locale: isLocale(profile?.locale) ? profile.locale : DEFAULT_LOCALE,
    isDemo: false,
  };
});

/**
 * Indique si la session doit vérifier son second facteur avant tout
 * changement de mot de passe : compte doté d'un facteur vérifié, session
 * encore au premier niveau. Toujours faux en démonstration.
 */
export const passwordNeedsSecondFactor = cache(async (): Promise<boolean> => {
  if (isDemoMode()) return false;
  const supabase = await createClient();
  const { data: level } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return passwordChangeNeedsSecondFactor({
    current: level?.currentLevel ?? null,
    next: level?.nextLevel ?? null,
  });
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
