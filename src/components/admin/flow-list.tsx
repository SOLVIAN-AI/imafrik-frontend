import { FlowTimeline } from "@/components/admin/flow-timeline";
import { RelativeTime } from "@/components/admin/relative-time";
import {
  type StudyStatus,
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { messagesFor } from "@/i18n";
import type { PipelineStudy } from "@/lib/data/control";
import { MISSING, formatBytes, formatCount, formatRate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { type SegmentKey, SEGMENT_STYLES, throughput } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { STUDY_STATUSES } from "@/lib/study-status";

/**
 * Liste des examens du flux d'images : clinique, débit, frise des étapes,
 * état, radiologue. Partagée par l'écran « Flux d'images » et la fiche
 * d'une clinique.
 *
 * Rendues au serveur : la langue de l'utilisateur arrive en propriété.
 */

/**
 * Légende des étapes.
 *
 * @param locale Langue de l'utilisateur.
 */
export function SegmentLegend({ locale }: { locale: Locale }) {
  const labels = messagesFor(locale).admin.stages.labels;
  const keys = Object.keys(SEGMENT_STYLES) as SegmentKey[];
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-2xs text-tertiary">
      {keys.map((key) => (
        <li key={key} className="flex items-center gap-1.5">
          <span
            className={cn("h-1.5 w-3 rounded-full", SEGMENT_STYLES[key].bar)}
            aria-hidden
          />
          {labels[key]}
        </li>
      ))}
    </ul>
  );
}

const isStatus = (status: string): status is StudyStatus =>
  (STUDY_STATUSES as readonly string[]).includes(status);

/**
 * Liste des examens, en lignes qui se replient sur téléphone.
 *
 * @param studies Examens à afficher.
 * @param locale  Langue de l'utilisateur.
 */
export function FlowList({
  studies,
  locale,
}: {
  studies: PipelineStudy[];
  locale: Locale;
}) {
  const t = messagesFor(locale).admin.shared;
  return (
    <ul className="divide-y divide-border-subtle">
      {studies.map((study) => {
        const rate = throughput(study);
        return (
          <li
            key={study.id}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-4 py-3",
              "lg:grid-cols-[minmax(0,13rem)_minmax(0,9rem)_minmax(0,1fr)_7rem_auto] lg:items-center",
              study.urgent && "rail-urgent",
            )}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm">
                <span className="truncate font-medium">{study.clinic}</span>
                {study.urgent && <UrgentMarker />}
              </p>
              <p className="truncate text-2xs text-tertiary">
                {study.modality ?? MISSING}
                {study.bodyPart && ` · ${study.bodyPart}`} ·{" "}
                {t.imageCount(
                  study.instanceCount,
                  formatCount(study.instanceCount, locale),
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 lg:order-last">
              {isStatus(study.status) ? (
                <StudyStatusChip status={study.status} />
              ) : (
                <span className="text-2xs text-tertiary">{study.status}</span>
              )}
              <RelativeTime
                date={study.receivedAt}
                className="text-2xs whitespace-nowrap text-tertiary"
              />
            </div>

            <div className="min-w-0 text-2xs tabular-nums lg:text-xs">
              <p
                className={cn(
                  "font-medium",
                  rate !== null && rate < 1 && "text-progress",
                )}
              >
                {formatRate(rate, locale)}
              </p>
              <p className="text-tertiary">
                {study.transferBytes !== null
                  ? formatBytes(study.transferBytes, locale)
                  : MISSING}
              </p>
            </div>

            <FlowTimeline flow={study} className="col-span-2 lg:col-span-1" />

            <p className="col-span-2 truncate text-2xs text-tertiary lg:col-span-1">
              {study.radiologist ?? t.unassigned}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
