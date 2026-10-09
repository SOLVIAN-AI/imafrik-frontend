import "server-only";

import { ApiError, apiGet } from "@/lib/api/client";
import {
  type ApiInvitationWelcome,
  invitationWelcomeSchema,
} from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { demoInvitation } from "@/lib/session/demo";
import type { OrgKind, UserRole } from "@/lib/session/types";

/**
 * Ce qu'une personne invitée voit en arrivant : l'organisation qui
 * l'accueille, son rôle, et qui l'a invitée.
 *
 * Nommer l'établissement et la personne qui invite rassure celui qui
 * attendait le lien, et alerte celui qui ne l'attendait pas : un courriel
 * d'invitation imité ne saurait pas ce que le service répond ici.
 */
export interface Invitation {
  organizationName: string;
  organizationKind: OrgKind;
  city: string | null;
  role: UserRole;
  /** Nom de la personne qui a invité ; `null` s'il n'est pas connu. */
  invitedByName: string | null;
  invitedAt: Date;
}

/** Traduit la réponse du service dans le vocabulaire de l'interface. */
function toInvitation(raw: ApiInvitationWelcome): Invitation {
  return {
    organizationName: raw.organization_name,
    organizationKind: raw.organization_kind,
    city: raw.city,
    role: raw.role,
    invitedByName: raw.invited_by_name,
    invitedAt: new Date(raw.invited_at),
  };
}

/**
 * Invitation de l'utilisateur connecté (`GET /me/invitation`).
 *
 * Le service la sert **avant** la double authentification : c'est la
 * première page de l'invité, avant même son mot de passe. Toute absence
 * de réponse — aucune appartenance (404), service injoignable, contrat
 * rompu — rend `null` : l'écran retombe alors sur le simple choix du mot
 * de passe, qui suffit à poursuivre. L'accueil est un confort, il ne doit
 * jamais bloquer l'entrée.
 *
 * @returns L'invitation, ou `null` si elle ne peut pas être présentée.
 */
export async function getInvitation(): Promise<Invitation | null> {
  if (isDemoMode()) return toInvitation(demoInvitation());
  try {
    const raw = await apiGet("/me/invitation", invitationWelcomeSchema, {
      notFoundAsNull: true,
    });
    return raw ? toInvitation(raw) : null;
  } catch (error) {
    // Ni le message ni la réponse : seulement le statut, sans donnée.
    console.error(
      "Accueil de l’invité indisponible",
      error instanceof ApiError ? error.status : "erreur inattendue",
    );
    return null;
  }
}
