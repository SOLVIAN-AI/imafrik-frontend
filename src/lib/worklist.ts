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
  /** Attribués à lui, pas encore rendus : commencés ou non. */
  mine: Study[];
  /**
   * Sans titulaire. Pour un radiologue : les urgences de sa liste
   * d'urgence, que le premier qui les prend obtient (il ne voit aucun
   * autre examen sans attribution). Pour l'équipe IMAFRIK, en
   * consultation : ce qui attend une attribution.
   */
  open: Study[];
  /**
   * Chez un autre radiologue : seule l'équipe IMAFRIK, en consultation,
   * en voit. Un radiologue ne voit jamais l'examen d'un confrère.
   */
  colleagues: Study[];
}

/**
 * Découpe la file.
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

// ─── Répartition ──────────────────────────────────────────────────────

/** Ce qu'une attribution, ou son retrait, faite depuis la file change à un examen. */
export interface AssignmentChange {
  status: Study["status"];
  assignedTo: string | null;
  assignedToName: string | null;
}

/**
 * La file, avec les attributions faites à l'instant depuis l'écran.
 *
 * Une ligne attribuée passe aussitôt de « À attribuer » à « Chez un
 * radiologue » (et l'inverse pour un retrait), sans attendre la relecture
 * du service : celle-ci suit, et fait foi. Un examen rendu entre-temps
 * (signé) n'est pas dans la file ; un changement sur un examen absent est
 * ignoré.
 *
 * @param sections La file découpée, telle que le service l'a lue.
 * @param changes  Les changements faits depuis, par examen.
 * @param userId   Utilisateur connecté, pour le découpage.
 * @returns La file découpée de nouveau ; la même si rien n'a changé.
 */
export function withAssignments(
  sections: WorklistSections,
  changes: ReadonlyMap<string, AssignmentChange>,
  userId: string,
): WorklistSections {
  if (changes.size === 0) return sections;
  const studies = [
    ...sections.mine,
    ...sections.open,
    ...sections.colleagues,
  ].map((study) => {
    const change = changes.get(study.id);
    return change ? { ...study, ...change } : study;
  });
  return splitWorklist(studies, userId);
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
 * Urgences à prendre apparues depuis le relevé précédent.
 *
 * Le premier relevé d'une session n'alerte de rien : ce qui est déjà là
 * à l'ouverture de l'écran n'est pas une arrivée.
 *
 * @param previous Identifiants des urgences à prendre au relevé précédent,
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
