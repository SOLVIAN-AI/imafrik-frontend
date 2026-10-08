"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { marketingCopy } from "@/content/marketing";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/locale";
import {
  isBilingualScreen,
  LANGUAGE_PARAM,
  translatePath,
} from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

/**
 * Sélecteur de langue du site public : « FR | EN ».
 *
 * Deux liens, pas un menu : avec deux langues, un menu ajouterait un clic
 * pour rien. Chaque lien mène à la **même page** dans l'autre langue
 * (`translatePath`), pas à l'accueil, et déclare sa langue (`hrefLang`,
 * `lang`) pour les lecteurs d'écran et les moteurs de recherche. Sur la
 * connexion, la même adresse est rechargée dans l'autre langue.
 *
 * Aucune redirection automatique selon la langue du navigateur : elle
 * empêcherait un visiteur anglophone de partager une page française, et
 * les moteurs de recherche d'indexer les deux versions.
 *
 * @param locale    Langue de la page.
 * @param className Classes de placement.
 */
export function LanguageSwitch({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = marketingCopy(locale).languageSwitch;

  /**
   * Adresse de la même page dans une langue. Sur un écran partagé
   * (connexion), les paramètres en cours, comme la destination demandée,
   * sont conservés.
   */
  const hrefFor = (target: Locale) => {
    if (!isBilingualScreen(pathname)) return translatePath(pathname, target);
    const params = new URLSearchParams(searchParams);
    params.set(LANGUAGE_PARAM, target);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <nav
      aria-label={t.label}
      className={cn(
        "flex items-center rounded-full border border-border-subtle p-0.5 text-2xs font-medium",
        className,
      )}
    >
      {LOCALES.map((target) => {
        const active = target === locale;
        return (
          // Un lien ordinaire, pas `<Link>` : changer de langue recharge la
          // page entière, pour que `<html lang>`, le titre et le cookie de
          // langue soient tous à jour, sans copie en cache du routeur.
          <a
            key={target}
            href={hrefFor(target)}
            hrefLang={target}
            lang={target}
            aria-current={active ? "true" : undefined}
            title={LOCALE_NAMES[target]}
            className={cn(
              "flex h-7 min-w-8 items-center justify-center rounded-full px-2 tracking-wide uppercase transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
              active
                ? "bg-surface-raised text-primary shadow-raised"
                : "text-tertiary hover:text-primary",
            )}
          >
            {target}
            <span className="sr-only"> ({LOCALE_NAMES[target]})</span>
          </a>
        );
      })}
    </nav>
  );
}
