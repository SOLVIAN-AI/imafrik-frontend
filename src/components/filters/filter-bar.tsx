"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

import { FilterChips, FilterToggle } from "@/components/filters/filter-chips";
import { FilterDropdown } from "@/components/filters/filter-dropdown";
import { DIMENSION_ICONS } from "@/components/filters/icons";
import type { AppMessages } from "@/i18n";
import { useMessages } from "@/i18n/client";
import {
  type ActiveFilters,
  type DimensionKey,
  dimension,
} from "@/lib/filters/dimensions";
import { clearFiltersHref } from "@/lib/filters/url";
import { cn } from "@/lib/utils";

/** Ce que comptent une liste et ses options (« examens »). */
export type FilterNoun = keyof AppMessages["filters"]["nouns"];

/** Une valeur proposée, avec le nombre de lignes qu'elle retient. */
export interface FilterOption {
  value: string;
  /** Nom affiché ; celui du registre pour une valeur fixe. */
  label?: string;
  /** Lignes retenues ; absent quand l'écran ne compte pas. */
  count?: number;
}

/** Une dimension de la barre, telle que la page la décrit. */
export interface BarDimension {
  key: DimensionKey;
  /** Valeurs proposées : toutes pour des puces, celles des données sinon. */
  options?: readonly FilterOption[];
  /** Lignes de toutes les valeurs, pour l'option par défaut. */
  total?: number;
  /** Nom propre à l'écran d'une bascule (« Urgences en cours »). */
  label?: string;
}

/** Au-delà de ce nombre de puces, un téléphone les remplace par une liste. */
const CHIPS_ON_PHONE = 3;

/**
 * Les filtres retenus, en clair : « Scanner, Polyclinique de Kara ».
 *
 * @param dimensions Dimensions de l'écran.
 * @param active     Filtres lus par la page.
 * @param t          Textes de l'écran.
 */
export function describeFilters(
  dimensions: readonly BarDimension[],
  active: ActiveFilters,
  t: AppMessages,
): string[] {
  return dimensions.flatMap((entry) => {
    const value = active[entry.key];
    if (!value) return [];
    const definition = dimension(entry.key);
    return [
      entry.options?.find((option) => option.value === value)?.label ??
        (definition.presentation === "toggle" ? entry.label : undefined) ??
        definition.valueLabel?.(t, value) ??
        value,
    ];
  });
}

/**
 * Barre de filtres d'une liste, la même sur tous les écrans.
 *
 * Chaque dimension se présente comme le registre le dit
 * (`lib/filters/dimensions.ts`) : puces pour une liste fixe et courte,
 * liste déroulante triée par ordre alphabétique pour une liste qui
 * grandit, bascule pour un filtre à une valeur ; toujours dans le même
 * ordre, avec le nombre de lignes de chaque option quand l'écran les
 * compte.
 *
 * - **Un filtre actif reste visible** : sa valeur se lit sur la puce ou
 *   sur le bouton de la liste, jamais derrière un bouton replié. Une liste
 *   filtrée à l'insu de l'utilisateur peut faire manquer une urgence.
 * - **Une dimension à une seule valeur n'est pas proposée**, sauf si elle
 *   est active : rien à choisir (une seule clinique, un seul pays).
 * - **Sur téléphone, rien ne défile en largeur** : la barre passe à la
 *   ligne, et une rangée de plus de trois puces devient une liste
 *   déroulante qui affiche sa valeur.
 * - **Le nombre de résultats est annoncé** aux lecteurs d'écran après
 *   chaque changement.
 *
 * L'état est dans l'adresse, la barre n'en garde aucun : la page serveur
 * relit les filtres (`readFilters`) et interroge le service avec.
 *
 * @param dimensions Dimensions de l'écran, dans l'ordre du registre.
 * @param active     Filtres lus par la page.
 * @param result     Lignes de la liste filtrée, et ce qu'elles sont.
 */
export function FilterBar({
  dimensions,
  active,
  result,
  className,
}: {
  dimensions: readonly BarDimension[];
  active: ActiveFilters;
  result: { count: number; noun: FilterNoun };
  className?: string;
}) {
  const t = useMessages();
  const pathname = usePathname();
  const params = useSearchParams();
  const text = t.filters;
  const countPhrase = text.nouns[result.noun];
  const keys = dimensions.map((entry) => entry.key);
  const filtered = keys.some((key) => Boolean(active[key]));

  return (
    <div
      role="group"
      aria-label={text.bar}
      data-testid="filter-bar"
      className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}
    >
      {dimensions.map((entry) => {
        const definition = dimension(entry.key);
        const { name, all } = definition.text(t);
        const current = active[entry.key] ?? null;
        const icon = DIMENSION_ICONS[entry.key];
        const options = (entry.options ?? []).map((option) => ({
          id: option.value,
          name:
            option.label ??
            definition.valueLabel?.(t, option.value) ??
            option.value,
          count: option.count,
        }));

        if (definition.presentation === "toggle") {
          const value = definition.values?.[0] ?? "";
          return (
            <FilterToggle
              key={entry.key}
              dimension={entry.key}
              label={entry.label ?? definition.valueLabel?.(t, value) ?? name}
              value={value}
              active={current !== null}
              count={entry.options?.[0]?.count}
              countPhrase={countPhrase}
            />
          );
        }

        const dropdown = (className?: string, given = false) => (
          <FilterDropdown
            key={`${entry.key}-liste`}
            appearance="pill"
            icon={icon}
            label={name}
            allLabel={all}
            options={options}
            total={entry.total}
            active={current}
            param={definition.param}
            write={definition.write}
            order={given ? "given" : "alphabetical"}
            searchText={given ? undefined : definition.searchText?.(t)}
            countPhrase={countPhrase}
            className={className}
          />
        );

        if (definition.presentation === "dropdown") {
          // Rien à choisir : une seule clinique, un seul pays.
          if (options.length < 2 && current === null) return null;
          return dropdown();
        }

        const chips = (className?: string) => (
          <FilterChips
            key={`${entry.key}-puces`}
            dimension={entry.key}
            label={name}
            allLabel={all}
            options={options}
            total={entry.total}
            active={current}
            countPhrase={countPhrase}
            className={className}
          />
        );
        if (options.length <= CHIPS_ON_PHONE) return chips();
        // Téléphone : la rangée devient une liste qui affiche sa valeur.
        return (
          <React.Fragment key={entry.key}>
            {chips("hidden sm:flex")}
            {dropdown("sm:hidden", true)}
          </React.Fragment>
        );
      })}

      {filtered && (
        <Link
          href={clearFiltersHref(pathname, params.toString(), keys)}
          replace
          scroll={false}
          prefetch={false}
          className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs text-tertiary hover:text-primary focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="size-3" aria-hidden />
          {text.clear}
        </Link>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic>
        {countPhrase(result.count)}
      </p>
    </div>
  );
}
