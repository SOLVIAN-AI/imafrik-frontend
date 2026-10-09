import {
  isAuthApiError,
  isAuthSessionMissingError,
} from "@supabase/supabase-js";

import { markServiceUnavailable } from "@/lib/service-unavailable";
import type { Membership } from "@/lib/session/types";

/**
 * Règles de résolution de la session, sans accès réseau : testables seules.
 *
 * Deux principes, que `getAuthState` applique :
 *
 * 1. **L'organisation active est celle du hook de jeton, et seulement
 *    elle.** Le hook (`custom_access_token_hook`, dépôt backend) lit le
 *    rôle par `profiles.active_membership_id`, joint à une organisation
 *    active, sans repli. L'interface se repliait sur la première
 *    appartenance active venue : quand l'organisation active était
 *    suspendue, le jeton sortait sans rôle (le proxy envoyait vers
 *    `/en-attente`) mais l'interface voyait une session (et `/en-attente`
 *    renvoyait vers le portail), d'où une boucle de redirection.
 * 2. **Une panne n'est pas une absence.** Une erreur du service
 *    d'authentification ou de la base ne doit jamais se lire « personne
 *    n'est connecté » ou « aucune organisation » : chacun de ces états
 *    redirige, et le proxy, qui vérifie le jeton localement, renvoie
 *    aussitôt en sens inverse. Une panne lève
 *    {@link SessionUnavailableError}, que l'écran d'erreur présente avec
 *    un bouton « Réessayer ».
 */

/**
 * La session n'a pas pu être résolue : service d'authentification ou base
 * indisponible, limite de débit atteinte. Ce n'est pas une déconnexion.
 *
 * Marquée comme panne (`lib/service-unavailable.ts`) : l'écran d'erreur
 * annonce un service momentanément indisponible, sans code à transmettre
 * au support.
 */
export class SessionUnavailableError extends Error {
  constructor(
    readonly step: "auth" | "profile" | "memberships" | "assurance",
    options?: { cause?: unknown },
  ) {
    super(`Session indisponible (${step})`, options);
    this.name = "SessionUnavailableError";
    markServiceUnavailable(this);
  }
}

/**
 * Indique si l'erreur de `getUser()` signifie « pas de session valide ».
 *
 * Pas de cookie de session, ou un jeton que le service refuse (expiré,
 * révoqué, compte supprimé) : réponse 4xx. Le reste, réseau, 5xx ou 429
 * (limite de débit), est une panne : la session existe peut-être, on ne
 * sait pas.
 *
 * @param error Erreur renvoyée par `supabase.auth.getUser()`.
 */
export function isSignedOutError(error: unknown): boolean {
  if (isAuthSessionMissingError(error)) return true;
  if (!isAuthApiError(error)) return false;
  return error.status >= 400 && error.status < 500 && error.status !== 429;
}

/**
 * Appartenance active, selon la règle du hook de jeton.
 *
 * @param memberships  Appartenances de l'utilisateur dont l'organisation
 *                     est active.
 * @param activeId     `profiles.active_membership_id`.
 * @returns L'appartenance désignée par le profil si son organisation est
 *          active, `null` sinon, **sans repli** sur une autre : le jeton
 *          n'en porterait pas le rôle.
 */
export function resolveActiveMembership(
  memberships: readonly Membership[],
  activeId: string | null | undefined,
): Membership | null {
  if (!activeId) return null;
  return memberships.find((membership) => membership.id === activeId) ?? null;
}
