"use client";

import { Bell, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Déclencheur de la palette de commandes.
 *
 * Placé au centre plutôt qu'en bout de barre : c'est le point d'entrée
 * principal d'un outil qu'on pilote au clavier. Il affiche son raccourci,
 * parce qu'une fonction que personne ne découvre n'existe pas.
 */
function CommandTrigger() {
  return (
    <button
      type="button"
      className={cn(
        "group flex h-8 w-full max-w-md items-center gap-2 rounded-lg px-2.5",
        "border border-border-subtle bg-surface-base/60 shadow-edge",
        "text-xs text-tertiary transition-colors duration-100",
        "hover:border-border-default hover:bg-surface-hover hover:text-secondary",
      )}
    >
      <Search className="size-3.5 shrink-0" aria-hidden />
      <span className="flex-1 text-left">Rechercher un patient, un examen…</span>
      <kbd
        className={cn(
          "rounded border border-border-subtle bg-surface-raised px-1.5 py-0.5",
          "font-sans text-2xs text-tertiary",
        )}
      >
        ⌘K
      </kbd>
    </button>
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
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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
 * Barre supérieure.
 *
 * Elle porte ce qui vaut pour toute l'application — recherche globale,
 * notifications, thème — par opposition à l'en-tête de page, qui porte
 * les actions de l'écran courant. Séparer les deux évite qu'un utilisateur
 * cherche une action au mauvais endroit.
 */
export function Topbar() {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle px-4",
        "bg-surface-raised/40 backdrop-blur-sm",
      )}
    >
      <div className="flex flex-1 justify-center">
        <CommandTrigger />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell />
          <span
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent"
            aria-hidden
          />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
