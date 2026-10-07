"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { marketingCopy } from "@/content/marketing";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/locale";
import { translatePath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

/**
 * Sélecteur de langue du site public : « FR | EN ».
 *
 * Deux liens, pas un menu : avec deux langues, un menu ajouterait un clic
 * pour rien. Chaque lien mène à la **même page** dans l'autre langue
 * (`translatePath`), pas à l'accueil, et déclare sa langue (`hrefLang`,
 * `lang`) pour les lecteurs d'écran et les moteurs de recherche.
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
  const t = marketingCopy(locale).languageSwitch;

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
          <Link
            key={target}
            href={translatePath(pathname, target)}
            hrefLang={target}
            lang={target}
            aria-current={active ? "true" : undefined}
            title={LOCALE_NAMES[target]}
            prefetch={false}
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
          </Link>
        );
      })}
    </nav>
  );
}
