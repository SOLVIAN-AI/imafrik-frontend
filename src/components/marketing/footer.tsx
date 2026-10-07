import Link from "next/link";

import { Wordmark } from "@/components/brand/brand";
import { LanguageSwitch } from "@/components/marketing/language-switch";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";

/**
 * Pied de page de la vitrine.
 *
 * Les mentions légales y figurent en clair plutôt qu'en petits
 * caractères : un service qui traite des données de santé se juge aussi
 * sur la facilité avec laquelle on trouve qui l'édite et ce qu'il fait des
 * données.
 *
 * @param locale Langue de la page.
 */
export function MarketingFooter({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).footer;
  return (
    <footer className="border-t border-border-subtle bg-surface-sunken">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Wordmark className="h-5" />
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-tertiary">
            {t.tagline}
          </p>
          <LanguageSwitch locale={locale} className="mt-5 inline-flex" />
        </div>

        {t.columns.map((column) => (
          <div key={column.title}>
            <p className="label-eyebrow">{column.title}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={localizePath(link.href, locale)}
                    // La connexion suit la langue choisie : elle n'est pas
                    // préchargée, pour être rendue avec la langue à jour.
                    prefetch={link.href === "/connexion" ? false : undefined}
                    className="text-xs text-secondary transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-2xs text-tertiary sm:flex-row sm:items-center sm:justify-between">
          <p>{t.publisher}</p>
          <p>{t.hosting}</p>
        </div>
      </div>
    </footer>
  );
}
