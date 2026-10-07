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
import type { Locale } from "@/lib/i18n/locale";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.analytics };
}

/** Textes et langue de l'utilisateur, transmis aux blocs de l'écran. */
interface Lang {
  t: AppMessages;
  locale: Locale;
}

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
  const { t, locale } = await getMessages();
  const lang = { t, locale };
  const text = t.admin.activity;
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
        title={t.nav.items.analytics}
        description={text.description(
          clinicName ?? t.admin.shared.wholeNetwork,
          days,
        )}
        actions={
          <>
            <Segmented
              label={text.period}
              options={ANALYTICS_PERIODS.map((period) => ({
                label:
                  period === 365
                    ? t.common.units.years(1)
                    : `${period} ${t.common.units.day}`,
                href: periodHref(period),
                active: period === days,
              }))}
            />
            <ClinicFilter clinics={clinics} />
          </>
        }
      />

      <ControlBody>
        <Totals data={data} {...lang} />

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <Volume data={data} {...lang} />
          <Turnaround data={data} {...lang} />
        </div>

        <Stages stages={data.stages} {...lang} />

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
          <Section
            title={text.arrivals}
            description={text.arrivalsDescription}
            className="xl:col-span-2"
          >
            <Heatmap
              cells={data.heatmap}
              caption={text.arrivalsCaption}
              locale={locale}
            />
          </Section>
          <Section
            title={text.modalities}
            description={text.modalitiesDescription}
          >
            <RankedBars
              locale={locale}
              items={data.byModality.map((row) => ({
                label: row.modality,
                value: row.received,
                hint: formatMinutes(row.medianMinutes, locale),
              }))}
            />
          </Section>
        </div>

        {!clinicId && <Clinics data={data} days={days} {...lang} />}

        <Radiologists data={data} {...lang} />
      </ControlBody>
    </>
  );
}

/** Totaux de la période. */
function Totals({ data, t, locale }: { data: ControlAnalytics } & Lang) {
  const text = t.admin.activity;
  const shared = t.admin.shared;
  const { totals, sla } = data;
  const ratio = sla.withinSla;
  return (
    <section
      aria-label={text.totals}
      className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-3 lg:grid-cols-5"
    >
      <Figure
        label={shared.receivedStudies}
        value={formatCount(totals.received, locale)}
      />
      <Figure
        label={shared.ofWhichUrgent}
        value={formatCount(totals.urgent, locale)}
        hint={
          totals.received
            ? formatPercent(totals.urgent / totals.received, locale)
            : undefined
        }
      />
      <Figure
        label={shared.signedReports}
        value={formatCount(totals.signed, locale)}
        hint={
          totals.received
            ? text.ofReceived(
                formatPercent(totals.signed / totals.received, locale),
              )
            : undefined
        }
      />
      <Figure
        label={text.withinSla}
        value={formatPercent(ratio, locale)}
        tone={
          ratio === null
            ? undefined
            : ratio >= 0.95
              ? "done"
              : ratio >= 0.8
                ? "progress"
                : "urgent"
        }
        hint={text.withinSlaHint(
          formatPercent(sla.urgent.withinSla, locale),
          formatPercent(sla.routine.withinSla, locale),
        )}
      />
      <Figure
        label={shared.imagesReceived}
        value={formatBytes(totals.bytes, locale)}
        hint={
          totals.received
            ? text.perStudy(formatBytes(totals.bytes / totals.received, locale))
            : undefined
        }
      />
    </section>
  );
}

/** Séries de l'histogramme des volumes, de bas en haut. */
const volumeSeries = (t: AppMessages) => [
  { label: t.admin.shared.routine, tone: "accent" as const },
  { label: t.admin.shared.urgent, tone: "urgent" as const },
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
function Volume({ data, t, locale }: { data: ControlAnalytics } & Lang) {
  const text = t.admin.activity;
  const series = volumeSeries(t);
  const { weekly, groups } = buckets(data);
  return (
    <Section
      title={t.admin.shared.volumeReceived}
      description={weekly ? text.perWeek : text.perDay}
      aside={<Legend series={series} />}
    >
      <StackedBars
        caption={weekly ? text.receivedPerWeek : text.receivedPerDay}
        locale={locale}
        points={groups.map((group) => ({
          label: formatDayShort(group[0].day, locale),
          values: [
            group.reduce((sum, day) => sum + day.routine, 0),
            group.reduce((sum, day) => sum + day.urgent, 0),
          ],
        }))}
        series={series}
      />
    </Section>
  );
}

/** Séries des délais : médiane et 90e centile. */
const turnaroundSeries = (t: AppMessages) => [
  { label: t.admin.activity.median, tone: "accent" as const },
  { label: t.admin.activity.p90, tone: "progress" as const, dashed: true },
];

/** Délai de réception à signature, au fil de la période. */
function Turnaround({ data, t, locale }: { data: ControlAnalytics } & Lang) {
  const text = t.admin.activity;
  const series = turnaroundSeries(t);
  const { weekly, groups } = buckets(data);
  return (
    <Section
      title={text.turnaround}
      description={weekly ? text.turnaroundWeekly : text.turnaroundDaily}
      aside={<Legend series={series} />}
    >
      <Lines
        caption={text.turnaroundCaption}
        locale={locale}
        points={groups.map((group) => {
          const pairs = (
            pick: (day: (typeof group)[number]) => number | null,
          ) => weightedMean(group.map((day) => [pick(day), day.signed]));
          return {
            label: formatDayShort(group[0].day, locale),
            values: [
              pairs((day) => day.medianMinutes),
              pairs((day) => day.p90Minutes),
            ],
          };
        })}
        series={series}
        threshold={{
          value: data.targets.routine,
          label: text.routineTarget(
            formatDuration(data.targets.routine, locale),
          ),
        }}
        unit="minutes"
        format={(value) => formatDuration(value, locale)}
      />
    </Section>
  );
}

/** Étapes du parcours, dans l'ordre ; libellés dans `admin.stages`. */
const STAGES: (keyof StageMedians)[] = [
  "arrival",
  "transfer",
  "queue",
  "reading",
  "delivery",
];

/**
 * Où se perd le temps : médiane de chaque étape.
 *
 * Le délai total ne dit pas si un examen attend dans le réseau, dans la
 * file ou chez le radiologue — et la réponse n'appelle pas le même geste.
 */
function Stages({ stages, t, locale }: { stages: StageMedians } & Lang) {
  const labels = t.admin.stages;
  const values = STAGES.map((key) => stages[key] ?? 0);
  const slowest = Math.max(...values);
  return (
    <Section
      title={t.admin.activity.journey}
      description={t.admin.activity.journeyDescription}
    >
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAGES.map((key, index) => {
          const value = stages[key];
          const isSlowest = value !== null && value > 0 && value === slowest;
          return (
            <li
              key={key}
              className={cn(
                "relative rounded-lg border px-3 py-2.5",
                isSlowest
                  ? "border-progress/40 bg-progress-muted"
                  : "border-border-subtle bg-surface-sunken/50",
              )}
            >
              <p className="flex items-center gap-1 text-2xs text-tertiary">
                <span className="tabular-nums">{index + 1}.</span>
                <span className="truncate">{labels.labels[key]}</span>
              </p>
              <p
                className={cn(
                  "mt-0.5 text-lg font-semibold tabular-nums",
                  isSlowest && "text-progress",
                )}
              >
                {formatMinutes(value, locale)}
              </p>
              <p
                className="truncate text-2xs text-tertiary"
                title={labels.details[key]}
              >
                {labels.details[key]}
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
function Clinics({
  data,
  days,
  t,
  locale,
}: { data: ControlAnalytics; days: number } & Lang) {
  const text = t.admin.activity;
  const columns = text.columns;
  return (
    <Section title={text.byClinic} description={text.byClinicDescription} flush>
      {data.byClinic.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-tertiary">
          {text.noClinic}
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
                  <Cell
                    label={columns.received}
                    value={formatCount(clinic.received, locale)}
                  />
                  <Cell
                    label={columns.median}
                    value={formatMinutes(clinic.medianMinutes, locale)}
                  />
                  <Cell
                    label={columns.withinSla}
                    value={formatPercent(clinic.withinSla, locale)}
                  />
                  <Cell
                    label={columns.throughput}
                    value={formatRate(clinic.medianMbPerSecond, locale)}
                    warn={isSlow(clinic.medianMbPerSecond)}
                  />
                  <Cell
                    label={columns.volume}
                    value={formatBytes(clinic.bytes, locale)}
                  />
                  <div className="min-w-0">
                    <dt className="text-tertiary">{columns.lastSent}</dt>
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
                    <span className="label-eyebrow">{columns.clinic}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{columns.received}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{columns.signed}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{columns.median}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{columns.withinSla}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{columns.throughput}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{columns.volume}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{columns.lastSent}</span>
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
                    <td>{formatCount(clinic.received, locale)}</td>
                    <td>{formatCount(clinic.signed, locale)}</td>
                    <td>{formatMinutes(clinic.medianMinutes, locale)}</td>
                    <td>{formatPercent(clinic.withinSla, locale)}</td>
                    <td
                      className={cn(
                        isSlow(clinic.medianMbPerSecond) && "text-progress",
                      )}
                    >
                      {formatRate(clinic.medianMbPerSecond, locale)}
                    </td>
                    <td>{formatBytes(clinic.bytes, locale)}</td>
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
function Radiologists({ data, t, locale }: { data: ControlAnalytics } & Lang) {
  const text = t.admin.activity;
  return (
    <Section
      title={text.byRadiologist}
      description={text.byRadiologistDescription}
      flush
    >
      {data.byRadiologist.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-tertiary">
          {text.noReport}
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
                  {formatCount(reader.signed, locale)}
                  <span className="ml-1 text-2xs font-normal text-tertiary">
                    {text.signed}
                  </span>
                </span>
                <span className="col-span-2 text-2xs text-tertiary tabular-nums sm:col-span-1 sm:w-44 sm:text-right">
                  {text.radiologistTimes(
                    formatMinutes(reader.medianMinutes, locale),
                    formatMinutes(reader.medianReadingMinutes, locale),
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
