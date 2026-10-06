"use client";

import { FlaskConical, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useSession } from "@/components/providers/session-provider";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Liste où cherche chaque portail : celle que l'utilisateur consulte le plus. */
const SEARCH_TARGET = {
  radiologist: "/worklist",
  clinic_staff: "/examens",
  platform_admin: "/admin/examens",
} as const;

/**
 * Recherche globale.
 *
 * Elle mène à la liste principale du portail, filtrée : la file de
 * lecture pour un radiologue, le suivi pour une clinique, tous les
 * examens pour l'équipe IMAFRIK. La recherche elle-même est faite par le
 * service, sur le périmètre de l'utilisateur.
 *
 * `/` place le curseur dans le champ depuis n'importe quel écran, sauf
 * quand on écrit déjà ailleurs — dans un compte-rendu, notamment.
 */
function GlobalSearch() {
  const router = useRouter();
  const { active } = useSession();
  const input = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const focus = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", focus);
    return () => window.removeEventListener("keydown", focus);
  }, []);

  return (
    <form
      role="search"
      className="w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        const query = input.current?.value.trim() ?? "";
        const target = SEARCH_TARGET[active.role];
        router.push(
          query ? `${target}?q=${encodeURIComponent(query)}` : target,
        );
      }}
    >
      <label
        className={cn(
          "group flex h-8 w-full items-center gap-2 rounded-lg px-2.5",
          "border border-border-subtle bg-surface-base/60 shadow-edge",
          "text-xs text-tertiary transition-colors duration-100",
          "focus-within:border-accent hover:border-border-default",
        )}
      >
        <Search className="size-3.5 shrink-0" aria-hidden />
        <span className="sr-only">Rechercher un patient ou un examen</span>
        <input
          ref={input}
          type="search"
          placeholder="Rechercher un patient, un examen…"
          className="min-w-0 flex-1 bg-transparent text-primary placeholder:text-tertiary focus:outline-none"
        />
        <kbd
          className={cn(
            "rounded border border-border-subtle bg-surface-raised px-1.5 py-0.5",
            "font-sans text-2xs text-tertiary",
          )}
          aria-hidden
        >
          /
        </kbd>
      </label>
    </form>
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
      Démonstration
    </span>
  );
}

/**
 * Barre supérieure.
 *
 * Elle porte ce qui vaut pour toute l'application — recherche globale,
 * thème, mention de démonstration — par opposition à l'en-tête de page,
 * qui porte les actions de l'écran courant. Séparer les deux évite qu'un utilisateur
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
        <GlobalSearch />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <DemoBadge />
        <ThemeToggle />
      </div>
    </div>
  );
}
