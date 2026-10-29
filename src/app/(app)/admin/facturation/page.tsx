import { Lock, Receipt } from "lucide-react";
import type { Metadata } from "next";

import { CloseMonthButton } from "@/components/admin/close-month-button";
import { ControlBody, Figure, Section } from "@/components/admin/control-ui";
import { CsvButton } from "@/components/admin/csv-button";
import { BillingStatement } from "@/components/domain/billing-statement";
import { DateTime } from "@/components/domain/date-time";
import { MonthNav } from "@/components/domain/month-nav";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { parseMonth } from "@/lib/admin-params";
import { statementCsvRows, sumStatements } from "@/lib/billing";
import { getBillingMonth } from "@/lib/data/activity";
import { formatCount, formatFcfa, formatMonth } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.billing };
}

/**
 * Facturation d'un mois : le relevé de chaque clinique.
 *
 * **Le même relevé que celui du responsable de la clinique** (écran
 * « Activité et facturation »), chiffré par le même calcul du service :
 * abonnement de sa formule, forfaits techniques des actes (examens reçus
 * dans le mois dont le compte-rendu est signé), actes par radiologue.
 *
 * Un mois fini se vérifie, puis se clôt : « Clore le mois » fige le relevé
 * de chaque clinique, qui ne change plus. Une clinique sans formule se
 * voit ici (« Sans formule ») et se règle sur sa fiche.
 *
 * Le mois se compte en UTC, l'heure de Lomé, sur la date de réception.
 */
export default async function BillingPage({
  searchParams,
}: PageProps<"/admin/facturation">) {
  await requireSession(["platform_admin"]);
  const { t, locale } = await getMessages();
  const text = t.admin.billing;
  const params = await searchParams;
  const month = parseMonth(params.mois);
  const current = parseMonth(undefined);
  const billing = await getBillingMonth(month);
  const totals = sumStatements(billing.statements);
  const label = formatMonth(month, locale);

  return (
    <>
      <PageHeader
        title={t.nav.items.billing}
        description={text.description(label)}
        actions={
          <>
            <MonthNav
              month={month}
              current={current}
              path="/admin/facturation"
              locale={locale}
              labels={text}
            />
            <CsvButton
              filename={text.csvFilename(month)}
              headers={text.csvHeaders}
              rows={billing.statements.flatMap((statement) =>
                statementCsvRows(
                  statement,
                  t.clinic.activity.billing,
                  t.assignment.modalities,
                  true,
                ),
              )}
              disabled={billing.statements.length === 0}
            />
            {billing.closable && (
              <CloseMonthButton month={month} monthLabel={label} />
            )}
          </>
        }
      />

      <ControlBody>
        <section
          aria-label={text.totals}
          className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised"
        >
          <p className="flex items-start gap-2 text-xs leading-relaxed text-secondary">
            {billing.closedAt ? (
              <>
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  {text.closedBefore}
                  <DateTime date={billing.closedAt} withTime={false} />
                  {text.closedAfter}
                </span>
              </>
            ) : billing.closable ? (
              text.toClose
            ) : (
              text.current
            )}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <Figure
              label={text.invoiced}
              value={formatFcfa(totals.total, locale)}
              hint={text.invoicedHint(totals.missingPlans)}
            />
            <Figure
              label={text.acts}
              value={formatCount(totals.acts, locale)}
              hint={text.actsHint}
              // La définition du glossaire, en entier : la bulle dit tout.
              info={{ text: t.help.glossary.acte.definition }}
            />
            <Figure
              label={text.unreported}
              value={formatCount(totals.unreported, locale)}
              hint={text.unreportedHint}
              info={{ text: text.unreportedInfo }}
              tone={
                totals.unreported > 0 && billing.closable
                  ? "progress"
                  : undefined
              }
            />
            <Figure
              label={text.missingPlans}
              value={formatCount(totals.missingPlans, locale)}
              hint={text.missingPlansHint}
              tone={totals.missingPlans > 0 ? "progress" : undefined}
            />
          </div>
        </section>

        {billing.statements.length === 0 ? (
          <Section title={text.totals}>
            <EmptyState
              icon={Receipt}
              title={text.emptyTitle}
              detail={text.emptyDetail}
            />
          </Section>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {billing.statements.map((statement) => (
              <Section
                key={statement.clinicId}
                title={statement.clinic}
                description={
                  statement.total === null
                    ? t.clinic.activity.billing.noPlan
                    : formatFcfa(statement.total, locale)
                }
                action={{
                  label: text.clinicSheet,
                  href: `/admin/organisations/${statement.clinicId}`,
                }}
                flush
              >
                <BillingStatement
                  statement={statement}
                  text={t.clinic.activity.billing}
                  groups={t.assignment.modalities}
                  locale={locale}
                  showStatus={false}
                />
              </Section>
            ))}
          </div>
        )}
      </ControlBody>
    </>
  );
}
