"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  type BarDimension,
  describeFilters,
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
 * @param dimensions Dimensions de l'écran, comme la barre les reçoit.
 * @param active     Filtres lus par la page.
 */
export function FilteredEmpty({
  dimensions,
  active,
}: {
  dimensions: readonly BarDimension[];
  active: ActiveFilters;
}) {
  const t = useMessages();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <EmptyState
      icon={SearchX}
      title={t.filters.empty.studies}
      detail={t.filters.empty.detail(
        describeFilters(dimensions, active, t).join(", "),
      )}
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
