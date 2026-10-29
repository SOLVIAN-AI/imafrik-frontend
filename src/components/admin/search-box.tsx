"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { setListSearch } from "@/lib/actions/search";
import { CURSOR_PARAM } from "@/lib/pagination";
import {
  LIST_SEARCH_MAX_LENGTH,
  type ListSearchScope,
} from "@/lib/search/list-search";
import { cn } from "@/lib/utils";

/**
 * Champ de recherche d'une liste de l'équipe IMAFRIK (les comptes).
 *
 * **La recherche n'entre jamais dans l'adresse** : elle porte un nom ou
 * une adresse électronique, qui finiraient dans l'historique du
 * navigateur, dans les journaux d'accès de l'hébergeur et dans tout lien
 * copié. Une action serveur la range dans un cookie httpOnly lié au
 * compte et à l'organisation active (`lib/search/list-search.ts`), et la
 * page serveur la relit. Les filtres, eux, restent dans l'adresse : ils ne
 * disent rien de personne.
 *
 * Validé à l'envoi plutôt qu'à chaque frappe : une requête au service par
 * caractère ne servirait à rien sur une liste de quelques centaines de
 * comptes.
 *
 * @param scope       Liste dont la recherche est tenue.
 * @param search      Recherche en cours, relue par la page serveur.
 * @param label       Intitulé lu par les lecteurs d'écran.
 * @param placeholder Exemple de saisie.
 */
export function SearchBox({
  scope,
  search,
  label,
  placeholder,
}: {
  scope: ListSearchScope;
  search?: string;
  label: string;
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  return (
    // Largeur minimale : sur téléphone, à côté d'un sélecteur à segments,
    // le champ passe à la ligne plutôt que de se réduire à trois lettres.
    <form
      role="search"
      className="min-w-40 flex-1 sm:flex-none"
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("q") ?? "");
        startTransition(async () => {
          // Le cookie modifié par l'action fait relire l'écran courant.
          const result = await setListSearch(scope, value);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          // Une page de liste désignait une position dans l'ancienne
          // recherche : on repart du début.
          if (params.has(CURSOR_PARAM)) {
            const next = new URLSearchParams(params);
            next.delete(CURSOR_PARAM);
            const query = next.toString();
            router.replace(query ? `${pathname}?${query}` : pathname);
          }
        });
      }}
    >
      <label className="relative flex items-center">
        <span className="sr-only">{label}</span>
        <Search
          className={cn(
            "pointer-events-none absolute left-2.5 size-3.5 text-tertiary",
            pending && "animate-pulse",
          )}
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
          placeholder={placeholder}
          className={cn(
            "h-9 w-full rounded-lg border border-border-subtle bg-surface-base/60 pr-2.5 pl-8 sm:h-8 sm:w-60",
            "text-xs placeholder:text-tertiary",
            "focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25 focus-visible:outline-none",
          )}
        />
      </label>
    </form>
  );
}
