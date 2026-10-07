/**
 * Langues du site public.
 *
 * Le site public existe en français et en anglais ; l'application (portails
 * clinique, radiologue, administration) reste en français pour l'instant.
 * Le français est la langue par défaut : ses adresses n'ont pas de préfixe,
 * celles de l'anglais commencent par `/en`.
 */

/** Langues proposées, dans l'ordre du sélecteur. */
export const LOCALES = ["fr", "en"] as const;

/** Une langue du site public. */
export type Locale = (typeof LOCALES)[number];

/** Langue des adresses sans préfixe. */
export const DEFAULT_LOCALE: Locale = "fr";

/**
 * En-tête de requête posé par le proxy : la langue déduite de l'adresse.
 * La disposition racine le lit pour écrire `<html lang>`.
 */
export const LOCALE_HEADER = "x-imafrik-locale";

/** Locale `Intl` de chaque langue, pour les dates et les nombres. */
export const INTL_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
};

/** Nom de chaque langue, écrit dans cette langue. */
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/**
 * Vrai si la valeur désigne une langue du site.
 *
 * @param value Valeur reçue, par exemple d'un en-tête.
 */
export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}
