"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  type BarDimension,
  describeFilters,
  type FilterNoun,
} from "@/components/filters/filter-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useMessages } from "@/i18n/client";
import type { ActiveFilters } from "@/lib/filters/dimensions";
import { clearFiltersHref } from "@/lib/filters/url";

/**
 * Liste vide à cause des filtres : elle le dit, nomme les filtres retenus
 * et propose de les effacer, plutôt qu'une liste vide qui laisserait
 * croire que rien n'est arrivé.
 *
 * Sans filtre retenu, c'est la recherche qui vide la liste : la page le
 * dit, sans bouton (le champ de recherche a le sien pour l'effacer).
 *
 * @param dimensions Dimensions de l'écran, comme la barre les reçoit.
 * @param active     Filtres lus par la page.
 * @param noun       Ce que la liste montre (« examens », par défaut).
 */
export function FilteredEmpty({
  dimensions,
  active,
  noun = "studies",
}: {
  dimensions: readonly BarDimension[];
  active: ActiveFilters;
  noun?: FilterNoun;
}) {
  const t = useMessages();
  const pathname = usePathname();
  const params = useSearchParams();
  const retained = describeFilters(dimensions, active, t);
  if (retained.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t.filters.empty.searchTitle}
        detail={t.filters.empty.searchDetail}
      />
    );
  }
  return (
    <EmptyState
      icon={SearchX}
      title={t.filters.empty[noun]}
      detail={t.filters.empty.detail(retained.join(", "))}
      action={
        <Button asChild variant="secondary" size="sm">
          <Link
            href={clearFiltersHref(
              pathname,
              params.toString(),
              dimensions.map((entry) => entry.key),
            )}
            replace
            scroll={false}
          >
            {t.filters.clear}
          </Link>
        </Button>
      }
    />
  );
}
