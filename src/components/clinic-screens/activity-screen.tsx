import { Activity, ChevronRight, Receipt } from "lucide-react";
import Link from "next/link";

import { ControlBody, Figure, Section } from "@/components/admin/control-ui";
import { CsvButton } from "@/components/admin/csv-button";
import { BillingStatement } from "@/components/domain/billing-statement";
import { MonthNav } from "@/components/domain/month-nav";
import { PerformanceTable } from "@/components/domain/performance-table";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ColumnLabel, type InfoTipContent } from "@/components/ui/info-tip";
import { parseMonth } from "@/lib/admin-params";
import { statementCsvRows } from "@/lib/billing";
import { type ClinicConsultation, clinicHref } from "@/lib/clinic-view";
import {
  getMonthActivity,
  getNetworkPerformance,
  getPerformance,
  getStatement,
} from "@/lib/data/activity";
import {
  formatCount,
  formatMinutes,
  formatMonth,
  formatPercent,
} from "@/lib/format";
import type { SearchParamsRecord } from "@/lib/pagination";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

/**
 * Activité et facturation de la clinique, pour son responsable.
 *
 * Un mois à la fois, choisi dans l'adresse (`?mois=AAAA-MM`). En haut,
 * l'activité : les examens reçus ce mois-là, combien sont rendus, en
 * combien de temps, et dans les délais promis ; par modalité et par
 * radiologue. En bas, le relevé de facturation du mois, celui que voit
 * l'équipe IMAFRIK : abonnement, forfaits techniques, actes de chaque
 * radiologue. Provisoire jusqu'à la clôture du mois, figé ensuite.
 *
 * Tout est borné à la clinique active par le service ; un radiologue de
 * la clinique n'a pas accès à cet écran.
 *
 * Dans la vue des cliniques, l'équipe IMAFRIK lit les mêmes chiffres, par
 * les mêmes calculs, pour la clinique consultée ; sa formule d'abonnement
 * se renseigne depuis sa fiche, geste de l'équipe.
 *
 * @param consultation Clinique consultée par l'équipe IMAFRIK ; `null`
 *                     pour son responsable.
 * @param params       Paramètres de l'adresse : le mois.
 */
export async function ActivityScreen({
  consultation,
  params,
}: {
  consultation: ClinicConsultation | null;
  params: SearchParamsRecord;
}) {
  const session = await requireSession();
  const clinicId = consultation?.clinicId;
  const clinicName = consultation?.name ?? session.active.organizationName;
  const { t, locale } = await getMessages();
  const text = t.clinic.activity;
  const columns = text.activity.columns;
  const month = parseMonth(params.mois);
  const current = parseMonth(undefined);
  const [activity, performance, statement] = await Promise.all([
    getMonthActivity(month, clinicId),
    // Les performances de la clinique ont déjà leur lecture pour l'équipe,
    // au même calcul : `/admin/performance?clinic_id=`.
    clinicId ? getNetworkPerformance(month, clinicId) : getPerformance(month),
    getStatement(month, clinicId),
  ]);
  const duration = (minutes: number | null) => formatMinutes(minutes, locale);
  const percent = (ratio: number | null) => formatPercent(ratio, locale);
  const count = (value: number) => formatCount(value, locale);
  // Ce que mesurent les délais : la bulle de leur libellé.
  const medianInfo: InfoTipContent = {
    text: t.common.measures.median,
    term: "delaiMedian",
  };
  const slaInfo: InfoTipContent = {
    text: t.common.measures.withinSla(
      duration(activity.slaRoutineMinutes),
      duration(activity.slaUrgentMinutes),
    ),
    term: "delaiPromis",
  };

  return (
    <>
      <PageHeader
        title={text.title}
        description={`${formatMonth(month, locale)} · ${clinicName}`}
        actions={
          <>
            <MonthNav
              month={month}
              current={current}
              path={clinicHref(consultation, "/activite")}
              locale={locale}
              labels={text}
            />
            <CsvButton
              filename={text.billing.csvFilename(month)}
              headers={text.billing.csvHeaders}
              rows={
                statement
                  ? statementCsvRows(
                      statement,
                      text.billing,
                      t.assignment.modalities,
                    )
                  : []
              }
              disabled={statement === null}
            />
            {consultation && (
              <Button asChild variant="secondary" size="sm">
                <Link
                  href={`/admin/organisations/${consultation.clinicId}#abonnement`}
                >
                  <Receipt aria-hidden />
                  {t.clinicView.activity.plan}
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Les trois parties de l'écran, à un clic. */}
      <nav
        aria-label={text.anchors.label}
        className="flex shrink-0 flex-wrap items-center gap-1 px-4 pb-3 sm:px-6"
      >
        {(
          [
            ["#activite", text.anchors.activity],
            ["#performances", text.anchors.performance],
            ["#facturation", text.anchors.billing],
          ] as const
        ).map(([anchor, label]) => (
          <a
            key={anchor}
            href={anchor}
            className="rounded-md px-2.5 py-1 text-xs whitespace-nowrap text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
          >
            {label}
          </a>
        ))}
        {consultation && (
          <Link
            href={`/admin/activite?onglet=radiologues&clinique=${encodeURIComponent(consultation.clinicId)}`}
            className="ml-auto flex min-h-6 items-center gap-1 text-xs whitespace-nowrap text-tertiary transition-colors hover:text-accent"
          >
            {t.clinicView.activity.console}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </nav>

      <ControlBody label={text.title}>
        <Section
          id="activite"
          title={text.activity.title}
          description={text.activity.description}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <Figure
              label={text.activity.received}
              value={count(activity.received)}
              hint={text.activity.ofWhichUrgent(activity.urgent.received)}
            />
            <Figure
              label={text.activity.signed}
              value={count(activity.signed)}
              hint={text.activity.pending(activity.pending)}
              tone={activity.pending > 0 ? "progress" : undefined}
            />
            <Figure
              label={text.activity.median}
              value={duration(activity.medianMinutes)}
              hint={text.activity.medianHint}
              info={medianInfo}
            />
            <Figure
              label={text.activity.withinSla}
              value={percent(activity.withinSla)}
              info={slaInfo}
              hint={text.activity.slaHint(
                duration(activity.slaRoutineMinutes),
                duration(activity.slaUrgentMinutes),
              )}
              tone={
                activity.withinSla !== null && activity.withinSla >= 0.9
                  ? "done"
                  : undefined
              }
            />
          </div>
        </Section>

        {activity.received === 0 ? (
          <Section title={text.activity.byModality}>
            <EmptyState
              icon={Activity}
              title={text.activity.emptyTitle}
              detail={text.activity.emptyDetail}
            />
          </Section>
        ) : (
          <Section title={text.activity.byModality} flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:px-4 [&>th]:text-right [&>th]:font-medium [&>th:first-child]:text-left">
                    {(
                      [
                        { label: columns.modality },
                        { label: columns.routine },
                        { label: columns.urgent },
                        { label: columns.signed },
                        { label: columns.median, info: medianInfo },
                        { label: columns.withinSla, info: slaInfo },
                      ] satisfies { label: string; info?: InfoTipContent }[]
                    ).map(({ label, info }) => (
                      <th key={label} scope="col">
                        <ColumnLabel label={label} info={info} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activity.byModality.map((row) => (
                    <tr
                      key={row.group}
                      className="[&>td]:h-10 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4 [&>td]:text-right [&>td]:tabular-nums"
                    >
                      <th
                        scope="row"
                        className="h-10 border-b border-border-subtle px-4 text-left font-medium"
                      >
                        {t.assignment.modalities[row.group]}
                      </th>
                      <td>{count(row.routine)}</td>
                      <td>{count(row.urgent)}</td>
                      <td>{count(row.signed)}</td>
                      <td>{duration(row.medianMinutes)}</td>
                      <td>{percent(row.withinSla)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        <Section
          id="performances"
          title={text.performance.title}
          description={text.performance.description}
          info={{
            title: text.performance.info.trendTitle,
            text: text.performance.info.trend,
          }}
          flush
        >
          <PerformanceTable performance={performance} />
        </Section>

        <Section
          id="facturation"
          title={text.billing.title}
          description={formatMonth(month, locale)}
          flush
        >
          {statement ? (
            <BillingStatement
              statement={statement}
              text={text.billing}
              groups={t.assignment.modalities}
              locale={locale}
            />
          ) : (
            <p className="px-4 py-8 text-center text-xs text-tertiary">
              {text.billing.none}
            </p>
          )}
        </Section>
      </ControlBody>
    </>
  );
}
