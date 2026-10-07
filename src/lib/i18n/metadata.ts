import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n/locale";
import { languageAlternates, localizePath } from "@/lib/i18n/routes";

/** Locale Open Graph de chaque langue. */
const OG_LOCALE: Record<Locale, string> = { fr: "fr_FR", en: "en_GB" };

/**
 * Métadonnées d'une page publique dans une langue.
 *
 * Chaque page déclare son adresse canonique et ses équivalents dans les
 * autres langues (`hreflang`) : un moteur de recherche sert alors la bonne
 * version à chacun, au lieu de considérer les deux comme du contenu
 * dupliqué.
 *
 * @param locale  Langue de la page.
 * @param frPath  Adresse française de référence.
 * @param page    Titre, description, et indexation (vrai par défaut).
 */
export function publicPageMetadata(
  locale: Locale,
  frPath: string,
  page: {
    title: string;
    description: string;
    /** `absolute` : titre complet, sans le gabarit « %s · IMAFRIK ». */
    absoluteTitle?: boolean;
    index?: boolean;
  },
): Metadata {
  const index = page.index ?? true;
  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: {
      canonical: localizePath(frPath, locale),
      languages: languageAlternates(frPath),
    },
    openGraph: {
      title: page.title,
      description: page.description,
      locale: OG_LOCALE[locale],
      alternateLocale: Object.entries(OG_LOCALE)
        .filter(([key]) => key !== locale)
        .map(([, value]) => value),
    },
    robots: { index, follow: index },
  };
}
