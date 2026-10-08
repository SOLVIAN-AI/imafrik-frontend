"use client";

import { formatAge } from "@/components/domain/study-age";
import { useNow } from "@/hooks/use-now";
import { useLocale, useMessages } from "@/i18n/client";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Ancienneté d'un événement — « il y a 3 h », « 3 h ago » —, calculée
 * côté client, dans la langue de l'utilisateur.
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
  const locale = useLocale();
  const t = useMessages();
  if (!now) return <time className={className} />;
  const stale =
    staleAfterHours !== undefined &&
    now - date.getTime() > staleAfterHours * 3_600_000;
  return (
    <time
      dateTime={date.toISOString()}
      title={formatDateTime(date, locale)}
      className={cn(stale && "text-progress", className)}
    >
      {t.admin.shared.ago(formatAge(date, new Date(now), locale))}
    </time>
  );
}
