import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppPreview } from "@/components/marketing/app-preview";
import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/**
 * Accroche de la page d'accueil.
 *
 * Elle dit ce que le service change, pas ce qu'il est : un directeur
 * d'établissement ne cherche pas « une plateforme de téléradiologie », il
 * cherche à ne plus attendre trois jours un compte-rendu de scanner.
 *
 * Le second paragraphe répond immédiatement à l'objection technique, qui
 * arrive toujours en deuxième : *que faut-il changer chez nous ?* La
 * réponse — rien, un logiciel s'installe à côté — désamorce le sujet
 * avant qu'il ne bloque la conversation.
 *
 * **Les délais sont présentés comme des engagements, jamais comme des
 * mesures.** Aucun examen n'a encore été lu : afficher « délai moyen
 * constaté » serait invérifiable. Ce sont des délais contractuels, et
 * l'étiquette le dit. Ils devront être confrontés au réel dès les premiers
 * mois, et revus s'ils ne tiennent pas.
 *
 * @param locale Langue de la page.
 */
export function Hero({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).hero;
  return (
    <section className="relative overflow-hidden">
      {/* Trois sources lumineuses décalées. Un dégradé centré produirait
          une symétrie qui trahit le gabarit ; décalées, elles donnent
          l'impression d'une lumière venue de hors cadre. */}
      <div
        className="pointer-events-none absolute -top-64 -left-40 size-[42rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-accent), transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-40 right-0 size-[36rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-brand), transparent)",
        }}
        aria-hidden
      />
      <div
        className="dot-grid pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-muted px-3 py-1 text-2xs font-medium tracking-wide text-accent uppercase">
            <Sparkles className="size-3" aria-hidden />
            {t.badge}
          </span>

          <h1 className="mt-7 text-4xl font-semibold text-balance md:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            {t.title.before}
            <span className="text-brand-gradient">{t.title.highlight}</span>
            {t.title.after}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-secondary md:text-lg">
            {t.lead}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href={localizePath("/contact", locale)}>
                {t.primaryCta}
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href={localizePath("/securite", locale)}>
                {t.secondaryCta}
              </Link>
            </Button>
          </div>

          <div className="mt-14">
            <p className="label-eyebrow">{t.commitmentsTitle}</p>
            <dl className="mt-4 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {t.commitments.map((commitment) => (
                <div key={commitment.label} className="text-center">
                  <dt className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                    {commitment.value}
                  </dt>
                  <dd className="mt-1 text-xs text-tertiary">
                    {commitment.label}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-2xs text-tertiary">{t.commitmentsNote}</p>
          </div>
        </div>

        <AppPreview className="mt-16" />
      </div>
    </section>
  );
}
