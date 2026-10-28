"use client";

import { ExternalLink, FileCheck2, History } from "lucide-react";

import { useLocale, useMessages } from "@/i18n/client";
import type { Study } from "@/lib/data/studies";
import { formatDate } from "@/lib/format";

/**
 * Antériorités partagées avec le radiologue pour l'examen qu'il lit.
 *
 * Par défaut, un radiologue ne voit aucun autre examen du patient : le
 * responsable de la clinique, ou l'équipe IMAFRIK, choisit ceux qu'il lui
 * partage. Chacune s'ouvre **dans un nouvel onglet**, en lecture seule :
 * le brouillon en cours et la position dans les images restent intacts.
 * L'ouverture se trace au journal, comme toute ouverture d'examen.
 *
 * Rien n'est affiché sans antériorité : un bandeau vide détournerait
 * l'attention de l'image.
 *
 * @param priors Antériorités partagées, les plus récentes d'abord.
 */
export function PriorsPanel({ priors }: { priors: readonly Study[] }) {
  const labels = useMessages().reading.workspace.priors;
  const locale = useLocale();
  if (priors.length === 0) return null;
  return (
    <section
      aria-label={labels.title(priors.length)}
      className="shrink-0 border-b border-border-subtle bg-surface-sunken/50 px-4 py-2.5"
    >
      <p className="label-eyebrow flex items-center gap-1.5">
        <History className="size-3.5 text-tertiary" aria-hidden />
        {labels.title(priors.length)}
      </p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {priors.map((prior) => (
          <li key={prior.id}>
            <a
              href={`/lecture/${prior.id}`}
              target="_blank"
              rel="noopener"
              className="group flex items-center gap-2 rounded-md px-1.5 py-1 text-xs text-secondary hover:bg-surface-raised hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              title={labels.open}
            >
              <span className="tabular-nums">
                {formatDate(prior.receivedAt, locale)}
              </span>
              <span className="font-medium text-primary">
                {prior.modality}
                {prior.bodyPart ? ` ${prior.bodyPart}` : ""}
              </span>
              {prior.reportId ? (
                <span className="inline-flex items-center gap-1 text-done">
                  <FileCheck2 className="size-3" aria-hidden />
                  {labels.signedReport}
                </span>
              ) : (
                <span className="text-tertiary">{labels.noReport}</span>
              )}
              <ExternalLink
                className="ml-auto size-3 shrink-0 text-tertiary group-hover:text-secondary"
                aria-hidden
              />
              <span className="sr-only">{labels.open}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
