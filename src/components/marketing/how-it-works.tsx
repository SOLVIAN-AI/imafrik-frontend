import { FileSignature, HardDrive, ScanLine } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { ANCHORS } from "@/lib/i18n/routes";

/**
 * Les trois temps du service.
 *
 * La numérotation est justifiée : c'est une véritable séquence, et
 * l'ordre porte une information — on ne signe pas avant d'avoir lu. Un
 * marqueur numéroté sur des blocs qui ne se suivent pas ne serait que de
 * la décoration.
 *
 * La première étape décrit la passerelle sans la nommer autrement que
 * par ce qu'elle fait. « Store-and-forward » ne veut rien dire pour un
 * directeur d'établissement ; « l'examen est accepté même si la liaison
 * est coupée » lui parle immédiatement, parce que c'est arrivé la
 * semaine dernière.
 */
/** Icône de chaque étape, dans l'ordre. */
const STEP_ICONS = [HardDrive, ScanLine, FileSignature] as const;

/**
 * Section « comment ça marche ».
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
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {t.steps.map((step, index) => {
          const Icon = STEP_ICONS[index];
          return (
            <li
              key={step.title}
              className="group relative flex flex-col rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-raised transition-all duration-200 ease-(--ease-out-quart) hover:-translate-y-0.5 hover:border-border-default hover:shadow-overlay"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex size-10 items-center justify-center rounded-lg bg-accent-muted ring-1 ring-accent/25 transition-transform duration-200 ease-(--ease-out-quart) ring-inset group-hover:scale-105"
                  aria-hidden
                >
                  <Icon className="size-4.5 text-accent" />
                </span>
                <span className="font-mono text-2xs text-tertiary">
                  0{index + 1}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="prose-justify mt-2 flex-1 text-sm leading-relaxed text-secondary">
                {step.detail}
              </p>
              <p className="mt-4 border-t border-border-subtle pt-3 text-2xs text-tertiary">
                {step.note}
              </p>
            </li>
          );
        })}
      </ol>

      <p className="prose-justify mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-tertiary">
        {t.uploadNote}
      </p>
    </Section>
  );
}
