import { ChevronDown } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Foire aux questions.
 *
 * Construite sur `<details>` natif : le repli fonctionne sans
 * JavaScript, reste accessible au clavier et se laisse chercher par la
 * recherche du navigateur. Une bibliothèque d'accordéon n'apporterait
 * ici qu'une dépendance.
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
    <Section eyebrow={t.eyebrow} title={t.title}>
      <div className="mt-10 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised">
        {t.entries.map((entry) => (
          <details key={entry.question} className="group">
            <summary
              className={
                "flex cursor-pointer list-none items-center gap-4 px-6 py-5 " +
                "transition-colors hover:bg-surface-hover"
              }
            >
              <h3 className="flex-1 text-sm font-medium">{entry.question}</h3>
              <ChevronDown
                className="size-4 shrink-0 text-tertiary transition-transform duration-150 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="prose-justify max-w-3xl px-6 pb-5 text-sm leading-relaxed text-secondary">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
