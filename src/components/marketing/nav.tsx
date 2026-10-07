"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Wordmark } from "@/components/brand/brand";
import { LanguageSwitch } from "@/components/marketing/language-switch";
import { Button } from "@/components/ui/button";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

/**
 * Barre de navigation publique.
 *
 * Elle se fige en haut au défilement, sur un fond flouté : sur une page
 * longue, l'appel à l'action doit rester à portée sans qu'on ait à
 * remonter. Le flou plutôt qu'un aplat opaque — le contenu qui passe
 * dessous reste deviné, ce qui rattache la barre à la page plutôt que de
 * la poser dessus.
 *
 * Quatre entrées, pas davantage : un menu public qui déploie une douzaine
 * de liens donne l'impression d'un site institutionnel ; ici chaque entrée
 * répond à une question qu'un directeur d'établissement se pose vraiment.
 *
 * @param locale Langue de la page.
 */
export function MarketingNav({ locale }: { locale: Locale }) {
  const [open, setOpen] = React.useState(false);
  const t = marketingCopy(locale).nav;
  const links = t.links.map((link) => ({
    ...link,
    href: localizePath(link.href, locale),
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:gap-8">
        <Link
          href={localizePath("/", locale)}
          aria-label={t.home}
          className="flex min-h-6 shrink-0 items-center gap-2.5"
        >
          <Wordmark className="h-6" />
        </Link>

        <nav className="hidden flex-1 items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-secondary transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <LanguageSwitch locale={locale} className="hidden sm:flex" />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/connexion">{t.signIn}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={localizePath("/contact", locale)}>
              {/* Libellé court sur téléphone : le long ne tient pas à côté
                  du logo et du menu. */}
              <span className="sm:hidden">{t.demoShort}</span>
              <span className="hidden sm:inline">{t.demoLong}</span>
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? t.closeMenu : t.openMenu}
            aria-expanded={open}
            className="flex size-9 items-center justify-center rounded-md text-secondary transition-colors hover:bg-surface-hover hover:text-primary lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border-subtle px-4 py-3 sm:px-6 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-md px-2 py-2 text-sm text-secondary",
                "transition-colors hover:bg-surface-hover hover:text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/connexion"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-2 text-sm text-secondary transition-colors hover:bg-surface-hover hover:text-primary sm:hidden"
          >
            {t.signIn}
          </Link>
          <LanguageSwitch
            locale={locale}
            className="mt-2 self-start sm:hidden"
          />
        </nav>
      )}
    </header>
  );
}
