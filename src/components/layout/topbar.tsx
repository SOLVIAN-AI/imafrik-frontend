"use client";

import { FlaskConical, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import * as React from "react";

import { Mark } from "@/components/layout/brand";
import {
  CommandPalette,
  usePaletteShortcut,
} from "@/components/layout/command-palette";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useSession } from "@/components/providers/session-provider";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import type { NavCounts } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Accès à la palette de commandes, au centre de la barre.
 *
 * Il a l'apparence d'un champ de recherche parce que c'est l'usage qu'on
 * en attend — trouver un patient — mais ouvre la palette, qui cherche
 * aussi les écrans et les réglages. Le raccourci affiché est celui du
 * système : ⌘K sur Mac, Ctrl K ailleurs. Il n'est connu qu'après
 * l'hydratation ; avant, seul `/`, commun à tous, est affiché.
 */
function SearchTrigger() {
  const [open, setOpen] = React.useState(false);
  const hydrated = useHydrated();
  const openPalette = React.useCallback(() => setOpen(true), []);
  usePaletteShortcut(openPalette);

  const mac = hydrated && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      {/* Téléphone : une loupe suffit, le champ ne tiendrait pas. */}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Rechercher"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-hover hover:text-primary sm:hidden"
      >
        <Search className="size-4.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={openPalette}
        className={cn(
          "group hidden h-8 w-full max-w-md items-center gap-2 rounded-lg px-2.5 sm:flex",
          "border border-border-subtle bg-surface-base/60 shadow-edge",
          "text-xs text-tertiary transition-colors duration-100",
          "hover:border-border-default hover:text-secondary",
        )}
      >
        <Search className="size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">
          Rechercher un patient, un écran…
        </span>
        <kbd
          className="rounded border border-border-subtle bg-surface-raised px-1.5 py-0.5 font-sans text-2xs text-tertiary"
          aria-hidden
        >
          {hydrated ? (mac ? "⌘ K" : "Ctrl K") : "/"}
        </kbd>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

/**
 * Bascule de thème.
 *
 * Rendue inerte jusqu'à l'hydratation : le thème courant n'est pas connu
 * du serveur, et afficher la mauvaise icône puis la corriger produirait
 * un clignotement.
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();

  // Avant l'hydratation, le thème réel est inconnu du serveur. Icône ET
  // étiquette doivent donc rester neutres : les faire dépendre du thème
  // supposé produirait une divergence serveur/client — React la signale,
  // et un lecteur d'écran annoncerait brièvement l'inverse de la réalité.
  const dark = resolvedTheme !== "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={
        mounted
          ? dark
            ? "Passer en thème clair"
            : "Passer en thème sombre"
          : "Changer de thème"
      }
    >
      {mounted && (dark ? <Sun /> : <Moon />)}
    </Button>
  );
}

/**
 * Marqueur de jeu de démonstration.
 *
 * **Présent dès qu'aucun service réel n'est branché**, et volontairement
 * impossible à confondre avec le reste du châssis. Un portail de
 * téléradiologie qui affiche des noms de patients doit dire, sans qu'on
 * ait à le demander, si ces noms sont inventés : quelqu'un qui découvre
 * l'application sur un aperçu ne peut pas le deviner, et un
 * établissement qui verrait de vraies données là où il n'y en a pas —
 * ou l'inverse — perdrait confiance pour de bon.
 *
 * Il disparaît de lui-même dès que Supabase et l'API sont tous deux
 * configurés — la même règle que celle qui fait servir le jeu de
 * démonstration (`lib/demo/mode.ts`).
 */
function DemoBadge() {
  const { isDemo } = useSession();
  if (!isDemo) return null;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1",
        "bg-progress-muted text-2xs font-medium text-progress",
        "ring-1 ring-progress/25 ring-inset",
      )}
      title="Aucune donnée réelle : les patients et les examens affichés sont inventés."
    >
      <FlaskConical className="size-3" aria-hidden />
      <span className="hidden sm:inline">Démonstration</span>
      <span className="sr-only sm:hidden">Démonstration</span>
    </span>
  );
}

/**
 * Barre supérieure.
 *
 * Elle porte ce qui vaut pour toute l'application — palette de commandes,
 * thème, mention de démonstration — par opposition à l'en-tête de page,
 * qui porte les actions de l'écran courant. Séparer les deux évite qu'un utilisateur
 * cherche une action au mauvais endroit.
 */
export function Topbar({ counts }: { counts: NavCounts | null }) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b border-border-subtle px-2 sm:gap-3 sm:px-4",
        "bg-surface-raised/40 backdrop-blur-sm",
      )}
    >
      {/* Téléphone et tablette : menu et marque, la barre latérale étant
          repliée dans un tiroir. */}
      <MobileNav counts={counts} />
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 lg:hidden"
        aria-label="IMAFRIK — accueil"
      >
        <Mark className="size-6" />
        <span className="hidden text-sm font-semibold tracking-[-0.01em] sm:inline">
          IMAFRIK
        </span>
      </Link>
      <div className="flex min-w-0 flex-1 justify-end sm:justify-center">
        <SearchTrigger />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <DemoBadge />
        <ThemeToggle />
      </div>
    </div>
  );
}
