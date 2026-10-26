import { ArrowUpRight } from "lucide-react";

import { marketingCopy } from "@/content/marketing";
import {
  IDC_CITATION,
  IMAGE_SOURCES,
  SOURCES,
} from "@/content/marketing/visuals";
import type { Locale } from "@/lib/i18n/locale";

/** Lien externe, ouvert dans un nouvel onglet. */
function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
    >
      {children}
      <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
    </a>
  );
}

/**
 * Page « Crédits des images ».
 *
 * Les licences Creative Commons des coupes (CC BY 4.0, CC BY 3.0 pour
 * LIDC-IDRI) exigent de citer la source, d'indiquer la licence et de dire
 * ce qui a été modifié. Les visuels de l'accueil portent une mention
 * courte ; cette page, liée depuis le pied de page de chaque page du
 * site, porte la mention complète de chaque collection.
 *
 * Les citations ne sont pas traduites : ce sont des références
 * bibliographiques, telles que leurs auteurs les demandent. Le reste suit
 * la langue de la page.
 *
 * @param locale Langue de la page.
 */
export function CreditsPage({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).credits;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <p className="label-eyebrow text-accent">{t.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{t.title}</h1>
      <p className="mt-5 text-base leading-relaxed text-pretty text-secondary">
        {t.lead}
      </p>

      <ul className="mt-12 flex flex-col gap-5">
        {IMAGE_SOURCES.map((id) => {
          const source = SOURCES[id];
          return (
            <li
              key={id}
              className="rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-raised sm:p-7"
            >
              <h2 className="text-lg font-semibold">{source.name}</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm leading-relaxed sm:grid-cols-[9rem_minmax(0,1fr)]">
                <dt className="text-tertiary">{t.labels.images}</dt>
                <dd className="text-secondary">{t.uses[id]}</dd>

                <dt className="text-tertiary">{t.labels.collection}</dt>
                <dd className="text-secondary">
                  <span lang="en">{source.citation}</span>{" "}
                  <ExternalLink href={`https://doi.org/${source.doi}`}>
                    doi:{source.doi}
                  </ExternalLink>
                </dd>

                <dt className="text-tertiary">{t.labels.license}</dt>
                <dd>
                  <ExternalLink href={source.license.url}>
                    {source.license.name}
                  </ExternalLink>
                </dd>

                <dt className="text-tertiary">{t.labels.modifications}</dt>
                <dd className="flex flex-col gap-2 text-secondary">
                  {source.processing.map((processing) => (
                    <p key={processing}>{t.modifications[processing]}</p>
                  ))}
                </dd>
              </dl>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-14 text-xl font-semibold">{t.idcTitle}</h2>
      <p className="mt-3 text-sm leading-relaxed text-secondary">
        {t.idcText} <span lang="en">{IDC_CITATION.citation}</span>{" "}
        <ExternalLink href={`https://doi.org/${IDC_CITATION.doi}`}>
          doi:{IDC_CITATION.doi}
        </ExternalLink>
      </p>

      <h2 className="mt-12 text-xl font-semibold">{t.productTitle}</h2>
      <p className="mt-3 text-sm leading-relaxed text-secondary">
        {t.productText}
      </p>

      <p className="mt-12 rounded-xl border border-accent/25 bg-accent-muted px-5 py-4 text-sm font-medium text-primary">
        {t.noAi}
      </p>
    </div>
  );
}
