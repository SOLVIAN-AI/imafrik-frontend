import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import {
  EXAM_TYPE_IDS,
  PLAN_IDS,
  SUBSCRIPTIONS,
  TECHNICAL_FEES,
} from "@/content/marketing/pricing";
import { formatCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { ANCHORS, localizePath } from "@/lib/i18n/routes";

/**
 * Prix d'une formule, le montant en grand, le reste du libellé à sa
 * taille. Le gabarit (`{amount} FCFA`, `dès {amount} FCFA`) garde l'ordre
 * des mots de chaque langue, et ses espaces : le texte lu (lecteur
 * d'écran, copier-coller) reste « 12 500 FCFA », l'écart visible venant de
 * la mise en page.
 */
function Price({ template, amount }: { template: string; amount: string }) {
  const [before, after] = template.split("{amount}");
  return (
    <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
      {before && (
        <span className="text-sm font-medium text-secondary">{before}</span>
      )}
      <span className="text-[2.5rem] leading-none font-semibold tracking-[-0.04em] tabular-nums">
        {amount}
      </span>
      {after && (
        <span className="text-sm font-medium text-secondary">{after}</span>
      )}
    </p>
  );
}

/**
 * Section tarifaire.
 *
 * **La grille est publiée en entier.** Un service de santé qui cache ses
 * prix inquiète : la page montre les deux seuls postes qu'IMAFRIK facture,
 * l'abonnement mensuel de chaque formule et le forfait technique de chaque
 * type d'examen, en délai normal ou en urgence. Les montants viennent de
 * `content/marketing/pricing.ts`, partagé par les deux langues.
 *
 * Les formules ne sont décrites que par leur nom et leur prix : leur
 * contenu n'est pas encore arrêté, et une liste de fonctionnalités
 * inventée engagerait IMAFRIK sur ce qu'aucun contrat ne porte. Pour la
 * même raison, aucune n'est désignée « la plus choisie ».
 *
 * Disposition : les formules, puis la grille des forfaits face à
 * l'honoraire du radiologue et à la demande de proposition, puis ce qui
 * est compris, en pleine largeur.
 *
 * **L'honoraire du radiologue est mis en exergue** (« 100 % ») : c'est la
 * question que pose tout établissement devant une plateforme qui met en
 * relation, qui encaisse quoi, et la réponse est la singularité du modèle.
 *
 * La liste de ce qui est compris écarte la crainte du coût caché : ce
 * qu'on redoute n'est pas le prix affiché, mais les frais annexes
 * (installation, licence, maintenance, stockage).
 *
 * @param locale Langue de la page.
 */
export function Pricing({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).pricing;
  const amount = (value: number) => formatCount(value, locale);
  return (
    <Section
      id={ANCHORS.tarifs[locale]}
      eyebrow={t.eyebrow}
      title={t.title}
      lead={t.lead}
    >
      <h3 className="label-eyebrow mt-14 text-center">{t.plansTitle}</h3>
      <ul className="mt-5 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {PLAN_IDS.map((id, index) => {
          const plan = SUBSCRIPTIONS[id];
          return (
            <li
              key={id}
              data-reveal
              style={{ "--reveal-order": index } as React.CSSProperties}
              className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised p-7 shadow-raised"
            >
              {/* Trois coupes du logotype, une de plus par formule. */}
              <span className="flex gap-1" aria-hidden>
                {PLAN_IDS.map((other, rank) => (
                  <span
                    key={other}
                    className={
                      rank <= index
                        ? "h-1 w-5 rounded-full bg-accent"
                        : "h-1 w-5 rounded-full bg-border-default"
                    }
                  />
                ))}
              </span>
              <p className="mt-5 text-lg font-semibold">{t.plans[id]}</p>
              <Price
                template={plan.fromPrice ? t.priceFrom : t.price}
                amount={amount(plan.monthly)}
              />
              <p className="mt-2 text-sm text-tertiary">{t.priceUnit}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div
          data-reveal
          className="flex flex-col rounded-2xl border border-border-subtle bg-surface-raised p-7 shadow-raised sm:p-8"
        >
          <h3 className="label-eyebrow">{t.feesTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            {t.feesLead}
          </p>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-xs text-tertiary">
                <th scope="col" className="pb-2.5 pr-4 font-medium">
                  {t.feesColumns.exam}
                </th>
                <th scope="col" className="pb-2.5 pr-4 text-right font-medium">
                  {t.feesColumns.normal}
                </th>
                <th scope="col" className="pb-2.5 text-right font-medium">
                  {t.feesColumns.urgent}
                </th>
              </tr>
            </thead>
            <tbody>
              {EXAM_TYPE_IDS.map((id) => (
                <tr
                  key={id}
                  className="border-b border-border-subtle transition-colors last:border-0 hover:bg-surface-hover/60"
                >
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left font-normal text-secondary"
                  >
                    {t.exams[id]}
                  </th>
                  <td className="py-3 pr-4 text-right font-medium tabular-nums">
                    {amount(TECHNICAL_FEES[id].normal)}
                  </td>
                  <td className="py-3 text-right font-medium tabular-nums">
                    {amount(TECHNICAL_FEES[id].urgent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-auto pt-5 text-xs leading-relaxed text-tertiary">
            {t.feesNote}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div
            data-reveal
            className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface-raised p-7 shadow-raised sm:p-8"
          >
            <div
              className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, var(--glow-accent), transparent)",
              }}
              aria-hidden
            />
            <h3 className="label-eyebrow relative">{t.radiologistFeeTitle}</h3>
            <p className="relative mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-brand-gradient text-5xl leading-none font-semibold tracking-[-0.04em]">
                {t.radiologistFeeFigure}
              </span>
              <span className="text-sm font-medium text-secondary">
                {t.radiologistFeeFigureLabel}
              </span>
            </p>
            <p className="relative mt-4 text-sm leading-relaxed text-secondary">
              {t.radiologistFeeText}
            </p>
          </div>

          <div
            data-reveal
            className="flex flex-1 flex-col justify-between rounded-2xl border border-border-subtle bg-surface-raised p-7 shadow-raised sm:p-8"
          >
            <div>
              <h3 className="text-xl font-semibold">{t.quoteTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {t.quoteText}
              </p>
            </div>
            <Button size="xl" className="mt-7 w-full" asChild>
              <Link href={localizePath("/contact", locale)}>
                {t.quoteCta}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div
        data-reveal
        className="mt-5 rounded-2xl border border-border-subtle bg-surface-raised/60 p-7 sm:p-8"
      >
        <p className="label-eyebrow">{t.includedTitle}</p>
        <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.included.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-secondary">
              <Check
                className="mt-0.5 size-4 shrink-0 text-accent"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-7 border-t border-border-subtle pt-5 text-xs leading-relaxed text-tertiary">
          {t.noCommitment}
        </p>
      </div>
    </Section>
  );
}
