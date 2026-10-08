import { en } from "@/content/marketing/en";
import { fr } from "@/content/marketing/fr";
import type { MarketingCopy } from "@/content/marketing/types";
import type { Locale } from "@/lib/i18n/locale";

export type { MarketingCopy } from "@/content/marketing/types";

const COPY: Record<Locale, MarketingCopy> = { fr, en };

/**
 * Textes du site public dans une langue.
 *
 * @param locale Langue de la page.
 */
export function marketingCopy(locale: Locale): MarketingCopy {
  return COPY[locale];
}

/**
 * Remplace les variables `{nom}` d'un texte.
 *
 * Une variable absente reste écrite telle quelle : une phrase visiblement
 * incomplète se repère en relecture, une phrase silencieusement tronquée
 * non.
 *
 * @param template Texte à variables.
 * @param values   Valeurs, par nom.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
