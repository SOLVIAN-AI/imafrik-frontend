"use client";

import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";
import {
  filtersToQuery,
  hasFilters,
  NO_FILTERS,
  type FilterOption,
  type WorklistFilters,
} from "@/lib/worklist";

/**
 * Filtres de la file : modalités et clinique.
 *
 * L'état vit dans l'adresse (`?modalite=CT,MR&clinique=…`) : un filtre se
 * garde au rechargement et se partage par lien, et rien de nominatif n'y
 * figure. Les modalités sont des liens, qui fonctionnent avant même que
 * le script soit chargé ; la clinique, plus nombreuse, est une liste.
 *
 * Chaque choix affiche le nombre d'examens qu'il retient, compté sur la
 * file **non filtrée** : on voit ce qu'on obtiendra avant de cliquer.
 * Un filtre qui n'aurait qu'une valeur possible n'est pas proposé.
 *
 * @param filters Filtres actifs.
 * @param options Valeurs présentes dans la file, avec leur nombre.
 */
export function WorklistFilterBar({
  filters,
  options,
}: {
  filters: WorklistFilters;
  options: { modalities: FilterOption[]; clinics: FilterOption[] };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useMessages();
  const labels = t.worklist.filters;
  const [pending, startTransition] = React.useTransition();

  const href = (next: WorklistFilters) => {
    const query = filtersToQuery(next);
    return query ? `${pathname}?${query}` : pathname;
  };
  const toggleModality = (value: string) =>
    href({
      ...filters,
      modalities: filters.modalities.includes(value)
        ? filters.modalities.filter((modality) => modality !== value)
        : [...filters.modalities, value].sort(),
    });

  const showModalities = options.modalities.length > 1;
  const showClinics = options.clinics.length > 1;
  if (!showModalities && !showClinics && !hasFilters(filters)) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 px-4 pb-3 sm:px-6",
        pending && "opacity-70",
      )}
    >
      {showModalities && (
        <nav aria-label={labels.modalities} className="flex flex-wrap gap-1.5">
          {options.modalities.map((option) => {
            const active = filters.modalities.includes(option.value);
            return (
              <Link
                key={option.value}
                href={toggleModality(option.value)}
                scroll={false}
                replace
                // La file se relit toutes les trente secondes : précharger
                // chaque combinaison de filtres la ferait rendre d'autant.
                prefetch={false}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  active
                    ? "border-accent bg-accent-muted font-medium text-primary"
                    : "border-border-subtle text-secondary hover:border-border-default hover:text-primary",
                )}
              >
                {option.label}
                <span className="text-2xs text-tertiary tabular-nums">
                  {option.count}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      {showClinics && (
        <label className="relative flex items-center">
          <span className="sr-only">{labels.clinic}</span>
          <select
            value={filters.clinicId ?? ""}
            onChange={(event) =>
              startTransition(() =>
                router.replace(
                  href({ ...filters, clinicId: event.target.value || null }),
                  { scroll: false },
                ),
              )
            }
            className={cn(
              // Dessin des puces, pas celui du système : la flèche native
              // jurait avec le reste de la barre, en clair surtout.
              "h-7 max-w-60 cursor-pointer appearance-none truncate rounded-full border bg-transparent pr-7 pl-2.5 text-xs transition-colors",
              "hover:border-border-default hover:text-primary",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              filters.clinicId
                ? "border-accent bg-accent-muted font-medium text-primary"
                : "border-border-subtle text-secondary",
            )}
          >
            <option value="">{labels.allClinics}</option>
            {options.clinics.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 size-3 text-tertiary"
            aria-hidden
          />
        </label>
      )}

      {hasFilters(filters) && (
        <Link
          href={href(NO_FILTERS)}
          scroll={false}
          replace
          prefetch={false}
          className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs text-tertiary hover:text-primary focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="size-3" aria-hidden />
          {t.common.actions.clearFilters}
        </Link>
      )}
    </div>
  );
}
