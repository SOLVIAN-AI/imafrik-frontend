import type {
  ApiBillingMonth,
  ApiClinicMonthActivity,
  ApiClinicPlan,
  ApiClinicStatement,
  FeeClass,
  ModalityGroup,
  Plan,
} from "@/lib/api/contracts";
import { quantile } from "@/lib/charts";
import { SUBSCRIPTIONS, TECHNICAL_FEES } from "@/content/marketing/pricing";
import {
  DEMO_NETWORK,
  DEMO_SLA,
  type DemoFlow,
  demoFlows,
} from "@/lib/demo/control";
import { modalityGroupOf } from "@/lib/modalities";

/**
 * Activité et facturation de démonstration, pour la clinique et l'équipe.
 *
 * Tirées des **mêmes examens synthétiques** que la tour de contrôle
 * (`demoFlows`), avec les définitions du service : un mois compte les
 * examens reçus ce mois-là (UTC) ; un acte est un examen reçu dont le
 * compte-rendu est signé, compté au tarif de base de son groupe ;
 * l'échographie et la mammographie sont hors grille. Les tarifs sont ceux
 * de la grille publiée (`content/marketing/pricing.ts`), la seule copie
 * du frontend.
 *
 * Un mois passé est clos le 3 du mois suivant, à 8 h : son relevé est
 * calculé à cet instant, comme le service le fige à la clôture.
 */

const HOUR = 3_600_000;

/** Formule de chaque clinique du réseau de démonstration. */
const DEMO_PLANS: Record<string, { plan: Plan; fee: number } | undefined> = {
  [DEMO_NETWORK[0].id]: { plan: "pro", fee: SUBSCRIPTIONS.pro.monthly },
  [DEMO_NETWORK[1].id]: {
    plan: "essential",
    fee: SUBSCRIPTIONS.essential.monthly,
  },
  "org-glf": { plan: "facility", fee: 120_000 },
};

/** Tarif de base de chaque groupe de la grille ; les autres sont hors grille. */
const BASE_FEE: Partial<Record<ModalityGroup, FeeClass>> = {
  radiography: "radiography",
  ct: "ct",
  mri: "mri",
};

const FEES: Record<FeeClass, { normal: number; urgent: number }> = {
  radiography: TECHNICAL_FEES.radiography,
  complex_radiography: TECHNICAL_FEES.complexRadiography,
  hysterosalpingography: TECHNICAL_FEES.hysterosalpingography,
  ct: TECHNICAL_FEES.ct,
  complex_ct: TECHNICAL_FEES.complexCt,
  mri: TECHNICAL_FEES.mri,
};

/** Premier instant d'un mois `AAAA-MM` et du suivant, en ms UTC. */
function bounds(month: string): [number, number] {
  const [year, number] = month.split("-").map(Number);
  return [Date.UTC(year, number - 1, 1), Date.UTC(year, number, 1)];
}

/** Instant de clôture d'un mois de démonstration, ou `null` s'il est ouvert. */
function closedAt(month: string, now: number): number | null {
  const at = bounds(month)[1] + 2 * 24 * HOUR + 8 * HOUR;
  return at <= now ? at : null;
}

/** Examens d'une clinique reçus dans le mois, tels qu'à l'instant `now`. */
function flowsOf(clinicId: string, month: string, now: number): DemoFlow[] {
  const [start, end] = bounds(month);
  return demoFlows(start, Math.min(end, now), clinicId).map((flow) =>
    flow.signedAt !== null && flow.signedAt > now
      ? { ...flow, signedAt: null }
      : flow,
  );
}

const minutes = (flow: DemoFlow) =>
  flow.signedAt === null ? null : (flow.signedAt - flow.receivedAt) / 60_000;
const within = (flow: DemoFlow) =>
  (minutes(flow) ?? Infinity) <=
  (flow.urgent ? DEMO_SLA.urgent : DEMO_SLA.routine);
const round1 = (value: number | null) =>
  value === null ? null : Math.round(value * 10) / 10;

/** Mesures d'un ensemble d'examens : rendus, délai médian, délais tenus. */
function measure(flows: DemoFlow[]) {
  const signed = flows.filter((flow) => flow.signedAt !== null);
  return {
    signed: signed.length,
    median_minutes: round1(
      quantile(
        signed.map((flow) => minutes(flow)!),
        0.5,
      ),
    ),
    within_sla: signed.length
      ? signed.filter(within).length / signed.length
      : null,
  };
}

/**
 * L'activité d'une clinique sur un mois.
 *
 * @param clinicId Clinique.
 * @param month    Mois `AAAA-MM`.
 * @param now      Instant de référence.
 */
export function demoMonthActivity(
  clinicId: string,
  month: string,
  now = Date.now(),
): ApiClinicMonthActivity {
  const flows = flowsOf(clinicId, month, now);
  const routine = flows.filter((flow) => !flow.urgent);
  const urgent = flows.filter((flow) => flow.urgent);
  const overall = measure(flows);

  const groups = new Map<ModalityGroup, DemoFlow[]>();
  for (const flow of flows) {
    const group = modalityGroupOf(flow.modality.code);
    groups.set(group, [...(groups.get(group) ?? []), flow]);
  }

  return {
    clinic_id: clinicId,
    month: `${month}-01`,
    sla_routine_minutes: DEMO_SLA.routine,
    sla_urgent_minutes: DEMO_SLA.urgent,
    received: flows.length,
    signed: overall.signed,
    pending: flows.length - overall.signed,
    median_minutes: overall.median_minutes,
    within_sla: overall.within_sla,
    routine: { received: routine.length, ...measure(routine) },
    urgent: { received: urgent.length, ...measure(urgent) },
    by_modality: [...groups.entries()]
      .map(([group, rows]) => ({
        modality_group: group,
        routine: rows.filter((flow) => !flow.urgent).length,
        urgent: rows.filter((flow) => flow.urgent).length,
        ...measure(rows),
      }))
      .sort(
        (a, b) =>
          b.routine + b.urgent - (a.routine + a.urgent) ||
          a.modality_group.localeCompare(b.modality_group),
      ),
  };
}

/** Le relevé d'une clinique, calculé à l'instant `at`. */
function compute(
  clinicId: string,
  month: string,
  at: number,
): Omit<ApiClinicStatement, "closed_at"> {
  const clinic = DEMO_NETWORK.find((entry) => entry.id === clinicId);
  const flows = flowsOf(clinicId, month, at);
  const signed = flows.filter((flow) => flow.signedAt !== null);
  const plan = DEMO_PLANS[clinicId] ?? null;

  const counts = new Map<string, { routine: number; urgent: number }>();
  for (const flow of signed) {
    const group = modalityGroupOf(flow.modality.code);
    const key = BASE_FEE[group] ?? group;
    const entry = counts.get(key) ?? { routine: 0, urgent: 0 };
    if (flow.urgent) entry.urgent += 1;
    else entry.routine += 1;
    counts.set(key, entry);
  }
  const lines = (Object.keys(FEES) as FeeClass[]).flatMap((feeClass) => {
    const entry = counts.get(feeClass);
    if (!entry) return [];
    const { normal, urgent } = FEES[feeClass];
    return [
      {
        fee_class: feeClass,
        routine: entry.routine,
        urgent: entry.urgent,
        routine_fee: normal,
        urgent_fee: urgent,
        amount: entry.routine * normal + entry.urgent * urgent,
      },
    ];
  });
  const outOfGrid = (["mammography", "ultrasound", "other"] as const).flatMap(
    (group) => {
      const entry = counts.get(group);
      return entry ? [{ modality_group: group, ...entry }] : [];
    },
  );
  const readers = new Map<string, ApiClinicStatement["radiologists"][number]>();
  for (const flow of signed) {
    if (flow.reader === null) continue;
    const entry = readers.get(flow.reader.id) ?? {
      profile_id: flow.reader.id,
      full_name: flow.reader.name,
      title: flow.reader.title,
      routine: 0,
      urgent: 0,
    };
    if (flow.urgent) entry.urgent += 1;
    else entry.routine += 1;
    readers.set(flow.reader.id, entry);
  }
  const technical = lines.reduce((sum, line) => sum + line.amount, 0);
  return {
    clinic_id: clinicId,
    clinic: clinic?.name ?? clinicId,
    month: `${month}-01`,
    plan: plan?.plan ?? null,
    subscription: plan?.fee ?? null,
    lines,
    out_of_grid: outOfGrid,
    acts: lines.reduce((sum, line) => sum + line.routine + line.urgent, 0),
    unreported: flows.length - signed.length,
    radiologists: [...readers.values()].sort(
      (a, b) =>
        b.routine + b.urgent - (a.routine + a.urgent) ||
        a.full_name.localeCompare(b.full_name),
    ),
    technical_total: technical,
    total: plan ? plan.fee + technical : null,
  };
}

/**
 * Le relevé d'une clinique pour un mois : figé s'il est clos.
 *
 * @param clinicId Clinique.
 * @param month    Mois `AAAA-MM`.
 * @param now      Instant de référence.
 */
export function demoStatement(
  clinicId: string,
  month: string,
  now = Date.now(),
): ApiClinicStatement {
  const closed = closedAt(month, now);
  return {
    ...compute(clinicId, month, closed ?? now),
    closed_at: closed === null ? null : new Date(closed).toISOString(),
  };
}

/**
 * Les relevés d'un mois pour toutes les cliniques du réseau.
 *
 * @param month Mois `AAAA-MM`.
 * @param now   Instant de référence.
 */
export function demoBillingMonth(
  month: string,
  now = Date.now(),
): ApiBillingMonth {
  const closed = closedAt(month, now);
  const end = bounds(month)[1];
  return {
    month: `${month}-01`,
    closed_at: closed === null ? null : new Date(closed).toISOString(),
    closable: closed === null && end <= now,
    statements: DEMO_NETWORK.filter(
      // Une clinique créée après la fin du mois n'a pas de relevé.
      (clinic) => now - clinic.ageDays * 24 * HOUR < end,
    )
      .map((clinic) => demoStatement(clinic.id, month, now))
      .sort((a, b) => a.clinic.localeCompare(b.clinic)),
  };
}

/** La formule d'une clinique du réseau de démonstration. */
export function demoClinicPlan(
  clinicId: string,
  now = Date.now(),
): ApiClinicPlan | null {
  const plan = DEMO_PLANS[clinicId];
  if (!plan) return null;
  return {
    plan: plan.plan,
    monthly_fee: plan.fee,
    set_at: new Date(now - 90 * 24 * HOUR).toISOString(),
  };
}
