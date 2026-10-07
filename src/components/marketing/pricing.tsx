import { Check, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { ANCHORS, localizePath } from "@/lib/i18n/routes";

/**
 * Section tarifaire.
 *
 * **Aucun prix affiché, et c'est délibéré.** Le tarif dépend du volume,
 * des modalités et du niveau d'urgence retenu ; publier un montant
 * unique tromperait la moitié des visiteurs. Ce que la page doit faire,
 * c'est dire *comment* on facture — à l'acte, sans abonnement, sans
 * frais d'installation — parce que c'est cela qui lève l'objection.
 *
 * Une grille chiffrée remplacera ce bloc dès que les premiers contrats
 * auront établi les paliers.
 *
 * La liste de ce qui est compris sert à écarter la crainte du coût caché :
 * dans un service facturé à l'acte, ce qu'on redoute n'est pas le prix
 * unitaire mais les frais annexes (installation, licence, maintenance,
 * stockage).
 *
 * @param locale Langue de la page.
 */
export function Pricing({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).pricing;
  return (
    <Section
      id={ANCHORS.tarifs[locale]}
      eyebrow={t.eyebrow}
      title={t.title}
      lead={t.lead}
    >
      <div className="mt-12 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-raised">
          <p className="label-eyebrow">{t.includedTitle}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
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

        <div className="flex flex-col justify-between rounded-2xl border border-accent/30 bg-surface-raised p-8 shadow-raised">
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
    </Section>
  );
}
