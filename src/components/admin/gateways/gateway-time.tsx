"use client";

import { RelativeTime } from "@/components/admin/relative-time";
import { useNow } from "@/hooks/use-now";
import { useLocale, useMessages } from "@/i18n/client";
import { formatDate } from "@/lib/format";
import { SILENCE_MINUTES, heartbeatFreshness } from "@/lib/gateways";
import { cn } from "@/lib/utils";

/** Seuil d'alerte d'une échéance de certificat, en jours : celui du service. */
const EXPIRY_ALERT_DAYS = 14;

/**
 * Échéance d'un certificat, en ambre à moins de quatorze jours, en rouge
 * une fois passée.
 *
 * Calculée côté client, comme toute durée relative : le rendu serveur
 * n'a pas la même horloge que le navigateur.
 *
 * @param notAfter Fin de validité.
 */
export function CertificateExpiry({
  notAfter,
  className,
}: {
  notAfter: Date;
  className?: string;
}) {
  const now = useNow();
  const locale = useLocale();
  if (!now) return <time className={className} />;
  const daysLeft = (notAfter.getTime() - now) / 86_400_000;
  return (
    <time
      dateTime={notAfter.toISOString()}
      className={cn(
        daysLeft <= 0
          ? "text-urgent"
          : daysLeft < EXPIRY_ALERT_DAYS && "text-progress",
        className,
      )}
    >
      {formatDate(notAfter, locale)}
    </time>
  );
}

/**
 * Dernier signe de vie d'une passerelle : son ancienneté, en ambre au-delà
 * de trente minutes ; ou son absence, dite en clair.
 *
 * @param lastHeartbeat Dernier signe de vie, ou `null`.
 * @param legacy        Passerelle reprise : sans le nouveau kit, elle n'en
 *                      envoie pas, et ce n'est pas une panne.
 */
export function HeartbeatAge({
  lastHeartbeat,
  legacy,
  className,
}: {
  lastHeartbeat: Date | null;
  legacy: boolean;
  className?: string;
}) {
  const text = useMessages().gateways;
  const now = useNow();
  if (!lastHeartbeat) {
    return (
      <span className={cn("text-tertiary", className)}>
        {legacy ? text.legacyNoHeartbeat : text.neverHeard}
      </span>
    );
  }
  const stale = now
    ? heartbeatFreshness(lastHeartbeat, now) === "stale"
    : false;
  return (
    <RelativeTime
      date={lastHeartbeat}
      staleAfterHours={SILENCE_MINUTES / 60}
      className={cn(stale && "font-medium", className)}
    />
  );
}
