/**
 * Langues de l'application.
 *
 * Le site public a ses propres textes (`src/content`) ; ceux de
 * l'application vivent ici, un espace de noms par zone
 * (`messages/fr/*.ts`, `messages/en/*.ts`). Le français est la langue de
 * référence : le type des textes anglais en est tiré, une entrée oubliée
 * est une erreur de compilation.
 *
 * La langue d'un utilisateur est celle de son profil (`profiles.locale`),
 * portée par la session ; en démonstration, celle du cookie de langue.
 *
 * Accès : `useMessages()` et `useLocale()` côté navigateur
 * (`@/i18n/client`), `getMessages()` côté serveur (`@/i18n/server`).
 */

import { en } from "@/i18n/messages/en";
import { fr, type AppMessages } from "@/i18n/messages/fr";
import type { Locale } from "@/lib/i18n/locale";

export type { AppMessages } from "@/i18n/messages/fr";

const MESSAGES: Record<Locale, AppMessages> = { fr, en };

/**
 * Textes de l'application dans une langue.
 *
 * @param locale Langue de l'utilisateur.
 */
export function messagesFor(locale: Locale): AppMessages {
  return MESSAGES[locale];
}
