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
  type AssuranceLevel,
  assuranceFromVerified,
  needsSecondFactor,
  passwordChangeNeedsSecondFactor,
} from "@/lib/session/mfa";
import {
  isSignedOutError,
  resolveActiveMembership,
  SessionUnavailableError,
} from "@/lib/session/resolve";
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
 * - `"no-membership"` — un compte valide dont l'organisation active
 *   (`profiles.active_membership_id`) n'existe pas ou est suspendue :
 *   c'est un radiologue dont le dossier attend sa validation, ou le membre
 *   d'une organisation suspendue. Il n'ouvre aucun portail, mais ce n'est
 *   pas une erreur de connexion (le renvoyer vers la connexion produisait
 *   une boucle, la connexion le renvoyant aussitôt ailleurs). S'il a une
 *   autre organisation active, `/en-attente` lui propose d'y basculer ;
 * - une {@link Session} — tout le reste.
 */
export type AuthState =
  "anonymous" | "mfa-required" | "no-membership" | Session;

/** Profil tel que la requête le renvoie. */
interface ProfileRow {
  full_name: string | null;
  title: string | null;
  license_number: string | null;
  credentials_verified_at: string | null;
  active_membership_id: string | null;
  locale: string | null;
}

/** Compte connecté, relu en base : avant le choix de l'organisation active. */
interface Account {
  user: { id: string; email: string };
  profile: ProfileRow | null;
  /** Appartenances dont l'organisation est active. */
  memberships: Membership[];
  /** Niveaux d'assurance de la session, tirés de données vérifiées. */
  assurance: AssuranceLevel;
}

/**
 * Compte connecté et ses appartenances, résolus une fois par requête.
 *
 * `getUser()` plutôt que `getSession()` : le second lit le cookie sans le
 * vérifier. Ici, la réponse décide d'un accès à des images médicales.
 *
 * Le niveau d'assurance suit la même exigence : claim `aal` du jeton
 * vérifié par `getClaims()`, facteurs renvoyés par `getUser()`. La
 * fonction `mfa.getAuthenticatorAssuranceLevel()` de la bibliothèque,
 * utilisée auparavant sur un second client, lisait l'utilisateur du
 * cookie sans vérification ; c'est elle qui produisait l'avertissement
 * « Using the user object as returned from supabase.auth.getSession() »
 * dans les journaux, à chaque requête.
 *
 * @returns Le compte, ou `"anonymous"` si aucune session valide n'existe.
 * @throws SessionUnavailableError Service d'authentification ou base
 *         indisponible : ce n'est ni une déconnexion ni une absence
 *         d'appartenance (voir `lib/session/resolve.ts`).
 */
const loadAccount = cache(async (): Promise<Account | "anonymous"> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    if (isSignedOutError(userError)) return "anonymous";
    throw new SessionUnavailableError("auth", { cause: userError });
  }
  if (!user) return "anonymous";

  const [profileResult, membershipsResult, claimsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, title, license_number, credentials_verified_at, active_membership_id, locale",
      )
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("memberships")
      .select(
        "id, role, organizations(id, name, kind, city, report_language, is_active)",
      )
      .eq("profile_id", user.id)
      .overrideTypes<MembershipRow[]>(),
    // Lit le jeton de la session (seulement lui, pas l'utilisateur du
    // cookie) et en vérifie la signature.
    supabase.auth.getClaims(),
  ]);
  if (profileResult.error)
    throw new SessionUnavailableError("profile", {
      cause: profileResult.error,
    });
  if (membershipsResult.error)
    throw new SessionUnavailableError("memberships", {
      cause: membershipsResult.error,
    });
  // `getUser()` vient d'accepter ce jeton : un jeton illisible ou absent
  // ici n'est pas une déconnexion mais un incident (clés de signature
  // injoignables, session effacée entre-temps).
  if (claimsResult.error || !claimsResult.data)
    throw new SessionUnavailableError("assurance", {
      cause: claimsResult.error,
    });

  const memberships: Membership[] = (membershipsResult.data ?? []).flatMap(
    (row) =>
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
  return {
    user: { id: user.id, email: user.email ?? "" },
    profile: profileResult.data,
    memberships,
    assurance: assuranceFromVerified(
      claimsResult.data.claims.aal,
      user.factors,
    ),
  };
});

/**
 * État d'authentification, résolu une fois par requête.
 *
 * `cache` partage le résultat entre la disposition, la page et la
 * navigation d'un même rendu : sans lui, chacune refaisait la vérification
 * du jeton et les deux requêtes de lecture.
 *
 * L'organisation active suit **exactement** la règle du hook de jeton :
 * celle de `profiles.active_membership_id`, si elle est active ; sinon
 * `"no-membership"`, sans repli sur une autre appartenance. Le proxy, qui
 * lit le jeton, et les écrans, qui lisent la base, tombent ainsi
 * d'accord, et aucun ne renvoie vers un écran que l'autre refuse.
 *
 * @throws SessionUnavailableError Panne du service d'authentification
 *         ou de la base : l'écran d'erreur s'affiche, avec « Réessayer »,
 *         au lieu d'une redirection.
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

  const account = await loadAccount();
  if (account === "anonymous") return "anonymous";
  const { user, profile, memberships, assurance } = account;

  const active = resolveActiveMembership(
    memberships,
    profile?.active_membership_id,
  );
  if (!active) return "no-membership";

  // Niveau d'assurance tiré du jeton vérifié et des facteurs renvoyés
  // par le service. Même règle que le hook qui a émis le jeton.
  if (needsSecondFactor(active.role, assurance)) return "mfa-required";

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name ?? user.email,
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
 * Variante de {@link getAuthState} pour les actions serveur : une panne
 * du service devient `"unavailable"`, que l'action traduit en message
 * (« le service ne répond pas, réessayez ») au lieu de lever une erreur
 * qui remplacerait le formulaire par l'écran d'erreur.
 */
export async function tryGetAuthState(): Promise<AuthState | "unavailable"> {
  try {
    return await getAuthState();
  } catch (error) {
    if (error instanceof SessionUnavailableError) {
      console.error("Session indisponible", error.step, error.cause);
      return "unavailable";
    }
    throw error;
  }
}

/**
 * Appartenances vers lesquelles l'utilisateur peut basculer : celles dont
 * l'organisation est active, qu'une soit active ou non.
 *
 * Sert l'écran `/en-attente` (un compte dont l'organisation active est
 * suspendue doit pouvoir en choisir une autre) et la bascule elle-même.
 * Vide pour une personne non connectée. En démonstration, celles du jeu
 * de démonstration.
 *
 * @throws SessionUnavailableError Voir {@link getAuthState}.
 */
export const getAvailableMemberships = cache(
  async (): Promise<Membership[]> => {
    if (isDemoMode()) {
      const state = await getAuthState();
      return typeof state === "string" ? [] : state.memberships;
    }
    const account = await loadAccount();
    return account === "anonymous" ? [] : account.memberships;
  },
);

/**
 * Indique si la session doit vérifier son second facteur avant tout
 * changement de mot de passe : compte doté d'un facteur vérifié, session
 * encore au premier niveau. Toujours faux en démonstration, et pour une
 * personne non connectée (aucun mot de passe à changer).
 */
export const passwordNeedsSecondFactor = cache(async (): Promise<boolean> => {
  if (isDemoMode()) return false;
  let account: Account | "anonymous";
  try {
    account = await loadAccount();
  } catch (error) {
    // Niveau illisible : on exige le second facteur plutôt que de
    // laisser passer un changement de mot de passe à l'aveugle.
    if (error instanceof SessionUnavailableError) return true;
    throw error;
  }
  if (account === "anonymous") return false;
  return passwordChangeNeedsSecondFactor(account.assurance);
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
