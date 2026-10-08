/**
 * Règles de la file de lecture du radiologue.
 *
 * Module pur : ni rendu, ni requête, ni horloge implicite. L'instant de
 * référence est toujours passé en paramètre. Tout ce qui décide de
 * l'ordre, des sections, des échéances et des filtres de la file vit ici,
 * et se teste sans navigateur.
 *
 * **Le principe d'ordre.** La file s'ordonne sur l'échéance promise à la
 * clinique (`dueAt`, calculée par le service d'après les délais en
 * vigueur), pas sur l'ancienneté : une urgence reçue il y a dix minutes
 * passe devant une routine reçue il y a une heure si son échéance est plus
 * proche, et un examen en retard passe devant tout le reste.
 */

import { messagesFor } from "@/i18n";
import type { Study } from "@/lib/data/studies";
import { formatPatientAge } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";

const MINUTE = 60_000;

// ─── Échéances ────────────────────────────────────────────────────────

/** Situation d'un examen au regard de son échéance. */
export type DeadlineTone = "overdue" | "soon" | "ok";

/** Échéance d'un examen, prête à afficher. */
export interface Deadline {
  tone: DeadlineTone;
  /** Par exemple « reste 12 min » ou « dépassé de 3 h », dans la langue demandée. */
  label: string;
  /** Millisecondes restantes, négatives une fois l'échéance dépassée. */
  remainingMs: number;
}

/**
 * Durée lisible, arrondie à ce qui sert : la minute sous l'heure, le
 * quart d'heure sous la journée, l'heure au-delà.
 *
 * @param ms     Durée en millisecondes, positive.
 * @param locale Langue, français par défaut.
 * @returns Par exemple « 12 min », « 2 h 15 », « 3 h », « 1 j 4 h »
 *          (« 1 d 4 h » en anglais).
 */
export function formatDuration(ms: number, locale: Locale = "fr"): string {
  const day = messagesFor(locale).common.units.day;
  const minutes = Math.max(0, Math.round(ms / MINUTE));
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const quarters = Math.round(minutes / 15) * 15;
    const hours = Math.floor(quarters / 60);
    const rest = quarters % 60;
    return rest === 0
      ? `${hours} h`
      : `${hours} h ${String(rest).padStart(2, "0")}`;
  }
  const hours = Math.round(minutes / 60);
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest === 0 ? `${days} ${day}` : `${days} ${day} ${rest} h`;
}

/**
 * Échéance d'un examen à un instant donné.
 *
 * « Bientôt » quand il reste moins du quart du délai promis, et au moins
 * quinze minutes de marge : sur une urgence de trente minutes, l'alerte
 * vient à quinze minutes du terme ; sur une routine de deux heures, à
 * trente.
 *
 * @param study  Examen, avec sa réception et son échéance.
 * @param now    Instant de référence, en millisecondes.
 * @param locale Langue du libellé, français par défaut.
 */
export function deadlineOf(
  study: Pick<Study, "receivedAt" | "dueAt">,
  now: number,
  locale: Locale = "fr",
): Deadline {
  const labels = messagesFor(locale).worklist.deadline;
  const remainingMs = study.dueAt.getTime() - now;
  if (remainingMs < 0) {
    return {
      tone: "overdue",
      label: labels.overdue(formatDuration(-remainingMs, locale)),
      remainingMs,
    };
  }
  const windowMs = study.dueAt.getTime() - study.receivedAt.getTime();
  const threshold = Math.max(15 * MINUTE, windowMs / 4);
  return {
    tone: remainingMs <= threshold ? "soon" : "ok",
    label: labels.remaining(formatDuration(remainingMs, locale)),
    remainingMs,
  };
}

/**
 * Ordre de la file : échéance la plus proche d'abord, puis la réception
 * la plus ancienne. Le service trie déjà ainsi ; le tri est refait ici
 * pour chaque section, et pour le jeu de démonstration.
 */
export function byDeadline(
  a: Pick<Study, "receivedAt" | "dueAt">,
  b: Pick<Study, "receivedAt" | "dueAt">,
): number {
  return (
    a.dueAt.getTime() - b.dueAt.getTime() ||
    a.receivedAt.getTime() - b.receivedAt.getTime()
  );
}

// ─── Sections ─────────────────────────────────────────────────────────

/** La file, découpée selon ce que le radiologue peut en faire. */
export interface WorklistSections {
  /** Pris en charge par lui, pas encore rendus : à reprendre. */
  mine: Study[];
  /** Libres : à prendre, dans l'ordre des échéances. */
  open: Study[];
  /** Pris par un confrère : pour mémoire, rien à y faire. */
  colleagues: Study[];
}

/**
 * Découpe la file.
 *
 * Mêler les examens pris par un confrère aux examens libres faisait
 * ouvrir des dossiers qu'on ne peut que consulter ; ils forment une
 * section à part, en fin de file.
 *
 * @param studies Examens non rendus.
 * @param userId  Radiologue connecté.
 */
export function splitWorklist(
  studies: readonly Study[],
  userId: string,
): WorklistSections {
  const sections: WorklistSections = { mine: [], open: [], colleagues: [] };
  for (const study of studies) {
    if (study.assignedTo === userId) sections.mine.push(study);
    else if (study.assignedTo === null) sections.open.push(study);
    else sections.colleagues.push(study);
  }
  sections.mine.sort(byDeadline);
  sections.open.sort(byDeadline);
  sections.colleagues.sort(byDeadline);
  return sections;
}

// ─── Filtres ──────────────────────────────────────────────────────────

/** Filtres de la file, tels que l'adresse les porte. */
export interface WorklistFilters {
  /** Modalités retenues ; vide = toutes. */
  modalities: string[];
  /** Clinique retenue ; `null` = toutes. */
  clinicId: string | null;
  urgentOnly: boolean;
}

/** Aucun filtre. */
export const NO_FILTERS: WorklistFilters = {
  modalities: [],
  clinicId: null,
  urgentOnly: false,
};

/** Paramètres d'adresse des filtres. Rien de nominatif n'y figure. */
export const FILTER_PARAMS = {
  modality: "modalite",
  clinic: "clinique",
  urgent: "urgent",
} as const;

/** Forme d'un code de modalité DICOM : deux à quatre lettres ou chiffres. */
const MODALITY_PATTERN = /^[A-Z0-9]{1,8}$/;

/**
 * Relit les filtres de l'adresse. Une valeur mal formée est ignorée, pas
 * propagée : l'adresse vient du navigateur.
 *
 * @param params Paramètres de la page, tels que Next les fournit.
 */
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
): WorklistFilters {
  const list = (value: string | string[] | undefined) =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];
  const modalities = [
    ...new Set(
      list(params[FILTER_PARAMS.modality])
        .flatMap((value) => value.split(","))
        .map((value) => value.trim().toUpperCase())
        .filter((value) => MODALITY_PATTERN.test(value)),
    ),
  ].sort();
  const clinic = list(params[FILTER_PARAMS.clinic])[0]?.trim() ?? "";
  return {
    modalities,
    clinicId: clinic && clinic.length <= 64 ? clinic : null,
    urgentOnly: list(params[FILTER_PARAMS.urgent])[0] === "1",
  };
}

/**
 * Sérialise les filtres en paramètres d'adresse.
 *
 * @returns Par exemple `modalite=CT,MR&urgent=1`, vide sans filtre.
 */
export function filtersToQuery(filters: WorklistFilters): string {
  const params = new URLSearchParams();
  if (filters.modalities.length > 0)
    params.set(FILTER_PARAMS.modality, filters.modalities.join(","));
  if (filters.clinicId) params.set(FILTER_PARAMS.clinic, filters.clinicId);
  if (filters.urgentOnly) params.set(FILTER_PARAMS.urgent, "1");
  return params.toString();
}

/** Vrai si au moins un filtre est actif. */
export function hasFilters(filters: WorklistFilters): boolean {
  return (
    filters.modalities.length > 0 ||
    filters.clinicId !== null ||
    filters.urgentOnly
  );
}

/**
 * Applique les filtres.
 *
 * @param studies Examens de la file.
 * @param filters Filtres actifs.
 */
export function applyFilters(
  studies: readonly Study[],
  filters: WorklistFilters,
): Study[] {
  return studies.filter(
    (study) =>
      (filters.modalities.length === 0 ||
        filters.modalities.includes(study.modality.toUpperCase())) &&
      (filters.clinicId === null || study.clinicId === filters.clinicId) &&
      (!filters.urgentOnly || study.urgent),
  );
}

/** Une valeur de filtre proposée, avec le nombre d'examens concernés. */
export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Options de filtre, tirées de la file **non filtrée** : choisir une
 * modalité ne doit pas faire disparaître les autres de la liste des
 * choix.
 *
 * @param studies Examens de la file, avant filtres.
 * @returns Modalités et cliniques présentes, les plus fréquentes d'abord.
 */
export function filterOptions(studies: readonly Study[]): {
  modalities: FilterOption[];
  clinics: FilterOption[];
} {
  const count = (key: (study: Study) => [string, string]) => {
    const options = new Map<string, FilterOption>();
    for (const study of studies) {
      const [value, label] = key(study);
      const option = options.get(value) ?? { value, label, count: 0 };
      option.count += 1;
      options.set(value, option);
    }
    return [...options.values()].sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"),
    );
  };
  return {
    modalities: count((study) => {
      const code = study.modality.toUpperCase();
      return [code, code];
    }),
    clinics: count((study) => [study.clinicId, study.clinic]),
  };
}

// ─── Patient ──────────────────────────────────────────────────────────

/**
 * Sexe et âge en abrégé, pour une ligne de file.
 *
 * L'âge est celui du jour de la réception : c'est celui qui compte pour
 * l'interprétation, et il ne change pas d'un jour à l'autre à l'écran.
 *
 * @param study  Examen, avec le sexe et la date de naissance du patient.
 * @param locale Langue, français par défaut.
 * @returns Par exemple « F · 58 ans » (« F · 58 years »), ou `null` si
 *          rien n'a été transmis.
 */
export function shortDemographics(
  study: Pick<Study, "patientSex" | "patientBirthDate" | "receivedAt">,
  locale: Locale = "fr",
): string | null {
  const key = study.patientSex?.trim().toUpperCase();
  const sex =
    key === "M" || key === "F" || key === "O"
      ? messagesFor(locale).common.sexShort[key]
      : null;
  const parts = [
    sex,
    formatPatientAge(study.patientBirthDate, study.receivedAt, locale),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

// ─── Arrivées ─────────────────────────────────────────────────────────

/**
 * Urgences libres apparues depuis le relevé précédent.
 *
 * Le premier relevé d'une session n'alerte de rien : ce qui est déjà là
 * à l'ouverture de l'écran n'est pas une arrivée.
 *
 * @param previous Identifiants des urgences libres au relevé précédent,
 *                 `null` au premier relevé.
 * @param open     Examens libres actuels.
 * @returns Les urgences nouvelles, et les identifiants à retenir.
 */
export function newUrgentArrivals(
  previous: ReadonlySet<string> | null,
  open: readonly Study[],
): { arrivals: Study[]; seen: Set<string> } {
  const urgent = open.filter((study) => study.urgent);
  const seen = new Set(urgent.map((study) => study.id));
  if (previous === null) return { arrivals: [], seen };
  return {
    arrivals: urgent.filter((study) => !previous.has(study.id)),
    seen,
  };
}
