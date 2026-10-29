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
 * écrans : où (la clinique), qui (le radiologue), quoi (la modalité), où
 * en est-on (l'état, l'urgence), quand (la période).
 * Chaque écran choisit ses dimensions dans `screens.ts` ; la requête au
 * service se construit à partir des filtres lus (`readFilters`).
 *
 * Module pur, sans rendu ni requête : lu par les pages serveur comme par
 * la barre de filtres, éprouvé par `url.test.ts`.
 */

import type { AppMessages } from "@/i18n";
import type { ModalityGroup } from "@/lib/api/contracts";
import {
  MODALITY_GROUPS,
  MODALITY_SLUGS,
  modalityGroupOf,
} from "@/lib/modalities";

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
  /**
   * Anciens paramètres d'adresse, encore lus (liens, favoris), retirés
   * dès qu'on change le filtre : `?vue=a-attribuer` devient `?etat=…`.
   */
  aliases?: readonly string[];
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
 * Codes DICOM que l'ancienne file « À lire » écrivait dans l'adresse
 * (`?modalite=CT,MR`), avant que toutes les listes ne filtrent par groupe.
 * Un favori ou un lien partagé ouvre ainsi le groupe de son premier code.
 */
const LEGACY_MODALITY_CODES = new Set([
  "CR",
  "DX",
  "RF",
  "XA",
  "MG",
  "US",
  "CT",
  "MR",
]);

/**
 * Le groupe d'un ancien filtre de modalité, ou `null`.
 *
 * @param raw Valeur d'adresse (`CT`, `CT,MR`).
 */
function legacyModality(raw: string): ModalityGroup | null {
  const code = raw.split(",")[0].trim();
  return LEGACY_MODALITY_CODES.has(code) ? modalityGroupOf(code) : null;
}

/**
 * État d'un examen, tel qu'une liste le filtre : à attribuer (reçu,
 * aucun radiologue ne le voit), en lecture (attribué ou commencé),
 * compte-rendu prêt (signé, pas encore téléchargé), remis.
 */
export const STUDY_STATES = [
  "to_assign",
  "reading",
  "ready",
  "delivered",
] as const;

/** Un état de la liste. */
export type StudyState = (typeof STUDY_STATES)[number];

/** L'état dans l'adresse : un mot court, en français. */
const STATE_SLUGS: Record<StudyState, string> = {
  to_assign: "a-attribuer",
  reading: "en-lecture",
  ready: "pret",
  delivered: "remis",
};

/** Périodes proposées, en jours : la réception depuis 24 h, 7 jours… */
export const PERIODS = ["1", "7", "30", "90", "365"] as const;

/** Une période. */
export type Period = (typeof PERIODS)[number];

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
  radiologist: {
    param: "radiologue",
    presentation: "dropdown",
    read: (raw) => (ID_PATTERN.test(raw) ? raw : null),
    write: (value) => value,
    text: (t) => ({
      name: t.filters.radiologist,
      all: t.filters.allRadiologists,
    }),
    searchText: (t) => ({
      search: t.filters.radiologistSearch,
      noMatch: t.filters.radiologistNoMatch,
      matches: t.filters.radiologistMatches,
    }),
  },
  modality: {
    param: "modalite",
    presentation: "chips",
    values: MODALITY_GROUPS,
    read: (raw) =>
      MODALITY_GROUPS.find((group) => MODALITY_SLUGS[group] === raw) ??
      legacyModality(raw),
    write: (value) => MODALITY_SLUGS[value as ModalityGroup] ?? value,
    text: (t) => ({ name: t.filters.modality, all: t.filters.allModalities }),
    valueLabel: (t, value) =>
      t.assignment.modalities[value as ModalityGroup] ?? value,
  },
  state: {
    param: "etat",
    aliases: ["vue"],
    presentation: "chips",
    values: STUDY_STATES,
    read: (raw) =>
      STUDY_STATES.find((state) => STATE_SLUGS[state] === raw) ?? null,
    write: (value) => STATE_SLUGS[value as StudyState] ?? value,
    text: (t) => ({ name: t.filters.state, all: t.filters.allStates }),
    valueLabel: (t, value) => t.filters.states[value as StudyState] ?? value,
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
  // Une liste courte, mais un filtre d'appoint : une liste déroulante, pour
  // que la barre tienne sur une ligne à 1 440 px.
  period: {
    param: "jours",
    presentation: "dropdown",
    values: PERIODS,
    read: (raw) => ((PERIODS as readonly string[]).includes(raw) ? raw : null),
    write: (value) => value,
    text: (t) => ({ name: t.filters.period, all: t.filters.allDates }),
    valueLabel: (t, value) => t.filters.periods[value as Period] ?? value,
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

/** Une valeur proposée, avec le nombre de lignes qu'elle retient. */
export interface FilterOption {
  value: string;
  /** Nom affiché ; celui du registre pour une valeur fixe. */
  label?: string;
  /** Lignes retenues ; absent quand l'écran ne compte pas. */
  count?: number;
}

/**
 * Une dimension de la barre de filtres, telle que la page la décrit : ses
 * options et leurs nombres, tirés du service ou de la liste.
 */
export interface BarDimension {
  key: DimensionKey;
  /** Valeurs proposées : toutes pour des puces, celles des données sinon. */
  options?: readonly FilterOption[];
  /** Lignes de toutes les valeurs, pour l'option par défaut. */
  total?: number;
  /** Nom propre à l'écran d'une bascule (« Urgences en cours »). */
  label?: string;
}
