import "server-only";

import { cache } from "react";

import type { StudyStatus } from "@/components/domain/study-status";
import { apiGet } from "@/lib/api/client";
import { metricsSchema } from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_STUDIES, DEMO_USER_ID } from "@/lib/demo/studies";
import { getSession } from "@/lib/session/server";

/**
 * Indicateurs du périmètre de l'utilisateur, calculés par le service.
 *
 * Ils remplacent les valeurs écrites en dur dans les écrans — compteurs
 * de navigation, délai moyen du tableau de bord — qui affichaient les
 * mêmes chiffres à tout le monde, quels que soient les examens réels.
 */
export interface Metrics {
  byStatus: Record<StudyStatus, number>;
  /** Urgences pas encore rendues. */
  urgentOpen: number;
  /** Examens en cours de lecture par l'utilisateur. */
  assignedToMe: number;
  receivedLast30Days: number;
  /** Délai médian réception → signature sur trente jours, en minutes. */
  medianTurnaroundMinutes: number | null;
  /** Comptes-rendus signés que la clinique n'a pas encore téléchargés. */
  reportsToDownload: number;
}

const STATUSES: StudyStatus[] = [
  "received",
  "assigned",
  "in_progress",
  "reported",
  "delivered",
];

/**
 * Indicateurs de l'utilisateur courant.
 *
 * Mis en cache pour la durée d'un rendu : la navigation et la page les
 * demandent toutes deux, un seul appel suffit.
 */
export const getMetrics = cache(async (): Promise<Metrics> => {
  if (isDemoMode()) return demoMetrics();

  const raw = await apiGet("/metrics/summary", metricsSchema);
  return {
    byStatus: Object.fromEntries(
      STATUSES.map((status) => [status, raw.by_status[status] ?? 0]),
    ) as Record<StudyStatus, number>,
    urgentOpen: raw.urgent_open,
    assignedToMe: raw.assigned_to_me,
    receivedLast30Days: raw.received_last_30_days,
    medianTurnaroundMinutes: raw.median_turnaround_minutes,
    reportsToDownload: raw.reports_to_download,
  };
});

/** Indicateurs calculés sur le jeu de démonstration, avec le même périmètre. */
async function demoMetrics(): Promise<Metrics> {
  const session = await getSession();
  const studies =
    session?.active?.organizationKind === "clinic"
      ? DEMO_STUDIES.filter(
          (study) => study.clinic === session.active?.organizationName,
        )
      : DEMO_STUDIES;

  const byStatus = Object.fromEntries(
    STATUSES.map((status) => [
      status,
      studies.filter((s) => s.status === status).length,
    ]),
  ) as Record<StudyStatus, number>;

  const turnarounds = studies
    .filter((study) => study.reportedAt)
    .map(
      (study) =>
        (study.reportedAt!.getTime() - study.receivedAt.getTime()) / 60_000,
    )
    .sort((a, b) => a - b);

  return {
    byStatus,
    urgentOpen: studies.filter(
      (s) =>
        s.urgent && ["received", "assigned", "in_progress"].includes(s.status),
    ).length,
    assignedToMe: studies.filter(
      (s) => s.assignedTo === DEMO_USER_ID && s.status === "in_progress",
    ).length,
    receivedLast30Days: studies.length,
    medianTurnaroundMinutes: turnarounds.length
      ? turnarounds[Math.floor(turnarounds.length / 2)]
      : null,
    reportsToDownload: byStatus.reported,
  };
}
