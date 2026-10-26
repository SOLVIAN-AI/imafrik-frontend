import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/section";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/**
 * Foire aux questions.
 *
 * Construite sur `<details>` natif : le repli fonctionne sans
 * JavaScript, reste accessible au clavier et se laisse chercher par la
 * recherche du navigateur. Une bibliothèque d'accordéon n'apporterait
 * ici qu'une dépendance ; là où le navigateur sait animer la hauteur d'un
 * `<details>`, la réponse se déplie (`.faq-item`, `globals.css`).
 *
 * Deux colonnes sur grand écran : le titre reste en place pendant qu'on
 * parcourt les questions, avec le lien vers le contact pour celle qui
 * manque.
 *
 * Les questions sont les objections réelles, dans l'ordre où elles
 * viennent : chaque entrée répond à une question qui, sans réponse,
 * empêche de signer. D'où le ton, direct, et qui assume les limites du
 * service quand il en a.
 *
 * @param locale Langue de la page.
 */
export function Faq({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).faq;
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-16 lg:px-8">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
        <Link
          href={localizePath("/contact", locale)}
          className="group mt-7 inline-flex items-center gap-1.5 py-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          {t.contact}
          <ArrowRight
            className="size-4 transition-transform duration-200 ease-(--ease-out-quart) group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <div className="divide-y divide-border-subtle border-y border-border-subtle">
        {t.entries.map((entry) => (
          <details key={entry.question} className="faq-item group">
            <summary className="flex cursor-pointer list-none items-center gap-5 py-5 transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
              <h3 className="flex-1 text-base font-medium">{entry.question}</h3>
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-default text-tertiary transition-[rotate,border-color,color] duration-300 ease-(--ease-out-quart) group-open:rotate-45 group-open:border-accent/50 group-open:text-accent"
                aria-hidden
              >
                <Plus className="size-3.5" />
              </span>
            </summary>
            <p className="max-w-2xl pr-12 pb-6 text-sm leading-relaxed text-pretty text-secondary md:text-base md:leading-7">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
