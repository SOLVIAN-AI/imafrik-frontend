import "server-only";

import { headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_HEADER,
  type Locale,
} from "@/lib/i18n/locale";

/**
 * Langue de la requête en cours, telle que le proxy l'a résolue
 * (`resolveLocale`) : l'adresse sur le site public, la langue choisie sur
 * la connexion, le français ailleurs.
 */
export async function requestLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
