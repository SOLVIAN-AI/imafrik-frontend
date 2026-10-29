"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ClinicDropdown } from "@/components/domain/clinic-dropdown";
import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";
import {
  FILTER_PARAMS,
  filtersToQuery,
  hasFilters,
  NO_FILTERS,
  type FilterOption,
  type WorklistFilters,
} from "@/lib/worklist";

/**
 * Filtres de la file : clinique et modalités.
 *
 * L'état vit dans l'adresse (`?modalite=CT,MR&clinique=…`) : un filtre se
 * garde au rechargement et se partage par lien, et rien de nominatif n'y
 * figure. Les modalités sont des liens, qui fonctionnent avant même que
 * le script soit chargé ; la clinique, plus nombreuse, est une liste
 * déroulante (`ClinicDropdown`), par ordre alphabétique, avec une
 * recherche quand les cliniques sont nombreuses.
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
  tour,
}: {
  filters: WorklistFilters;
  options: { modalities: FilterOption[]; clinics: FilterOption[] };
  /** Repère de la visite guidée (`data-tour`, voir `components/tour`). */
  tour?: string;
}) {
  const pathname = usePathname();
  const t = useMessages();
  const labels = t.worklist.filters;

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
      data-tour={tour}
      // La barre porte la marge de la page : la visite montre les filtres.
      data-tour-fit={tour ? "content" : undefined}
      className="flex flex-wrap items-center gap-2 px-4 pb-3 sm:px-6"
    >
      {showClinics && (
        <ClinicDropdown
          appearance="pill"
          label={labels.clinic}
          allLabel={labels.allClinics}
          clinics={options.clinics.map((option) => ({
            id: option.value,
            name: option.label,
            count: option.count,
          }))}
          total={options.clinics.reduce((sum, option) => sum + option.count, 0)}
          active={filters.clinicId}
          param={FILTER_PARAMS.clinic}
          reset={[]}
        />
      )}

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
                // Un lien ne peut pas être « pressé » (`aria-pressed` est
                // réservé aux boutons) : le filtre actif est l'élément
                // courant de cette navigation.
                aria-current={active ? "true" : undefined}
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
