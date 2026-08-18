"use client";

import * as React from "react";

import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Rôles, tels que le schéma les définit (`public.user_role`).
 *
 * Le rôle n'est pas porté par l'utilisateur mais par son **appartenance**
 * à une organisation : le même médecin peut être radiologue dans un
 * cabinet et membre du personnel d'une clinique. C'est le rôle de
 * l'appartenance active qui alimente les claims du JWT, et donc toutes
 * les politiques RLS.
 */
export type UserRole = "platform_admin" | "radiologist" | "clinic_staff";

/** Nature d'une organisation (`public.org_kind`). */
export type OrgKind = "clinic" | "radiology_group";

/** Une appartenance : qui, dans quelle organisation, à quel titre. */
export interface Membership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationKind: OrgKind;
  role: UserRole;
  /** Ville, affichée pour distinguer deux établissements homonymes. */
  city: string;
}

/** Libellés des rôles, du point de vue de l'utilisateur. */
export const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: "Administrateur IMAFRIK",
  radiologist: "Radiologue",
  clinic_staff: "Clinique",
};

/**
 * Utilisateur de démonstration.
 *
 * Il appartient volontairement à **deux** organisations de nature
 * différente : c'est le cas qui met à l'épreuve toute l'architecture —
 * un même compte, deux portails, deux jeux de droits. Basculer de l'une
 * à l'autre depuis le sélecteur d'organisation change entièrement
 * l'application, sans reconnexion.
 */
export const DEMO_USER = {
  fullName: "Dr Adjo Kponton",
  title: "Radiologue",
} as const;

export const DEMO_MEMBERSHIPS: Membership[] = [
  {
    id: "m-radio",
    organizationId: "org-radio",
    organizationName: "IMAFRIK Radiologie",
    organizationKind: "radiology_group",
    role: "radiologist",
    city: "Lomé",
  },
  {
    id: "m-clinic",
    organizationId: "org-stj",
    organizationName: "Clinique Saint-Joseph",
    organizationKind: "clinic",
    role: "clinic_staff",
    city: "Lomé",
  },
];

/** Appartenance retenue tant que l'utilisateur n'a rien choisi. */
const DEFAULT_MEMBERSHIP_ID = DEMO_MEMBERSHIPS[0].id;

const STORAGE_KEY = "imafrik.active-membership";

/**
 * Abonnés au changement d'organisation active.
 *
 * L'état vit hors de React, dans `localStorage`, pour deux raisons : il
 * survit au rechargement — on retrouve la casquette qu'on avait — et il
 * se propage aux autres onglets, ce qui évite de travailler dans deux
 * onglets sous deux organisations différentes sans s'en apercevoir.
 */
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // `storage` ne se déclenche que dans les *autres* onglets ; le nôtre
  // est prévenu par `notify`.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Identifiant courant.
 *
 * Lu à chaque rendu : `localStorage.getItem` est peu coûteux, et deux
 * chaînes égales sont considérées identiques par React — la valeur est
 * donc stable au sens de `useSyncExternalStore`.
 */
const getSnapshot = () =>
  window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MEMBERSHIP_ID;

/**
 * Le serveur ne connaît pas le choix de l'utilisateur.
 *
 * Il rend donc l'appartenance par défaut, exactement comme le premier
 * rendu du navigateur : les deux HTML coïncident, et la bascule vers
 * l'organisation réellement choisie a lieu juste après, sans divergence
 * d'hydratation.
 */
const getServerSnapshot = () => DEFAULT_MEMBERSHIP_ID;

/**
 * Session de démonstration.
 *
 * Sera remplacée par la session Supabase : `GET /me` renvoie déjà le
 * profil, ses appartenances et l'appartenance active, et
 * `PUT /me/active-organization` effectue la bascule côté serveur — ce
 * qui, à ce moment-là, régénérera le JWT et donc les droits.
 *
 * @returns L'utilisateur, ses appartenances, celle qui est active, la
 *          fonction qui en change, et `ready` — faux tant que le choix
 *          réel de l'utilisateur n'est pas connu.
 *
 * @example
 * ```tsx
 * const { active } = useSession();
 * if (active.role === "clinic_staff") return <PortailClinique />;
 * ```
 */
export function useSession() {
  const activeId = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const active =
    DEMO_MEMBERSHIPS.find((m) => m.id === activeId) ?? DEMO_MEMBERSHIPS[0];

  const setActive = React.useCallback((membershipId: string) => {
    window.localStorage.setItem(STORAGE_KEY, membershipId);
    notify();
  }, []);

  return {
    user: DEMO_USER,
    memberships: DEMO_MEMBERSHIPS,
    active,
    setActive,
    // Au rendu serveur et pendant l'hydratation, `active` vaut
    // l'appartenance par défaut, qui n'est pas forcément celle qu'a
    // choisie l'utilisateur. Tout ce qui **agit** sur cette valeur — une
    // redirection, un appel d'API — doit attendre ce drapeau ; tout ce
    // qui se contente de l'afficher peut s'en passer, la correction
    // arrivant au rendu suivant.
    ready: useHydrated(),
  };
}
