import { Activity } from "lucide-react";
import type { Metadata } from "next";

import { ControlBody, Figure, Section } from "@/components/admin/control-ui";
import { CsvButton } from "@/components/admin/csv-button";
import { BillingStatement } from "@/components/domain/billing-statement";
import { MonthNav } from "@/components/domain/month-nav";
import { PerformanceTable } from "@/components/domain/performance-table";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { parseMonth } from "@/lib/admin-params";
import { statementCsvRows } from "@/lib/billing";
import {
  getMonthActivity,
  getPerformance,
  getStatement,
} from "@/lib/data/activity";
import {
  formatCount,
  formatMinutes,
  formatMonth,
  formatPercent,
} from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.activity.title };
}

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
 */
export default async function ActivityPage({
  searchParams,
}: PageProps<"/activite">) {
  const session = await requireSession(["clinic_staff"]);
  const { t, locale } = await getMessages();
  const text = t.clinic.activity;
  const columns = text.activity.columns;
  const params = await searchParams;
  const month = parseMonth(params.mois);
  const current = parseMonth(undefined);
  const [activity, performance, statement] = await Promise.all([
    getMonthActivity(month),
    getPerformance(month),
    getStatement(month),
  ]);
  const duration = (minutes: number | null) => formatMinutes(minutes, locale);
  const percent = (ratio: number | null) => formatPercent(ratio, locale);
  const count = (value: number) => formatCount(value, locale);

  return (
    <>
      <PageHeader
        title={text.title}
        description={`${formatMonth(month, locale)} · ${session.active.organizationName}`}
        actions={
          <>
            <MonthNav
              month={month}
              current={current}
              path="/activite"
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
          </>
        }
      />

      <ControlBody label={text.title}>
        <Section
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
            />
            <Figure
              label={text.activity.withinSla}
              value={percent(activity.withinSla)}
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
                    {[
                      columns.modality,
                      columns.routine,
                      columns.urgent,
                      columns.signed,
                      columns.median,
                      columns.withinSla,
                    ].map((label) => (
                      <th key={label} scope="col">
                        <span className="label-eyebrow">{label}</span>
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
          title={text.performance.title}
          description={text.performance.description}
          flush
        >
          <PerformanceTable performance={performance} />
        </Section>

        <Section
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
