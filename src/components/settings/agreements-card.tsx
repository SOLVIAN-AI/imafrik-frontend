import { Download, FileSignature } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n/server";
import { type AgreementStatus, agreementPdfHref } from "@/lib/agreements";
import { formatDate, formatDateTime } from "@/lib/format";

/**
 * Engagements, dans les paramètres : ce que le compte a accepté, et
 * l'exemplaire de chacun à télécharger.
 *
 * L'exemplaire est rendu par le service à la demande : la version
 * acceptée, suivie du certificat d'acceptation. Il fait foi en cas de
 * différend, et doit donc rester accessible après la mise en service.
 *
 * @param statuses Engagements dus par le compte.
 */
export async function AgreementsCard({
  statuses,
}: {
  statuses: AgreementStatus[];
}) {
  const { t, locale } = await getMessages();
  const text = t.agreements;
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-semibold">{text.settings.title}</h2>
        <p className="mt-0.5 text-xs text-tertiary">{text.settings.lead}</p>
      </div>
      {statuses.length === 0 ? (
        <p className="px-4 py-4 text-sm text-tertiary">{text.settings.none}</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {statuses.map((status) => (
            <li
              key={status.kind}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent ring-1 ring-inset ring-accent/20">
                <FileSignature className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-[1_1_14rem] text-sm">
                <p className="font-medium">{status.title}</p>
                <p className="mt-0.5 text-xs text-tertiary">
                  {text.review.version(
                    status.version,
                    formatDate(
                      new Date(`${status.effectiveDate}T00:00:00Z`),
                      locale,
                    ),
                  )}
                </p>
                <p className="mt-0.5 text-xs text-secondary">
                  {status.acceptedAt
                    ? text.review.acceptedOn(
                        formatDateTime(status.acceptedAt, locale),
                        status.acceptedBy,
                      )
                    : text.settings.pending}
                </p>
              </div>
              {status.acceptedAt ? (
                <Button asChild variant="secondary" size="sm">
                  <a href={agreementPdfHref(status.kind)} download>
                    <Download />
                    {text.review.downloadAccepted}
                  </a>
                </Button>
              ) : (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/engagements">{text.settings.review}</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
