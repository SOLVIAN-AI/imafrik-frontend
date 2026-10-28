import { Lock } from "lucide-react";

import { DateTime } from "@/components/domain/date-time";
import type { AppMessages } from "@/i18n";
import type { Statement } from "@/lib/billing";
import { formatCount, formatFcfa } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

type BillingText = AppMessages["clinic"]["activity"]["billing"];

/**
 * Le relevé de facturation d'une clinique pour un mois.
 *
 * Le même composant pour le responsable de la clinique (`/activite`) et
 * pour l'équipe IMAFRIK (`/admin/facturation`) : ils lisent le même relevé,
 * chiffré par le service, et le voient de la même façon. Rien n'est
 * calculé ici, sinon des sommes de nombres d'actes.
 *
 * Dans l'ordre : l'abonnement, les forfaits techniques par type d'examen
 * (nombre d'actes et tarif, en délai normal et en urgence), ce qui n'est
 * pas facturé (hors grille, sans compte-rendu signé), le total, puis les
 * actes de chaque radiologue, base de ses honoraires.
 *
 * @param statement  Relevé.
 * @param text       Textes de la facturation.
 * @param groups     Noms des groupes de modalités.
 * @param showStatus Afficher l'état du mois (provisoire ou clos) en tête :
 *                   l'écran de l'équipe le dit une fois pour tout le mois.
 */
export function BillingStatement({
  statement,
  text,
  groups,
  locale,
  showStatus = true,
}: {
  statement: Statement;
  text: BillingText;
  groups: AppMessages["assignment"]["modalities"];
  locale: Locale;
  showStatus?: boolean;
}) {
  const money = (amount: number) => formatFcfa(amount, locale);
  const count = (value: number) => formatCount(value, locale);

  return (
    <div className="flex flex-col divide-y divide-border-subtle text-sm">
      {showStatus && (
        <p
          className={cn(
            "flex items-start gap-2 px-4 py-3 text-xs leading-relaxed",
            statement.closedAt ? "text-secondary" : "text-tertiary",
          )}
        >
          {statement.closedAt ? (
            <>
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                {text.closedBefore}
                <DateTime date={statement.closedAt} withTime={false} />
                {text.closedAfter}
              </span>
            </>
          ) : (
            text.provisional
          )}
        </p>
      )}

      {/* Abonnement */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
        <div className="min-w-0">
          <p className="font-medium">{text.subscription}</p>
          <p
            className={cn(
              "text-xs",
              statement.plan ? "text-secondary" : "text-progress",
            )}
          >
            {statement.plan ? text.plans[statement.plan] : text.noPlan}
          </p>
          {!statement.plan && (
            <p className="mt-1 max-w-prose text-2xs leading-relaxed text-tertiary">
              {text.noPlanDetail}
            </p>
          )}
        </div>
        {statement.subscription !== null && (
          <p className="font-medium tabular-nums">
            {money(statement.subscription)}
          </p>
        )}
      </div>

      {/* Forfaits techniques */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <p className="font-medium">{text.technicalFees}</p>
          <p className="font-medium tabular-nums">
            {money(statement.technicalTotal)}
          </p>
        </div>
        <p className="max-w-prose text-2xs leading-relaxed text-tertiary">
          {text.technicalFeesDetail} {text.baseTariff}
        </p>
        {statement.lines.length === 0 ? (
          <p className="text-xs text-tertiary">{text.noActs}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="[&>th]:h-8 [&>th]:border-b [&>th]:border-border-subtle [&>th]:pr-3 [&>th]:text-right [&>th]:font-medium [&>th:first-child]:text-left [&>th:last-child]:pr-0">
                  <th scope="col">
                    <span className="label-eyebrow">{text.columns.type}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">
                      {text.columns.routine}
                    </span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{text.columns.urgent}</span>
                  </th>
                  <th scope="col">
                    <span className="label-eyebrow">{text.columns.amount}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {statement.lines.map((line) => (
                  <tr
                    key={line.feeClass}
                    className="[&>td]:h-10 [&>td]:border-b [&>td]:border-border-subtle [&>td]:pr-3 [&>td]:text-right [&>td]:tabular-nums [&>td:first-child]:text-left [&>td:last-child]:pr-0"
                  >
                    <th scope="row" className="text-left font-medium">
                      {text.feeClasses[line.feeClass]}
                    </th>
                    <td>
                      {text.acts(line.routine)}
                      <span className="block text-2xs text-tertiary">
                        {text.unitPrice(money(line.routineFee))}
                      </span>
                    </td>
                    <td>
                      {text.acts(line.urgent)}
                      <span className="block text-2xs text-tertiary">
                        {text.unitPrice(money(line.urgentFee))}
                      </span>
                    </td>
                    <td className="font-medium">{money(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {statement.outOfGrid.length > 0 && (
          <div className="text-xs">
            <p className="text-secondary">
              {text.outOfGrid(
                statement.outOfGrid
                  .map(
                    (row) =>
                      `${groups[row.group]} (${count(row.routine + row.urgent)})`,
                  )
                  .join(", "),
              )}
            </p>
            <p className="text-2xs text-tertiary">{text.outOfGridDetail}</p>
          </div>
        )}
        {statement.unreported > 0 && (
          <p className="text-xs text-secondary">
            {text.unreported(statement.unreported)}
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-surface-sunken px-4 py-3">
        <div>
          <p className="font-semibold">{text.total}</p>
          <p className="text-2xs text-tertiary">
            {statement.total === null ? text.totalMissing : text.totalHint}
          </p>
        </div>
        {statement.total !== null && (
          <p className="text-lg font-semibold tabular-nums">
            {money(statement.total)}
          </p>
        )}
      </div>

      {/* Honoraires */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <p className="font-medium">{text.fees}</p>
        <p className="max-w-prose text-2xs leading-relaxed text-tertiary">
          {text.feesDetail}
        </p>
        {statement.radiologists.length === 0 ? (
          <p className="text-xs text-tertiary">{text.noFees}</p>
        ) : (
          <ul className="flex flex-col text-xs">
            {statement.radiologists.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-border-subtle py-2 last:border-b-0"
              >
                <span className="font-medium">{row.name}</span>
                <span className="text-secondary tabular-nums">
                  {text.acts(row.routine + row.urgent)}
                  {row.urgent > 0 && (
                    <span className="text-tertiary">
                      {" · "}
                      {text.urgentActs(row.urgent)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
