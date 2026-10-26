import { Check, Upload } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { ANCHORS } from "@/lib/i18n/routes";

/**
 * Les trois temps du service.
 *
 * La numérotation est justifiée : c'est une véritable séquence, et
 * l'ordre porte une information (on ne signe pas avant d'avoir lu). Les
 * étapes sont reliées par une ligne qui se trace au défilement, une seule
 * fois l'œil arrivé dessus : la page raconte un trajet, pas trois
 * arguments juxtaposés. Pas de cartes : trois cadres de plus après
 * l'accroche alourdiraient une page qui en compte déjà beaucoup.
 *
 * La première étape décrit la passerelle sans la nommer autrement que
 * par ce qu'elle fait. « Store-and-forward » ne veut rien dire pour un
 * directeur d'établissement ; « l'examen est accepté même si la liaison
 * est coupée » lui parle immédiatement, parce que c'est arrivé la
 * semaine dernière.
 *
 * @param locale Langue de la page.
 */
export function HowItWorks({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).howItWorks;
  return (
    <Section
      id={ANCHORS.fonctionnement[locale]}
      eyebrow={t.eyebrow}
      title={t.title}
      lead={t.lead}
    >
      <ol className="relative mt-16 grid gap-12 md:mt-20 md:grid-cols-3 md:gap-10">
        {/* Le trajet : vertical sur téléphone, horizontal au-delà. */}
        <li
          className="absolute top-5 bottom-5 left-5 w-px bg-border-default md:top-5 md:right-[16.67%] md:bottom-auto md:left-[16.67%] md:h-px md:w-auto"
          aria-hidden
        >
          <span className="trace-on-scroll absolute inset-0 hidden bg-gradient-to-r from-accent/30 via-accent to-accent/30 md:block" />
        </li>

        {t.steps.map((step, index) => (
          <li
            key={step.title}
            data-reveal
            style={{ "--reveal-order": index } as React.CSSProperties}
            className="relative flex gap-5 md:flex-col md:items-center md:gap-0 md:text-center"
          >
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-surface-base font-mono text-sm text-accent shadow-[0_0_0_8px_var(--surface-base),0_0_24px_-4px_var(--glow-accent)] tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="md:mt-7 md:max-w-sm">
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-pretty text-secondary md:text-base md:leading-7">
                {step.detail}
              </p>
              <p className="mt-5 inline-flex items-start gap-1.5 rounded-xl border border-border-subtle bg-surface-raised px-3 py-1.5 text-left text-xs text-secondary md:items-center md:rounded-full md:py-1">
                <Check
                  className="mt-px size-3.5 shrink-0 text-accent md:mt-0"
                  aria-hidden
                />
                {step.note}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p
        data-reveal
        className="mx-auto mt-16 flex max-w-2xl items-start gap-3 rounded-xl border border-border-subtle bg-surface-raised/60 px-5 py-4 text-sm leading-relaxed text-secondary md:items-center"
      >
        <Upload
          className="mt-0.5 size-4 shrink-0 text-accent md:mt-0"
          aria-hidden
        />
        {t.uploadNote}
      </p>
    </Section>
  );
}
