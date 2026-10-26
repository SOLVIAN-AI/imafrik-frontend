import { Check, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { fill, marketingCopy } from "@/content/marketing";
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
 * inventée engagerait IMAFRIK sur ce qu'aucun contrat ne porte.
 *
 * Disposition : les formules, puis la grille des forfaits face à deux
 * encarts empilés (l'honoraire du radiologue, la demande de proposition),
 * de hauteur voisine du tableau, puis ce qui est compris, en pleine
 * largeur.
 *
 * L'encart sur l'honoraire du radiologue répond à la question que pose
 * tout établissement devant une plateforme qui met en relation : qui
 * encaisse quoi. L'honoraire revient en totalité au radiologue, versé par
 * un établissement de paiement agréé, sans passer par IMAFRIK.
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
      <h3 className="label-eyebrow mt-12 text-center">{t.plansTitle}</h3>
      <ul className="mt-5 grid gap-5 sm:grid-cols-3">
        {PLAN_IDS.map((id) => {
          const plan = SUBSCRIPTIONS[id];
          return (
            <li
              key={id}
              className="rounded-2xl border border-border-subtle bg-surface-raised p-6 text-center shadow-raised"
            >
              <p className="text-lg font-semibold">{t.plans[id]}</p>
              <p className="mt-3 text-2xl font-semibold tabular-nums">
                {fill(plan.fromPrice ? t.priceFrom : t.price, {
                  amount: amount(plan.monthly),
                })}
              </p>
              <p className="mt-1 text-sm text-tertiary">{t.priceUnit}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-raised">
          <h3 className="label-eyebrow">{t.feesTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            {t.feesLead}
          </p>
          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-tertiary">
                <th scope="col" className="py-2 pr-4 font-medium">
                  {t.feesColumns.exam}
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  {t.feesColumns.normal}
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  {t.feesColumns.urgent}
                </th>
              </tr>
            </thead>
            <tbody>
              {EXAM_TYPE_IDS.map((id) => (
                <tr
                  key={id}
                  className="border-b border-border-subtle last:border-0"
                >
                  <th
                    scope="row"
                    className="py-2 pr-4 text-left font-normal text-secondary"
                  >
                    {t.exams[id]}
                  </th>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {amount(TECHNICAL_FEES[id].normal)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
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
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-raised">
            <h3 className="label-eyebrow">{t.radiologistFeeTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              {t.radiologistFeeText}
            </p>
          </div>

          <div className="flex flex-1 flex-col justify-between rounded-2xl border border-accent/30 bg-surface-raised p-8 shadow-raised">
            <div>
              <span
                className="flex size-10 items-center justify-center rounded-lg bg-accent-muted ring-1 ring-accent/25 ring-inset"
                aria-hidden
              >
                <MessageSquare className="size-4.5 text-accent" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{t.quoteTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {t.quoteText}
              </p>
            </div>

            <Button size="lg" className="mt-8 w-full" asChild>
              <Link href={localizePath("/contact", locale)}>{t.quoteCta}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-raised">
        <p className="label-eyebrow">{t.includedTitle}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        <p className="mt-8 border-t border-border-subtle pt-5 text-xs leading-relaxed text-tertiary">
          {t.noCommitment}
        </p>
      </div>
    </Section>
  );
}
