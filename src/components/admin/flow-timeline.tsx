"use client";

import { useNow } from "@/hooks/use-now";
import { formatMinutes } from "@/lib/format";
import { type FlowInstants, SEGMENT_STYLES, segments } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

/**
 * Frise d'un examen : une barre par étape, proportionnelle à sa durée.
 *
 * Calculée côté client, comme toute durée relative : l'étape en cours
 * court jusqu'à maintenant, et rayée pour se distinguer d'une étape
 * close. Le texte sous la barre donne le total et l'étape en cours, pour
 * qui ne lit pas les couleurs.
 */
export function FlowTimeline({
  flow,
  className,
}: {
  flow: FlowInstants;
  className?: string;
}) {
  const now = useNow();
  if (!now) return <div className={cn("h-8", className)} />;

  const parts = segments(flow, new Date(now));
  const total = parts.reduce((sum, part) => sum + part.minutes, 0);
  const ongoing = parts.find((part) => part.ongoing);
  const description = parts
    .map(
      (part) =>
        `${SEGMENT_STYLES[part.key].label} ${formatMinutes(part.minutes)}${part.ongoing ? " (en cours)" : ""}`,
    )
    .join(", ");

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className="flex h-2 gap-px overflow-hidden rounded-full bg-surface-active"
        role="img"
        aria-label={description}
        title={description}
      >
        {parts.map((part) => (
          <span
            key={part.key}
            className={cn(
              "h-full min-w-[3px]",
              SEGMENT_STYLES[part.key].bar,
              part.ongoing &&
                "bg-[length:6px_6px] bg-[linear-gradient(135deg,transparent_25%,rgb(255_255_255/0.35)_25%,rgb(255_255_255/0.35)_50%,transparent_50%,transparent_75%,rgb(255_255_255/0.35)_75%)]",
            )}
            style={{
              flexGrow: total > 0 ? part.minutes / total : 1,
              flexBasis: 0,
            }}
          />
        ))}
      </div>
      <p className="mt-1 truncate text-2xs text-tertiary tabular-nums">
        {formatMinutes(total)}
        {ongoing && (
          <>
            {" · "}
            <span className={ongoing.key === "queue" ? "text-progress" : ""}>
              {SEGMENT_STYLES[ongoing.key].label.toLowerCase()} en cours
            </span>
          </>
        )}
      </p>
    </div>
  );
}
