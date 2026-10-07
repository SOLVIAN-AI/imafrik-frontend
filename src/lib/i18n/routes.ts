/**
 * Adresses du site public, dans chaque langue.
 *
 * Chaque page française a son équivalent anglais, avec une adresse dans
 * la langue de la page (`/securite` et `/en/security`) : une adresse se
 * lit, se dicte et se partage. Ce module est la seule table de
 * correspondance ; le sélecteur de langue, les liens de navigation et les
 * balises `hreflang` en dérivent.
 *
 * Module pur : ni rendu ni requête.
 */

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";

/** Préfixe des adresses anglaises. */
const EN_PREFIX = "/en";

/**
 * Pages publiques et leur adresse dans chaque langue.
 *
 * `prefix` : la page porte un paramètre après son adresse (le code d'un
 * compte-rendu à vérifier).
 */
const PAGES: readonly { fr: string; en: string; prefix?: true }[] = [
  { fr: "/", en: "/en" },
  { fr: "/contact", en: "/en/contact" },
  { fr: "/securite", en: "/en/security" },
  { fr: "/cgu", en: "/en/terms" },
  { fr: "/confidentialite", en: "/en/privacy" },
  { fr: "/mentions-legales", en: "/en/legal-notice" },
  { fr: "/verifier", en: "/en/verify", prefix: true },
];

/**
 * Ancres des sections de la page d'accueil, dans chaque langue.
 * Les clés sont les ancres françaises, qui servent de référence.
 */
export const ANCHORS: Record<string, Record<Locale, string>> = {
  fonctionnement: { fr: "fonctionnement", en: "how-it-works" },
  profils: { fr: "profils", en: "audiences" },
  tarifs: { fr: "tarifs", en: "pricing" },
};

/**
 * Langue d'une adresse.
 *
 * @param pathname Chemin demandé, sans domaine.
 */
export function localeOfPath(pathname: string): Locale {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)
    ? "en"
    : DEFAULT_LOCALE;
}

/** La page publique qui correspond à un chemin, dans une langue donnée. */
function findPage(pathname: string, locale: Locale) {
  for (const page of PAGES) {
    const base = page[locale];
    if (pathname === base) return { page, rest: "" };
    if (page.prefix && pathname.startsWith(`${base}/`))
      return { page, rest: pathname.slice(base.length) };
  }
  return null;
}

/**
 * Adresse d'une page publique dans une langue.
 *
 * L'adresse de référence est l'adresse française, ancre comprise :
 * `localizePath("/#tarifs", "en")` donne `/en#pricing`. Une adresse qui
 * n'est pas une page publique (connexion, application) est rendue telle
 * quelle : l'application n'existe qu'en français.
 *
 * @param href   Adresse française, avec ancre éventuelle.
 * @param locale Langue voulue.
 */
export function localizePath(href: string, locale: Locale): string {
  const [pathname, anchor] = href.split("#") as [string, string | undefined];
  const found = findPage(pathname, "fr");
  const base = found ? found.page[locale] + found.rest : pathname;
  if (anchor === undefined) return base;
  const localizedAnchor = ANCHORS[anchor]?.[locale] ?? anchor;
  return `${base}#${localizedAnchor}`;
}

/**
 * Adresse équivalente dans l'autre langue, pour le sélecteur.
 *
 * Une adresse sans équivalent mène à l'accueil de la langue voulue,
 * plutôt qu'à une page d'erreur.
 *
 * @param pathname Chemin courant.
 * @param target   Langue voulue.
 */
export function translatePath(pathname: string, target: Locale): string {
  const current = localeOfPath(pathname);
  if (current === target) return pathname;
  const found = findPage(pathname, current);
  if (!found) return target === "en" ? EN_PREFIX : "/";
  return found.page[target] + found.rest;
}

/**
 * Adresses d'une page dans toutes les langues, pour les balises
 * `hreflang` de ses métadonnées.
 *
 * @param frPath Adresse française de la page.
 */
export function languageAlternates(frPath: string): Record<string, string> {
  return {
    fr: localizePath(frPath, "fr"),
    en: localizePath(frPath, "en"),
    "x-default": localizePath(frPath, "fr"),
  };
}

/**
 * Pages offertes aux moteurs de recherche, par leur adresse française,
 * avec leur priorité dans le plan du site. La vérification d'un document
 * n'y figure pas : chaque adresse porte un code.
 */
export const INDEXABLE_PAGES: readonly { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/securite", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/confidentialite", priority: 0.3 },
  { path: "/mentions-legales", priority: 0.2 },
  { path: "/cgu", priority: 0.2 },
];
