"use client";

import { Activity, ArrowDown, ArrowUp, ArrowUpDown, Minus } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { InfoTip, type InfoTipContent } from "@/components/ui/info-tip";
import { useLocale, useMessages } from "@/i18n/client";
import { formatCount, formatMinutes, formatPercent } from "@/lib/format";
import {
  MEDIAN_TREND_THRESHOLD,
  type PerformanceMonth,
  type PerformanceSortKey,
  type RadiologistPerformance,
  SLA_TREND_THRESHOLD,
  type SortDirection,
  type Trend,
  defaultDirection,
  sortPerformance,
  trendOf,
} from "@/lib/performance";
import { cn } from "@/lib/utils";

/**
 * Performances par radiologue sur un mois, en un tableau triable.
 *
 * Une ligne par radiologue ; rangé d'abord par délai médian, du plus court
 * au plus long. Chaque intitulé de colonne trie : un premier clic dans le
 * sens qui se lit naturellement (un délai du plus court, un volume du plus
 * grand), un second dans l'autre. Une ligne sans donnée pour la colonne
 * reste en bas.
 *
 * Le délai médian et la part dans les délais portent leur tendance par
 * rapport au mois précédent : une flèche, l'écart, et une phrase pour les
 * lecteurs d'écran.
 *
 * Chaque indicateur se dit en une phrase, dans la bulle ⓘ de son
 * intitulé, à côté du bouton de tri (un clic sur ⓘ ne trie pas) ; la
 * bulle renvoie au glossaire quand il en dit davantage. Les flèches de
 * tendance s'expliquent dans la bulle du titre de la section
 * (`info.trend`, posée par l'écran). Un mois sans activité le dit, et un
 * mois sans acte signé explique pourquoi ses délais sont vides (c'est le
 * cas tant qu'aucun radiologue n'est habilité).
 *
 * Le même tableau pour le responsable de la clinique et pour l'équipe
 * IMAFRIK ; un radiologue n'y a jamais accès.
 *
 * @param performance Les performances du mois, rangées par le service.
 * @param highlight   Radiologue à mettre en évidence (son profil), depuis
 *                    sa ligne dans « Comptes » : sa ligne est marquée et
 *                    amenée à l'écran.
 */
export function PerformanceTable({
  performance,
  highlight,
}: {
  performance: PerformanceMonth;
  highlight?: string;
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.clinic.activity.performance;
  const columns = text.columns;
  const [sort, setSort] = React.useState<{
    key: PerformanceSortKey;
    direction: SortDirection;
  }>({ key: "median", direction: "ascending" });
  const rows = React.useMemo(
    () =>
      sortPerformance(
        performance.radiologists,
        sort.key,
        sort.direction,
        locale,
      ),
    [performance.radiologists, sort, locale],
  );

  const minutes = (value: number | null) => formatMinutes(value, locale);
  const percent = (value: number | null) => formatPercent(value, locale);
  const count = (value: number) => formatCount(value, locale);
  const info = text.info;
  const measures = t.common.measures;
  // Ce que mesure chaque colonne : la bulle de son intitulé.
  const median: InfoTipContent = {
    text: measures.median,
    term: "delaiMedian",
  };
  const mean: InfoTipContent = { text: measures.mean };
  const p90: InfoTipContent = { text: measures.p90, term: "centile90" };
  const withinSla: InfoTipContent = {
    text: measures.withinSla(
      minutes(performance.slaRoutineMinutes),
      minutes(performance.slaUrgentMinutes),
    ),
    term: "delaiPromis",
  };

  if (performance.radiologists.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title={text.emptyTitle}
        detail={text.emptyDetail}
      />
    );
  }
  const signedTotal = performance.radiologists.reduce(
    (total, row) => total + row.signedRoutine + row.signedUrgent,
    0,
  );

  const header = (
    key: PerformanceSortKey,
    label: string,
    options: { info?: InfoTipContent; rowSpan?: number; first?: boolean } = {},
  ) => {
    const active = sort.key === key;
    const Icon = active
      ? sort.direction === "ascending"
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;
    return (
      <th
        scope="col"
        rowSpan={options.rowSpan}
        aria-sort={active ? sort.direction : "none"}
        className={cn(
          "h-9 border-b border-border-subtle px-3 align-bottom font-medium",
          options.first
            ? "sticky left-0 z-10 bg-surface-raised text-left"
            : "text-right",
        )}
      >
        {/* La bulle à côté du bouton de tri, jamais dedans : un clic sur
            ⓘ explique la colonne sans la trier. */}
        <span className="inline-flex items-center">
          <button
            type="button"
            onClick={() =>
              setSort((current) => ({
                key,
                direction:
                  current.key === key
                    ? current.direction === "ascending"
                      ? "descending"
                      : "ascending"
                    : defaultDirection(key),
              }))
            }
            aria-label={text.sortBy(label)}
            className={cn(
              "inline-flex items-center gap-1 rounded py-1 whitespace-nowrap transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
              active ? "text-primary" : "text-tertiary",
            )}
          >
            <span className="label-eyebrow">{label}</span>
            <Icon className="size-3 shrink-0" aria-hidden />
          </button>
          {options.info && <InfoTip label={label} {...options.info} />}
        </span>
      </th>
    );
  };

  const group = (label: string, span: number) => (
    <th
      scope="colgroup"
      colSpan={span}
      className="h-8 border-b border-border-subtle px-3 text-center text-2xs font-medium text-tertiary"
    >
      {label}
    </th>
  );

  return (
    <div className="flex flex-col">
      {signedTotal === 0 && (
        <p
          role="status"
          className="border-b border-border-subtle bg-progress-muted px-4 py-2.5 text-xs leading-relaxed text-progress"
        >
          {text.noSigned}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[72rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {header("name", columns.name, { rowSpan: 2, first: true })}
              {header("signed", columns.signed, {
                rowSpan: 2,
                info: { text: info.signed },
              })}
              {group(text.groups.overall, 2)}
              {group(text.groups.routine, 4)}
              {group(text.groups.urgent, 4)}
              {group(text.groups.workflow, 2)}
              {group(text.groups.month, 2)}
              {header("open", columns.open, {
                rowSpan: 2,
                info: { text: info.open },
              })}
            </tr>
            <tr>
              {header("median", columns.median, { info: median })}
              {header("withinSla", columns.withinSla, { info: withinSla })}
              {header("routineMedian", columns.routineMedian, {
                info: median,
              })}
              {header("routineMean", columns.routineMean, { info: mean })}
              {header("routineP90", columns.routineP90, { info: p90 })}
              {header("routineWithinSla", columns.routineWithinSla, {
                info: withinSla,
              })}
              {header("urgentMedian", columns.urgentMedian, { info: median })}
              {header("urgentMean", columns.urgentMean, { info: mean })}
              {header("urgentP90", columns.urgentP90, { info: p90 })}
              {header("urgentWithinSla", columns.urgentWithinSla, {
                info: withinSla,
              })}
              {header("pickup", columns.pickup, {
                info: { text: info.pickup, term: "priseEnCharge" },
              })}
              {header("reading", columns.reading, {
                info: { text: info.reading, term: "dureeLecture" },
              })}
              {header("released", columns.released, {
                info: { text: info.released },
              })}
              {header("urgentClaimed", columns.urgentClaimed, {
                info: { text: info.urgentClaimed },
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                highlighted={row.id === highlight}
                minutes={minutes}
                percent={percent}
                count={count}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Une ligne du tableau. */
function Row({
  row,
  highlighted,
  minutes,
  percent,
  count,
}: {
  row: RadiologistPerformance;
  highlighted: boolean;
  minutes: (value: number | null) => string;
  percent: (value: number | null) => string;
  count: (value: number) => string;
}) {
  const t = useMessages();
  const text = t.clinic.activity.performance;
  const locale = useLocale();
  const signed = row.signedRoutine + row.signedUrgent;
  const medianTrend = trendOf(
    row.medianMinutes,
    row.previousMedianMinutes,
    true,
    MEDIAN_TREND_THRESHOLD,
  );
  const slaTrend = trendOf(
    row.withinSla,
    row.previousWithinSla,
    false,
    SLA_TREND_THRESHOLD,
  );
  // Le radiologue désigné : sa ligne est amenée à l'écran à l'arrivée.
  const ref = React.useRef<HTMLTableRowElement>(null);
  React.useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: "center" });
  }, [highlighted]);
  return (
    <tr
      ref={ref}
      aria-current={highlighted ? "true" : undefined}
      className={cn(
        "[&>td]:h-11 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-3 [&>td]:text-right [&>td]:tabular-nums",
        highlighted && "bg-accent-muted",
      )}
    >
      <th
        scope="row"
        className={cn(
          "sticky left-0 z-10 h-11 border-b border-border-subtle px-3 text-left font-medium whitespace-nowrap",
          // Fond plein : la colonne reste fixe quand le tableau défile.
          highlighted
            ? "border-l-2 border-l-accent bg-surface-raised text-accent"
            : "bg-surface-raised",
        )}
      >
        {row.name}
      </th>
      <td>
        {count(signed)}
        {row.signedUrgent > 0 && (
          <span className="block text-2xs text-tertiary">
            {text.urgentShare(row.signedUrgent)}
          </span>
        )}
      </td>
      <td className="font-medium">
        {minutes(row.medianMinutes)}
        <TrendMark
          trend={medianTrend}
          value={medianTrend ? formatMinutes(medianTrend.delta, locale) : ""}
        />
      </td>
      <td>
        {percent(row.withinSla)}
        <TrendMark
          trend={slaTrend}
          value={
            slaTrend
              ? text.points(String(Math.round(slaTrend.delta * 100)))
              : ""
          }
        />
      </td>
      <td>{minutes(row.routine.medianMinutes)}</td>
      <td className="text-secondary">{minutes(row.routine.meanMinutes)}</td>
      <td className="text-secondary">{minutes(row.routine.p90Minutes)}</td>
      <td>{percent(row.routine.withinSla)}</td>
      <td>{minutes(row.urgent.medianMinutes)}</td>
      <td className="text-secondary">{minutes(row.urgent.meanMinutes)}</td>
      <td className="text-secondary">{minutes(row.urgent.p90Minutes)}</td>
      <td>{percent(row.urgent.withinSla)}</td>
      <td>{minutes(row.pickupMinutes)}</td>
      <td>{minutes(row.readingMinutes)}</td>
      <td className={cn(row.released > 0 && "text-progress")}>
        {count(row.released)}
      </td>
      <td>{count(row.urgentClaimed)}</td>
      <td>
        <span title={text.open(row.assignedWaiting, row.inReading)}>
          {count(row.assignedWaiting)} · {count(row.inReading)}
        </span>
        <span className="sr-only">
          {text.open(row.assignedWaiting, row.inReading)}
        </span>
      </td>
    </tr>
  );
}

/**
 * Tendance d'une mesure : flèche et écart, une phrase pour les lecteurs
 * d'écran. Rien sans mois précédent comparable.
 */
function TrendMark({ trend, value }: { trend: Trend | null; value: string }) {
  const t = useMessages();
  const text = t.clinic.activity.performance.trend;
  if (trend === null) return null;
  const label =
    trend.direction === "same"
      ? text.same
      : trend.direction === "better"
        ? text.better(value)
        : text.worse(value);
  const Icon =
    trend.direction === "same" ? Minus : trend.rising ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "flex items-center justify-end gap-0.5 text-2xs font-normal",
        trend.direction === "better" && "text-done",
        trend.direction === "worse" && "text-progress",
        trend.direction === "same" && "text-tertiary",
      )}
      title={label}
    >
      <Icon className="size-3" aria-hidden />
      {trend.direction !== "same" && <span aria-hidden>{value}</span>}
      <span className="sr-only">{label}</span>
    </span>
  );
}
