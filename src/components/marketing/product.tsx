import { ProductTabs } from "@/components/marketing/product-tabs";
import { Section } from "@/components/marketing/section";
import { marketingCopy } from "@/content/marketing";
import { PRODUCT_SCREENS, productScreen } from "@/content/marketing/visuals";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Le produit, tel qu'il est.
 *
 * Des captures de l'application, pas une maquette : la file de lecture du
 * radiologue, un compte-rendu signé, le tableau de bord d'un
 * établissement. Elles sont prises en mode démonstration
 * (`tools/captures-produit/capturer.mjs`), dans la langue de la page et
 * dans le thème où chaque écran se vit, sombre pour le radiologue, clair
 * pour l'établissement. Les données affichées sont fictives, et la page le
 * dit sous les captures : une capture de production exposerait des noms
 * de patients.
 *
 * @param locale Langue de la page.
 */
export function Product({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).product;
  return (
    <Section eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <div data-reveal>
        <ProductTabs
          label={t.tabsLabel}
          screens={t.screens.map((screen, index) => ({
            ...screen,
            visual: productScreen(PRODUCT_SCREENS[index], locale),
          }))}
        />
      </div>
      <p className="mt-4 text-center text-2xs text-tertiary">{t.note}</p>
    </Section>
  );
}
