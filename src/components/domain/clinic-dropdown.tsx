"use client";

import { FilterDropdown } from "@/components/filters/filter-dropdown";
import { DIMENSION_ICONS } from "@/components/filters/icons";
import { useMessages } from "@/i18n/client";
import type { ChoiceOption } from "@/lib/filters/choice";
import { DIMENSIONS } from "@/lib/filters/dimensions";
import { PAGE_PARAMS } from "@/lib/filters/url";

/**
 * Choix de la clinique d'une liste d'examens, en liste déroulante : la
 * liste déroulante commune (`FilterDropdown`) avec les textes, le
 * pictogramme et la recherche de la dimension « clinique ».
 *
 * Pour les écrans qui ne sont pas encore passés à la barre de filtres
 * commune (`FilterBar`), qui la rend d'elle-même.
 *
 * @param label      Nom du choix (« Clinique »), visible sur le bouton.
 * @param allLabel   Option qui retire le filtre (« Toutes les cliniques »).
 * @param clinics    Cliniques proposées, dans n'importe quel ordre.
 * @param total      Examens de toutes les cliniques, quand l'écran compte.
 * @param active     Clinique retenue ; `null` pour toutes.
 * @param param      Paramètre d'adresse de la clinique.
 * @param reset      Paramètres retirés au changement (la page de la liste).
 * @param appearance `pill` dans une barre de pastilles, `field` ailleurs.
 */
export function ClinicDropdown({
  label,
  allLabel,
  clinics,
  total,
  active,
  param = DIMENSIONS.clinic.param,
  reset = PAGE_PARAMS,
  appearance = "field",
  className,
}: {
  label: string;
  allLabel: string;
  clinics: readonly ChoiceOption[];
  total?: number;
  active: string | null;
  param?: string;
  reset?: readonly string[];
  appearance?: "pill" | "field";
  className?: string;
}) {
  const t = useMessages();
  return (
    <FilterDropdown
      label={label}
      allLabel={allLabel}
      options={clinics}
      total={total}
      active={active}
      param={param}
      reset={reset}
      icon={DIMENSION_ICONS.clinic}
      searchText={DIMENSIONS.clinic.searchText(t)}
      countPhrase={t.filters.nouns.studies}
      appearance={appearance}
      className={className}
    />
  );
}
