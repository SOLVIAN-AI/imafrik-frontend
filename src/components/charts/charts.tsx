import type * as React from "react";

import { messagesFor } from "@/i18n";
import { axisTicks, labelIndices } from "@/lib/charts";
import { formatPercent } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Graphiques de la tour de contrôle.
 *
 * Dessinés en SVG et en HTML, sans bibliothèque : quatre formes suffisent
 * à l'administration, et une bibliothèque de graphiques pèserait plus que
 * tout le reste de l'écran.
 *
 * Principes communs :
 * - les couleurs viennent des rôles du thème — un graphique suit le
 *   passage du sombre au clair sans rien changer ;
 * - les marques sont dessinées dans un SVG étiré (`preserveAspectRatio
 *   ="none"`), le texte en HTML par-dessus : les étiquettes ne se
 *   déforment jamais, quelle que soit la largeur ;
 * - chaque graphique porte un tableau de ses données, masqué à l'écran
 *   et lu par les lecteurs d'écran : une courbe ne se décrit pas ;
 * - tout texte qu'ils écrivent eux-mêmes — en-têtes, infobulles, jours —
 *   suit la langue reçue en propriété (`locale`) : les graphiques sont
 *   rendus au serveur comme au navigateur.
 */

/** Charge sémantique d'une série. */
export type Tone = "accent" | "urgent" | "progress" | "done" | "neutral";

const FILL: Record<Tone, string> = {
  accent: "var(--accent)",
  urgent: "var(--urgent)",
  progress: "var(--progress)",
  done: "var(--done)",
  neutral: "var(--text-tertiary)",
};

const DOT: Record<Tone, string> = {
  accent: "bg-accent",
  urgent: "bg-urgent",
  progress: "bg-progress",
  done: "bg-done",
  neutral: "bg-tertiary",
};

/** Légende : une pastille et un libellé par série. */
export function Legend({
  series,
  className,
}: {
  series: { label: string; tone: Tone }[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1 text-2xs text-tertiary",
        className,
      )}
    >
      {series.map((entry) => (
        <li key={entry.label} className="flex items-center gap-1.5">
          <span
            className={cn("size-2 rounded-full", DOT[entry.tone])}
            aria-hidden
          />
          {entry.label}
        </li>
      ))}
    </ul>
  );
}

/** Tableau des données, pour les lecteurs d'écran. */
function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  // L'enveloppe porte `sr-only`, pas le tableau : un tableau ignore la
  // largeur d'un pixel et s'étend à son contenu — vingt-cinq colonnes
  // suffisaient à faire défiler toute la page sur un téléphone.
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) => (
                <td key={column}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Axe des ordonnées, en HTML à gauche du tracé. */
function YAxis({
  scale,
  format,
}: {
  scale: number[];
  format: (value: number) => string;
}) {
  return (
    <div
      className="relative w-12 shrink-0 text-right text-2xs whitespace-nowrap text-tertiary tabular-nums"
      aria-hidden
    >
      {[...scale].reverse().map((tick, index, all) => (
        <span
          key={tick}
          className="absolute right-2 -translate-y-1/2"
          style={{ top: `${(index / (all.length - 1)) * 100}%` }}
        >
          {format(tick)}
        </span>
      ))}
    </div>
  );
}

/** Grille horizontale, alignée sur les graduations de l'axe. */
function Grid({ scale }: { scale: number[] }) {
  const max = scale.at(-1) || 1;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {scale.map((tick) => (
        <div
          key={tick}
          className="absolute inset-x-0 border-t border-dashed border-border-subtle"
          style={{ top: `${(1 - tick / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Densités d'étiquettes selon la largeur **du graphique** — pas de
 * l'écran : un même graphique occupe toute la largeur d'un téléphone, ou
 * le tiers d'un grand écran. Les requêtes de conteneur (`@container`
 * sur la figure) choisissent la bonne densité, sans mesure en JavaScript.
 */
const LABEL_DENSITIES = [
  { max: 3, className: "@sm:hidden" },
  { max: 5, className: "hidden @sm:block @xl:hidden" },
  { max: 8, className: "hidden @xl:block" },
] as const;

/** Étiquettes d'abscisse, sans chevauchement à aucune largeur. */
function XLabels({ labels }: { labels: string[] }) {
  return (
    <>
      {LABEL_DENSITIES.map((density) => {
        const shown = new Set(labelIndices(labels.length, density.max));
        return (
          <div
            key={density.max}
            className={cn(
              "relative mt-1.5 ml-12 h-4 text-2xs text-tertiary",
              density.className,
            )}
            aria-hidden
          >
            {labels.map((label, index) =>
              shown.has(index) ? (
                <span
                  key={index}
                  className={cn(
                    "absolute whitespace-nowrap",
                    // Les extrémités s'alignent sur le bord au lieu de
                    // déborder du graphique.
                    index === 0 && labels.length > 1
                      ? "translate-x-0"
                      : index === labels.length - 1 && labels.length > 1
                        ? "-translate-x-full"
                        : "-translate-x-1/2",
                  )}
                  style={{
                    left:
                      index === 0 && labels.length > 1
                        ? "0%"
                        : index === labels.length - 1 && labels.length > 1
                          ? "100%"
                          : `${((index + 0.5) / labels.length) * 100}%`,
                  }}
                >
                  {label}
                </span>
              ) : null,
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * Histogramme empilé, une barre par période.
 *
 * @param points  Une entrée par période : son libellé et une valeur par série.
 * @param series  Séries empilées, de bas en haut.
 * @param caption Titre lu par les lecteurs d'écran.
 * @param locale  Langue de l'utilisateur.
 */
export function StackedBars({
  points,
  series,
  caption,
  locale,
  height = 180,
  format = (value) => String(Math.round(value)),
}: {
  points: { label: string; values: number[] }[];
  series: { label: string; tone: Tone }[];
  caption: string;
  locale: Locale;
  height?: number;
  format?: (value: number) => string;
}) {
  const t = messagesFor(locale).admin.charts;
  const scale = axisTicks(
    Math.max(0, ...points.map((p) => p.values.reduce((a, b) => a + b, 0))),
  );
  const max = scale.at(-1) || 1;
  const width = Math.max(points.length, 1) * 10;

  return (
    <figure className="@container">
      <div className="flex" style={{ height }}>
        <YAxis scale={scale} format={format} />
        <div className="relative flex-1">
          <Grid scale={scale} />
          <svg
            viewBox={`0 0 ${width} 100`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden
          >
            {points.map((point, index) => {
              let base = 100;
              return point.values.map((value, serie) => {
                const h = (value / max) * 100;
                base -= h;
                return value > 0 ? (
                  <rect
                    key={`${index}-${serie}`}
                    x={index * 10 + 2}
                    y={base}
                    width={6}
                    height={h}
                    rx={0.8}
                    fill={FILL[series[serie].tone]}
                  >
                    <title>
                      {t.point(point.label, series[serie].label, format(value))}
                    </title>
                  </rect>
                ) : null;
              });
            })}
          </svg>
        </div>
      </div>
      <XLabels labels={points.map((p) => p.label)} />
      <DataTable
        caption={caption}
        headers={[t.period, ...series.map((s) => s.label)]}
        rows={points.map((p) => [p.label, ...p.values.map(format)])}
      />
    </figure>
  );
}

/**
 * Courbes, avec un seuil facultatif — l'engagement de délai, par exemple.
 *
 * Un point `null` interrompt la courbe : une journée sans examen n'a pas
 * de délai, et la relier à ses voisines inventerait une valeur.
 *
 * @param locale Langue de l'utilisateur.
 */
export function Lines({
  points,
  series,
  caption,
  locale,
  threshold,
  unit = "count",
  height = 180,
  format = (value) => String(Math.round(value)),
}: {
  points: { label: string; values: (number | null)[] }[];
  series: { label: string; tone: Tone; dashed?: boolean }[];
  caption: string;
  locale: Locale;
  threshold?: { value: number; label: string };
  /** Nature des valeurs : choisit des graduations rondes pour l'unité. */
  unit?: "count" | "minutes";
  height?: number;
  format?: (value: number) => string;
}) {
  const t = messagesFor(locale).admin.charts;
  const values = points.flatMap((p) =>
    p.values.filter((v): v is number => v !== null),
  );
  const scale = axisTicks(Math.max(0, threshold?.value ?? 0, ...values), unit);
  const max = scale.at(-1) || 1;
  const width = Math.max(points.length, 1) * 10;
  const x = (index: number) => index * 10 + 5;
  const y = (value: number) => 100 - (value / max) * 100;

  return (
    <figure className="@container">
      <div className="flex" style={{ height }}>
        <YAxis scale={scale} format={format} />
        <div className="relative flex-1">
          <Grid scale={scale} />
          <svg
            viewBox={`0 0 ${width} 100`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden
          >
            {threshold && (
              <line
                x1={0}
                x2={width}
                y1={y(threshold.value)}
                y2={y(threshold.value)}
                stroke="var(--urgent)"
                strokeWidth={1}
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                opacity={0.7}
              />
            )}
            {series.map((serie, s) => {
              // Une ligne par segment continu.
              const segments: string[][] = [[]];
              points.forEach((point, index) => {
                const value = point.values[s];
                if (value === null || value === undefined) {
                  if (segments.at(-1)!.length) segments.push([]);
                } else {
                  segments.at(-1)!.push(`${x(index)},${y(value)}`);
                }
              });
              return segments
                .filter((segment) => segment.length > 0)
                .map((segment, index) => (
                  <polyline
                    key={`${s}-${index}`}
                    points={segment.join(" ")}
                    fill="none"
                    stroke={FILL[serie.tone]}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={serie.dashed ? "5 4" : undefined}
                    vectorEffect="non-scaling-stroke"
                  />
                ));
            })}
          </svg>
          {threshold && (
            <span
              className="absolute right-0 -translate-y-full pb-0.5 text-2xs text-urgent"
              style={{ top: `${y(threshold.value)}%` }}
            >
              {threshold.label}
            </span>
          )}
        </div>
      </div>
      <XLabels labels={points.map((p) => p.label)} />
      <DataTable
        caption={caption}
        headers={[t.period, ...series.map((s) => s.label)]}
        rows={points.map((p) => [
          p.label,
          ...p.values.map((v) => (v === null ? "—" : format(v))),
        ])}
      />
    </figure>
  );
}

/**
 * Carte de chaleur jour × heure : quand les examens arrivent.
 *
 * Elle dit où placer les gardes de radiologues : un pic le lundi matin
 * ne se voit pas dans une moyenne quotidienne.
 *
 * @param cells  7 lignes (lundi → dimanche) de 24 valeurs (heure UTC).
 * @param locale Langue de l'utilisateur : noms des jours, heures.
 */
export function Heatmap({
  cells,
  caption,
  locale,
}: {
  cells: number[][];
  caption: string;
  locale: Locale;
}) {
  const t = messagesFor(locale).admin.charts;
  const days = t.weekdays;
  const max = Math.max(1, ...cells.flat());
  return (
    <figure className="overflow-x-auto">
      <div className="grid min-w-[36rem] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-0.5">
        <span />
        {Array.from({ length: 24 }, (_, hour) => (
          <span
            key={hour}
            className="text-center text-2xs text-tertiary tabular-nums"
            aria-hidden
          >
            {hour % 3 === 0 ? t.hour(hour) : ""}
          </span>
        ))}
        {cells.map((row, day) => (
          <div key={day} className="contents">
            <span className="self-center text-2xs text-tertiary">
              {days[day]}
            </span>
            {row.map((value, hour) => (
              <span
                key={hour}
                title={t.heatmapCell(days[day], t.hour(hour), value)}
                className="aspect-square rounded-[3px] bg-accent"
                style={{
                  opacity: value === 0 ? 0.06 : 0.15 + 0.85 * (value / max),
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <DataTable
        caption={caption}
        headers={[t.day, ...Array.from({ length: 24 }, (_, h) => t.hour(h))]}
        rows={cells.map((row, day) => [days[day], ...row])}
      />
    </figure>
  );
}

/**
 * Classement en barres horizontales — cliniques, radiologues, modalités.
 *
 * @param locale Langue de l'utilisateur, pour le message par défaut.
 * @param empty  Message sans donnée ; par défaut, « aucune donnée sur la
 *               période ».
 */
export function RankedBars({
  items,
  locale,
  tone = "accent",
  format = (value) => String(Math.round(value)),
  empty,
}: {
  items: { label: string; value: number; hint?: React.ReactNode }[];
  locale: Locale;
  tone?: Tone;
  format?: (value: number) => string;
  empty?: string;
}) {
  if (items.length === 0)
    return (
      <p className="py-6 text-center text-xs text-tertiary">
        {empty ?? messagesFor(locale).admin.charts.noData}
      </p>
    );
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li
          key={item.label}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
        >
          <span className="truncate text-xs text-secondary">{item.label}</span>
          <span className="text-xs font-medium tabular-nums">
            {format(item.value)}
            {item.hint && (
              <span className="ml-1.5 font-normal text-tertiary">
                {item.hint}
              </span>
            )}
          </span>
          <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-active">
            <span
              className={cn("block h-full rounded-full", DOT[tone])}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Anneau de proportion — part des examens rendus dans les délais, par exemple.
 *
 * @param value  Proportion entre 0 et 1, ou `null` sans donnée.
 * @param locale Langue de l'utilisateur, pour le libellé lu.
 */
export function Ring({
  value,
  label,
  locale,
  tone,
  size = 88,
  showLabel = true,
}: {
  value: number | null;
  label: string;
  locale: Locale;
  tone?: Tone;
  size?: number;
  /** Faux quand le libellé est déjà écrit à côté : il reste lu par l'`aria-label`. */
  showLabel?: boolean;
}) {
  const ratio = value ?? 0;
  const resolved: Tone =
    tone ??
    (value === null
      ? "neutral"
      : ratio >= 0.95
        ? "done"
        : ratio >= 0.8
          ? "progress"
          : "urgent");
  const radius = 15.9155; // circonférence de 100
  return (
    <figure className="flex shrink-0 items-center gap-3">
      <svg
        viewBox="0 0 36 36"
        width={size}
        height={size}
        role="img"
        aria-label={messagesFor(locale).admin.charts.ring(
          label,
          value === null ? null : formatPercent(ratio, locale),
        )}
      >
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="var(--surface-active)"
          strokeWidth="3.2"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={FILL[resolved]}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={`${ratio * 100} 100`}
          transform="rotate(-90 18 18)"
        />
        <text
          x="18"
          y="20.5"
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          fill="var(--text-primary)"
        >
          {value === null ? "—" : `${Math.round(ratio * 100)}%`}
        </text>
      </svg>
      {showLabel && (
        <figcaption className="text-xs text-secondary">{label}</figcaption>
      )}
    </figure>
  );
}

/** Petite courbe de tendance, dans une carte de mesure. */
export function Sparkline({
  values,
  tone = "accent",
  className,
}: {
  values: number[];
  tone?: Tone;
  className?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const step = 100 / (values.length - 1);
  const path = values
    .map((value, index) => `${index * step},${30 - (value / max) * 28}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
      aria-hidden
    >
      <polyline
        points={`0,30 ${path} 100,30`}
        fill={FILL[tone]}
        opacity={0.12}
        stroke="none"
      />
      <polyline
        points={path}
        fill="none"
        stroke={FILL[tone]}
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
