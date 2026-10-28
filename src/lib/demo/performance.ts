import type { ApiPerformanceMonth } from "@/lib/api/contracts";
import { quantile } from "@/lib/charts";
import { DEMO_SLA, type DemoFlow, demoFlows } from "@/lib/demo/control";

/**
 * Performances des radiologues, en démonstration.
 *
 * Tirées des **mêmes examens synthétiques** que la tour de contrôle et que
 * l'activité de la clinique (`demoFlows`), avec les définitions du service :
 * les examens reçus dans le mois, signés par chaque radiologue ; délais en
 * routine et en urgence ; prise en charge mesurée depuis l'arrivée (les
 * règles d'attribution confient l'examen dès sa réception) ; lecture de la
 * prise en charge à la signature. Les examens rendus et les urgences prises
 * sur la liste, que le jeu ne simule pas, sont déduits du volume de façon
 * déterministe. « En cours » regarde les deux derniers jours.
 */

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const round1 = (value: number | null) =>
  value === null ? null : Math.round(value * 10) / 10;
const mean = (values: number[]) =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

/** Premier instant d'un mois `AAAA-MM` et du suivant, en ms UTC. */
function bounds(month: string): [number, number] {
  const [year, number] = month.split("-").map(Number);
  return [Date.UTC(year, number - 1, 1), Date.UTC(year, number, 1)];
}

/** Examens signés à `now`, reçus dans le mois, groupés par radiologue. */
function signedByReader(
  month: string,
  clinicId: string | null,
  now: number,
): Map<string, DemoFlow[]> {
  const [start, end] = bounds(month);
  const groups = new Map<string, DemoFlow[]>();
  if (start >= now) return groups;
  for (const flow of demoFlows(start, Math.min(end, now), clinicId)) {
    if (flow.reader === null || flow.signedAt === null || flow.signedAt > now)
      continue;
    groups.set(flow.reader.id, [...(groups.get(flow.reader.id) ?? []), flow]);
  }
  return groups;
}

const turnaround = (flow: DemoFlow) =>
  (flow.signedAt! - flow.receivedAt) / MINUTE;
const within = (flow: DemoFlow) =>
  turnaround(flow) <= (flow.urgent ? DEMO_SLA.urgent : DEMO_SLA.routine);
const share = (flows: DemoFlow[]) =>
  flows.length ? flows.filter(within).length / flows.length : null;

function delays(flows: DemoFlow[]) {
  const times = flows.map(turnaround);
  return {
    median_minutes: round1(quantile(times, 0.5)),
    mean_minutes: round1(mean(times)),
    p90_minutes: round1(quantile(times, 0.9)),
    within_sla: share(flows),
  };
}

/**
 * Les performances des radiologues sur un mois.
 *
 * @param month    Mois `AAAA-MM`.
 * @param clinicId Clinique, ou `null` pour tout le réseau.
 * @param now      Instant de référence.
 */
export function demoPerformance(
  month: string,
  clinicId: string | null,
  now = Date.now(),
): ApiPerformanceMonth {
  const [start] = bounds(month);
  const previousMonth = new Date(start - DAY).toISOString().slice(0, 7);
  const current = signedByReader(month, clinicId, now);
  const previous = signedByReader(previousMonth, clinicId, now);

  // En cours, à l'instant : les deux derniers jours suffisent.
  const open = new Map<string, { waiting: number; reading: number }>();
  for (const flow of demoFlows(now - 2 * DAY, now, clinicId)) {
    if (flow.signedAt !== null || flow.reader === null) continue;
    const entry = open.get(flow.reader.id) ?? { waiting: 0, reading: 0 };
    if (flow.claimedAt === null) entry.waiting += 1;
    else entry.reading += 1;
    open.set(flow.reader.id, entry);
  }

  const readers = new Map<string, NonNullable<DemoFlow["reader"]>>();
  for (const rows of [...current.values(), ...previous.values()]) {
    readers.set(rows[0].reader!.id, rows[0].reader!);
  }
  for (const flow of demoFlows(now - 2 * DAY, now, clinicId)) {
    if (flow.reader && open.has(flow.reader.id))
      readers.set(flow.reader.id, flow.reader);
  }

  const radiologists = [...readers.values()]
    .filter((reader) => current.has(reader.id) || open.has(reader.id))
    .map((reader) => {
      const flows = current.get(reader.id) ?? [];
      const before = previous.get(reader.id) ?? [];
      const routine = flows.filter((flow) => !flow.urgent);
      const urgent = flows.filter((flow) => flow.urgent);
      const pickup = flows
        .filter((flow) => flow.claimedAt !== null)
        .map((flow) => (flow.claimedAt! - flow.receivedAt) / MINUTE);
      const reading = flows
        .filter((flow) => flow.claimedAt !== null)
        .map((flow) => (flow.signedAt! - flow.claimedAt!) / MINUTE);
      const held = open.get(reader.id);
      return {
        profile_id: reader.id,
        full_name: reader.name,
        title: reader.title,
        signed_routine: routine.length,
        signed_urgent: urgent.length,
        median_minutes: round1(quantile(flows.map(turnaround), 0.5)),
        within_sla: share(flows),
        routine: delays(routine),
        urgent: delays(urgent),
        pickup_median_minutes: round1(quantile(pickup, 0.5)),
        reading_median_minutes: round1(quantile(reading, 0.5)),
        released: Math.floor(flows.length / 30),
        urgent_claimed: Math.round(urgent.length / 2),
        assigned_waiting: held?.waiting ?? 0,
        in_reading: held?.reading ?? 0,
        previous_median_minutes: round1(quantile(before.map(turnaround), 0.5)),
        previous_within_sla: share(before),
      };
    })
    .sort(
      (a, b) =>
        (a.median_minutes ?? Infinity) - (b.median_minutes ?? Infinity) ||
        a.full_name.localeCompare(b.full_name),
    );

  return {
    month: `${month}-01`,
    clinic_id: clinicId,
    sla_routine_minutes: DEMO_SLA.routine,
    sla_urgent_minutes: DEMO_SLA.urgent,
    radiologists,
  };
}
