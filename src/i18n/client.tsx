"use client";

import * as React from "react";

import { messagesFor, type AppMessages } from "@/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";

const LocaleContext = React.createContext<Locale>(DEFAULT_LOCALE);

/**
 * Fournit la langue de l'utilisateur à l'arbre client.
 *
 * Posé par `SessionProvider` (langue du profil) et par la disposition des
 * écrans d'authentification (langue choisie sur le site). Les deux
 * dictionnaires sont dans le paquet du navigateur : changer de langue ne
 * demande aucun chargement.
 *
 * @param locale Langue à fournir.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

/** Langue de l'utilisateur. */
export function useLocale(): Locale {
  return React.useContext(LocaleContext);
}

/**
 * Textes de l'application dans la langue de l'utilisateur.
 *
 * @example
 * ```tsx
 * const t = useMessages();
 * return <Button>{t.common.actions.save}</Button>;
 * ```
 */
export function useMessages(): AppMessages {
  return messagesFor(useLocale());
}
