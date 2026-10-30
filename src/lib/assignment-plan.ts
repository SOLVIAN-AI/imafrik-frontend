import type {
  ApiAssignmentPlan,
  ApiPlanLine,
  ModalityGroup,
} from "@/lib/api/contracts";
import { modalityGroupOf } from "@/lib/modalities";

/**
 * Planning d'attribution d'une clinique : le vocabulaire de l'interface, et
 * ce que l'écran calcule seul (semaines, gardes de nuit, conflits).
 *
 * Le planning **propose**, il n'attribue rien. Une ligne porte un
 * radiologue, des jours, et au besoin des heures, une modalité et une
 * période ; sans période, elle vaut chaque semaine. Pour un examen à
 * attribuer, le service désigne le radiologue prévu (la ligne la plus
 * précise : modalité, puis période, puis heures) ; le responsable le
 * confirme d'un geste. Deux lignes aussi précises pour deux radiologues
 * ne proposent personne : l'écran le signale comme un conflit.
 *
 * Les dates sont des jours du calendrier de la clinique (`AAAA-MM-JJ`),
 * jamais des instants : « cette semaine » est celle de la clinique, pas
 * celle du navigateur.
 */

/** Jour ISO : 1 = lundi … 7 = dimanche. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Les jours, dans l'ordre de l'écran. */
export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** Jour du calendrier de la clinique, `AAAA-MM-JJ`. */
export type CalendarDay = string;

/** Une ligne du planning, telle qu'on l'écrit. */
export interface PlanLineInput {
  radiologistId: string;
  weekdays: Weekday[];
  /** `HH:MM` ; `null` pour toute la journée. */
  startsAt: string | null;
  /** `HH:MM` ; avant le début pour une garde de nuit. */
  endsAt: string | null;
  /** `null` pour toutes les modalités. */
  modality: ModalityGroup | null;
  /** Premier jour de la période ; `null` pour chaque semaine. */
  startsOn: CalendarDay | null;
  /** Dernier jour de la période, compris. */
  endsOn: CalendarDay | null;
}

/** Une ligne du planning, telle qu'elle est enregistrée. */
export interface PlanLine extends PlanLineInput {
  id: string;
  updatedAt: Date;
  updatedByName: string | null;
}

/** Un radiologue qui peut figurer au planning. */
export interface PlanRadiologist {
  profileId: string;
  name: string;
  organizationName: string;
  /** Radiologue du réseau : l'équipe IMAFRIK seule le planifie. */
  viaPool: boolean;
  /** Réglées par l'équipe IMAFRIK ; `null` pour toutes. */
  readModalities: ModalityGroup[] | null;
  /** Faux : pas habilité ou plus rattaché, le planning l'ignore. */
  canReceive: boolean;
}

/** Le planning d'une clinique, tel que le service le donne. */
export interface AssignmentPlan {
  clinicId: string;
  /** Fuseau de la clinique (IANA). */
  timeZone: string;
  /** Date du jour à la clinique. */
  today: CalendarDay;
  lines: PlanLine[];
  radiologists: PlanRadiologist[];
}

function isWeekday(day: number): day is Weekday {
  return Number.isInteger(day) && day >= 1 && day <= 7;
}

/** Traduit une ligne reçue du service. */
export function toPlanLine(row: ApiPlanLine): PlanLine {
  return {
    id: row.id,
    radiologistId: row.radiologist_id,
    weekdays: row.weekdays.filter(isWeekday),
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    modality: row.modality_group ?? null,
    startsOn: row.starts_on ?? null,
    endsOn: row.ends_on ?? null,
    updatedAt: new Date(row.updated_at),
    updatedByName: row.updated_by_name,
  };
}

/** Traduit la réponse du service. */
export function toAssignmentPlan(row: ApiAssignmentPlan): AssignmentPlan {
  return {
    clinicId: row.clinic_id,
    timeZone: row.time_zone,
    today: row.today,
    lines: row.lines.map(toPlanLine),
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

// ─── Jours et semaines ──────────────────────────────────────────

const DAY = 24 * 60;
const DAY_MS = 86_400_000;

/** Un jour du calendrier en millisecondes, à minuit UTC : sans fuseau. */
function epoch(day: CalendarDay): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/** Vrai pour un jour du calendrier bien formé et réel. */
export function isCalendarDay(value: string): value is CalendarDay {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = epoch(value);
  return (
    !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value
  );
}

/** Le jour, décalé d'un nombre de jours. */
export function addDays(day: CalendarDay, days: number): CalendarDay {
  return new Date(epoch(day) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Jour de la semaine ISO d'un jour du calendrier. */
export function weekdayOf(day: CalendarDay): Weekday {
  const sunday0 = new Date(epoch(day)).getUTCDay();
  return (sunday0 === 0 ? 7 : sunday0) as Weekday;
}

/** Le lundi de la semaine de ce jour. */
export function mondayOf(day: CalendarDay): CalendarDay {
  return addDays(day, 1 - weekdayOf(day));
}

/** Les sept jours d'une semaine, du lundi au dimanche. */
export function weekDays(monday: CalendarDay): CalendarDay[] {
  return WEEKDAYS.map((offset) => addDays(monday, offset - 1));
}

/** Nombre de jours d'un jour à l'autre. */
export function daysBetween(from: CalendarDay, to: CalendarDay): number {
  return Math.round((epoch(to) - epoch(from)) / DAY_MS);
}

/** Un jour du calendrier, comme date à midi UTC : pour l'afficher sans décalage. */
export function dayAsDate(day: CalendarDay): Date {
  return new Date(epoch(day) + DAY_MS / 2);
}

// ─── Une ligne ──────────────────────────────────────────────────

/** Minutes écoulées depuis minuit, pour une heure `HH:MM`. */
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Vrai pour une garde de nuit : elle finit le lendemain. */
export function isOvernight(line: PlanLineInput): boolean {
  return (
    line.startsAt !== null &&
    line.endsAt !== null &&
    minutesOf(line.endsAt) < minutesOf(line.startsAt)
  );
}

/** Vrai pour une ligne datée ; faux pour une ligne qui vaut chaque semaine. */
export function isDated(line: PlanLineInput): boolean {
  return line.startsOn !== null && line.endsOn !== null;
}

/**
 * Précision d'une ligne, comme la compte le service : une modalité (4),
 * puis une période (2), puis des heures (1). La plus précise l'emporte.
 */
export function precisionOf(line: PlanLineInput): number {
  return (
    (line.modality !== null ? 4 : 0) +
    (isDated(line) ? 2 : 0) +
    (line.startsAt !== null ? 1 : 0)
  );
}

/** Jours de la semaine (ISO) que compte une période. */
function daysIn(startsOn: CalendarDay, endsOn: CalendarDay): Set<Weekday> {
  const span = Math.min(daysBetween(startsOn, endsOn) + 1, 7);
  const days = new Set<Weekday>();
  for (let offset = 0; offset < span; offset++) {
    days.add(weekdayOf(addDays(startsOn, offset)));
  }
  return days;
}

/** Ce qui empêche d'enregistrer une ligne, s'il y a quelque chose. */
export type LineProblem =
  | "radiologist"
  | "days"
  | "hours"
  | "sameHours"
  | "period"
  | "periodOrder"
  | "periodTooLong"
  | "periodPast"
  | "noDayInPeriod"
  | "modalityNotRead";

/** Une période tient en un an au plus, comme l'exige le service. */
export const MAX_PERIOD_DAYS = 366;

/**
 * Le premier défaut d'une ligne, ou `null`, avant de l'envoyer : le
 * service vérifie de même, et refuse le reste (radiologue étranger).
 *
 * @param line         Ligne en cours d'édition.
 * @param today        Date du jour à la clinique.
 * @param radiologist  Le radiologue choisi, s'il est connu.
 */
export function lineProblem(
  line: PlanLineInput,
  today: CalendarDay,
  radiologist?: PlanRadiologist,
): LineProblem | null {
  if (!line.radiologistId) return "radiologist";
  if (line.weekdays.length === 0) return "days";
  if ((line.startsAt === null) !== (line.endsAt === null)) return "hours";
  if (line.startsAt !== null && line.startsAt === line.endsAt)
    return "sameHours";
  if (
    line.modality !== null &&
    radiologist &&
    !readsGroup(radiologist, line.modality)
  )
    return "modalityNotRead";
  if ((line.startsOn === null) !== (line.endsOn === null)) return "period";
  if (line.startsOn !== null && line.endsOn !== null) {
    if (!isCalendarDay(line.startsOn) || !isCalendarDay(line.endsOn))
      return "period";
    if (line.endsOn < line.startsOn) return "periodOrder";
    if (daysBetween(line.startsOn, line.endsOn) > MAX_PERIOD_DAYS)
      return "periodTooLong";
    if (line.endsOn < today) return "periodPast";
    const inPeriod = daysIn(line.startsOn, line.endsOn);
    if (!line.weekdays.some((day) => inPeriod.has(day))) return "noDayInPeriod";
  }
  return null;
}

/** Vrai si le radiologue lit ce groupe de modalités. */
export function readsGroup(
  radiologist: PlanRadiologist,
  group: ModalityGroup,
): boolean {
  return (
    radiologist.readModalities === null ||
    radiologist.readModalities.includes(group)
  );
}

/**
 * Vrai si la ligne commence ce jour-là : le bon jour de la semaine, dans
 * sa période. Une garde de nuit appartient au jour où elle commence.
 */
export function startsOnDay(line: PlanLineInput, day: CalendarDay): boolean {
  if (!line.weekdays.includes(weekdayOf(day))) return false;
  if (line.startsOn === null || line.endsOn === null) return true;
  return day >= line.startsOn && day <= line.endsOn;
}

/** Vrai si une ligne datée touche la semaine de ce lundi. */
export function touchesWeek(line: PlanLineInput, monday: CalendarDay): boolean {
  if (line.startsOn === null || line.endsOn === null) return false;
  return line.startsOn <= addDays(monday, 6) && line.endsOn >= monday;
}

/** Les lignes qui valent pendant une semaine : hebdomadaires, ou datées qui la touchent. */
export function linesOfWeek<T extends PlanLineInput>(
  lines: readonly T[],
  monday: CalendarDay,
): T[] {
  return lines.filter((line) => !isDated(line) || touchesWeek(line, monday));
}

// ─── Les conflits d'une semaine ─────────────────────────────────

/**
 * Plages couvertes par une ligne pendant une semaine, en minutes depuis
 * le lundi à minuit, fin exclue. Une garde de nuit déborde sur le
 * lendemain ; celle du dimanche, sur le lundi suivant (au-delà de 7 jours).
 */
export function lineIntervals(
  line: PlanLineInput,
  monday: CalendarDay,
): [number, number][] {
  const intervals: [number, number][] = [];
  weekDays(monday).forEach((day, index) => {
    if (!startsOnDay(line, day)) return;
    const base = index * DAY;
    if (line.startsAt === null || line.endsAt === null) {
      intervals.push([base, base + DAY]);
      return;
    }
    const start = minutesOf(line.startsAt);
    const end = minutesOf(line.endsAt);
    if (start < end) intervals.push([base + start, base + end]);
    else intervals.push([base + start, base + DAY + end]);
  });
  return intervals;
}

/** Deux lignes aussi précises, pour deux radiologues, qui se recouvrent. */
export interface Conflict {
  /** Les deux lignes, dans l'ordre du planning. */
  first: string;
  second: string;
  /** Jours de la semaine où elles se recouvrent (jour où le recouvrement commence). */
  days: CalendarDay[];
}

/**
 * Conflits du planning pendant une semaine : deux lignes aussi précises,
 * pour la même modalité (ou toutes deux pour toutes), pour deux
 * radiologues qui peuvent recevoir les examens, qui se recouvrent. Pendant
 * ce temps, personne n'est prévu : le responsable choisit.
 *
 * Une ligne plus précise ne fait pas conflit : elle l'emporte. Une ligne
 * dont le radiologue ne peut pas recevoir d'examen ne compte pas.
 *
 * @param lines       Lignes du planning.
 * @param monday      Lundi de la semaine regardée.
 * @param counts      Vrai si la ligne compte (radiologue qui peut recevoir,
 *                    et qui lit sa modalité).
 */
export function conflictsOfWeek<T extends PlanLineInput & { id: string }>(
  lines: readonly T[],
  monday: CalendarDay,
  counts: (line: T) => boolean = () => true,
): Conflict[] {
  const week = weekDays(monday);
  const active = linesOfWeek(lines, monday).filter(counts);
  const found: Conflict[] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const [a, b] = [active[i], active[j]];
      if (a.radiologistId === b.radiologistId) continue;
      if (a.modality !== b.modality) continue;
      if (precisionOf(a) !== precisionOf(b)) continue;
      const days = new Set<CalendarDay>();
      for (const [startA, endA] of lineIntervals(a, monday)) {
        for (const [startB, endB] of lineIntervals(b, monday)) {
          const start = Math.max(startA, startB);
          if (start >= Math.min(endA, endB)) continue;
          const index = Math.floor(start / DAY);
          days.add(index < 7 ? week[index] : addDays(monday, index));
        }
      }
      if (days.size > 0) {
        found.push({ first: a.id, second: b.id, days: [...days].sort() });
      }
    }
  }
  return found;
}

// ─── Recopier la semaine précédente ─────────────────────────────

/**
 * Ce que ferait « Recopier la semaine précédente » sur une semaine : les
 * lignes datées de la semaine d'avant qui ne touchent pas celle-ci, et
 * les lignes datées comprises dans celle-ci, que la recopie remplacerait.
 * Comme le service, qui seul recopie.
 */
export function weekCopyPreview<T extends PlanLineInput>(
  lines: readonly T[],
  monday: CalendarDay,
): { sources: T[]; replaced: T[] } {
  const previous = addDays(monday, -7);
  const last = addDays(monday, 6);
  return {
    sources: lines.filter(
      (line) => touchesWeek(line, previous) && !touchesWeek(line, monday),
    ),
    replaced: lines.filter(
      (line) =>
        line.startsOn !== null &&
        line.endsOn !== null &&
        line.startsOn >= monday &&
        line.endsOn <= last,
    ),
  };
}

// ─── Le radiologue prévu d'un examen ────────────────────────────

/** Jour, jour de la semaine et heure d'un instant, à l'heure de la clinique. */
export function localParts(
  instant: Date,
  timeZone: string,
): { day: CalendarDay; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Vrai si la ligne couvre cet instant local : comme `slot_covers` en base. */
export function covers(
  line: PlanLineInput,
  day: CalendarDay,
  minutes: number,
): boolean {
  if (line.startsAt === null || line.endsAt === null) {
    return startsOnDay(line, day);
  }
  const start = minutesOf(line.startsAt);
  const end = minutesOf(line.endsAt);
  if (start < end) {
    return startsOnDay(line, day) && minutes >= start && minutes < end;
  }
  return (
    (startsOnDay(line, day) && minutes >= start) ||
    (startsOnDay(line, addDays(day, -1)) && minutes < end)
  );
}

/**
 * Radiologues que le planning prévoit pour un examen, comme
 * `public.planned_assignees` : les lignes qui couvrent son arrivée, à
 * l'heure de la clinique, pour sa modalité, d'un radiologue qui peut le
 * recevoir ; parmi elles, les plus précises. Sert la démonstration ; en
 * service, la base décide.
 *
 * @param plan       Planning de la clinique.
 * @param receivedAt Arrivée de l'examen.
 * @param modality   Code DICOM de sa modalité.
 * @param canReceive Vrai si ce radiologue peut recevoir l'examen.
 * @returns Les radiologues prévus, sans doublon : un seul, il est prévu ;
 *          plusieurs, conflit ; aucun, personne.
 */
export function plannedFor(
  plan: { timeZone: string; lines: readonly PlanLineInput[] },
  receivedAt: Date,
  modality: string | null,
  canReceive: (radiologistId: string) => boolean,
): string[] {
  const { day, minutes } = localParts(receivedAt, plan.timeZone);
  const group = modalityGroupOf(modality);
  const matching = plan.lines.filter(
    (line) =>
      (line.modality === null || line.modality === group) &&
      covers(line, day, minutes) &&
      canReceive(line.radiologistId),
  );
  const best = Math.max(-1, ...matching.map(precisionOf));
  return [
    ...new Set(
      matching
        .filter((line) => precisionOf(line) === best)
        .map((line) => line.radiologistId),
    ),
  ];
}

// ─── En clair ───────────────────────────────────────────────────

/**
 * Les jours d'une ligne en clair : trois jours qui se suivent ou plus
 * deviennent une plage (« Lun à Ven »), les autres se listent
 * (« Sam, Dim ») ; les sept, « Toute la semaine ».
 *
 * @param weekdays Jours de la ligne, rangés.
 * @param names    Noms courts des jours, du lundi au dimanche.
 * @param allWeek  Nom des sept jours.
 * @param range    Une plage de jours, de son premier à son dernier.
 */
export function daysSummary(
  weekdays: readonly Weekday[],
  names: readonly string[],
  allWeek: string,
  range: (from: string, to: string) => string,
): string {
  const days = [...new Set(weekdays)].sort((a, b) => a - b);
  if (days.length === 7) return allWeek;
  const runs: Weekday[][] = [];
  for (const day of days) {
    const run = runs.at(-1);
    if (run && run.at(-1) === day - 1) run.push(day);
    else runs.push([day]);
  }
  return runs
    .flatMap((run) =>
      run.length >= 3
        ? [range(names[run[0] - 1], names[run.at(-1)! - 1])]
        : run.map((day) => names[day - 1]),
    )
    .join(", ");
}

// ─── Confirmer ──────────────────────────────────────────────────

/** Un examen à confirmer, et le radiologue que l'écran montre prévu. */
export interface PlannedItem {
  studyId: string;
  radiologistId: string;
}

/**
 * Les examens qu'un « Tout confirmer » attribuerait : ceux qui ont un seul
 * radiologue prévu. Un examen où le planning hésite attend un choix.
 *
 * @param studyIds Examens à attribuer de la page, dans son ordre.
 * @param planned  Radiologues prévus, par examen.
 */
export function confirmable(
  studyIds: readonly string[],
  planned: Readonly<Record<string, readonly { profileId: string }[]>>,
): PlannedItem[] {
  return studyIds.flatMap((studyId) => {
    const found = planned[studyId] ?? [];
    return found.length === 1
      ? [{ studyId, radiologistId: found[0].profileId }]
      : [];
  });
}
