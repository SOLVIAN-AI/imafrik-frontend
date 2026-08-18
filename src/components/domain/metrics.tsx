import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  Inbox,
  PenLine,
  Send,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Évolution d'une mesure par rapport à la période précédente.
 *
 * `good` est renseigné explicitement, et **ne se déduit pas du sens de la
 * variation** : un délai qui baisse est une bonne nouvelle, un volume qui
 * baisse en est une mauvaise. Colorer en vert tout ce qui monte est
 * l'erreur classique des tableaux de bord.
 */
export interface MetricTrend {
  value: string;
  direction: "up" | "down";
  good: boolean;
  /** Période de comparaison, par exemple « vs. semaine dernière ». */
  label: string;
}

/**
 * Une mesure affichée en tête d'écran.
 *
 * @property label   Ce que compte la mesure, en langage d'utilisateur.
 * @property value   La valeur, déjà formatée.
 * @property hint    Précision facultative — comparaison, seuil, unité.
 * @property icon    Repère visuel, secondaire au chiffre.
 * @property tone    Charge sémantique. `urgent` n'est employé que si la
 *                   valeur appelle réellement une action.
 * @property trend   Évolution, si elle éclaire la lecture.
 */
export interface Metric {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "urgent" | "progress" | "accent" | "done";
  trend?: MetricTrend;
}

/**
 * Habillage d'une mesure selon sa charge sémantique.
 *
 * L'anneau intérieur — un liseré d'un pixel de la teinte, très dilué —
 * détache la pastille de la carte. Sans lui, un aplat de couleur posé
 * sur une surface sombre paraît collé dessus plutôt que posé dedans.
 */
const TONE_STYLES: Record<
  NonNullable<Metric["tone"]>,
  { icon: string; halo: string }
> = {
  neutral: {
    icon: "text-tertiary",
    halo: "bg-surface-active ring-1 ring-border-default ring-inset",
  },
  urgent: {
    icon: "text-urgent",
    halo: "bg-urgent-muted ring-1 ring-urgent/20 ring-inset",
  },
  progress: {
    icon: "text-progress",
    halo: "bg-progress-muted ring-1 ring-progress/20 ring-inset",
  },
  accent: {
    icon: "text-accent",
    halo: "bg-accent-muted ring-1 ring-accent/25 ring-inset",
  },
  done: {
    icon: "text-done",
    halo: "bg-done-muted ring-1 ring-done/20 ring-inset",
  },
};

/**
 * Bandeau de mesures, au-dessus du contenu.
 *
 * Il répond à la question qu'on se pose en arrivant le matin — combien,
 * de quoi, depuis quand — sans obliger à parcourir les listes. Sans lui,
 * l'écran s'ouvre directement sur un tableau, ce qui donne une page sans
 * point d'entrée.
 *
 * Les valeurs sont grandes et les libellés discrets : à cette échelle un
 * chiffre se lit d'un coup d'œil, ce qui est tout l'intérêt.
 */
export function MetricGrid({
  metrics,
  className,
}: {
  metrics: Metric[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4",
        className,
      )}
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  );
}

/** Une mesure isolée. */
export function MetricCard({ metric }: { metric: Metric }) {
  const tone = TONE_STYLES[metric.tone ?? "neutral"];
  const TrendIcon =
    metric.trend?.direction === "down" ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-xl px-4 py-3.5",
        "border border-border-subtle bg-surface-raised shadow-raised",
        "transition-colors duration-150 hover:border-border-default",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          tone.halo,
        )}
        aria-hidden
      >
        <metric.icon className={cn("size-4.5", tone.icon)} />
      </span>

      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">
            {metric.value}
          </span>
          {metric.hint && (
            <span className="truncate text-2xs text-tertiary">
              {metric.hint}
            </span>
          )}
          {metric.trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-2xs font-medium",
                metric.trend.good ? "text-done" : "text-urgent",
              )}
              title={metric.trend.label}
            >
              <TrendIcon className="size-3" aria-hidden />
              {metric.trend.value}
            </span>
          )}
        </div>
        <p className="label-eyebrow mt-0.5 truncate">{metric.label}</p>
      </div>
    </div>
  );
}

/** Icônes exposées pour composer un bandeau depuis un écran. */
export const METRIC_ICONS = {
  inbox: Inbox,
  urgent: AlertTriangle,
  writing: PenLine,
  wait: Clock,
  sent: Send,
  ready: FileCheck,
  done: CheckCircle2,
} satisfies Record<string, LucideIcon>;
