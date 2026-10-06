"use client";

import { RefreshCw, Search, Siren } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Barre d'outils d'une liste d'examens : recherche, filtre des urgences,
 * actualisation.
 *
 * **L'état vit dans l'adresse** (`?q=…&urgent=1`), pas dans le composant :
 * la page serveur relit les paramètres et interroge le service avec. Un
 * filtre se partage donc par lien, survit au rechargement, et la liste
 * affichée est toujours celle que le service a renvoyée — jamais un
 * sous-ensemble filtré dans le navigateur.
 *
 * @param urgentFilter Afficher le bouton « Urgences seulement ».
 */
export function ListToolbar({
  urgentFilter = false,
}: {
  urgentFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();
  const urgentOnly = params.get("urgent") === "1";

  const navigate = (update: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    update(next);
    const query = next.toString();
    startTransition(() =>
      router.replace(query ? `${pathname}?${query}` : pathname),
    );
  };

  return (
    // Pleine largeur sur téléphone : le champ prend la place disponible et
    // les boutons se réduisent à leur icône.
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <form
        role="search"
        className="min-w-0 flex-1 sm:flex-none"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(
            new FormData(event.currentTarget).get("q") ?? "",
          ).trim();
          navigate((next) => (value ? next.set("q", value) : next.delete("q")));
        }}
      >
        <label className="relative flex items-center">
          <span className="sr-only">Rechercher un patient ou une modalité</span>
          <Search
            className="pointer-events-none absolute left-2.5 size-3.5 text-tertiary"
            aria-hidden
          />
          <input
            name="q"
            type="search"
            defaultValue={params.get("q") ?? ""}
            placeholder="Patient, identifiant, modalité…"
            className={cn(
              "h-9 w-full rounded-lg border border-border-subtle bg-surface-base/60 pr-2.5 pl-8 sm:h-8 sm:w-56",
              "text-xs placeholder:text-tertiary",
              "focus-visible:border-accent focus-visible:outline-none",
            )}
          />
        </label>
      </form>

      {urgentFilter && (
        <Button
          variant={urgentOnly ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={urgentOnly}
          onClick={() =>
            navigate((next) =>
              urgentOnly ? next.delete("urgent") : next.set("urgent", "1"),
            )
          }
        >
          <Siren />
          <span className="sm:hidden">Urgences</span>
          <span className="hidden sm:inline">Urgences seulement</span>
        </Button>
      )}

      <Button
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={() => startTransition(() => router.refresh())}
        aria-label="Actualiser"
      >
        <RefreshCw />
        <span className="hidden sm:inline">Actualiser</span>
      </Button>
    </div>
  );
}
