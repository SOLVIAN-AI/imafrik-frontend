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

import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/locale";

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
 * plutôt qu'à une page d'erreur. Un écran partagé (connexion) garde son
 * adresse : le paramètre `langue` fait poser le cookie par le proxy, qui
 * redirige ensuite vers l'adresse sans paramètre.
 *
 * @param pathname Chemin courant.
 * @param target   Langue voulue.
 */
export function translatePath(pathname: string, target: Locale): string {
  if (isBilingualScreen(pathname))
    return `${pathname}?${LANGUAGE_PARAM}=${target}`;
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

/**
 * Cookie de la langue choisie sur le site public.
 *
 * Posé à chaque visite d'une page publique, il fait suivre la même langue
 * aux écrans qui font le pont entre le site et l'application : un visiteur
 * du site anglais qui clique sur « Sign in » arrive sur une connexion en
 * anglais. Il ne contient qu'un code de langue, rien de personnel.
 */
export const LANGUAGE_COOKIE = "imafrik-langue";

/** Durée de vie du cookie de langue, en secondes : un an. */
export const LANGUAGE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/** Paramètre d'adresse par lequel le sélecteur change la langue d'un écran partagé. */
export const LANGUAGE_PARAM = "langue";

/**
 * Écrans d'entrée, atteints depuis le site avant toute session : ils
 * portent le sélecteur de langue du site (`?langue=en`). Une fois
 * connecté, la langue se règle dans les paramètres.
 */
export const BILINGUAL_SCREENS: readonly string[] = [
  "/connexion",
  "/mot-de-passe-oublie",
];

/** Vrai si le chemin est une page du site public, dans l'une ou l'autre langue. */
export function isPublicSitePath(pathname: string): boolean {
  return LOCALES.some((locale) => findPage(pathname, locale) !== null);
}

/** Vrai si le chemin est un écran partagé qui suit la langue choisie. */
export function isBilingualScreen(pathname: string): boolean {
  return BILINGUAL_SCREENS.includes(pathname);
}

/**
 * Langue d'une page, pour `<html lang>` dès le premier octet.
 *
 * - le site public : la langue de son adresse ;
 * - tout le reste (connexion, application) : la langue choisie (cookie),
 *   le français à défaut. Le cookie suit la langue du site visité, puis
 *   celle du profil, posée à la connexion et à chaque changement de
 *   préférence ; les textes de l'application, eux, suivent toujours le
 *   profil (`Session.locale`).
 *
 * @param pathname Chemin demandé.
 * @param chosen   Valeur du cookie de langue, si présent.
 */
export function resolveLocale(
  pathname: string,
  chosen: string | undefined,
): Locale {
  if (localeOfPath(pathname) === "en") return "en";
  if (isPublicSitePath(pathname)) return DEFAULT_LOCALE;
  return chosen === "en" ? "en" : DEFAULT_LOCALE;
}
