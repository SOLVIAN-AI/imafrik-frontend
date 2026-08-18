import type { NavIconKey } from "@/components/layout/sidebar";
import type { UserRole } from "@/lib/demo/session";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  /** Compteur affiché à droite. Masqué à zéro : un « 0 » attire l'œil pour rien. */
  count?: number;
  /** Signale que le compteur contient des urgences. */
  urgent?: boolean;
}

/**
 * Un groupe d'entrées de navigation.
 *
 * Au-delà de cinq entrées, une liste plate se parcourt entièrement à
 * chaque fois qu'on cherche quelque chose. Les regrouper — agir, suivre,
 * administrer — donne des repères stables : on sait dans quel tiers
 * chercher avant même de lire.
 *
 * Le premier groupe n'a pas d'intitulé : ce qu'on utilise vingt fois par
 * jour n'a pas besoin d'être annoncé.
 */
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * Navigation du radiologue.
 *
 * L'ordre suit le déroulé d'une journée : ce qui reste à lire, ce qu'on a
 * en main, ce qu'on a rendu, les outils. Un classement alphabétique
 * obligerait à réfléchir avant de cliquer.
 */
const RADIOLOGIST_NAV: NavGroup[] = [
  {
    items: [
      {
        href: "/worklist",
        label: "À lire",
        icon: "worklist",
        count: 3,
        urgent: true,
      },
      { href: "/mes-examens", label: "Mes examens", icon: "studies", count: 2 },
    ],
  },
  {
    label: "Production",
    items: [
      { href: "/comptes-rendus", label: "Comptes-rendus", icon: "reports" },
      { href: "/modeles", label: "Modèles", icon: "templates" },
    ],
  },
  {
    label: "Compte",
    items: [{ href: "/parametres", label: "Paramètres", icon: "settings" }],
  },
];

/**
 * Navigation de la clinique.
 *
 * Elle suit le cycle de vie d'un examen vu de l'établissement : on
 * envoie, on suit, on récupère. « Envoyer un examen » est isolé en tête
 * parce que c'est la seule action de la journée — tout le reste est de
 * la consultation.
 */
const CLINIC_NAV: NavGroup[] = [
  {
    items: [
      { href: "/tableau-de-bord", label: "Tableau de bord", icon: "dashboard" },
      { href: "/envoyer", label: "Envoyer un examen", icon: "send" },
    ],
  },
  {
    label: "Suivi",
    items: [
      { href: "/examens", label: "Examens", icon: "studies", count: 4 },
      {
        href: "/comptes-rendus",
        label: "Comptes-rendus",
        icon: "reports",
        count: 2,
      },
    ],
  },
  {
    label: "Établissement",
    items: [
      { href: "/equipe", label: "Équipe", icon: "team" },
      { href: "/parametres", label: "Paramètres", icon: "settings" },
    ],
  },
];

/** Navigation de l'équipe IMAFRIK. */
const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { href: "/admin/organisations", label: "Organisations", icon: "team" },
      { href: "/admin/examens", label: "Examens", icon: "studies" },
    ],
  },
  {
    label: "Compte",
    items: [{ href: "/parametres", label: "Paramètres", icon: "settings" }],
  },
];

const NAV_BY_ROLE: Record<UserRole, NavGroup[]> = {
  radiologist: RADIOLOGIST_NAV,
  clinic_staff: CLINIC_NAV,
  platform_admin: ADMIN_NAV,
};

/**
 * Navigation correspondant à un rôle.
 *
 * **Le rôle décide de la navigation, pas l'inverse.** Afficher à tout le
 * monde les mêmes entrées en refusant l'accès au clic produirait une
 * interface pleine de portes fermées ; et masquer une entrée n'est pas
 * une protection — celle-ci est posée en base, par les politiques RLS.
 * Ce module ne fait que présenter à chacun ce qui le concerne.
 *
 * @param role Rôle de l'appartenance active.
 * @returns Les groupes d'entrées, dans l'ordre d'affichage.
 */
export function navigationFor(role: UserRole): NavGroup[] {
  return NAV_BY_ROLE[role];
}

/**
 * Écran d'accueil de chaque rôle.
 *
 * Ce n'est pas le même verbe pour tout le monde : le radiologue arrive
 * sur ce qu'il a à lire, la clinique sur ce qu'elle attend.
 */
const HOME_BY_ROLE: Record<UserRole, string> = {
  radiologist: "/worklist",
  clinic_staff: "/tableau-de-bord",
  platform_admin: "/admin/organisations",
};

/**
 * Racines d'URL accessibles à chaque rôle.
 *
 * Certaines sont partagées — la fiche d'un examen, les comptes-rendus,
 * les paramètres — parce que les deux métiers y cherchent la même chose.
 * Le contenu, lui, s'adapte au rôle à l'intérieur de l'écran.
 */
const ROUTES_BY_ROLE: Record<UserRole, string[]> = {
  radiologist: [
    "/worklist",
    "/mes-examens",
    "/lecture",
    "/examens",
    "/comptes-rendus",
    "/modeles",
    "/parametres",
  ],
  clinic_staff: [
    "/tableau-de-bord",
    "/envoyer",
    "/examens",
    // La clinique consulte ses propres images : même écran que le
    // radiologue, mais sans rédaction ni signature.
    "/lecture",
    "/comptes-rendus",
    "/equipe",
    "/parametres",
  ],
  platform_admin: ["/admin", "/parametres"],
};

/**
 * Adresse d'accueil d'un rôle.
 *
 * @param role Rôle de l'appartenance active.
 */
export function homeFor(role: UserRole): string {
  return HOME_BY_ROLE[role];
}

/**
 * Indique si une adresse appartient au portail d'un rôle.
 *
 * Sert uniquement à **rediriger** : quelqu'un qui change d'organisation
 * depuis la file de lecture ne doit pas rester devant un écran qui
 * n'existe pas pour sa nouvelle casquette.
 *
 * **Ce n'est pas un contrôle d'accès.** Celui-ci est posé en base, par
 * les politiques RLS : une adresse atteinte de force ne renverrait aucune
 * donnée. Confondre les deux reviendrait à croire qu'un menu masqué
 * protège quoi que ce soit.
 *
 * @param role     Rôle de l'appartenance active.
 * @param pathname Adresse courante.
 */
export function isRouteAllowed(role: UserRole, pathname: string): boolean {
  return ROUTES_BY_ROLE[role].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
