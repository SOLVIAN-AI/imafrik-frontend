import type { NavIconKey } from "@/components/layout/sidebar";
import type { AppMessages } from "@/i18n";
import type { UserRole } from "@/lib/session/types";

/** Clé d'une entrée de navigation ; son libellé dépend de la langue. */
export type NavItemKey = keyof AppMessages["nav"]["items"];

/** Clé d'un titre de groupe. */
export type NavGroupKey = keyof AppMessages["nav"]["groups"];

/**
 * Compteurs affichables dans la navigation.
 *
 * Calculés par le service (`GET /metrics/summary`) sur le périmètre de
 * l'utilisateur, et passés au châssis par la disposition. La navigation
 * ne contient que la **clé** du compteur : un nombre écrit ici
 * s'afficherait à tout le monde, quel que soit le contenu réel.
 */
export interface NavCounts {
  /** Examens du pool en attente de lecture. */
  toRead: number;
  /** Dont urgences. */
  urgentToRead: number;
  /** Examens en cours de lecture par l'utilisateur. */
  mine: number;
  /** Examens de la clinique pas encore rendus. */
  clinicOpen: number;
  /** Comptes-rendus signés que la clinique n'a pas encore téléchargés. */
  reportsToDownload: number;
}

export interface NavItem {
  href: string;
  /** Clé du libellé dans les textes de l'application (`nav.items`). */
  key: NavItemKey;
  icon: NavIconKey;
  /** Compteur affiché à droite. Masqué à zéro : un « 0 » attire l'œil pour rien. */
  count?: keyof NavCounts;
  /** Compteur dont une valeur non nulle signale des urgences. */
  urgentCount?: keyof NavCounts;
  /**
   * Actif sur cette adresse seulement, pas sur ses sous-pages — pour une
   * racine comme `/admin`, qui coifferait sinon tout le portail.
   */
  exact?: boolean;
}

/**
 * Indique si une entrée correspond à l'adresse courante.
 *
 * @param item     Entrée de navigation.
 * @param pathname Adresse courante.
 */
export function isActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  return !item.exact && pathname.startsWith(`${item.href}/`);
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
  /** Clé du titre de groupe (`nav.groups`) ; sans titre, le premier groupe. */
  key?: NavGroupKey;
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
        key: "worklist",
        icon: "worklist",
        count: "toRead",
        urgentCount: "urgentToRead",
      },
      {
        href: "/mes-examens",
        key: "myStudies",
        icon: "studies",
        count: "mine",
      },
    ],
  },
  {
    key: "production",
    items: [
      { href: "/comptes-rendus", key: "reports", icon: "reports" },
      { href: "/modeles", key: "templates", icon: "templates" },
    ],
  },
  {
    key: "account",
    items: [{ href: "/parametres", key: "settings", icon: "settings" }],
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
      { href: "/tableau-de-bord", key: "dashboard", icon: "dashboard" },
      { href: "/envoyer", key: "send", icon: "send" },
    ],
  },
  {
    key: "tracking",
    items: [
      {
        href: "/examens",
        key: "studies",
        icon: "studies",
        count: "clinicOpen",
      },
      {
        href: "/comptes-rendus",
        key: "reports",
        icon: "reports",
        count: "reportsToDownload",
      },
    ],
  },
  {
    key: "facility",
    items: [
      { href: "/equipe", key: "team", icon: "team" },
      { href: "/parametres", key: "settings", icon: "settings" },
    ],
  },
];

/**
 * Navigation de l'équipe IMAFRIK : la tour de contrôle.
 *
 * Trois questions, trois groupes. **Pilotage** : la plateforme tient-elle
 * ses promesses, en ce moment et dans la durée ? **Réseau** : qui est
 * raccordé, qui attend, qui a écrit ? **Plateforme** : ce qui se facture,
 * ce qui tourne, ce qui s'est passé, ce qui se règle.
 */
const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { href: "/admin", key: "cockpit", icon: "cockpit", exact: true },
      { href: "/admin/activite", key: "analytics", icon: "analytics" },
      { href: "/admin/flux", key: "flow", icon: "flow" },
    ],
  },
  {
    key: "network",
    items: [
      {
        href: "/admin/organisations",
        key: "organisations",
        icon: "organizations",
      },
      { href: "/admin/utilisateurs", key: "accounts", icon: "users" },
      { href: "/admin/examens", key: "studies", icon: "studies" },
      { href: "/admin/demandes", key: "requests", icon: "inbox" },
    ],
  },
  {
    key: "platform",
    items: [
      { href: "/admin/facturation", key: "billing", icon: "billing" },
      { href: "/admin/systeme", key: "system", icon: "system" },
      { href: "/admin/audit", key: "audit", icon: "audit" },
      { href: "/admin/reglages", key: "controls", icon: "controls" },
    ],
  },
  {
    key: "account",
    items: [{ href: "/parametres", key: "settings", icon: "settings" }],
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
  platform_admin: "/admin",
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
 * Racines accessibles à tout utilisateur rattaché à une organisation,
 * quel que soit son rôle : la mise en service et le choix d'un nouveau
 * mot de passe — après une invitation, par exemple.
 */
const SHARED_ROUTES = ["/bienvenue", "/nouveau-mot-de-passe"];

/**
 * Adresses accessibles sans session.
 *
 * Tout le reste est protégé par défaut. C'est le bon sens de la liste
 * blanche : ajouter un écran ne doit pas pouvoir l'exposer par oubli, et
 * dans une application qui manipule des données de santé, l'oubli se
 * paie cher.
 */
const PUBLIC_ROUTES = [
  "/",
  "/securite",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
  "/cgu",
  "/verifier",
  // Le site public en anglais : uniquement des pages de vitrine.
  "/en",
  "/connexion",
  "/mot-de-passe-oublie",
  "/auth",
  "/configuration-requise",
  "/robots.txt",
  "/sitemap.xml",
  // Lu par le navigateur avant toute connexion, pour proposer
  // l'installation sur l'écran d'accueil.
  "/manifest.webmanifest",
];

/** Vrai si l'adresse est la racine donnée ou l'une de ses sous-pages. */
function under(pathname: string, root: string): boolean {
  return root === "/"
    ? pathname === "/"
    : pathname === root || pathname.startsWith(`${root}/`);
}

/**
 * Indique si une adresse est accessible sans être connecté.
 *
 * @param pathname Adresse demandée.
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => under(pathname, route));
}

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
 * Utilisée par le proxy et par les dispositions pour **renvoyer chacun
 * vers son portail** : quelqu'un qui change d'organisation, ou qui suit
 * le lien d'un autre rôle, atterrit chez lui plutôt que devant un écran
 * qui n'est pas le sien.
 *
 * Ce tri n'est pas la protection des données : celle-ci est posée par le
 * service et les politiques RLS, et une adresse atteinte de force ne
 * renverrait aucune donnée. Les deux barrières sont complémentaires.
 *
 * @param role     Rôle de l'appartenance active.
 * @param pathname Adresse courante.
 */
export function isRouteAllowed(role: UserRole, pathname: string): boolean {
  return (
    isPublicRoute(pathname) ||
    [...ROUTES_BY_ROLE[role], ...SHARED_ROUTES].some((route) =>
      under(pathname, route),
    )
  );
}
