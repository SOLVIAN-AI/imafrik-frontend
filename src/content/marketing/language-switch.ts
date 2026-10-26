import type { Locale } from "@/lib/i18n/locale";

/**
 * Nom accessible du sélecteur de langue, dans chaque langue.
 *
 * À part des textes du site : le sélecteur est un composant client, présent
 * aussi sur la connexion, et n'a besoin que de ce libellé. Importer les
 * textes complets du site l'aurait fait télécharger, dans les deux
 * langues, par chaque visiteur.
 */
export const LANGUAGE_SWITCH_LABEL: Record<Locale, string> = {
  fr: "Langue du site",
  en: "Website language",
};
