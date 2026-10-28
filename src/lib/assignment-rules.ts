import type { ApiAssignmentRules, ModalityGroup } from "@/lib/api/contracts";

/**
 * Règles d'attribution d'une clinique : le vocabulaire de l'interface, et
 * ce que l'écran calcule seul (gardes de nuit, chevauchements).
 *
 * La règle elle-même est appliquée par le service, à l'arrivée d'un
 * examen : le radiologue de sa modalité le reçoit, sinon le seul
 * radiologue de garde qui peut le recevoir ; sinon il reste à attribuer.
 * L'écran prévient seulement de ce qui ne marchera pas comme on le croit :
 * deux radiologues de garde en même temps ne se partagent pas les
 * examens, le responsable choisit.
 */

/** Jour ISO : 1 = lundi … 7 = dimanche. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Les jours, dans l'ordre de l'écran. */
export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** Un créneau du planning. */
export interface RuleSlot {
  radiologistId: string;
  weekdays: Weekday[];
  /** `HH:MM` ; `null` pour toute la journée. */
  startsAt: string | null;
  /** `HH:MM` ; avant le début pour une garde de nuit. */
  endsAt: string | null;
}

/** Le radiologue désigné pour un groupe de modalités. */
export interface ModalityDesignation {
  group: ModalityGroup;
  radiologistId: string;
}

/** Un radiologue qui peut figurer dans les règles. */
export interface RuleRadiologist {
  profileId: string;
  name: string;
  organizationName: string;
  viaPool: boolean;
  readModalities: ModalityGroup[] | null;
  /** Faux : pas habilité ou plus rattaché, la règle l'ignore. */
  canReceive: boolean;
}

/** Les règles d'une clinique, telles que le service les donne. */
export interface AssignmentRules {
  clinicId: string;
  /** Fuseau du planning (IANA). */
  timeZone: string;
  /** À rendre à l'enregistrement : refusé si les règles ont changé. */
  version: string;
  slots: RuleSlot[];
  modalities: ModalityDesignation[];
  radiologists: RuleRadiologist[];
}

/** Traduit la réponse du service. */
export function toAssignmentRules(row: ApiAssignmentRules): AssignmentRules {
  return {
    clinicId: row.clinic_id,
    timeZone: row.time_zone,
    version: row.version,
    slots: row.slots.map((slot) => ({
      radiologistId: slot.radiologist_id,
      weekdays: slot.weekdays.filter(isWeekday),
      startsAt: slot.starts_at ?? null,
      endsAt: slot.ends_at ?? null,
    })),
    modalities: row.modalities.map((rule) => ({
      group: rule.group,
      radiologistId: rule.radiologist_id,
    })),
    radiologists: row.radiologists.map((radiologist) => ({
      profileId: radiologist.profile_id,
      name: radiologist.name,
      organizationName: radiologist.organization_name,
      viaPool: radiologist.via_pool,
      readModalities: radiologist.read_modalities,
      canReceive: radiologist.can_receive,
    })),
  };
}

function isWeekday(day: number): day is Weekday {
  return Number.isInteger(day) && day >= 1 && day <= 7;
}

const DAY = 24 * 60;

/** Minutes écoulées depuis minuit, pour une heure `HH:MM`. */
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Vrai pour une garde de nuit : elle finit le lendemain. */
export function isOvernight(slot: RuleSlot): boolean {
  return (
    slot.startsAt !== null &&
    slot.endsAt !== null &&
    minutesOf(slot.endsAt) < minutesOf(slot.startsAt)
  );
}

/** Ce qui empêche d'enregistrer un créneau, s'il y a quelque chose. */
export type SlotProblem = "radiologist" | "days" | "hours" | "sameHours";

/** Le premier défaut d'un créneau, ou `null`. */
export function slotProblem(slot: RuleSlot): SlotProblem | null {
  if (!slot.radiologistId) return "radiologist";
  if (slot.weekdays.length === 0) return "days";
  if ((slot.startsAt === null) !== (slot.endsAt === null)) return "hours";
  if (slot.startsAt !== null && slot.startsAt === slot.endsAt)
    return "sameHours";
  return null;
}

/**
 * Plages de la semaine couvertes par un créneau, en minutes depuis le
 * lundi à minuit, fin exclue. Une garde de nuit déborde sur le
 * lendemain ; celle du dimanche, sur le lundi.
 */
export function slotIntervals(slot: RuleSlot): [number, number][] {
  const intervals: [number, number][] = [];
  for (const day of slot.weekdays) {
    const base = (day - 1) * DAY;
    if (slot.startsAt === null || slot.endsAt === null) {
      intervals.push([base, base + DAY]);
      continue;
    }
    const start = minutesOf(slot.startsAt);
    const end = minutesOf(slot.endsAt);
    if (start < end) {
      intervals.push([base + start, base + end]);
    } else {
      intervals.push([base + start, base + DAY]);
      const next = (day % 7) * DAY;
      intervals.push([next, next + end]);
    }
  }
  return intervals;
}

/** Deux radiologues de garde en même temps, et les jours où cela arrive. */
export interface Overlap {
  first: string;
  second: string;
  days: Weekday[];
}

/**
 * Radiologues de garde en même temps : pendant ces heures, un examen que
 * plusieurs d'entre eux peuvent lire reste à attribuer.
 *
 * Les créneaux incomplets sont ignorés ; un radiologue ne chevauche pas
 * ses propres créneaux.
 */
export function overlaps(slots: RuleSlot[]): Overlap[] {
  const found = new Map<string, Overlap>();
  const complete = slots.filter((slot) => slotProblem(slot) === null);
  for (let i = 0; i < complete.length; i++) {
    for (let j = i + 1; j < complete.length; j++) {
      const [a, b] = [complete[i], complete[j]];
      if (a.radiologistId === b.radiologistId) continue;
      for (const [startA, endA] of slotIntervals(a)) {
        for (const [startB, endB] of slotIntervals(b)) {
          const start = Math.max(startA, startB);
          if (start >= Math.min(endA, endB)) continue;
          const [first, second] = [a.radiologistId, b.radiologistId].sort();
          const key = `${first}|${second}`;
          const overlap = found.get(key) ?? { first, second, days: [] };
          const day = (Math.floor(start / DAY) + 1) as Weekday;
          if (!overlap.days.includes(day)) overlap.days.push(day);
          found.set(key, overlap);
        }
      }
    }
  }
  return [...found.values()].map((overlap) => ({
    ...overlap,
    days: [...overlap.days].sort((x, y) => x - y),
  }));
}

/** Vrai si le radiologue lit ce groupe de modalités. */
export function readsGroup(
  radiologist: RuleRadiologist,
  group: ModalityGroup,
): boolean {
  return (
    radiologist.readModalities === null ||
    radiologist.readModalities.includes(group)
  );
}
