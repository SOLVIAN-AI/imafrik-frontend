/**
 * Dimensions de filtre des listes : **le seul endroit où l'on en ajoute
 * une**.
 *
 * Une dimension est une façon de restreindre une liste : la clinique, le
 * groupe de modalités, l'urgence ; demain le pays. Elle dit ici, une fois
 * pour tous les écrans :
 *
 * - son paramètre d'adresse, court, en français, qui ne dit rien d'une
 *   personne (`?modalite=scanner`, `?clinique=<identifiant>`) ;
 * - sa présentation : des puces pour une liste fixe et courte, une liste
 *   déroulante triée par ordre alphabétique, avec recherche, pour une
 *   liste qui grandit, une bascule pour un filtre à une seule valeur ;
 * - comment lire une valeur venue de l'adresse (une valeur inconnue est
 *   ignorée : la liste revient à « Tous ») et comment l'écrire ;
 * - ses textes : son nom et son option par défaut, « Tous » ou « Toutes ».
 *
 * L'ordre de ce registre est celui de la barre, le même sur tous les
 * écrans : où (la clinique), quoi (la modalité), où en est-on (l'urgence).
 * Chaque écran choisit ses dimensions dans `screens.ts` ; la requête au
 * service se construit à partir des filtres lus (`readFilters`).
 *
 * Module pur, sans rendu ni requête : lu par les pages serveur comme par
 * la barre de filtres, éprouvé par `url.test.ts`.
 */

import type { AppMessages } from "@/i18n";
import type { ModalityGroup } from "@/lib/api/contracts";
import { MODALITY_GROUPS, MODALITY_SLUGS } from "@/lib/modalities";

/**
 * Présentation d'une dimension : `chips`, une puce par valeur fixe, plus
 * « Toutes » ; `dropdown`, une liste déroulante aux valeurs tirées des
 * données ; `toggle`, une seule puce, qu'on active ou retire.
 */
export type Presentation = "chips" | "dropdown" | "toggle";

/** Textes de la recherche dans une liste déroulante. */
export interface SearchText {
  /** Nom et indication du champ (« Rechercher une clinique »). */
  search: string;
  /** Aucune option ne correspond. */
  noMatch: string;
  /** Nombre d'options trouvées, annoncé aux lecteurs d'écran. */
  matches: (count: number) => string;
}

/** Une dimension de filtre. */
export interface FilterDimension {
  /** Paramètre d'adresse. */
  param: string;
  presentation: Presentation;
  /** Valeurs fixes, dans l'ordre d'affichage ; absentes si tirées des données. */
  values?: readonly string[];
  /**
   * Valeur interne d'une valeur d'adresse, ou `null` si elle n'en est pas
   * une : l'adresse vient du navigateur, elle se tape et se modifie.
   */
  read(raw: string): string | null;
  /** Valeur d'adresse d'une valeur interne. */
  write(value: string): string;
  /** Nom de la dimension et option par défaut, dans la langue de l'écran. */
  text(t: AppMessages): { name: string; all: string };
  /** Nom d'une valeur fixe. */
  valueLabel?(t: AppMessages, value: string): string;
  /** Textes de la recherche, pour une liste déroulante qui grandit. */
  searchText?(t: AppMessages): SearchText;
}

/**
 * Forme d'un identifiant venu de l'adresse : celui du service (UUID) ou de
 * la démonstration (`org-stj`). Rien d'autre n'est transmis au service.
 */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Les dimensions, dans l'ordre de la barre. */
export const DIMENSIONS = {
  clinic: {
    param: "clinique",
    presentation: "dropdown",
    read: (raw) => (ID_PATTERN.test(raw) ? raw : null),
    write: (value) => value,
    text: (t) => ({ name: t.filters.clinic, all: t.filters.allClinics }),
    searchText: (t) => ({
      search: t.filters.clinicSearch,
      noMatch: t.filters.clinicNoMatch,
      matches: t.filters.clinicMatches,
    }),
  },
  modality: {
    param: "modalite",
    presentation: "chips",
    values: MODALITY_GROUPS,
    read: (raw) =>
      MODALITY_GROUPS.find((group) => MODALITY_SLUGS[group] === raw) ?? null,
    write: (value) => MODALITY_SLUGS[value as ModalityGroup] ?? value,
    text: (t) => ({ name: t.filters.modality, all: t.filters.allModalities }),
    valueLabel: (t, value) =>
      t.assignment.modalities[value as ModalityGroup] ?? value,
  },
  urgency: {
    param: "urgent",
    presentation: "toggle",
    values: ["urgent"],
    read: (raw) => (raw === "1" ? "urgent" : null),
    write: () => "1",
    text: (t) => ({ name: t.filters.urgency, all: t.filters.allPriorities }),
    valueLabel: (t) => t.filters.urgent,
  },
} as const satisfies Record<string, FilterDimension>;

/** Une dimension du registre. */
export type DimensionKey = keyof typeof DIMENSIONS;

/** Les dimensions, dans l'ordre de la barre. */
export const DIMENSION_ORDER = Object.keys(DIMENSIONS) as DimensionKey[];

/** Filtres actifs d'une liste : une valeur interne par dimension retenue. */
export type ActiveFilters = Partial<Record<DimensionKey, string>>;

/**
 * La dimension d'une clé.
 *
 * @param key Clé du registre.
 */
export function dimension(key: DimensionKey): FilterDimension {
  return DIMENSIONS[key];
}
