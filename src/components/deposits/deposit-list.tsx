import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { DepositRowActions } from "@/components/deposits/deposit-row-actions";
import { DepositStateBadge } from "@/components/deposits/deposit-state";
import { DateTime } from "@/components/domain/date-time";
import { ColumnLabel, type InfoTipContent } from "@/components/ui/info-tip";
import type { AppMessages } from "@/i18n";
import type { Deposit } from "@/lib/data/deposits";
import { formatBytes, formatDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";

/**
 * La liste des dépôts : « Mes dépôts » chez le responsable, « Dépôts »
 * dans la console de l'équipe IMAFRIK.
 *
 * Une ligne par archive : quand, laquelle, qui, où elle en est, et ce
 * qu'elle a donné. Un envoi interrompu dit jusqu'à quand il se reprend, et
 * se reprend d'ici (le même fichier, choisi de nouveau) ou s'annule. Le
 * compte rendu s'ouvre depuis chaque ligne.
 *
 * Tableau sur un grand écran, cartes sur un téléphone : aucune ligne ne
 * défile en largeur à 390 px.
 *
 * @param deposits   Dépôts à afficher, déjà filtrés.
 * @param t          Textes de l'application.
 * @param locale     Langue de l'utilisateur.
 * @param reportBase Adresse des comptes rendus.
 * @param team       `true` pour l'équipe IMAFRIK : l'auteur s'y lit.
 * @param showClinic La colonne de la clinique : dans la console, pas dans
 *                   la vue d'une clinique (par défaut, comme `team`).
 */
export function DepositList({
  deposits,
  t,
  locale,
  reportBase,
  team,
  showClinic = team,
}: {
  deposits: Deposit[];
  t: AppMessages;
  locale: Locale;
  reportBase: string;
  team: boolean;
  showClinic?: boolean;
}) {
  const text = t.deposits.list;
  const info = {
    state: { text: text.tips.state, term: "depot" },
    result: { text: text.tips.result, term: "fichierIgnore" },
  } satisfies Record<string, InfoTipContent>;

  return (
    <>
      <ul className="divide-y divide-border-subtle lg:hidden">
        {deposits.map((deposit) => (
          <li key={deposit.id} className="flex flex-col gap-2.5 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <ReportLink deposit={deposit} reportBase={reportBase} />
                <p className="mt-0.5 text-2xs text-tertiary">
                  <DateTime date={deposit.createdAt} />
                  {" · "}
                  {formatBytes(deposit.sizeBytes, locale)}
                  {showClinic && ` · ${deposit.clinicName}`}
                </p>
              </div>
              <DepositStateBadge state={deposit.state} t={t} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-2xs [&_dd]:mt-0.5">
              <div className="min-w-0">
                <dt className="text-tertiary">{text.columns.author}</dt>
                <dd className="truncate">{author(deposit, t)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="flex min-w-0 items-center text-tertiary">
                  <ColumnLabel
                    label={text.columns.result}
                    info={info.result}
                    textClass="truncate"
                  />
                </dt>
                <dd>
                  <Outcome deposit={deposit} t={t} locale={locale} />
                </dd>
              </div>
            </dl>
            {deposit.status === "uploading" && (
              <DepositRowActions deposit={interruptedOf(deposit)} team={team} />
            )}
          </li>
        ))}
      </ul>

      <div className="hidden lg:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
              <th scope="col">
                <span className="label-eyebrow">{text.columns.date}</span>
              </th>
              <th scope="col">
                <span className="label-eyebrow">{text.columns.file}</span>
              </th>
              {showClinic && (
                <th scope="col">
                  <span className="label-eyebrow">{text.columns.clinic}</span>
                </th>
              )}
              <th scope="col">
                <span className="label-eyebrow">{text.columns.author}</span>
              </th>
              <th scope="col">
                <ColumnLabel label={text.columns.state} info={info.state} />
              </th>
              <th scope="col">
                <ColumnLabel label={text.columns.result} info={info.result} />
              </th>
              <th scope="col" className="text-right">
                <span className="sr-only">{text.open}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((deposit) => (
              <tr
                key={deposit.id}
                className="align-middle [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4 [&>td]:py-2.5"
              >
                <td className="whitespace-nowrap text-xs text-secondary">
                  <DateTime date={deposit.createdAt} />
                </td>
                <td className="max-w-72">
                  <ReportLink deposit={deposit} reportBase={reportBase} />
                  <p className="text-2xs text-tertiary tabular-nums">
                    {formatBytes(deposit.sizeBytes, locale)}
                  </p>
                </td>
                {showClinic && (
                  <td className="text-xs text-secondary">
                    {deposit.clinicName}
                  </td>
                )}
                <td className="text-xs whitespace-nowrap text-secondary">
                  {author(deposit, t)}
                </td>
                <td>
                  <DepositStateBadge state={deposit.state} t={t} />
                </td>
                <td className="text-xs">
                  <Outcome deposit={deposit} t={t} locale={locale} />
                </td>
                <td className="text-right">
                  {deposit.status === "uploading" ? (
                    <div className="flex justify-end">
                      <DepositRowActions
                        deposit={interruptedOf(deposit)}
                        team={team}
                      />
                    </div>
                  ) : (
                    <Link
                      href={`${reportBase}/${encodeURIComponent(deposit.id)}`}
                      aria-label={text.openLabel(deposit.fileName)}
                      className="inline-flex min-h-6 items-center gap-1 text-xs font-medium text-accent hover:underline"
                    >
                      {text.open}
                      <ChevronRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Ce qu'il faut à « Reprendre » pour reconnaître le fichier. */
export function interruptedOf(deposit: Deposit) {
  return {
    id: deposit.id,
    fileName: deposit.fileName,
    sizeBytes: deposit.sizeBytes,
    receivedBytes: deposit.receivedBytes,
    headSha256: deposit.headSha256,
  };
}

/** Qui a déposé : l'équipe IMAFRIK reste « l'équipe » pour la clinique. */
function author(deposit: Deposit, t: AppMessages): string {
  if (deposit.onBehalf && !deposit.authorName)
    return t.deposits.list.teamAuthor;
  return deposit.authorName ?? "—";
}

/** Le nom de l'archive, qui mène à son compte rendu. */
function ReportLink({
  deposit,
  reportBase,
}: {
  deposit: Deposit;
  reportBase: string;
}) {
  return (
    <Link
      href={`${reportBase}/${encodeURIComponent(deposit.id)}`}
      className="block truncate py-0.5 leading-5 font-medium hover:underline"
      title={deposit.fileName}
    >
      {deposit.fileName}
    </Link>
  );
}

/** Ce qu'a donné le dépôt, ou où en est l'envoi. */
function Outcome({
  deposit,
  t,
  locale,
}: {
  deposit: Deposit;
  t: AppMessages;
  locale: Locale;
}) {
  const text = t.deposits.list;
  switch (deposit.state) {
    case "uploading": {
      const percent = Math.floor(
        (deposit.receivedBytes / Math.max(deposit.sizeBytes, 1)) * 100,
      );
      return (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="tabular-nums text-secondary">
            {percent} % ·{" "}
            {text.received(
              formatBytes(deposit.receivedBytes, locale),
              formatBytes(deposit.sizeBytes, locale),
            )}
          </span>
          {deposit.expiresAt && (
            <span className="text-2xs text-tertiary">
              {text.interrupted(formatDate(deposit.expiresAt, locale))}
            </span>
          )}
        </div>
      );
    }
    case "processing":
      return <span className="text-secondary">{text.waiting}</span>;
    case "done":
      return (
        <div className="flex flex-col">
          <span className="tabular-nums">
            {text.result(deposit.studiesCount, deposit.instancesCount)}
          </span>
          {deposit.ignoredCount > 0 && (
            <span className="text-2xs text-progress">
              {text.ignored(deposit.ignoredCount)}
            </span>
          )}
        </div>
      );
    case "refused":
      return (
        <span className="text-urgent">
          {deposit.refusal
            ? t.deposits.refusals[deposit.refusal].title
            : t.deposits.states.refused}
        </span>
      );
    case "abandoned":
      return (
        <span className="text-tertiary">
          {t.deposits.statuses[deposit.status]}
        </span>
      );
  }
}
