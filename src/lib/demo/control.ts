import type {
  ApiAdminUser,
  ApiContactRequest,
  ApiAuditEntry,
  ApiBillingLine,
  ApiClinicDetail,
  ApiControlAnalytics,
  ApiControlOverview,
  ApiOpsRun,
  ApiPipelineStudy,
  ApiPlatformSettings,
  ApiSystemStatus,
} from "@/lib/api/contracts";
import { quantile } from "@/lib/charts";
import { DEMO_CLINIC_IDS, DEMO_RADIOLOGISTS } from "@/lib/demo/studies";

/**
 * Réseau de démonstration de la tour de contrôle.
 *
 * Sans service branché, l'administration doit quand même pouvoir se
 * parcourir avec des chiffres qui se tiennent : des volumes qui suivent
 * la semaine et l'heure, une clinique sur une liaison lente, une autre
 * muette depuis la veille, une dernière en cours de mise en service.
 *
 * **Tout est déduit d'un seul jeu d'examens synthétiques**, tiré au sort
 * de façon déterministe — la graine est le jour et la clinique. Le
 * cockpit, l'activité, le flux et la facturation calculent donc leurs
 * chiffres sur les mêmes examens, avec les mêmes définitions que le
 * service : ils ne peuvent pas se contredire d'un écran à l'autre, et un
 * rechargement ne les fait pas changer.
 *
 * Les données produites ont la forme exacte des réponses de l'API
 * (`ApiControlOverview`…) : elles passent ensuite par la même traduction
 * que les vraies, dans `lib/data/control.ts`.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Délais promis par défaut, comme en base. */
export const DEMO_SLA = { urgent: 30, routine: 120 } as const;

// ─── Tirage déterministe ──────────────────────────────────────────────

/**
 * Générateur pseudo-aléatoire Mulberry32 : rapide, 32 bits, et surtout
 * reproductible à partir d'une graine.
 */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tire un élément selon des poids relatifs. */
function weighted<T>(rand: () => number, entries: readonly [T, number][]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let target = rand() * total;
  for (const [value, weight] of entries) {
    target -= weight;
    if (target <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

/** Durée log-normale autour d'une médiane — les délais réels ont une longue traîne. */
function lognormal(rand: () => number, median: number, spread = 0.45): number {
  // Box-Muller.
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return median * Math.exp(spread * normal);
}

// ─── Le réseau ────────────────────────────────────────────────────────

interface DemoClinic {
  id: string;
  name: string;
  city: string;
  /** Examens par jour ouvré, en moyenne. */
  volume: number;
  /** Débit médian de la liaison, en Mo/s. */
  bandwidth: number;
  /** Jours depuis la création. */
  ageDays: number;
  /** Heures de silence en cours — passerelle à l'arrêt. */
  silentHours?: number;
}

/** Les cliniques, de la plus active à la plus récente. */
export const DEMO_NETWORK: DemoClinic[] = [
  {
    id: DEMO_CLINIC_IDS["Clinique Saint-Joseph"],
    name: "Clinique Saint-Joseph",
    city: "Lomé",
    volume: 14,
    bandwidth: 4.2,
    ageDays: 430,
  },
  {
    id: DEMO_CLINIC_IDS["Polyclinique de Kara"],
    name: "Polyclinique de Kara",
    city: "Kara",
    volume: 8,
    bandwidth: 0.9,
    ageDays: 380,
  },
  {
    id: "org-lum",
    name: "Centre médical Lumière",
    city: "Sokodé",
    volume: 5,
    bandwidth: 2.4,
    ageDays: 200,
  },
  {
    id: "org-glf",
    name: "Clinique du Golfe",
    city: "Aného",
    volume: 3,
    bandwidth: 3.1,
    ageDays: 120,
    silentHours: 27,
  },
  {
    id: "org-esp",
    name: "Cabinet Espérance",
    city: "Kpalimé",
    volume: 0,
    bandwidth: 2,
    ageDays: 6,
  },
];

/** Le groupe de radiologie qui lit pour le pool. */
export const DEMO_GROUP = { id: "org-radio", name: "IMAFRIK Radiologie" };

/** Radiologues du groupe, avec leur part de lectures et leur rythme. */
const READERS = [
  { ...DEMO_RADIOLOGISTS.me, title: "Dr", share: 0.34, pace: 1 },
  { ...DEMO_RADIOLOGISTS.bakari, title: "Dr", share: 0.28, pace: 1.15 },
  {
    id: "demo-agbeko",
    name: "Mawuli Agbeko",
    title: "Pr",
    share: 0.22,
    pace: 0.85,
  },
  {
    id: "demo-diallo",
    name: "Fatou Diallo",
    title: "Dr",
    share: 0.16,
    pace: 1.3,
  },
] as const;

/**
 * Modalités : part du volume, taille médiane d'un examen (Mo), et durée
 * médiane de lecture (min).
 */
const MODALITIES = [
  { code: "CT", weight: 32, size: 180, reading: 19, part: "Thorax" },
  { code: "CR", weight: 26, size: 14, reading: 6, part: "Thorax" },
  { code: "MR", weight: 14, size: 120, reading: 26, part: "Crâne" },
  { code: "US", weight: 14, size: 22, reading: 9, part: "Abdomen" },
  { code: "DX", weight: 9, size: 18, reading: 7, part: "Membre" },
  { code: "MG", weight: 5, size: 60, reading: 14, part: "Sein" },
] as const;

/** Arrivées par heure (UTC = heure de Lomé) : matinée chargée, nuit creuse. */
const HOURLY = [
  0.15, 0.1, 0.1, 0.1, 0.15, 0.3, 0.6, 1.2, 2.2, 2.6, 2.5, 2.3, 1.8, 1.6, 2.0,
  2.1, 1.9, 1.5, 1.1, 0.8, 0.6, 0.45, 0.3, 0.2,
] as const;

/** Volume relatif par jour de la semaine, lundi en tête. */
const WEEKDAY = [1.25, 1.1, 1.05, 1.0, 0.95, 0.55, 0.3] as const;

/** Un examen synthétique et les instants de son parcours (ms epoch). */
export interface DemoFlow {
  id: string;
  clinic: DemoClinic;
  modality: (typeof MODALITIES)[number];
  urgent: boolean;
  instances: number;
  bytes: number;
  acquiredAt: number;
  firstInstanceAt: number;
  lastInstanceAt: number;
  receivedAt: number;
  claimedAt: number | null;
  signedAt: number | null;
  deliveredAt: number | null;
  reader: (typeof READERS)[number] | null;
}

/** Jour UTC (nombre de jours depuis l'époque Unix) d'un instant. */
const epochDay = (ms: number) => Math.floor(ms / DAY);

/** Lundi = 0 … dimanche = 6. */
const weekday = (ms: number) => (new Date(ms).getUTCDay() + 6) % 7;

/**
 * Examens d'une clinique sur un jour UTC, tirés avec la graine
 * (jour, clinique) ; ceux qui ne sont pas encore arrivés à `now` sont
 * écartés, ceux qui sont arrivés mais pas encore lus restent ouverts.
 */
function flowsOfDay(clinicIndex: number, day: number, now: number): DemoFlow[] {
  const clinic = DEMO_NETWORK[clinicIndex];
  const start = day * DAY;
  const createdDay = epochDay(now) - clinic.ageDays;
  if (clinic.volume === 0 || day < createdDay) return [];

  const rand = random(day * 977 + clinicIndex * 7919 + 17);
  const expected = clinic.volume * WEEKDAY[weekday(start)];
  // Variation de ±35 % autour de l'attendu.
  const count = Math.max(0, Math.round(expected * (0.65 + rand() * 0.7)));
  const silentSince =
    clinic.silentHours !== undefined ? now - clinic.silentHours * HOUR : null;

  const flows: DemoFlow[] = [];
  for (let n = 0; n < count; n += 1) {
    const hour = weighted(
      rand,
      HOURLY.map((weight, h) => [h, weight] as [number, number]),
    );
    const acquiredAt = start + hour * HOUR + Math.floor(rand() * HOUR);
    const modality = weighted(
      rand,
      MODALITIES.map((m) => [m, m.weight] as [typeof m, number]),
    );
    const urgent = rand() < 0.13;
    const bytes = Math.round(lognormal(rand, modality.size, 0.35) * 1_048_576);
    const instances = Math.max(1, Math.round(bytes / 520_000));
    // Envoi par la passerelle : quelques minutes après l'acquisition.
    const firstInstanceAt = acquiredAt + lognormal(rand, 4, 0.6) * MINUTE;
    const seconds = bytes / 1_048_576 / lognormal(rand, clinic.bandwidth, 0.3);
    const lastInstanceAt = firstInstanceAt + seconds * 1000;
    // Stabilité : Orthanc attend la fin de la série avant de prévenir.
    const receivedAt = lastInstanceAt + 60_000 + rand() * 30_000;
    if (receivedAt > now) continue;
    if (silentSince !== null && receivedAt > silentSince) continue;

    const reader = weighted(
      rand,
      READERS.map((r) => [r, r.share] as [typeof r, number]),
    );
    const queue = lognormal(rand, urgent ? 6 : 38, 0.7) * MINUTE;
    const reading =
      lognormal(rand, modality.reading * reader.pace, 0.4) * MINUTE;
    const delivery = lognormal(rand, urgent ? 4 : 25, 0.9) * MINUTE;
    const claimedAt = receivedAt + queue;
    const signedAt = claimedAt + reading;
    const deliveredAt = signedAt + delivery;

    flows.push({
      id: `demo-flow-${clinic.id}-${day}-${n}`,
      clinic,
      modality,
      urgent,
      instances,
      bytes,
      acquiredAt,
      firstInstanceAt,
      lastInstanceAt,
      receivedAt,
      claimedAt: claimedAt <= now ? claimedAt : null,
      reader: claimedAt <= now ? reader : null,
      signedAt: signedAt <= now ? signedAt : null,
      deliveredAt: deliveredAt <= now ? deliveredAt : null,
    });
  }
  return flows;
}

/**
 * Examens reçus entre deux instants, toutes cliniques ou une seule.
 *
 * @param since   Début, inclus.
 * @param until   Fin, exclue — en général maintenant.
 * @param clinicId Clinique, ou toutes.
 */
export function demoFlows(
  since: number,
  until: number,
  clinicId?: string | null,
): DemoFlow[] {
  const flows: DemoFlow[] = [];
  for (let day = epochDay(since); day <= epochDay(until); day += 1) {
    DEMO_NETWORK.forEach((clinic, index) => {
      if (clinicId && clinic.id !== clinicId) return;
      for (const flow of flowsOfDay(index, day, until)) {
        if (flow.receivedAt >= since && flow.receivedAt < until) {
          flows.push(flow);
        }
      }
    });
  }
  return flows.sort((a, b) => b.receivedAt - a.receivedAt);
}

// ─── Agrégats, mêmes définitions que le service ──────────────────────

const iso = (ms: number) => new Date(ms).toISOString();
const isoOrNull = (ms: number | null) => (ms === null ? null : iso(ms));
const dayKey = (ms: number) => iso(ms).slice(0, 10);
const minutesBetween = (from: number, to: number) => (to - from) / MINUTE;
const median = (values: number[]) => quantile(values, 0.5);
const round1 = (value: number | null) =>
  value === null ? null : Math.round(value * 10) / 10;

/** Délai de réception à signature, en minutes. */
const turnaround = (flow: DemoFlow) =>
  flow.signedAt === null
    ? null
    : minutesBetween(flow.receivedAt, flow.signedAt);

/** Respect du délai promis par un examen signé. */
const withinSla = (flow: DemoFlow, sla = DEMO_SLA) =>
  (turnaround(flow) ?? Infinity) <= (flow.urgent ? sla.urgent : sla.routine);

function prioritySla(flows: DemoFlow[]) {
  const signed = flows.filter((flow) => flow.signedAt !== null);
  const times = signed.map((flow) => turnaround(flow)!);
  return {
    signed: signed.length,
    within_sla: signed.length
      ? signed.filter((flow) => withinSla(flow)).length / signed.length
      : null,
    median_minutes: round1(median(times)),
    p90_minutes: round1(quantile(times, 0.9)),
  };
}

function sla(flows: DemoFlow[]) {
  const signed = flows.filter((flow) => flow.signedAt !== null);
  return {
    urgent: prioritySla(flows.filter((flow) => flow.urgent)),
    routine: prioritySla(flows.filter((flow) => !flow.urgent)),
    within_sla: signed.length
      ? signed.filter((flow) => withinSla(flow)).length / signed.length
      : null,
  };
}

/** Débit d'un transfert, en Mo/s — nul pour une image unique. */
function throughput(flow: DemoFlow): number | null {
  const seconds = (flow.lastInstanceAt - flow.firstInstanceAt) / 1000;
  return seconds > 1 ? flow.bytes / 1_048_576 / seconds : null;
}

/** Dernière exécution de chaque tâche d'exploitation. */
function demoOps(now: number): ApiOpsRun[] {
  const at = (hoursAgo: number) => iso(now - hoursAgo * HOUR);
  return [
    {
      kind: "backup",
      target: "supabase",
      ok: true,
      finished_at: at(5.2),
      summary: "41,3 Mo chiffrés · 18 tables vérifiées",
    },
    {
      kind: "backup",
      target: "orthanc-index",
      ok: true,
      finished_at: at(5.1),
      summary: "3,8 Mo chiffrés",
    },
    {
      kind: "restore_drill",
      target: "supabase",
      ok: true,
      finished_at: at(77),
      summary: "Restauration conforme : 18 tables, 0 écart",
    },
    {
      kind: "reconciliation",
      target: null,
      ok: true,
      finished_at: at(0.08),
      summary: "0 examen manquant",
    },
    {
      kind: "retention",
      target: null,
      ok: true,
      finished_at: at(3.4),
      summary:
        "3 examen(s) purgé(s) du PACS, 0 en échec, 0 demande(s) reçue(s) supprimée(s)",
    },
    {
      kind: "host_watch",
      target: null,
      ok: false,
      finished_at: at(0.2),
      summary: "Disque /var à 83 % (seuil d’alerte : 80 %)",
    },
  ];
}

/** Cockpit : l'état de la plateforme à l'instant. */
export function demoOverview(now = Date.now()): ApiControlOverview {
  const today = epochDay(now) * DAY;
  const flows = demoFlows(today - 29 * DAY, now);
  const open = flows.filter((flow) => flow.signedAt === null);
  const waiting = open.filter((flow) => flow.claimedAt === null);
  const overdue = (urgent: boolean) =>
    open.filter(
      (flow) =>
        flow.urgent === urgent &&
        minutesBetween(flow.receivedAt, now) >
          (urgent ? DEMO_SLA.urgent : DEMO_SLA.routine),
    ).length;

  const received14 = Array.from({ length: 14 }, (_, index) => {
    const start = today - (13 - index) * DAY;
    const ofDay = flows.filter(
      (flow) => flow.receivedAt >= start && flow.receivedAt < start + DAY,
    );
    return {
      day: dayKey(start),
      urgent: ofDay.filter((flow) => flow.urgent).length,
      routine: ofDay.filter((flow) => !flow.urgent).length,
    };
  });

  const ofToday = (field: "receivedAt" | "signedAt" | "deliveredAt") =>
    flows.filter((flow) => (flow[field] ?? 0) >= today).length;

  const silent = DEMO_NETWORK.find((clinic) => clinic.silentHours);
  const urgentOverdue = overdue(true);
  const routineOverdue = overdue(false);
  const alerts: ApiControlOverview["alerts"] = [];
  if (urgentOverdue)
    alerts.push({
      code: "urgent_overdue",
      severity: "critical",
      message: `${urgentOverdue} urgence${urgentOverdue > 1 ? "s attendent" : " attend"} depuis plus de ${DEMO_SLA.urgent} min`,
      href: "/admin/examens?urgent=1",
    });
  if (routineOverdue)
    alerts.push({
      code: "routine_overdue",
      severity: "warning",
      message: `${routineOverdue} examen${routineOverdue > 1 ? "s dépassent" : " dépasse"} le délai de ${DEMO_SLA.routine / 60} h`,
      href: "/admin/flux",
    });
  if (silent)
    alerts.push({
      code: "clinic_silent",
      severity: "warning",
      message: `${silent.name} n’a rien envoyé depuis ${silent.silentHours} h : passerelle à vérifier`,
      href: "/admin/organisations",
    });
  alerts.push({
    code: "host_watch_failed",
    severity: "warning",
    message: "Surveillance de l’hôte en échec : disque /var à 83 %",
    href: "/admin/systeme",
  });
  alerts.push({
    code: "new_requests",
    severity: "info",
    message: "2 demandes reçues par le site attendent une réponse",
    href: "/admin/demandes",
  });

  return {
    generated_at: iso(now),
    live: {
      waiting: waiting.length,
      urgent_waiting: waiting.filter((flow) => flow.urgent).length,
      in_progress: open.length - waiting.length,
      urgent_overdue: urgentOverdue,
      routine_overdue: routineOverdue,
      oldest_waiting_minutes: waiting.length
        ? Math.round(
            minutesBetween(
              Math.min(...waiting.map((flow) => flow.receivedAt)),
              now,
            ),
          )
        : null,
      received_today: ofToday("receivedAt"),
      signed_today: ofToday("signedAt"),
      delivered_today: ofToday("deliveredAt"),
      received_7d: flows.filter((flow) => flow.receivedAt >= now - 7 * DAY)
        .length,
    },
    network: {
      clinics_active: DEMO_NETWORK.length,
      clinics_connected: DEMO_NETWORK.length,
      radiologists_active: READERS.length,
      new_requests: 2,
    },
    received_14d: received14,
    sla_30d: sla(flows),
    sla_urgent_minutes: DEMO_SLA.urgent,
    sla_routine_minutes: DEMO_SLA.routine,
    alerts,
    ops: demoOps(now),
  };
}

/** Activité d'une période, éventuellement d'une seule clinique. */
export function demoAnalytics(
  days: number,
  clinicId: string | null = null,
  now = Date.now(),
): ApiControlAnalytics {
  const today = epochDay(now) * DAY;
  const since = today - (days - 1) * DAY;
  const flows = demoFlows(since, now, clinicId);
  const signed = flows.filter((flow) => flow.signedAt !== null);

  const daily = Array.from({ length: days }, (_, index) => {
    const start = since + index * DAY;
    const ofDay = flows.filter(
      (flow) => flow.receivedAt >= start && flow.receivedAt < start + DAY,
    );
    const times = ofDay
      .map(turnaround)
      .filter((value): value is number => value !== null);
    return {
      day: dayKey(start),
      urgent: ofDay.filter((flow) => flow.urgent).length,
      routine: ofDay.filter((flow) => !flow.urgent).length,
      signed: ofDay.filter((flow) => flow.signedAt !== null).length,
      median_minutes: round1(median(times)),
      p90_minutes: round1(quantile(times, 0.9)),
    };
  });

  const heatmap = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0),
  );
  for (const flow of flows) {
    heatmap[weekday(flow.receivedAt)][
      new Date(flow.receivedAt).getUTCHours()
    ] += 1;
  }

  const stage = (pick: (flow: DemoFlow) => number | null) =>
    round1(
      median(
        flows.map(pick).filter((value): value is number => value !== null),
      ),
    );

  return {
    days,
    since: iso(since),
    until: iso(now),
    totals: {
      received: flows.length,
      urgent: flows.filter((flow) => flow.urgent).length,
      signed: signed.length,
      bytes: flows.reduce((sum, flow) => sum + flow.bytes, 0),
    },
    sla: sla(flows),
    sla_urgent_minutes: DEMO_SLA.urgent,
    sla_routine_minutes: DEMO_SLA.routine,
    stages: {
      transfer: stage((f) =>
        minutesBetween(f.firstInstanceAt, f.lastInstanceAt),
      ),
      arrival: stage((f) => minutesBetween(f.acquiredAt, f.lastInstanceAt)),
      queue: stage((f) =>
        f.claimedAt === null ? null : minutesBetween(f.receivedAt, f.claimedAt),
      ),
      reading: stage((f) =>
        f.signedAt === null || f.claimedAt === null
          ? null
          : minutesBetween(f.claimedAt, f.signedAt),
      ),
      delivery: stage((f) =>
        f.deliveredAt === null || f.signedAt === null
          ? null
          : minutesBetween(f.signedAt, f.deliveredAt),
      ),
    },
    daily,
    heatmap,
    by_clinic: DEMO_NETWORK.filter(
      (clinic) => !clinicId || clinic.id === clinicId,
    )
      .map((clinic) => {
        const own = flows.filter((flow) => flow.clinic.id === clinic.id);
        const ownSigned = own.filter((flow) => flow.signedAt !== null);
        const last = demoFlows(now - 90 * DAY, now, clinic.id)[0];
        return {
          id: clinic.id,
          name: clinic.name,
          received: own.length,
          signed: ownSigned.length,
          bytes: own.reduce((sum, flow) => sum + flow.bytes, 0),
          median_minutes: round1(
            median(ownSigned.map((flow) => turnaround(flow)!)),
          ),
          within_sla: ownSigned.length
            ? ownSigned.filter((flow) => withinSla(flow)).length /
              ownSigned.length
            : null,
          median_mb_per_s: round1(
            median(
              own
                .map(throughput)
                .filter((value): value is number => value !== null),
            ),
          ),
          last_received_at: last ? iso(last.receivedAt) : null,
        };
      })
      .sort((a, b) => b.received - a.received),
    by_modality: MODALITIES.map((modality) => {
      const own = flows.filter((flow) => flow.modality.code === modality.code);
      return {
        modality: modality.code,
        received: own.length,
        median_minutes: round1(
          median(
            own
              .map(turnaround)
              .filter((value): value is number => value !== null),
          ),
        ),
      };
    })
      .filter((row) => row.received > 0)
      .sort((a, b) => b.received - a.received),
    by_radiologist: READERS.map((reader) => {
      const own = signed.filter((flow) => flow.reader?.id === reader.id);
      return {
        id: reader.id,
        full_name: reader.name,
        title: reader.title,
        signed: own.length,
        median_minutes: round1(median(own.map((flow) => turnaround(flow)!))),
        median_reading_minutes: round1(
          median(
            own.map((flow) => minutesBetween(flow.claimedAt!, flow.signedAt!)),
          ),
        ),
      };
    }).sort((a, b) => b.signed - a.signed),
  };
}

/** Statut d'un examen synthétique, dans le vocabulaire du service. */
function status(flow: DemoFlow): string {
  if (flow.deliveredAt !== null) return "delivered";
  if (flow.signedAt !== null) return "reported";
  if (flow.claimedAt !== null) return "in_progress";
  return "received";
}

/** Derniers examens reçus, avec les instants de leur parcours. */
export function demoPipeline(
  limit: number,
  clinicId: string | null = null,
  now = Date.now(),
): ApiPipelineStudy[] {
  return demoFlows(now - 3 * DAY, now, clinicId)
    .slice(0, limit)
    .map((flow) => ({
      id: flow.id,
      clinic: flow.clinic.name,
      modality: flow.modality.code,
      body_part: flow.modality.part,
      priority: flow.urgent ? "urgent" : "routine",
      status: status(flow),
      instance_count: flow.instances,
      radiologist: flow.reader
        ? `${flow.reader.title} ${flow.reader.name}`
        : null,
      acquired_at: iso(flow.acquiredAt),
      first_instance_at: iso(flow.firstInstanceAt),
      last_instance_at: iso(flow.lastInstanceAt),
      received_at: iso(flow.receivedAt),
      claimed_at: isoOrNull(flow.claimedAt),
      signed_at: isoOrNull(flow.signedAt),
      delivered_at: isoOrNull(flow.deliveredAt),
      transfer_bytes: flow.bytes,
    }));
}

/** Actes d'un mois `AAAA-MM`, par clinique, modalité et priorité. */
export function demoBilling(month: string, now = Date.now()): ApiBillingLine[] {
  const [year, number] = month.split("-").map(Number);
  const start = Date.UTC(year, number - 1, 1);
  const end = Math.min(Date.UTC(year, number, 1), now);
  if (end <= start) return [];
  const lines = new Map<string, ApiBillingLine>();
  for (const flow of demoFlows(start, end)) {
    const key = `${flow.clinic.id}|${flow.modality.code}`;
    const line = lines.get(key) ?? {
      clinic_id: flow.clinic.id,
      clinic: flow.clinic.name,
      modality: flow.modality.code,
      reported: 0,
      urgent: 0,
      routine: 0,
    };
    if (flow.urgent) line.urgent += 1;
    else line.routine += 1;
    if (flow.signedAt !== null) line.reported += 1;
    lines.set(key, line);
  }
  return [...lines.values()].sort(
    (a, b) =>
      a.clinic.localeCompare(b.clinic) || a.modality.localeCompare(b.modality),
  );
}

/** État technique. */
export function demoSystem(now = Date.now()): ApiSystemStatus {
  const ops = demoOps(now);
  const stored = demoFlows(now - 366 * DAY, now);
  const recent: ApiOpsRun[] = [
    ...ops,
    ...Array.from({ length: 6 }, (_, index) => ({
      kind: "reconciliation" as const,
      target: null,
      ok: true,
      finished_at: iso(now - (index + 1) * 15 * MINUTE - 5 * MINUTE),
      summary: index === 3 ? "1 examen rattrapé" : "0 examen manquant",
    })),
    {
      kind: "backup",
      target: "supabase",
      ok: true,
      finished_at: iso(now - 29.2 * HOUR),
      summary: "41,1 Mo chiffrés · 18 tables vérifiées",
    },
    {
      kind: "host_watch",
      target: null,
      ok: true,
      finished_at: iso(now - 1.2 * HOUR),
      summary: "Disque /var à 79 %",
    },
  ];
  recent.sort((a, b) => b.finished_at.localeCompare(a.finished_at));
  return {
    environment: "démonstration",
    release: "2026.10.07-demo",
    services: [
      { name: "Base de données", ok: true, detail: "Supabase · Postgres 17" },
      { name: "PACS central", ok: true, detail: "Orthanc 1.13 · DICOM TLS" },
      { name: "Stockage objet", ok: true, detail: "R2 · comptes-rendus" },
      { name: "Réseau privé", ok: true, detail: "Tailscale · 5 passerelles" },
    ],
    orthanc_version: "1.13.0",
    stored_studies: stored.length,
    stored_megabytes: Math.round(
      stored.reduce((sum, flow) => sum + flow.bytes, 0) / 1_048_576,
    ),
    ops,
    recent_runs: recent.slice(0, 12),
  };
}

/** Réglages de la plateforme. */
export function demoSettings(now = Date.now()): ApiPlatformSettings {
  return {
    sla_urgent_minutes: DEMO_SLA.urgent,
    sla_routine_minutes: DEMO_SLA.routine,
    maintenance_message: null,
    updated_at: iso(now - 12 * DAY),
  };
}

/** Comptes de la plateforme. */
export function demoUsers(now = Date.now()): ApiAdminUser[] {
  const ago = (hours: number | null) =>
    hours === null ? null : iso(now - hours * HOUR);
  const group = (role: "radiologist" | "platform_admin") => ({
    membership_id: `m-${role}`,
    organization_id: DEMO_GROUP.id,
    organization_name: DEMO_GROUP.name,
    organization_kind: "radiology_group" as const,
    role,
  });
  const clinic = (index: number) => ({
    membership_id: `m-clinic-${index}`,
    organization_id: DEMO_NETWORK[index].id,
    organization_name: DEMO_NETWORK[index].name,
    organization_kind: "clinic" as const,
    role: "clinic_staff" as const,
  });
  const user = (
    id: string,
    full_name: string,
    title: string | null,
    email: string,
    createdDaysAgo: number,
    lastSignInHours: number | null,
    mfa: boolean,
    memberships: ApiAdminUser["memberships"],
    license: string | null = null,
  ): ApiAdminUser => ({
    id,
    full_name,
    title,
    license_number: license,
    email,
    created_at: iso(now - createdDaysAgo * DAY),
    last_sign_in_at: ago(lastSignInHours),
    mfa_enabled: mfa,
    memberships,
  });
  return [
    user(
      READERS[0].id,
      READERS[0].name,
      "Dr",
      "a.kponton@exemple.tg",
      420,
      0.3,
      true,
      [group("radiologist")],
      "TG-RAD-0142",
    ),
    user(
      READERS[1].id,
      READERS[1].name,
      "Dr",
      "i.bakari@exemple.tg",
      400,
      2,
      true,
      [group("radiologist")],
      "TG-RAD-0187",
    ),
    user(
      READERS[2].id,
      READERS[2].name,
      "Pr",
      "m.agbeko@exemple.tg",
      260,
      20,
      true,
      [group("radiologist")],
      "TG-RAD-0031",
    ),
    user(
      READERS[3].id,
      READERS[3].name,
      "Dr",
      "f.diallo@exemple.sn",
      140,
      5,
      false,
      [group("radiologist")],
      "SN-RAD-2210",
    ),
    user(
      "demo-admin",
      "Équipe IMAFRIK",
      null,
      "exploitation@imafrik.example",
      450,
      0.1,
      true,
      [group("platform_admin")],
    ),
    user(
      "demo-staff-stj",
      "Akossiwa Mensah",
      null,
      "accueil@stjoseph.example",
      410,
      1,
      false,
      [clinic(0)],
    ),
    user(
      "demo-staff-pka",
      "Essowè Padaro",
      null,
      "imagerie@kara.example",
      370,
      26,
      false,
      [clinic(1)],
    ),
    user(
      "demo-staff-lum",
      "Rachida Ouro-Bawa",
      null,
      "radio@lumiere.example",
      190,
      50,
      false,
      [clinic(2)],
    ),
    user(
      "demo-staff-glf",
      "Kodjo Amouzou",
      null,
      "contact@golfe.example",
      110,
      31,
      false,
      [clinic(3)],
    ),
    user(
      "demo-staff-esp",
      "Yawa Dossou",
      null,
      "cabinet@esperance.example",
      6,
      null,
      false,
      [clinic(4)],
    ),
    user(
      "demo-pending-1",
      "Moussa Traoré",
      "Dr",
      "m.traore@exemple.ml",
      2,
      40,
      false,
      [],
      "ML-RAD-0915",
    ),
    user(
      "demo-pending-2",
      "Aïcha Bello",
      "Dr",
      "a.bello@exemple.bj",
      0.4,
      9,
      false,
      [],
      "BJ-RAD-0477",
    ),
  ];
}

/** Mise en service d'une clinique, ou `null` si elle n'existe pas. */
export function demoClinic(
  id: string,
  now = Date.now(),
): ApiClinicDetail | null {
  const clinic = DEMO_NETWORK.find((candidate) => candidate.id === id);
  if (!clinic) return null;
  const created = now - clinic.ageDays * DAY;
  const flows = demoFlows(created, now, id);
  const first = flows.at(-1) ?? null;
  const step = (
    key: ApiClinicDetail["onboarding"][number]["key"],
    label: string,
    at: number | null,
  ) => ({ key, label, done: at !== null, done_at: isoOrNull(at) });
  const firstSigned = flows.filter((f) => f.signedAt !== null).at(-1);
  const firstDelivered = flows.filter((f) => f.deliveredAt !== null).at(-1);
  return {
    id: clinic.id,
    name: clinic.name,
    city: clinic.city,
    is_active: true,
    open_to_pool: true,
    received_30d: flows.filter((flow) => flow.receivedAt >= now - 30 * DAY)
      .length,
    // Saint-Joseph a fixé une durée par contrat ; les autres, non.
    image_retention_days: clinic.id === DEMO_NETWORK[0].id ? 365 : null,
    images_purged: clinic.id === DEMO_NETWORK[0].id ? 42 : 0,
    // Une clinique anglophone, pour montrer la langue des comptes-rendus.
    report_language: clinic.id === DEMO_NETWORK.at(-1)?.id ? "en" : "fr",
    last_received_at: first ? iso(flows[0].receivedAt) : null,
    onboarding: [
      step("created", "Organisation créée", created),
      step("connected", "Passerelle raccordée", created + 2 * HOUR),
      step("team", "Équipe invitée", created + 5 * HOUR),
      step("first_study", "Premier examen reçu", first?.receivedAt ?? null),
      step(
        "first_report",
        "Premier compte-rendu signé",
        firstSigned?.signedAt ?? null,
      ),
      step(
        "first_delivery",
        "Premier compte-rendu remis",
        firstDelivered?.deliveredAt ?? null,
      ),
    ],
  };
}

/** Journal d'audit, des plus récentes aux plus anciennes. */
export function demoAudit(now = Date.now()): ApiAuditEntry[] {
  const admin = { actor_id: "demo-admin", actor_name: "Équipe IMAFRIK" };
  const rows: Omit<ApiAuditEntry, "id">[] = [];
  const push = (
    minutesAgo: number,
    action: string,
    actor: { actor_id: string | null; actor_name: string | null },
    org: { id: string; name: string } | null,
    resource: [string, string] | null,
    metadata: Record<string, unknown> | null = null,
  ) =>
    rows.push({
      at: iso(now - minutesAgo * MINUTE),
      action,
      ...actor,
      organization_id: org?.id ?? null,
      organization_name: org?.name ?? null,
      resource_type: resource?.[0] ?? null,
      resource_id: resource?.[1] ?? null,
      metadata,
    });
  const reader = (index: number) => ({
    actor_id: READERS[index].id,
    actor_name: `${READERS[index].title} ${READERS[index].name}`,
  });
  const staff = { actor_id: "demo-staff-stj", actor_name: "Akossiwa Mensah" };
  const stj = { id: DEMO_NETWORK[0].id, name: DEMO_NETWORK[0].name };
  const group = DEMO_GROUP;

  let minutes = 2;
  for (let index = 0; index < 60; index += 1) {
    const r = index % READERS.length;
    const study = `demo-flow-${index}`;
    switch (index % 6) {
      case 0:
        push(minutes, "study.claimed", reader(r), group, ["study", study]);
        break;
      case 1:
        push(minutes, "report.signed", reader(r), group, [
          "report",
          `r-${index}`,
        ]);
        break;
      case 2:
        push(minutes, "report.delivered", staff, stj, ["report", `r-${index}`]);
        break;
      case 3:
        push(minutes, "study.viewed", reader(r), group, ["study", study]);
        break;
      case 4:
        push(minutes, "report.addendum", reader(r), group, [
          "report",
          `r-${index}`,
        ]);
        break;
      default:
        push(minutes, "study.released", reader(r), group, ["study", study]);
    }
    minutes += 7 + (index % 5) * 6;
    if (index === 12)
      push(
        minutes,
        "platform.settings_changed",
        admin,
        group,
        ["platform", "settings"],
        {
          sla_urgent_minutes: 30,
        },
      );
    if (index === 30)
      push(
        minutes,
        "membership.created",
        admin,
        { id: "org-esp", name: "Cabinet Espérance" },
        ["membership", "m-clinic-4"],
        {
          role: "clinic_staff",
        },
      );
    if (index === 44)
      push(
        minutes,
        "contact_request.tracked",
        admin,
        group,
        ["contact_request", "c-2"],
        {
          status: "contacted",
        },
      );
  }
  return rows.map((row, index) => ({ id: 10_000 - index, ...row }));
}

/** Demandes reçues par le site, à divers stades de suivi. */
export function demoContactRequests(now = Date.now()): ApiContactRequest[] {
  const at = (hours: number) => iso(now - hours * HOUR);
  return [
    {
      id: "c-1",
      full_name: "Komlan Adjavon",
      organization: "Centre de santé de Tsévié",
      email: "direction@tsevie.example",
      phone: "+228 90 00 00 01",
      message:
        "Nous avons un scanner 16 barrettes sans radiologue sur place. Pouvez-vous nous présenter l’offre et les délais de lecture ?",
      status: "new",
      notes: null,
      handled_at: null,
      created_at: at(3),
    },
    {
      id: "c-2",
      full_name: "Mariam Sanni",
      organization: "Clinique Les Palmiers",
      email: "m.sanni@palmiers.example",
      phone: null,
      message: "Demande de démonstration pour notre équipe d’imagerie.",
      status: "new",
      notes: null,
      handled_at: null,
      created_at: at(20),
    },
    {
      id: "c-3",
      full_name: "Edem Kouassi",
      organization: "Hôpital de district de Notsé",
      email: "imagerie@notse.example",
      phone: "+228 91 00 00 02",
      message: "Intéressés par la lecture des radiographies de nuit.",
      status: "contacted",
      notes: "Appelé le 2 oct. : visite prévue, devis à envoyer.",
      handled_at: at(90),
      created_at: at(120),
    },
    {
      id: "c-4",
      full_name: "Yawa Dossou",
      organization: "Cabinet Espérance",
      email: "cabinet@esperance.example",
      phone: "+228 92 00 00 03",
      message: "Nous souhaitons rejoindre le réseau.",
      status: "converted",
      notes: "Raccordé : kit installé, équipe invitée.",
      handled_at: at(150),
      created_at: at(200),
    },
    {
      id: "c-5",
      full_name: "Service commercial",
      organization: null,
      email: "offres@fournisseur.example",
      phone: null,
      message: "Proposition de partenariat publicitaire.",
      status: "dismissed",
      notes: "Hors sujet.",
      handled_at: at(300),
      created_at: at(310),
    },
  ];
}
