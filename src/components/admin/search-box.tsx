"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Champ de recherche porté par l'adresse (`?q=…`).
 *
 * Validé à l'envoi plutôt qu'à chaque frappe : une requête au service par
 * caractère ne servirait à rien sur une liste de quelques centaines de
 * comptes. Les autres paramètres de l'adresse sont conservés.
 *
 * @param label       Intitulé lu par les lecteurs d'écran.
 * @param placeholder Exemple de saisie.
 */
export function SearchBox({
  label,
  placeholder,
  maxLength = 100,
}: {
  label: string;
  placeholder: string;
  maxLength?: number;
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
        const value = String(new FormData(event.currentTarget).get("q") ?? "")
          .trim()
          .slice(0, maxLength);
        const next = new URLSearchParams(params);
        if (value) next.set("q", value);
        else next.delete("q");
        const query = next.toString();
        startTransition(() =>
          router.replace(query ? `${pathname}?${query}` : pathname),
        );
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
          maxLength={maxLength}
          defaultValue={params.get("q") ?? ""}
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
