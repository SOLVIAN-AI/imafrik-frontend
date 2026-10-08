import "server-only";

import { messagesFor, type AppMessages } from "@/i18n";
import type { Locale } from "@/lib/i18n/locale";
import { requestLocale } from "@/lib/i18n/server";
import { getAuthState } from "@/lib/session/server";

/**
 * Langue de l'utilisateur, côté serveur.
 *
 * Celle de son profil quand une session est ouverte ; à défaut, celle de
 * la requête (cookie de langue, choisi sur le site public).
 */
export async function getLocale(): Promise<Locale> {
  const state = await getAuthState();
  return typeof state === "string" ? requestLocale() : state.locale;
}

/**
 * Textes de l'application dans la langue de l'utilisateur, côté serveur.
 *
 * @example
 * ```tsx
 * const { t } = await getMessages();
 * export const metadata = { title: t.nav.items.worklist };
 * ```
 */
export async function getMessages(): Promise<{
  t: AppMessages;
  locale: Locale;
}> {
  const locale = await getLocale();
  return { t: messagesFor(locale), locale };
}
