import type { Membership, Session } from "@/lib/session/types";

/**
 * Session de démonstration.
 *
 * Servie tant que Supabase n'est pas configuré. L'utilisateur appartient
 * volontairement à **deux** organisations de nature différente : c'est le
 * cas qui met à l'épreuve toute l'architecture — un même compte, deux
 * portails, deux jeux de droits — et celui qu'on veut pouvoir montrer.
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
    id: "m-clinic",
    organizationId: "org-stj",
    organizationName: "Clinique Saint-Joseph",
    organizationKind: "clinic",
    role: "clinic_staff",
    city: "Lomé",
  },
];

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
    user: {
      id: "demo-user",
      email: "demo@imafrik.com",
      fullName: "Dr Adjo Kponton",
      title: "Radiologue",
    },
    memberships: DEMO_MEMBERSHIPS,
    active,
    isDemo: true,
  };
}
