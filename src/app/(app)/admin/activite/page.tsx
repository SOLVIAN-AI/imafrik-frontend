import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ClinicFilter } from "@/components/admin/clinic-filter";
import {
  ControlBody,
  Figure,
  Section,
  Segmented,
} from "@/components/admin/control-ui";
import { RelativeTime } from "@/components/admin/relative-time";
import {
  Heatmap,
  Legend,
  Lines,
  RankedBars,
  StackedBars,
} from "@/components/charts/charts";
import { PageHeader } from "@/components/layout/app-shell";
import {
  ANALYTICS_PERIODS,
  parseClinic,
  parsePeriod,
} from "@/lib/admin-params";
import { chunk, weightedMean } from "@/lib/charts";
import { listOrganizations } from "@/lib/data/admin";
import {
  type ControlAnalytics,
  type StageMedians,
  getAnalytics,
} from "@/lib/data/control";
import {
  MISSING,
  formatBytes,
  formatCount,
  formatDayShort,
  formatDuration,
  formatMinutes,
  formatPercent,
  formatPersonName,
  formatRate,
} from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Activité" };

/** Au-delà, une barre par jour devient illisible : on passe à la semaine. */
const DAILY_LIMIT = 90;

/**
 * Activité de la plateforme sur une période.
 *
 * Volumes, délais et leur décomposition par étape, heures d'arrivée,
 * puis les mêmes chiffres par clinique, par modalité et par radiologue.
 * Période et clinique vivent dans l'adresse : une vue se partage telle
 * quelle.
 */
export default async function ActivityPage({
  searchParams,
}: PageProps<"/admin/activite">) {
  await requireSession(["platform_admin"]);
  const params = await searchParams;
  const clinics = (await listOrganizations())
    .filter((org) => org.kind === "clinic")
    .map((org) => ({ id: org.id, name: org.name }));
  const days = parsePeriod(params.jours);
  const clinicId = parseClinic(
    params.clinique,
    clinics.map((clinic) => clinic.id),
  );
  const data = await getAnalytics(days, clinicId);
  const clinicName = clinics.find((clinic) => clinic.id === clinicId)?.name;

  const periodHref = (period: number) => {
    const query = new URLSearchParams({ jours: String(period) });
    if (clinicId) query.set("clinique", clinicId);
    return `/admin/activite?${query}`;
  };

  return (
    <>
      <PageHeader
        title="Activité"
        description={`${clinicName ?? "Tout le réseau"} · ${days} derniers jours`}
        actions={
          <>
            <Segmented
              label="Période"
              options={ANALYTICS_PERIODS.map((period) => ({
                label: period === 365 ? "1 an" : `${period} j`,
                href: periodHref(period),
                active: period === days,
              }))}
            />
            <ClinicFilter clinics={clinics} />
          </>
        }
      />

      <ControlBody>
        <Totals data={data} />

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <Volume data={data} />
          <Turnaround data={data} />
        </div>

        <Stages stages={data.stages} />

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
          <Section
            title="Heures d’arrivée"
            description="Examens reçus par jour de la semaine et heure (UTC, heure de Lomé)"
            className="xl:col-span-2"
          >
            <Heatmap
              cells={data.heatmap}
              caption="Examens reçus par jour de la semaine et par heure"
            />
          </Section>
          <Section title="Modalités" description="Examens reçus · délai médian">
            <RankedBars
              items={data.byModality.map((row) => ({
                label: row.modality,
                value: row.received,
                hint: formatMinutes(row.medianMinutes),
              }))}
            />
          </Section>
        </div>

        {!clinicId && <Clinics data={data} days={days} />}

        <Radiologists data={data} />
      </ControlBody>
    </>
  );
}

/** Totaux de la période. */
function Totals({ data }: { data: ControlAnalytics }) {
  const { totals, sla } = data;
  const ratio = sla.withinSla;
  return (
    <section
      aria-label="Totaux de la période"
      className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-3 lg:grid-cols-5"
    >
      <Figure label="Examens reçus" value={formatCount(totals.received)} />
      <Figure
        label="Dont urgences"
        value={formatCount(totals.urgent)}
        hint={
          totals.received
            ? formatPercent(totals.urgent / totals.received)
            : undefined
        }
      />
      <Figure
        label="Comptes-rendus signés"
        value={formatCount(totals.signed)}
        hint={
          totals.received
            ? `${formatPercent(totals.signed / totals.received)} des reçus`
            : undefined
        }
      />
      <Figure
        label="Dans les délais promis"
        value={formatPercent(ratio)}
        tone={
          ratio === null
            ? undefined
            : ratio >= 0.95
              ? "done"
              : ratio >= 0.8
                ? "progress"
                : "urgent"
        }
        hint={`urgence ${formatPercent(sla.urgent.withinSla)} · routine ${formatPercent(sla.routine.withinSla)}`}
      />
      <Figure
        label="Images reçues"
        value={formatBytes(totals.bytes)}
        hint={
          totals.received
            ? `${formatBytes(totals.bytes / totals.received)} par examen`
            : undefined
        }
      />
    </section>
  );
}

const VOLUME_SERIES = [
  { label: "Routine", tone: "accent" as const },
  { label: "Urgence", tone: "urgent" as const },
];

/** Séries quotidiennes, regroupées par semaine au-delà de 90 jours. */
function buckets(data: ControlAnalytics) {
  const weekly = data.days > DAILY_LIMIT;
  return {
    weekly,
    groups: chunk(data.daily, weekly ? 7 : 1),
  };
}

/** Volume reçu par période. */
function Volume({ data }: { data: ControlAnalytics }) {
  const { weekly, groups } = buckets(data);
  return (
    <Section
      title="Volume reçu"
      description={weekly ? "Par semaine" : "Par jour"}
      aside={<Legend series={VOLUME_SERIES} />}
    >
      <StackedBars
        caption={`Examens reçus ${weekly ? "par semaine" : "par jour"}`}
        points={groups.map((group) => ({
          label: formatDayShort(group[0].day),
          values: [
            group.reduce((sum, day) => sum + day.routine, 0),
            group.reduce((sum, day) => sum + day.urgent, 0),
          ],
        }))}
        series={VOLUME_SERIES}
      />
    </Section>
  );
}

const TURNAROUND_SERIES = [
  { label: "Médiane", tone: "accent" as const },
  { label: "9 examens sur 10", tone: "progress" as const, dashed: true },
];

/** Délai de réception à signature, au fil de la période. */
function Turnaround({ data }: { data: ControlAnalytics }) {
  const { weekly, groups } = buckets(data);
  return (
    <Section
      title="Délai de lecture"
      description={
        weekly
          ? "De la réception à la signature, en moyenne hebdomadaire des valeurs quotidiennes"
          : "De la réception à la signature, par jour"
      }
      aside={<Legend series={TURNAROUND_SERIES} />}
    >
      <Lines
        caption="Délai de réception à signature, en minutes"
        points={groups.map((group) => {
          const pairs = (
            pick: (day: (typeof group)[number]) => number | null,
          ) => weightedMean(group.map((day) => [pick(day), day.signed]));
          return {
            label: formatDayShort(group[0].day),
            values: [
              pairs((day) => day.medianMinutes),
              pairs((day) => day.p90Minutes),
            ],
          };
        })}
        series={TURNAROUND_SERIES}
        threshold={{
          value: data.targets.routine,
          label: `Promis en routine : ${formatDuration(data.targets.routine)}`,
        }}
        unit="minutes"
        format={(value) => formatDuration(value)}
      />
    </Section>
  );
}

/** Étapes du parcours, dans l'ordre. */
const STAGES: { key: keyof StageMedians; label: string; detail: string }[] = [
  {
    key: "arrival",
    label: "Acheminement",
    detail: "acquisition → dernière image reçue",
  },
  {
    key: "transfer",
    label: "Transfert",
    detail: "première → dernière image",
  },
  { key: "queue", label: "File", detail: "réception → prise en charge" },
  { key: "reading", label: "Lecture", detail: "prise en charge → signature" },
  { key: "delivery", label: "Remise", detail: "signature → téléchargement" },
];

/**
 * Où se perd le temps : médiane de chaque étape.
 *
 * Le délai total ne dit pas si un examen attend dans le réseau, dans la
 * file ou chez le radiologue — et la réponse n'appelle pas le même geste.
 */
function Stages({ stages }: { stages: StageMedians }) {
  const values = STAGES.map((stage) => stages[stage.key] ?? 0);
  const slowest = Math.max(...values);
  return (
    <Section
      title="Parcours d’un examen"
      description="Durée médiane de chaque étape, la plus longue étant mise en évidence"
    >
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAGES.map((stage, index) => {
          const value = stages[stage.key];
          const isSlowest = value !== null && value > 0 && value === slowest;
          return (
            <li
              key={stage.key}
              className={cn(
                "relative rounded-lg border px-3 py-2.5",
                isSlowest
                  ? "border-progress/40 bg-progress-muted"
                  : "border-border-subtle bg-surface-sunken/50",
              )}
            >
              <p className="flex items-center gap-1 text-2xs text-tertiary">
                <span className="tabular-nums">{index + 1}.</span>
                <span className="truncate">{stage.label}</span>
              </p>
              <p
                className={cn(
                  "mt-0.5 text-lg font-semibold tabular-nums",
                  isSlowest && "text-progress",
                )}
              >
                {formatMinutes(value)}
              </p>
              <p
                className="truncate text-2xs text-tertiary"
                title={stage.detail}
              >
                {stage.detail}
              </p>
              {index < STAGES.length - 1 && (
                <ChevronRight
                  className="absolute top-1/2 -right-3 hidden size-3.5 -translate-y-1/2 text-tertiary lg:block"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/** Tableau par clinique : volumes, délais, débit de réception. */
function Clinics({ data, days }: { data: ControlAnalytics; days: number }) {
  return (
    <Section
      title="Par clinique"
      description="Le débit est celui de la liaison entre la passerelle et le PACS central"
      flush
    >
      {data.byClinic.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-tertiary">
          Aucune clinique sur la période.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border-subtle md:hidden">
            {data.byClinic.map((clinic) => (
              <li key={clinic.id} className="px-4 py-3">
                <Link
                  href={`/admin/activite?jours=${days}&clinique=${clinic.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {clinic.name}
                </Link>
                <dl className="mt-1.5 grid grid-cols-3 gap-2 text-2xs">
                  <Cell label="Reçus" value={formatCount(clinic.received)} />
                  <Cell
                    label="Délai médian"
                    value={formatMinutes(clinic.medianMinutes)}
                  />
                  <Cell
                    label="Dans les délais"
                    value={formatPercent(clinic.withinSla)}
                  />
                  <Cell
                    label="Débit"
                    value={formatRate(clinic.medianMbPerSecond)}
                    warn={isSlow(clinic.medianMbPerSecond)}
                  />
                  <Cell label="Volume" value={formatBytes(clinic.bytes)} />
                  <div className="min-w-0">
                    <dt className="text-tertiary">Dernier envoi</dt>
                    <dd className="truncate">
                      {clinic.lastReceivedAt ? (
                        <RelativeTime
                          date={clinic.lastReceivedAt}
                          staleAfterHours={24}
                        />
                      ) : (
                        MISSING
                      )}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:px-4 [&>th]:text-right [&>th]:font-medium [&>th:first-child]:text-left">
                  <th scope="col">
                    <span className="label-eyebrow">Clinique</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">Reçus</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">Signés</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">Délai médian</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">Dans les délais</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">Débit</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">Volume</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">Dernier envoi</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.byClinic.map((clinic) => (
                  <tr
                    key={clinic.id}
                    className="[&>td]:h-11 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4 [&>td]:text-right [&>td]:tabular-nums [&>td:first-child]:text-left last:[&>td]:border-b-0"
                  >
                    <td className="max-w-[16rem] truncate">
                      <Link
                        href={`/admin/activite?jours=${days}&clinique=${clinic.id}`}
                        className="font-medium hover:underline"
                      >
                        {clinic.name}
                      </Link>
                    </td>
                    <td>{formatCount(clinic.received)}</td>
                    <td>{formatCount(clinic.signed)}</td>
                    <td>{formatMinutes(clinic.medianMinutes)}</td>
                    <td>{formatPercent(clinic.withinSla)}</td>
                    <td
                      className={cn(
                        isSlow(clinic.medianMbPerSecond) && "text-progress",
                      )}
                    >
                      {formatRate(clinic.medianMbPerSecond)}
                    </td>
                    <td>{formatBytes(clinic.bytes)}</td>
                    <td className="text-2xs whitespace-nowrap text-tertiary">
                      {clinic.lastReceivedAt ? (
                        <RelativeTime
                          date={clinic.lastReceivedAt}
                          staleAfterHours={24}
                        />
                      ) : (
                        MISSING
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Section>
  );
}

/**
 * Seuil sous lequel une liaison est signalée : à 1 Mo/s, un scanner de
 * 200 Mo met plus de trois minutes à arriver.
 */
const SLOW_LINK_MB_PER_S = 1.5;

const isSlow = (rate: number | null) =>
  rate !== null && rate < SLOW_LINK_MB_PER_S;

/** Une valeur étiquetée, dans les cartes du téléphone. */
function Cell({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-tertiary">{label}</dt>
      <dd className={cn("truncate tabular-nums", warn && "text-progress")}>
        {value}
      </dd>
    </div>
  );
}

/** Production des radiologues. */
function Radiologists({ data }: { data: ControlAnalytics }) {
  return (
    <Section
      title="Par radiologue"
      description="Délai total (réception → signature) et temps de lecture (prise en charge → signature)"
      flush
    >
      {data.byRadiologist.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-tertiary">
          Aucun compte-rendu signé sur la période.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {data.byRadiologist.map((reader) => {
            const max = Math.max(
              1,
              ...data.byRadiologist.map((row) => row.signed),
            );
            return (
              <li
                key={reader.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto_auto]"
              >
                <span className="truncate text-sm font-medium">
                  {formatPersonName(reader.title, reader.fullName)}
                </span>
                <span className="order-last col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-active sm:order-none sm:col-span-1">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(reader.signed / max) * 100}%` }}
                  />
                </span>
                <span className="text-right text-sm font-semibold tabular-nums">
                  {formatCount(reader.signed)}
                  <span className="ml-1 text-2xs font-normal text-tertiary">
                    signés
                  </span>
                </span>
                <span className="col-span-2 text-2xs text-tertiary tabular-nums sm:col-span-1 sm:w-44 sm:text-right">
                  délai {formatMinutes(reader.medianMinutes)} · lecture{" "}
                  {formatMinutes(reader.medianReadingMinutes)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
