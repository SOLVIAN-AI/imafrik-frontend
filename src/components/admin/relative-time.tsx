"use client";

import { formatAge } from "@/components/domain/study-age";
import { useNow } from "@/hooks/use-now";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Ancienneté d'un événement — « il y a 3 h » —, calculée côté client.
 *
 * Même règle que {@link StudyAge} : une durée relative calculée au rendu
 * serveur divergerait de celle du navigateur. La date absolue reste
 * accessible au survol et aux technologies d'assistance.
 *
 * @param date      Instant de l'événement.
 * @param staleAfterHours Au-delà, la durée passe en ambre — une sauvegarde
 *                  de plus de 26 heures, une clinique muette.
 */
export function RelativeTime({
  date,
  staleAfterHours,
  className,
}: {
  date: Date;
  staleAfterHours?: number;
  className?: string;
}) {
  const now = useNow();
  if (!now) return <time className={className} />;
  const stale =
    staleAfterHours !== undefined &&
    now - date.getTime() > staleAfterHours * 3_600_000;
  return (
    <time
      dateTime={date.toISOString()}
      title={formatDateTime(date)}
      className={cn(stale && "text-progress", className)}
    >
      il y a {formatAge(date, new Date(now))}
    </time>
  );
}
