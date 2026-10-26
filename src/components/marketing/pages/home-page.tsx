import { Audiences } from "@/components/marketing/audiences";
import { FinalCta } from "@/components/marketing/cta";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { Product } from "@/components/marketing/product";
import { Proofs } from "@/components/marketing/proofs";
import { Reveal } from "@/components/marketing/reveal";
import { SecurityTeaser } from "@/components/marketing/security-teaser";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Page d'accueil.
 *
 * L'ordre des sections suit celui d'une conversation commerciale : ce
 * que ça change (accroche, et ce que le service garantit), comment ça
 * marche, à quoi ça ressemble (le produit), pour qui, est-ce sûr,
 * combien, et les objections. Chacune répond à la question que soulève
 * la précédente.
 *
 * @param locale Langue de la page.
 * @param steps  Section à la place de « Fonctionnement » : le parcours
 *               animé de l'aperçu `/apercu/parcours`, avant sa mise en
 *               ligne. Passée par la page d'aperçu, et non choisie ici :
 *               le parcours, son script et ses textes restent ainsi hors
 *               du JavaScript de l'accueil.
 */
export function HomePage({
  locale,
  steps,
}: {
  locale: Locale;
  steps?: React.ReactNode;
}) {
  return (
    <>
      <Reveal />
      <Hero locale={locale} />
      <Proofs locale={locale} />
      {steps ?? <HowItWorks locale={locale} />}
      <Product locale={locale} />
      <Audiences locale={locale} />
      <SecurityTeaser locale={locale} />
      <Pricing locale={locale} />
      <Faq locale={locale} />
      <FinalCta locale={locale} />
    </>
  );
}
