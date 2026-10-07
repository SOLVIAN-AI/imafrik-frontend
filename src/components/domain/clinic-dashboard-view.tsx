"use client";

import { ArrowRight, Upload } from "lucide-react";
import Link from "next/link";

import { DateTime } from "@/components/domain/date-time";
import { DownloadPdfButton } from "@/components/domain/download-pdf-button";
import {
  METRIC_ICONS,
  MetricGrid,
  type Metric,
} from "@/components/domain/metrics";
import { StudyAge } from "@/components/domain/study-age";
import { StudyStatusChip } from "@/components/domain/study-status";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import type { Metrics } from "@/lib/data/metrics";
import type { Study } from "@/lib/data/studies";
import { formatDuration, formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Mesures du tableau de bord d'une clinique.
 *
 * Elles ne comptent pas la même chose que celles du radiologue. Une
 * clinique se demande ce qu'elle a envoyé, ce qui revient, et si le délai
 * habituel est tenu. Toutes viennent du service ; aucune n'est estimée ici.
 */
function buildMetrics(metrics: Metrics): Metric[] {
  const inReading = metrics.byStatus.assigned + metrics.byStatus.in_progress;
  return [
    {
      label: "Envoyés sur 30 jours",
      value: String(metrics.receivedLast30Days),
      icon: METRIC_ICONS.sent,
      tone: "neutral",
    },
    {
      label: "En cours de lecture",
      value: String(inReading),
      icon: METRIC_ICONS.writing,
      tone: "progress",
    },
    {
      label: "Comptes-rendus prêts",
      value: String(metrics.reportsToDownload),
      hint: metrics.reportsToDownload > 0 ? "à télécharger" : undefined,
      icon: METRIC_ICONS.ready,
      tone: metrics.reportsToDownload > 0 ? "accent" : "neutral",
    },
    {
      label: "Délai médian sur 30 jours",
      value:
        metrics.medianTurnaroundMinutes === null
          ? "—"
          : formatDuration(metrics.medianTurnaroundMinutes),
      hint: "de la réception à la signature",
      icon: METRIC_ICONS.wait,
      tone: "done",
    },
  ];
}

/**
 * Tableau de bord de la clinique.
 *
 * @param recent  Derniers examens envoyés.
 * @param ready   Comptes-rendus signés pas encore téléchargés.
 * @param metrics Indicateurs calculés par le service.
 */
export function ClinicDashboardView({
  recent,
  ready,
  metrics,
}: {
  recent: Study[];
  ready: Study[];
  metrics: Metrics;
}) {
  const { active } = useSession();

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={[active.organizationName, active.city]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Button size="sm" asChild>
            <Link href="/envoyer">
              <Upload />
              Envoyer un examen
            </Link>
          </Button>
        }
      />

      <MetricGrid
        metrics={buildMetrics(metrics)}
        className="px-4 pb-4 sm:px-6"
      />

      {/* `items-start` : les deux panneaux prennent la hauteur de leur
          contenu. Étirés sur toute la fenêtre, ils laisseraient de larges
          zones vides qui donnent à l'écran un air inachevé. */}
      <div className="grid min-h-0 flex-1 items-start gap-4 overflow-auto px-4 pb-6 sm:px-6 lg:grid-cols-3">
        {/* Ce qui appelle une action occupe la place principale. */}
        <Panel className="flex flex-col overflow-hidden lg:col-span-2">
          <SectionTitle
            title="Comptes-rendus à télécharger"
            action={{ label: "Tout voir", href: "/comptes-rendus" }}
          />

          {ready.length === 0 ? (
            <EmptyRow>Aucun compte-rendu en attente de récupération.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {ready.map((study) => (
                <li
                  key={study.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Link
                    href={`/comptes-rendus/${study.reportId}`}
                    className="min-w-0 flex-1 rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <p className="truncate text-sm font-medium">
                      {formatPatientName(study.patientName)}
                    </p>
                    <p className="truncate text-2xs text-tertiary">
                      {study.modality}
                      {study.bodyPart && ` ${study.bodyPart}`}, signé par{" "}
                      {study.reportedBy ?? "—"}
                      {study.reportedAt && (
                        <>
                          {" · "}
                          <DateTime date={study.reportedAt} />
                        </>
                      )}
                    </p>
                  </Link>
                  <DownloadPdfButton reportId={study.reportId} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Ce qui n'appelle que de la patience tient dans une colonne. */}
        <Panel className="flex flex-col overflow-hidden">
          <SectionTitle
            title="Derniers examens envoyés"
            action={{ label: "Tout voir", href: "/examens" }}
          />

          {recent.length === 0 ? (
            <EmptyRow>Aucun examen envoyé pour le moment.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {recent.map((study) => (
                <li key={study.id}>
                  <Link
                    href={`/examens/${study.id}`}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-2.5 text-left",
                      "transition-colors hover:bg-surface-hover",
                      "focus-visible:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {formatPatientName(study.patientName)}
                      </p>
                      <p className="truncate text-2xs text-tertiary">
                        {study.modality}
                        {study.bodyPart && ` · ${study.bodyPart}`}
                      </p>
                    </div>
                    <StudyStatusChip status={study.status} />
                    <StudyAge
                      date={study.receivedAt}
                      muted={study.status === "delivered"}
                      className="w-10 shrink-0 text-right text-2xs tabular-nums"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

/** En-tête d'un panneau, avec son lien de sortie. */
function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-4">
      <h2 className="label-eyebrow">{title}</h2>
      {action && (
        <Link
          href={action.href}
          className="-my-1.5 flex items-center gap-1 py-1.5 text-2xs text-tertiary transition-colors hover:text-accent"
        >
          {action.label}
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Message d'un panneau sans contenu. */
function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-8 text-center text-xs text-tertiary">{children}</p>
  );
}
