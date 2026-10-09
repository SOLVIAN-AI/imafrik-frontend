import { DEMO_USER_ID } from "@/lib/demo/studies";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
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
    reportLanguage: "fr",
  },
  {
    id: "m-admin",
    organizationId: "org-solvian",
    organizationName: "Équipe IMAFRIK",
    organizationKind: "radiology_group",
    role: "platform_admin",
    city: "Lomé",
    reportLanguage: "fr",
  },
  {
    id: "m-clinic",
    organizationId: "org-stj",
    organizationName: "Clinique Saint-Joseph",
    organizationKind: "clinic",
    role: "clinic_staff",
    city: "Lomé",
    reportLanguage: "fr",
  },
];

/** Numéro d'ordre de la radiologue de démonstration, validé. */
export const DEMO_LICENSE_NUMBER = "TG-RAD-0142";

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
    hasLicenseNumber: true,
    credentialsVerified: true,
  },
  "m-admin": {
    id: DEMO_USER_ID,
    email: "operations@imafrik.tech",
    fullName: "Edem Agbodjan",
    title: "",
    hasLicenseNumber: false,
    credentialsVerified: false,
  },
  "m-clinic": {
    id: DEMO_USER_ID,
    email: "accueil@cliniquesaintjoseph.tg",
    fullName: "Akouvi Mensah",
    title: "",
    hasLicenseNumber: false,
    credentialsVerified: false,
  },
};

/**
 * Construit la session de démonstration.
 *
 * @param activeId Appartenance choisie, si l'utilisateur en a changé.
 */
export function demoSession(
  activeId?: string,
  locale: Locale = DEFAULT_LOCALE,
): Session {
  const active =
    DEMO_MEMBERSHIPS.find((membership) => membership.id === activeId) ??
    DEMO_MEMBERSHIPS[0];

  return {
    user: PERSONAS[active.id],
    memberships: DEMO_MEMBERSHIPS,
    active,
    locale,
    isDemo: true,
  };
}

/**
 * Invitation de démonstration, telle que `GET /me/invitation` la
 * renverrait : une personne de l'accueil invitée à la Clinique
 * Saint-Joseph par la gestionnaire de la clinique, hier matin.
 *
 * Sert à montrer l'écran d'accueil d'un invité (`/invitation`) sans lien
 * d'invitation réel, et à le tester de bout en bout.
 *
 * @param now Instant de référence, en millisecondes.
 */
export function demoInvitation(now = Date.now()) {
  const clinic = DEMO_MEMBERSHIPS.find(
    (membership) => membership.id === "m-clinic",
  )!;
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  yesterday.setUTCHours(9, 30, 0, 0);
  return {
    organization_name: clinic.organizationName,
    organization_kind: clinic.organizationKind,
    city: clinic.city,
    role: "clinic_staff" as const,
    invited_by_name: PERSONAS["m-clinic"].fullName,
    invited_at: yesterday.toISOString(),
  };
}
