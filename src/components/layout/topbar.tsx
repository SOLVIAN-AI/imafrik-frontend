"use client";

import { Bell, FlaskConical, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useSession } from "@/components/providers/session-provider";
import { useHydrated } from "@/hooks/use-hydrated";
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
      <span className="flex-1 text-left">
        Rechercher un patient, un examen…
      </span>
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
 * Il disparaît de lui-même dès que Supabase et l'API sont configurés.
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
      Démonstration
    </span>
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
      <div className="flex shrink-0 items-center gap-2">
        <DemoBadge />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
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
