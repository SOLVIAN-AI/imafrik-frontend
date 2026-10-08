"use client";

import { RefreshCw, Search, Siren } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { setListSearch } from "@/lib/actions/search";
import {
  LIST_SEARCH_MAX_LENGTH,
  type ListSearchScope,
} from "@/lib/search/list-search";
import { cn } from "@/lib/utils";

/**
 * Barre d'outils d'une liste d'examens : recherche, filtre des urgences,
 * actualisation.
 *
 * **Aucun état dans le composant** : la page serveur relit les filtres et
 * interroge le service avec, et la liste affichée est toujours celle qu'il
 * a renvoyée — jamais un sous-ensemble filtré dans le navigateur.
 *
 * Les deux filtres ne voyagent pas de la même façon :
 *
 * - **la recherche** porte un nom de patient : elle passe par une action
 *   serveur qui la range dans un cookie httpOnly lié au compte, et
 *   n'apparaît ni dans l'adresse, ni dans l'historique, ni dans les
 *   journaux (voir `lib/search/list-search.ts`) ;
 * - **le filtre des urgences** ne dit rien de personne : il reste dans
 *   l'adresse (`?urgent=1`), partageable par lien — c'est la destination
 *   des alertes du cockpit.
 *
 * @param scope        Liste dont la recherche est tenue.
 * @param search       Recherche en cours, relue par la page serveur.
 * @param urgentFilter Afficher le bouton « Urgences seulement ».
 */
export function ListToolbar({
  scope,
  search,
  urgentFilter = false,
}: {
  scope: ListSearchScope;
  search?: string;
  urgentFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useMessages();
  const labels = t.worklist.toolbar;
  const [pending, startTransition] = React.useTransition();
  const urgentOnly = params.get("urgent") === "1";

  const navigate = (update: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    // Un ancien lien portant encore `?q=` ne le transmet pas plus loin.
    next.delete("q");
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
          );
          startTransition(async () => {
            const result = await setListSearch(scope, value);
            if (!result.ok) toast.error(result.error);
          });
        }}
      >
        <label className="relative flex items-center">
          <span className="sr-only">{labels.searchLabel}</span>
          <Search
            className="pointer-events-none absolute left-2.5 size-3.5 text-tertiary"
            aria-hidden
          />
          <input
            name="q"
            type="search"
            // Remonté quand la recherche change côté serveur : le champ
            // reflète toujours le filtre réellement appliqué.
            key={search ?? ""}
            defaultValue={search ?? ""}
            maxLength={LIST_SEARCH_MAX_LENGTH}
            // L'historique de saisie du navigateur garderait, lui aussi,
            // les noms cherchés.
            autoComplete="off"
            placeholder={labels.searchPlaceholder}
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
          <span className="sm:hidden">{labels.urgentShort}</span>
          <span className="hidden sm:inline">{labels.urgentOnly}</span>
        </Button>
      )}

      <Button
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={() => startTransition(() => router.refresh())}
        aria-label={t.common.actions.refresh}
      >
        <RefreshCw />
        <span className="hidden sm:inline">{t.common.actions.refresh}</span>
      </Button>
    </div>
  );
}
