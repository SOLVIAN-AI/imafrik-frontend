import { AlertTriangle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

import { Figure } from "@/components/admin/control-ui";
import { DepositStateBadge } from "@/components/deposits/deposit-state";
import { ReportRefresh } from "@/components/deposits/report-refresh";
import { DateTime } from "@/components/domain/date-time";
import { Panel } from "@/components/layout/app-shell";
import { ColumnLabel, InfoTip } from "@/components/ui/info-tip";
import type { AppMessages } from "@/i18n";
import type {
  DepositReport as Report,
  DepositStudy,
} from "@/lib/data/deposits";
import { awaitsIntegration, groupIgnored } from "@/lib/deposits";
import {
  formatBytes,
  formatCount,
  formatDate,
  formatPatientName,
  MISSING,
} from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Le compte rendu d'un dépôt : ce que l'archive a donné.
 *
 * En tête, où en est le dépôt, et ce qu'il faut faire s'il le faut :
 * reprendre un envoi interrompu, recréer une archive refusée. Puis les
 * nombres (examens, séries, images transmises, doublons, fichiers
 * ignorés, chacun expliqué dans sa bulle), les examens trouvés avec un
 * lien vers chacun une fois intégré, et les fichiers ignorés, regroupés
 * par raison, avec ce qu'elle veut dire.
 *
 * La page se relit d'elle-même tant qu'elle attend le contrôle de
 * l'archive ou l'intégration d'un examen.
 *
 * @param report     Le compte rendu.
 * @param t          Textes de l'application.
 * @param locale     Langue de l'utilisateur.
 * @param backHref   Retour à la liste.
 * @param studyHref  Adresse d'un examen de la clinique.
 * @param team       `true` dans la console.
 */
export function DepositReportView({
  report,
  t,
  locale,
  backHref,
  studyHref,
  team,
}: {
  report: Report;
  t: AppMessages;
  locale: Locale;
  backHref: string;
  studyHref: (studyId: string) => string;
  team: boolean;
}) {
  const text = t.deposits.report;
  const author =
    report.onBehalf && !report.authorName
      ? t.deposits.list.teamAuthor
      : (report.authorName ?? MISSING);
  const accepted = report.studies.filter(
    (study) =>
      study.accepted && study.instancesCount + study.duplicatesCount > 0,
  );
  const refused = report.studies.filter((study) => !study.accepted);
  const awaitingIntegration = awaitsIntegration(report);
  const refresh =
    report.status === "received" ||
    report.status === "processing" ||
    awaitingIntegration;
  const groups = groupIgnored(report.ignored);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 sm:px-6 [&>*]:shrink-0">
      {refresh && <ReportRefresh />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex min-h-6 items-center gap-1 text-xs text-secondary hover:text-primary"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          {team ? text.teamBack : text.back}
        </Link>
        <DepositStateBadge state={report.state} t={t} />
      </div>

      <p className="text-xs text-tertiary">
        {text.meta(
          formatDate(report.createdAt, locale),
          author,
          formatBytes(report.sizeBytes, locale),
        )}
        {team && ` · ${report.clinicName}`}
        {report.entriesCount > 0 && ` · ${text.entries(report.entriesCount)}`}
      </p>

      <StatusCallout report={report} t={t} locale={locale} />

      {report.status === "done" && (
        <>
          <Panel className="p-4">
            <h2 className="label-eyebrow mb-3">{text.summary}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Figure
                label={text.figures.studies}
                value={formatCount(report.studiesCount, locale)}
                info={{ text: text.tips.studies, term: "examen" }}
                tone={report.studiesCount > 0 ? "done" : undefined}
              />
              <Figure
                label={text.figures.series}
                value={formatCount(report.seriesCount, locale)}
                info={{ text: text.tips.series }}
              />
              <Figure
                label={text.figures.instances}
                value={formatCount(report.instancesCount, locale)}
                info={{ text: text.tips.instances }}
              />
              <Figure
                label={text.figures.duplicates}
                value={formatCount(report.duplicatesCount, locale)}
                info={{ text: text.tips.duplicates, term: "doublon" }}
              />
              <Figure
                label={text.figures.ignored}
                value={formatCount(report.ignoredCount, locale)}
                info={{ text: text.tips.ignored, term: "fichierIgnore" }}
                tone={report.ignoredCount > 0 ? "progress" : undefined}
              />
            </div>
            {report.studiesCount === 0 && (
              <p className="mt-3 text-xs text-urgent">{text.nothingAccepted}</p>
            )}
          </Panel>

          {report.studies.length > 0 && (
            <Panel className="overflow-hidden">
              <h2 className="label-eyebrow flex h-11 items-center border-b border-border-subtle px-4">
                {text.studiesSection}
              </h2>
              <StudyRows
                studies={[...accepted, ...refused]}
                t={t}
                locale={locale}
                studyHref={studyHref}
              />
            </Panel>
          )}

          <Panel className="overflow-hidden">
            <h2 className="label-eyebrow flex h-11 items-center gap-2 border-b border-border-subtle px-4">
              {text.ignoredSection}
              {report.ignoredCount > 0 && (
                <span className="text-tertiary tabular-nums">
                  {text.ignoredCount(report.ignoredCount)}
                </span>
              )}
            </h2>
            {groups.length === 0 ? (
              <p className="px-4 py-3 text-xs text-secondary">
                {text.noneIgnored}
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {groups.map((group) => {
                  const reason = t.deposits.reasons[group.reason];
                  return (
                    <li key={group.reason} className="px-4 py-3 text-xs">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="font-medium">{reason.label}</p>
                        <p className="text-tertiary tabular-nums">
                          {text.ignoredCount(group.names.length)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-secondary">{reason.detail}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-accent">
                          {text.showFiles(group.names.length)}
                        </summary>
                        <ul className="mt-2 max-h-48 overflow-y-auto rounded-md bg-surface-sunken px-3 py-2 font-mono text-2xs break-all text-secondary">
                          {group.names.map((name, index) => (
                            <li key={`${index}-${name}`}>{name}</li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
            {report.ignored.length < report.ignoredCount && (
              <p className="border-t border-border-subtle px-4 py-2 text-2xs text-tertiary">
                {text.listedOnly(report.ignored.length, report.ignoredCount)}
              </p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

/** Où en est le dépôt, et ce qu'il faut faire, quand il n'est pas intégré. */
function StatusCallout({
  report,
  t,
  locale,
}: {
  report: Report;
  t: AppMessages;
  locale: Locale;
}) {
  const text = t.deposits.report;
  switch (report.status) {
    case "uploading":
      return (
        <Callout tone="progress" title={text.uploadingTitle}>
          {text.uploadingDetail(
            formatBytes(report.receivedBytes, locale),
            formatBytes(report.sizeBytes, locale),
            report.expiresAt ? formatDate(report.expiresAt, locale) : MISSING,
          )}
        </Callout>
      );
    case "received":
    case "processing":
      return (
        <Callout tone="accent" title={text.processingTitle}>
          {text.processingDetail}
        </Callout>
      );
    case "refused": {
      const refusal = report.refusal
        ? t.deposits.refusals[report.refusal]
        : null;
      return (
        <Callout tone="urgent" title={refusal?.title ?? text.refusedTitle}>
          {refusal?.action}
        </Callout>
      );
    }
    case "cancelled":
    case "expired":
      return (
        <Callout tone="neutral" title={text.abandonedTitle}>
          {t.deposits.statuses[report.status]}. {text.abandonedDetail}
        </Callout>
      );
    case "done":
      return null;
  }
}

const CALLOUT_TONES = {
  progress: "border-progress/40 bg-progress-muted text-progress",
  accent: "border-accent/40 bg-accent-muted text-accent",
  urgent: "border-urgent/40 bg-urgent-muted text-urgent",
  neutral: "border-border-default bg-surface-sunken text-secondary",
} as const;

function Callout({
  tone,
  title,
  children,
}: {
  tone: keyof typeof CALLOUT_TONES;
  title: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "urgent" ? AlertTriangle : Clock;
  return (
    <div
      role={tone === "urgent" ? "alert" : "status"}
      className={`flex gap-3 rounded-xl border px-4 py-3 ${CALLOUT_TONES[tone]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-medium">{title}</p>
        {children && <p className="mt-1 text-xs text-secondary">{children}</p>}
      </div>
    </div>
  );
}

/** Les examens trouvés : tableau sur grand écran, cartes sur téléphone. */
function StudyRows({
  studies,
  t,
  locale,
  studyHref,
}: {
  studies: DepositStudy[];
  t: AppMessages;
  locale: Locale;
  studyHref: (studyId: string) => string;
}) {
  const text = t.deposits.report;
  return (
    <>
      <ul className="divide-y divide-border-subtle md:hidden">
        {studies.map((study) => (
          <li
            key={study.studyInstanceUid}
            className="flex flex-col gap-1.5 px-4 py-3 text-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate font-medium">
                {patient(study, t)}
              </p>
              <span className="shrink-0 text-tertiary">
                {study.modality ?? MISSING}
              </span>
            </div>
            <p className="text-2xs text-tertiary tabular-nums">
              {study.studyDate ? formatDate(study.studyDate, locale) : MISSING}
              {" · "}
              {text.columns.series} {study.seriesCount} · {text.columns.images}{" "}
              {study.instancesCount}
              {study.duplicatesCount > 0 &&
                ` · ${text.columns.duplicates} ${study.duplicatesCount}`}
            </p>
            <Integration study={study} t={t} studyHref={studyHref} />
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:px-4 [&>th]:font-medium">
              <th scope="col" className="text-left">
                <span className="label-eyebrow">{text.columns.patient}</span>
              </th>
              <th scope="col" className="text-left">
                <span className="label-eyebrow">{text.columns.modality}</span>
              </th>
              <th scope="col" className="text-left">
                <span className="label-eyebrow">{text.columns.date}</span>
              </th>
              <th scope="col" className="text-right">
                <span className="label-eyebrow">{text.columns.series}</span>
              </th>
              <th scope="col" className="text-right">
                <span className="label-eyebrow">{text.columns.images}</span>
              </th>
              <th scope="col" className="text-right">
                <ColumnLabel
                  label={text.columns.duplicates}
                  info={{ text: text.tips.duplicates, term: "doublon" }}
                  className="justify-end"
                />
              </th>
              <th scope="col" className="text-left">
                <ColumnLabel
                  label={text.columns.state}
                  info={{ text: text.pendingTip }}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {studies.map((study) => (
              <tr
                key={study.studyInstanceUid}
                className="align-middle [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4 [&>td]:py-2.5"
              >
                <td className="max-w-64 truncate font-medium">
                  {patient(study, t)}
                </td>
                <td className="text-xs text-secondary">
                  {study.modality ?? MISSING}
                </td>
                <td className="text-xs whitespace-nowrap text-secondary">
                  {study.studyDate ? (
                    <DateTime date={study.studyDate} withTime={false} />
                  ) : (
                    MISSING
                  )}
                </td>
                <td className="text-right text-xs tabular-nums">
                  {study.seriesCount}
                </td>
                <td className="text-right text-xs tabular-nums">
                  {study.instancesCount}
                </td>
                <td className="text-right text-xs tabular-nums">
                  {study.duplicatesCount}
                </td>
                <td>
                  <Integration study={study} t={t} studyHref={studyHref} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function patient(study: DepositStudy, t: AppMessages): string {
  if (!study.accepted) return t.deposits.reasons.other_clinic.label;
  return study.patientName
    ? formatPatientName(study.patientName)
    : t.deposits.report.unknownPatient;
}

/** L'examen intégré (un lien), en cours d'intégration, ou non transmis. */
function Integration({
  study,
  t,
  studyHref,
}: {
  study: DepositStudy;
  t: AppMessages;
  studyHref: (studyId: string) => string;
}) {
  const text = t.deposits.report;
  if (!study.accepted) {
    return <span className="text-xs text-urgent">{text.refusedStudy}</span>;
  }
  if (!study.studyId) {
    return (
      <span className="inline-flex items-center text-xs text-progress">
        {text.pending}
        <InfoTip label={text.pending} text={text.pendingTip} />
      </span>
    );
  }
  return (
    <Link
      href={studyHref(study.studyId)}
      className="inline-flex min-h-6 items-center gap-1 text-xs font-medium text-accent hover:underline"
    >
      {text.open}
      <ChevronRight className="size-3.5" aria-hidden />
    </Link>
  );
}
