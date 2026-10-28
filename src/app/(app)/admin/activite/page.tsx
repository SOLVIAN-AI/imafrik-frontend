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
import { MonthNav } from "@/components/domain/month-nav";
import { PerformanceTable } from "@/components/domain/performance-table";
import { PageHeader } from "@/components/layout/app-shell";
import {
  ANALYTICS_PERIODS,
  parseClinic,
  parseMonth,
  parsePeriod,
} from "@/lib/admin-params";
import { chunk, weightedMean } from "@/lib/charts";
import { getNetworkPerformance } from "@/lib/data/activity";
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
  formatMonth,
  formatPercent,
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

/** Rubriques de l'écran, telles que l'adresse les nomme (`?onglet=`). */
const TABS = ["ensemble", "radiologues", "cliniques"] as const;
type Tab = (typeof TABS)[number];

/** La rubrique demandée ; la vue d'ensemble à défaut. */
function parseTab(value: string | string[] | undefined): Tab {
  return TABS.find((tab) => tab === value) ?? "ensemble";
}

/**
 * Activité de la plateforme sur une période.
 *
 * Trois rubriques, à un clic dès l'en-tête, chacune à son adresse
 * (`?onglet=`) : la **vue d'ensemble** (volumes, délais et leur
 * décomposition par étape, heures d'arrivée, modalités), les
 * **performances par radiologue** d'un mois (`?mois=`, et `?radiologue=`
 * pour en désigner un, depuis sa ligne dans « Comptes »), et l'activité
 * **par clinique**. La facturation a son écran, à côté. Période, mois et
 * clinique vivent dans l'adresse : une vue se partage telle quelle.
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
  const month = parseMonth(params.mois);
  const current = parseMonth(undefined);
  const tab = parseTab(params.onglet);
  const radiologistId =
    typeof params.radiologue === "string" ? params.radiologue : undefined;
  // Chaque rubrique ne lit que ce qu'elle montre.
  const [data, performance] = await Promise.all([
    tab === "radiologues" ? null : getAnalytics(days, clinicId),
    tab === "radiologues" ? getNetworkPerformance(month, clinicId) : null,
  ]);
  const clinicName = clinics.find((clinic) => clinic.id === clinicId)?.name;

  /** Adresse de l'écran, rubrique, période, clinique et mois gardés. */
  const href = (
    changes: { tab?: Tab; period?: number; everyone?: boolean } = {},
  ) => {
    const target = changes.tab ?? tab;
    const query = new URLSearchParams();
    if (target !== "ensemble") query.set("onglet", target);
    query.set("jours", String(changes.period ?? days));
    if (clinicId) query.set("clinique", clinicId);
    if (month !== current) query.set("mois", month);
    if (target === "radiologues" && radiologistId && !changes.everyone)
      query.set("radiologue", radiologistId);
    return `/admin/activite?${query}`;
  };
  // Le mois des performances garde la rubrique, la période et la clinique.
  const monthQuery: Record<string, string> = {
    onglet: "radiologues",
    jours: String(days),
  };
  if (clinicId) monthQuery.clinique = clinicId;
  if (radiologistId) monthQuery.radiologue = radiologistId;
  const focused = performance?.radiologists.find(
    (row) => row.id === radiologistId,
  );

  return (
    <>
      <PageHeader
        title={t.nav.items.analytics}
        description={
          tab === "radiologues"
            ? `${clinicName ?? t.admin.shared.wholeNetwork} · ${formatMonth(month, locale)}`
            : text.description(clinicName ?? t.admin.shared.wholeNetwork, days)
        }
        actions={
          <>
            {tab === "radiologues" ? (
              <MonthNav
                month={month}
                current={current}
                path="/admin/activite"
                query={monthQuery}
                locale={locale}
                labels={t.clinic.activity}
              />
            ) : (
              <Segmented
                label={text.period}
                options={ANALYTICS_PERIODS.map((period) => ({
                  label:
                    period === 365
                      ? t.common.units.years(1)
                      : `${period} ${t.common.units.day}`,
                  href: href({ period }),
                  active: period === days,
                }))}
              />
            )}
            <ClinicFilter clinics={clinics} />
          </>
        }
      />

      {/* Les rubriques, à un clic : la facturation a son écran. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-4 sm:px-6">
        <Segmented
          label={text.tabs.label}
          options={TABS.map((key) => ({
            label: text.tabs[key],
            href: href({ tab: key }),
            active: key === tab,
          }))}
        />
        <Link
          href={`/admin/facturation?mois=${month}`}
          className="flex min-h-6 items-center gap-1 text-xs text-tertiary transition-colors hover:text-accent"
        >
          {text.tabs.billing}
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <ControlBody>
        {data && tab === "ensemble" && (
          <>
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
          </>
        )}

        {data && tab === "cliniques" && (
          <Clinics data={data} days={days} {...lang} />
        )}

        {performance && (
          <Section
            title={
              focused
                ? text.focus(focused.name)
                : t.clinic.activity.performance.title
            }
            description={`${formatMonth(month, locale)} · ${
              clinicName ?? t.admin.shared.wholeNetwork
            } · ${t.clinic.activity.performance.description}`}
            action={
              radiologistId
                ? { label: text.seeAll, href: href({ everyone: true }) }
                : undefined
            }
            flush
          >
            {radiologistId && !focused && (
              <p className="border-b border-border-subtle px-4 py-3 text-xs text-secondary">
                {text.focusNone}
              </p>
            )}
            <PerformanceTable
              performance={performance}
              highlight={radiologistId}
            />
          </Section>
        )}
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
              {/* Sur le fond de l'étape la plus longue, le gris tertiaire
                  manque de contraste en thème sombre : texte secondaire. */}
              <p
                className={cn(
                  "flex items-center gap-1 text-2xs",
                  isSlowest ? "text-secondary" : "text-tertiary",
                )}
              >
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
                className={cn(
                  "truncate text-2xs",
                  isSlowest ? "text-secondary" : "text-tertiary",
                )}
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
