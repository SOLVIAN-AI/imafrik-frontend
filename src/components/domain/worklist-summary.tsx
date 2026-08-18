import { AlertTriangle, Clock, Inbox, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Une mesure affichée en tête de worklist.
 *
 * @property label   Ce que compte la mesure, en langage d'utilisateur.
 * @property value   La valeur, déjà formatée.
 * @property hint    Précision facultative — comparaison, seuil, unité.
 * @property icon    Repère visuel, secondaire au chiffre.
 * @property tone    Charge sémantique. `urgent` n'est employé que si la
 *                   valeur appelle réellement une action.
 */
export interface Metric {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "urgent" | "progress" | "accent";
}

const TONE_STYLES: Record<
  NonNullable<Metric["tone"]>,
  { icon: string; halo: string }
> = {
  neutral: { icon: "text-tertiary", halo: "bg-surface-active" },
  urgent: { icon: "text-urgent", halo: "bg-urgent-muted" },
  progress: { icon: "text-progress", halo: "bg-progress-muted" },
  accent: { icon: "text-accent", halo: "bg-accent-muted" },
};

/**
 * Bandeau de mesures, au-dessus de la liste.
 *
 * Il répond à la question qu'on se pose en arrivant le matin — combien,
 * de quoi, depuis quand — sans obliger à parcourir la liste. Sans lui,
 * l'écran s'ouvrait directement sur un tableau, ce qui donnait une page
 * sans point d'entrée.
 *
 * Les valeurs sont grandes et les libellés discrets : à cette échelle un
 * chiffre se lit d'un coup d'œil, ce qui est tout l'intérêt.
 */
export function WorklistSummary({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pb-4 lg:grid-cols-4">
      {metrics.map((metric) => {
        const tone = TONE_STYLES[metric.tone ?? "neutral"];

        return (
          <div
            key={metric.label}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-3",
              "border border-border-subtle bg-surface-raised shadow-raised",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                tone.halo,
              )}
              aria-hidden
            >
              <metric.icon className={cn("size-4", tone.icon)} />
            </span>

            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tracking-[-0.02em] tabular-nums">
                  {metric.value}
                </span>
                {metric.hint && (
                  <span className="truncate text-2xs text-tertiary">
                    {metric.hint}
                  </span>
                )}
              </div>
              <p className="label-eyebrow mt-0.5 truncate">{metric.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Icônes exposées pour composer un bandeau depuis un écran. */
export const METRIC_ICONS = {
  inbox: Inbox,
  urgent: AlertTriangle,
  writing: PenLine,
  wait: Clock,
} satisfies Record<string, LucideIcon>;
