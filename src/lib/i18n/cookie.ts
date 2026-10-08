import "server-only";

import { cookies } from "next/headers";

import type { Locale } from "@/lib/i18n/locale";
import { LANGUAGE_COOKIE, LANGUAGE_COOKIE_MAX_AGE } from "@/lib/i18n/routes";

/**
 * Pose le cookie de langue depuis une action serveur.
 *
 * Il donne à `<html lang>` la bonne langue dès le premier octet (le proxy
 * le lit) ; les textes de l'application, eux, suivent le profil. Mêmes
 * attributs que le cookie posé par le proxy sur le site public.
 *
 * @param locale Langue choisie.
 */
export async function writeLanguageCookie(locale: Locale): Promise<void> {
  (await cookies()).set(LANGUAGE_COOKIE, locale, {
    path: "/",
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
