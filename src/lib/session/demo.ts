import { DEMO_USER_ID } from "@/lib/demo/studies";
import type { Membership, Session } from "@/lib/session/types";

/**
 * Session de démonstration.
 *
 * Servie tant que Supabase n'est pas configuré. L'utilisateur appartient
 * volontairement à **trois** organisations couvrant les trois rôles :
 * c'est le cas qui met à l'épreuve toute l'architecture — un même
 * compte, trois portails, trois jeux de droits — et celui qu'on veut
 * pouvoir montrer.
 */
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
    id: "m-admin",
    organizationId: "org-solvian",
    organizationName: "Équipe IMAFRIK",
    organizationKind: "radiology_group",
    role: "platform_admin",
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

/**
 * Qui l'on incarne dans chaque portail.
 *
 * Un seul compte appartient aux trois organisations — c'est le cas que
 * l'architecture doit tenir — mais une démonstration où la même
 * radiologue apparaît dans l'équipe d'une clinique et dans le
 * back-office brouille le propos. Chaque portail montre donc la personne
 * qu'un vrai client y verrait.
 */
const PERSONAS: Record<string, Session["user"]> = {
  "m-radio": {
    id: DEMO_USER_ID,
    email: "a.kponton@imafrik.tech",
    fullName: "Adjo Kponton",
    title: "Dr",
  },
  "m-admin": {
    id: DEMO_USER_ID,
    email: "operations@imafrik.tech",
    fullName: "Edem Agbodjan",
    title: "",
  },
  "m-clinic": {
    id: DEMO_USER_ID,
    email: "accueil@cliniquesaintjoseph.tg",
    fullName: "Akouvi Mensah",
    title: "",
  },
};

/**
 * Construit la session de démonstration.
 *
 * @param activeId Appartenance choisie, si l'utilisateur en a changé.
 */
export function demoSession(activeId?: string): Session {
  const active =
    DEMO_MEMBERSHIPS.find((membership) => membership.id === activeId) ??
    DEMO_MEMBERSHIPS[0];

  return {
    user: PERSONAS[active.id],
    memberships: DEMO_MEMBERSHIPS,
    active,
    isDemo: true,
  };
}
