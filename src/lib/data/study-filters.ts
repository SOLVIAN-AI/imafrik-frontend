import "server-only";

import {
  getStudyFacets,
  type StudyFacets,
  type StudyQuery,
} from "@/lib/data/studies";
import type { ActiveFilters, DimensionKey } from "@/lib/filters/dimensions";
import { facetsFor, studyQuery } from "@/lib/filters/studies";
import { type Params, readFilters } from "@/lib/filters/url";

/** Les filtres d'une liste d'examens, validés, et leurs comptes. */
export interface LoadedStudyFilters {
  /** Filtres lus dans l'adresse, validés par le service. */
  filters: ActiveFilters;
  /** Comptes de chaque dimension de la barre. */
  counts: StudyFacets;
  /** Requête de la liste : la base de l'écran, plus les filtres. */
  query: StudyQuery;
}

/**
 * Lit les filtres d'une liste d'examens dans l'adresse, les valide auprès
 * du service et compte chaque option, en un ou deux appels.
 *
 * - Une clinique ou un radiologue inconnus (identifiant tapé à la main)
 *   reviennent à « Tous », au lieu d'une liste vide inexpliquée.
 * - Un radiologue retenu reste proposé même quand les autres filtres ne
 *   lui laissent aucun examen : le service ne compte que les radiologues
 *   qui en ont, il est alors ajouté à zéro, son choix visible.
 *
 * @param params   Paramètres de l'adresse.
 * @param keys     Dimensions de l'écran.
 * @param base     Ce que l'écran impose (recherche, « les miens »…).
 * @param adjust   Règle propre à l'écran, appliquée à la requête.
 * @param clinicId Clinique consultée par l'équipe IMAFRIK.
 */
export async function loadStudyFilters({
  params,
  keys,
  base,
  adjust = (query) => query,
  clinicId,
}: {
  params: Params;
  keys: readonly DimensionKey[];
  base: StudyQuery;
  adjust?: (query: StudyQuery, filters: ActiveFilters) => StudyQuery;
  clinicId?: string;
}): Promise<LoadedStudyFilters> {
  const now = new Date();
  const queryOf = (filters: ActiveFilters) =>
    adjust({ ...base, ...studyQuery(filters, now) }, filters);
  const wanted = facetsFor(keys);
  const draft = readFilters(params, keys);
  let counts = await getStudyFacets(queryOf(draft), wanted, clinicId);

  const radiologists = [...(counts.facets.radiologist ?? [])];
  if (
    draft.radiologist &&
    !radiologists.some((row) => row.value === draft.radiologist)
  ) {
    // Ses examens hors des autres filtres : de quoi le nommer, à zéro.
    const named = await getStudyFacets(base, ["radiologist"], clinicId);
    const found = named.facets.radiologist?.find(
      (row) => row.value === draft.radiologist,
    );
    if (found) radiologists.push({ ...found, count: 0 });
  }
  const filters = readFilters(params, keys, {
    ...(counts.facets.clinic && {
      clinic: counts.facets.clinic.map((row) => row.value),
    }),
    ...(keys.includes("radiologist") && {
      radiologist: radiologists.map((row) => row.value),
    }),
  });
  if (
    filters.clinic !== draft.clinic ||
    filters.radiologist !== draft.radiologist
  ) {
    counts = await getStudyFacets(queryOf(filters), wanted, clinicId);
  } else if (counts.facets.radiologist) {
    counts = {
      ...counts,
      facets: { ...counts.facets, radiologist: radiologists },
    };
  }
  return { filters, counts, query: queryOf(filters) };
}
