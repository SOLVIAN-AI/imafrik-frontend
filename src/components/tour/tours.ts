import type { Placement } from "@/components/tour/geometry";
import type { UserRole } from "@/lib/session/types";

/**
 * Les visites guidées : quel écran, pour qui, et quelles étapes.
 *
 * Une visite démarre seule à la première ouverture de son écran, puis ne
 * revient plus, sur aucun appareil (`profiles.tours_completed`). Elle se
 * relance à la demande depuis le bouton d'aide.
 *
 * Les textes sont dans les dictionnaires (`tour.tours`), par identifiant
 * de visite et d'étape ; ce module ne décrit que la structure. Une étape
 * vise un élément par son attribut `data-tour` ; s'il n'est pas affiché
 * (téléphone, tiroir fermé, bouton propre à un autre état de l'écran),
 * elle essaie `fallback`, puis se passe de lui si `optional`, ou se centre.
 */

/** Une étape : l'élément qu'elle montre, et où poser sa bulle. */
export interface TourStep {
  /** Identifiant, clé de ses textes. */
  id: string;
  /** Valeur de `data-tour` de l'élément à montrer ; absente, la bulle se centre. */
  target?: string;
  /** Repère de remplacement quand `target` n'est pas affiché (le menu, sur téléphone). */
  fallback?: string;
  /** Sans aucun repère affiché, l'étape est sautée plutôt que centrée. */
  optional?: boolean;
  placement?: Placement;
}

/** Une visite. */
export interface TourDefinition {
  /** Identifiant, noté sur le profil une fois la visite faite. */
  id: TourId;
  roles: readonly UserRole[];
  /** Vrai si la visite concerne cet écran. */
  matches: (pathname: string) => boolean;
  steps: readonly TourStep[];
}

export type TourId =
  "radiologue-file" | "lecture" | "clinique-accueil" | "equipe-cockpit";

const under = (pathname: string, root: string) =>
  pathname === root || pathname.startsWith(`${root}/`);

export const TOURS: readonly TourDefinition[] = [
  {
    id: "radiologue-file",
    roles: ["radiologist"],
    matches: (pathname) => pathname === "/worklist",
    steps: [
      { id: "welcome" },
      {
        id: "worklist",
        target: "nav-worklist",
        fallback: "menu",
        placement: "right",
      },
      { id: "metrics", target: "worklist-metrics", optional: true },
      { id: "filters", target: "worklist-filters", optional: true },
      {
        id: "table",
        target: "worklist-table",
        placement: "top",
        optional: true,
      },
      {
        id: "mine",
        target: "nav-myStudies",
        fallback: "menu",
        placement: "right",
      },
      {
        id: "training",
        target: "nav-training",
        fallback: "menu",
        placement: "right",
      },
      { id: "search", target: "search" },
      { id: "help", target: "help", placement: "bottom" },
    ],
  },
  {
    id: "lecture",
    roles: ["radiologist"],
    // Le même écran sert les vrais examens et les exercices de formation.
    matches: (pathname) =>
      under(pathname, "/lecture") ||
      (pathname.startsWith("/formation/") && !pathname.endsWith("/pdf")),
    steps: [
      { id: "viewer", target: "viewer", placement: "right" },
      {
        id: "clinical",
        target: "clinical-info",
        placement: "left",
        optional: true,
      },
      { id: "claim", target: "claim", optional: true },
      // Sur téléphone, le compte-rendu est dans son onglet : la visite le montre.
      {
        id: "editor",
        target: "editor",
        fallback: "report-tab",
        placement: "left",
        optional: true,
      },
      { id: "templates", target: "templates", optional: true },
      { id: "sign", target: "sign", optional: true },
      { id: "back", target: "back", placement: "bottom" },
    ],
  },
  {
    id: "clinique-accueil",
    roles: ["clinic_staff"],
    matches: (pathname) => pathname === "/tableau-de-bord",
    steps: [
      { id: "welcome" },
      { id: "send", target: "send-study" },
      { id: "stats", target: "clinic-stats", optional: true },
      {
        id: "ready",
        target: "reports-ready",
        placement: "top",
        optional: true,
      },
      {
        id: "studies",
        target: "nav-studies",
        fallback: "menu",
        placement: "right",
      },
      { id: "team", target: "nav-team", fallback: "menu", placement: "right" },
      { id: "help", target: "help", placement: "bottom" },
    ],
  },
  {
    id: "equipe-cockpit",
    roles: ["platform_admin"],
    matches: (pathname) => pathname === "/admin",
    steps: [
      { id: "welcome" },
      { id: "alerts", target: "cockpit-alerts", optional: true },
      {
        id: "accounts",
        target: "nav-accounts",
        fallback: "menu",
        placement: "right",
      },
      {
        id: "organisations",
        target: "nav-organisations",
        fallback: "menu",
        placement: "right",
      },
      {
        id: "training",
        target: "nav-training",
        fallback: "menu",
        placement: "right",
      },
      { id: "help", target: "help", placement: "bottom" },
    ],
  },
];

/** La visite d'un écran pour un rôle, s'il en a une. */
export function tourFor(
  pathname: string,
  role: UserRole,
): TourDefinition | null {
  return (
    TOURS.find((tour) => tour.roles.includes(role) && tour.matches(pathname)) ??
    null
  );
}

/** La visite principale d'un rôle : celle de son écran d'accueil. */
export function mainTourFor(role: UserRole): TourDefinition | null {
  const id: Record<UserRole, TourId> = {
    radiologist: "radiologue-file",
    clinic_staff: "clinique-accueil",
    platform_admin: "equipe-cockpit",
  };
  return TOURS.find((tour) => tour.id === id[role]) ?? null;
}

/** Tous les identifiants : ce que la base accepte, et ce que les tests marquent faits. */
export const TOUR_IDS: readonly TourId[] = TOURS.map((tour) => tour.id);
