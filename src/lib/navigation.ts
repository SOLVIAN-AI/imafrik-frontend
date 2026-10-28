import type { NavIconKey } from "@/components/layout/sidebar";
import type { AppMessages } from "@/i18n";
import { isPublicSitePath } from "@/lib/i18n/routes";
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
  /** Radiologue : examens attribués pas encore commencés, et urgences à prendre. */
  toRead: number;
  /** Dont urgences à prendre (liste d'urgence). */
  urgentToRead: number;
  /** Examens en cours de lecture par l'utilisateur. */
  mine: number;
  /** Clinique : examens qui attendent une attribution. */
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
 * Le premier groupe se passe en général d'intitulé : ce qu'on utilise
 * vingt fois par jour n'a pas besoin d'être annoncé.
 */
export interface NavGroup {
  /** Clé du titre de groupe (`nav.groups`) ; sans titre, le premier groupe. */
  key?: NavGroupKey;
  items: NavItem[];
  /**
   * Suite du groupe précédent : même bloc, séparé par un simple filet, sans
   * titre ni grand espace. Pour garder ensemble ce qui relève d'un même
   * rôle tout en le découpant en paquets lisibles d'un coup d'œil.
   */
  continues?: boolean;
  /**
   * Replié par défaut, derrière son titre : pour ce qu'on n'ouvre que de
   * temps en temps. Il s'ouvre de lui-même sur une de ses pages.
   */
  collapsible?: boolean;
  /**
   * Écrans d'une clinique choisie (vue des cliniques) : les adresses sont
   * celles du responsable, que la navigation place sous la clinique
   * consultée (`lib/clinic-view.ts`). Le bloc porte le choix de la clinique.
   */
  clinicScoped?: boolean;
}

/**
 * Un bloc de la barre latérale : un groupe et ses suites.
 */
export interface NavBlock {
  key?: NavGroupKey;
  collapsible: boolean;
  /** Écrans d'une clinique choisie, voir {@link NavGroup.clinicScoped}. */
  clinicScoped: boolean;
  /** Paquets d'entrées, séparés par un filet. */
  sections: NavItem[][];
}

/**
 * Réunit chaque groupe et ses suites (`continues`) en un bloc.
 *
 * @param groups Groupes dans l'ordre d'affichage.
 * @returns Les blocs, dans le même ordre.
 */
export function navigationBlocks(groups: readonly NavGroup[]): NavBlock[] {
  const blocks: NavBlock[] = [];
  for (const group of groups) {
    const last = blocks.at(-1);
    if (group.continues && last) {
      last.sections.push(group.items);
    } else {
      blocks.push({
        key: group.key,
        collapsible: group.collapsible ?? false,
        clinicScoped: group.clinicScoped ?? false,
        sections: [group.items],
      });
    }
  }
  return blocks;
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
      // Ouverte dès l'inscription, dossier validé ou non : c'est là qu'on
      // prend l'outil en main, sans patient (docs/formation.md du backend).
      { href: "/formation", key: "training", icon: "training" },
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
      { href: "/activite", key: "activity", icon: "analytics" },
      { href: "/parametres", key: "settings", icon: "settings" },
    ],
  },
];

/**
 * Navigation de l'équipe IMAFRIK : la tour de contrôle.
 *
 * **Administration**, un seul bloc pour tout ce qui est à l'équipe, en
 * trois paquets séparés d'un filet, qui répondent à trois questions :
 * la plateforme tient-elle ses promesses, en ce moment et dans la durée ?
 * qui est raccordé, qui attend, qui a écrit ? ce qui se facture, ce qui
 * tourne, ce qui s'est passé, ce qui se règle. Ces outils se suivent :
 * rien d'autre ne vient s'intercaler entre eux.
 *
 * Puis les deux vues de consultation, repliées, où IMAFRIK supervise son
 * service comme ses utilisateurs le vivent, de temps en temps :
 *
 * - la **vue des cliniques** ouvre les écrans du responsable d'une
 *   clinique choisie, avec ses données (tableau de bord, examens,
 *   comptes-rendus, équipe, activité et facturation). Les gestes du
 *   responsable (envoyer, inviter, renseigner un examen, télécharger au
 *   nom de la clinique) restent les siens ;
 * - la **vue des radiologues** ouvre leurs écrans sur toute la plateforme
 *   (la file à lire, les comptes-rendus, les modèles, la formation). Les
 *   gestes médicaux (prise en charge, rédaction, signature) restent aux
 *   radiologues.
 */
const ADMIN_NAV: NavGroup[] = [
  {
    key: "administration",
    items: [
      { href: "/admin", key: "cockpit", icon: "cockpit", exact: true },
      { href: "/admin/activite", key: "analytics", icon: "analytics" },
      { href: "/admin/flux", key: "flow", icon: "flow" },
    ],
  },
  {
    continues: true,
    items: [
      {
        href: "/admin/organisations",
        key: "organisations",
        icon: "organizations",
      },
      { href: "/admin/passerelles", key: "gateways", icon: "gateways" },
      { href: "/admin/utilisateurs", key: "accounts", icon: "users" },
      { href: "/admin/examens", key: "studies", icon: "studies" },
      { href: "/admin/demandes", key: "requests", icon: "inbox" },
    ],
  },
  {
    continues: true,
    items: [
      { href: "/admin/facturation", key: "billing", icon: "billing" },
      { href: "/admin/systeme", key: "system", icon: "system" },
      { href: "/admin/audit", key: "audit", icon: "audit" },
      { href: "/admin/reglages", key: "controls", icon: "controls" },
    ],
  },
  {
    key: "clinicView",
    collapsible: true,
    clinicScoped: true,
    // Les écrans du responsable, dans l'ordre de sa navigation. Ni
    // « Envoyer un examen » ni les paramètres : ce sont ses gestes.
    items: [
      { href: "/tableau-de-bord", key: "dashboard", icon: "dashboard" },
      { href: "/examens", key: "studies", icon: "studies" },
      { href: "/comptes-rendus", key: "reports", icon: "reports" },
      { href: "/equipe", key: "team", icon: "team" },
      { href: "/activite", key: "activity", icon: "analytics" },
    ],
  },
  {
    key: "radiologistView",
    collapsible: true,
    items: [
      { href: "/worklist", key: "worklist", icon: "worklist" },
      { href: "/comptes-rendus", key: "reports", icon: "reports" },
      { href: "/modeles", key: "templates", icon: "templates" },
      // L'équipe prévisualise aussi les cas en relecture, pour les faire
      // relire avant publication.
      { href: "/formation", key: "training", icon: "training" },
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
    // Ses adresses mènent à la file ou au poste de lecture : un lien
    // d'examen reçu s'ouvre, au lieu de renvoyer à l'accueil.
    "/examens",
    "/comptes-rendus",
    "/modeles",
    "/formation",
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
    // Activité et facturation : responsables seulement, un radiologue de
    // la clinique n'y a pas accès (le service le refuse aussi).
    "/activite",
    "/parametres",
  ],
  // L'administration consulte aussi les portails, en lecture seule : la
  // file, les comptes-rendus, les modèles et les images, sur toute la
  // plateforme (policies RLS *_select_admin). Ouverture des images
  // tracée à son nom.
  platform_admin: [
    "/admin",
    "/worklist",
    "/comptes-rendus",
    "/modeles",
    "/lecture",
    // Les adresses de la clinique mènent aux écrans de l'équipe : un lien
    // d'examen reçu d'une clinique s'ouvre, au lieu de renvoyer au cockpit.
    "/examens",
    "/formation",
    "/parametres",
  ],
};

/**
 * Racines accessibles à tout utilisateur rattaché à une organisation,
 * quel que soit son rôle : la mise en service, les engagements à
 * accepter, l'accueil d'une personne invitée et le choix d'un nouveau
 * mot de passe.
 */
const SHARED_ROUTES = [
  "/bienvenue",
  "/engagements",
  "/invitation",
  "/nouveau-mot-de-passe",
];

/**
 * Adresses accessibles sans session, en plus des pages du site public.
 *
 * Tout le reste est protégé par défaut. C'est le bon sens de la liste
 * blanche : ajouter un écran ne doit pas pouvoir l'exposer par oubli, et
 * dans une application qui manipule des données de santé, l'oubli se
 * paie cher.
 *
 * Les pages du site public, elles, ne sont pas répétées ici : elles
 * viennent de leur liste unique (`PAGES`, `lib/i18n/routes.ts`), dans
 * chaque langue. Répétées, l'une avait été oubliée : `/apercu/parcours`
 * menait à la connexion en production (22 octobre 2026).
 */
const PUBLIC_ROUTES = [
  // Le site public en anglais : uniquement des pages de vitrine. Une
  // adresse inconnue y répond par la page introuvable, sans connexion.
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
  return (
    isPublicSitePath(pathname) ||
    PUBLIC_ROUTES.some((route) => under(pathname, route))
  );
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
