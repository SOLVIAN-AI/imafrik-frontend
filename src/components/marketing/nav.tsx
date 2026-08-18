"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Mark } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sections de la vitrine.
 *
 * Quatre entrées, pas davantage. Un menu public qui déploie une
 * douzaine de liens donne l'impression d'un site institutionnel ; ici
 * chaque entrée répond à une question qu'un directeur d'établissement se
 * pose vraiment.
 */
const LINKS = [
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#profils", label: "Cliniques & radiologues" },
  { href: "/securite", label: "Sécurité" },
  { href: "/#tarifs", label: "Tarifs" },
] as const;

/**
 * Barre de navigation publique.
 *
 * Elle se fige en haut au défilement, sur un fond flouté : sur une page
 * longue, l'appel à l'action doit rester à portée sans qu'on ait à
 * remonter. Le flou plutôt qu'un aplat opaque — le contenu qui passe
 * dessous reste deviné, ce qui rattache la barre à la page plutôt que de
 * la poser dessus.
 */
export function MarketingNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Mark className="size-7" />
          <span className="text-base font-semibold tracking-[-0.01em]">
            IMAFRIK
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-secondary transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/connexion">Se connecter</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/contact">Demander une démonstration</Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="flex size-8 items-center justify-center rounded-md text-secondary md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border-subtle px-6 py-3 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
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
            Se connecter
          </Link>
        </nav>
      )}
    </header>
  );
}
