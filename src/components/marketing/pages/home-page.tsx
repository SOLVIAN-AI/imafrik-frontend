import { Audiences } from "@/components/marketing/audiences";
import { FinalCta } from "@/components/marketing/cta";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { SecurityTeaser } from "@/components/marketing/security-teaser";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Page d'accueil.
 *
 * L'ordre des sections suit celui d'une conversation commerciale : ce
 * que ça change (accroche), comment ça marche, pour qui, est-ce sûr,
 * combien, et les objections. Chacune répond à la question que soulève
 * la précédente.
 *
 * @param locale Langue de la page.
 */
export function HomePage({ locale }: { locale: Locale }) {
  return (
    <>
      <Hero locale={locale} />
      <HowItWorks locale={locale} />
      <Audiences locale={locale} />
      <SecurityTeaser locale={locale} />
      <Pricing locale={locale} />
      <Faq locale={locale} />
      <FinalCta locale={locale} />
    </>
  );
}
