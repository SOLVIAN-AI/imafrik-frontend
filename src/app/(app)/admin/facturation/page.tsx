import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ControlBody, Figure, Section } from "@/components/admin/control-ui";
import { CsvButton } from "@/components/admin/csv-button";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { parseMonth, shiftMonth } from "@/lib/admin-params";
import { type BillingLine, getBilling } from "@/lib/data/control";
import { formatCount } from "@/lib/format";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Facturation" };

/**
 * Actes d'un mois, par clinique et par modalité.
 *
 * La base de la facture de chaque clinique : examens reçus, dont
 * urgences — facturées à part —, et combien ont un compte-rendu signé.
 * Un examen reçu sans compte-rendu signé à la clôture du mois se voit
 * ici avant d'être facturé à tort.
 *
 * Le mois se compte en UTC — l'heure de Lomé —, sur la date de réception.
 */
export default async function BillingPage({
  searchParams,
}: PageProps<"/admin/facturation">) {
  await requireSession(["platform_admin"]);
  const params = await searchParams;
  const month = parseMonth(params.mois);
  const current = parseMonth(undefined);
  const lines = await getBilling(month);
  const clinics = groupByClinic(lines);
  const totals = sum(lines);
  const unreported = totals.received - totals.reported;

  return (
    <>
      <PageHeader
        title="Facturation"
        description={`${monthLabel(month)} · actes reçus, par clinique et modalité`}
        actions={
          <>
            <nav
              aria-label="Mois"
              className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-sunken p-0.5"
            >
              <Button asChild variant="ghost" size="icon">
                <Link
                  href={`/admin/facturation?mois=${shiftMonth(month, -1)}`}
                  aria-label="Mois précédent"
                >
                  <ChevronLeft />
                </Link>
              </Button>
              <span className="min-w-[8.5rem] text-center text-xs font-medium capitalize">
                {monthLabel(month)}
              </span>
              {month < current ? (
                <Button asChild variant="ghost" size="icon">
                  <Link
                    href={`/admin/facturation?mois=${shiftMonth(month, 1)}`}
                    aria-label="Mois suivant"
                  >
                    <ChevronRight />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled
                  aria-label="Mois suivant"
                >
                  <ChevronRight />
                </Button>
              )}
            </nav>
            <CsvButton
              filename={`imafrik-actes-${month}.csv`}
              headers={[
                "Mois",
                "Clinique",
                "Modalité",
                "Routine",
                "Urgence",
                "Total",
                "Comptes-rendus signés",
              ]}
              rows={lines.map((line) => [
                month,
                line.clinic,
                line.modality,
                line.routine,
                line.urgent,
                line.routine + line.urgent,
                line.reported,
              ])}
              disabled={lines.length === 0}
            />
          </>
        }
      />

      <ControlBody>
        <section
          aria-label="Totaux du mois"
          className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-4"
        >
          <Figure label="Actes reçus" value={formatCount(totals.received)} />
          <Figure
            label="Dont urgences"
            value={formatCount(totals.urgent)}
            hint="facturées au tarif d’urgence"
          />
          <Figure
            label="Comptes-rendus signés"
            value={formatCount(totals.reported)}
          />
          <Figure
            label="Sans compte-rendu signé"
            value={formatCount(unreported)}
            hint={
              month === current
                ? "le mois est en cours"
                : "à vérifier avant facture"
            }
            tone={unreported > 0 && month !== current ? "progress" : undefined}
          />
        </section>

        {clinics.length === 0 ? (
          <Section title="Actes">
            <EmptyState
              icon={Receipt}
              title="Aucun acte ce mois-ci"
              detail="Les examens reçus apparaissent ici, regroupés par clinique."
            />
          </Section>
        ) : (
          clinics.map((clinic) => (
            <Section
              key={clinic.id}
              title={clinic.name}
              description={`${formatCount(clinic.totals.received)} actes · ${formatCount(clinic.totals.urgent)} urgences · ${formatCount(clinic.totals.reported)} comptes-rendus signés`}
              flush
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:px-4 [&>th]:text-right [&>th]:font-medium [&>th:first-child]:text-left">
                      <th scope="col">
                        <span className="label-eyebrow">Modalité</span>
                      </th>
                      <th scope="col">
                        <span className="label-eyebrow">Routine</span>
                      </th>
                      <th scope="col">
                        <span className="label-eyebrow">Urgence</span>
                      </th>
                      <th scope="col">
                        <span className="label-eyebrow">Total</span>
                      </th>
                      <th scope="col">
                        <span className="label-eyebrow">Signés</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinic.lines.map((line) => (
                      <tr
                        key={line.modality}
                        className="[&>td]:h-10 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4 [&>td]:text-right [&>td]:tabular-nums [&>td:first-child]:text-left"
                      >
                        <td className="font-medium">{line.modality}</td>
                        <td>{formatCount(line.routine)}</td>
                        <td>{formatCount(line.urgent)}</td>
                        <td className="font-medium">
                          {formatCount(line.routine + line.urgent)}
                        </td>
                        <td className="text-secondary">
                          {formatCount(line.reported)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="[&>td]:h-10 [&>td]:px-4 [&>td]:text-right [&>td]:font-semibold [&>td]:tabular-nums [&>td:first-child]:text-left">
                      <td>Total</td>
                      <td>{formatCount(clinic.totals.routine)}</td>
                      <td>{formatCount(clinic.totals.urgent)}</td>
                      <td>{formatCount(clinic.totals.received)}</td>
                      <td>{formatCount(clinic.totals.reported)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Section>
          ))
        )}
      </ControlBody>
    </>
  );
}

/** Totaux d'un ensemble de lignes. */
function sum(lines: BillingLine[]) {
  return lines.reduce(
    (total, line) => ({
      routine: total.routine + line.routine,
      urgent: total.urgent + line.urgent,
      received: total.received + line.routine + line.urgent,
      reported: total.reported + line.reported,
    }),
    { routine: 0, urgent: 0, received: 0, reported: 0 },
  );
}

/** Lignes regroupées par clinique, dans l'ordre du service. */
function groupByClinic(lines: BillingLine[]) {
  const groups = new Map<
    string,
    { id: string; name: string; lines: BillingLine[] }
  >();
  for (const line of lines) {
    const group = groups.get(line.clinicId) ?? {
      id: line.clinicId,
      name: line.clinic,
      lines: [],
    };
    group.lines.push(line);
    groups.set(line.clinicId, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    totals: sum(group.lines),
  }));
}

/** « octobre 2026 ». */
function monthLabel(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, number - 1, 1)));
}
