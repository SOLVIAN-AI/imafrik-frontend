/**
 * Filtres et comptes d'une liste filtrée sur la page, quand le service
 * renvoie toute la liste (quelques centaines de lignes au plus) : les
 * comptes, les organisations.
 *
 * La même règle que le service (`/studies/facets`) : chaque option d'une
 * dimension est comptée avec tous les autres filtres, le sien mis à part.
 * Choisir « Radiologue » ne fait pas disparaître « Responsable », et le
 * nombre d'une option est celui de la liste filtrée sur elle.
 *
 * Module pur : éprouvé par `facets.test.ts`.
 */

import type {
  ActiveFilters,
  DimensionKey,
  FilterOption,
} from "@/lib/filters/dimensions";

/**
 * Les valeurs d'une ligne pour chaque dimension de l'écran : plusieurs
 * possibles (un compte peut appartenir à deux organisations). Une ligne
 * retient une option si l'une de ses valeurs est cette option.
 */
export type RowValues<Row> = Partial<
  Record<DimensionKey, (row: Row) => readonly string[]>
>;

/**
 * Vrai si la ligne passe les filtres, sauf celui d'une dimension.
 *
 * @param row     Ligne de la liste.
 * @param values  Valeurs de chaque dimension.
 * @param filters Filtres actifs.
 * @param except  Dimension dont le filtre est ignoré.
 */
function passes<Row>(
  row: Row,
  values: RowValues<Row>,
  filters: ActiveFilters,
  except?: DimensionKey,
): boolean {
  return Object.entries(filters).every(([key, value]) => {
    if (!value || key === except) return true;
    const of = values[key as DimensionKey];
    return of ? of(row).includes(value) : true;
  });
}

/**
 * Les lignes qui passent tous les filtres.
 *
 * @param rows    Lignes de la liste.
 * @param values  Valeurs de chaque dimension.
 * @param filters Filtres actifs.
 */
export function filterRows<Row>(
  rows: readonly Row[],
  values: RowValues<Row>,
  filters: ActiveFilters,
): Row[] {
  return rows.filter((row) => passes(row, values, filters));
}

/**
 * Les options d'une dimension, chacune avec ses lignes, et le total de la
 * dimension : comptés avec tous les autres filtres, le sien mis à part.
 *
 * @param rows       Lignes de la liste.
 * @param values     Valeurs de chaque dimension.
 * @param filters    Filtres actifs.
 * @param key        Dimension comptée.
 * @param candidates Options proposées, dans l'ordre de l'écran, avec leur
 *                   nom pour une valeur tirée des données.
 */
export function countOptions<Row>(
  rows: readonly Row[],
  values: RowValues<Row>,
  filters: ActiveFilters,
  key: DimensionKey,
  candidates: readonly { value: string; label?: string }[],
): { options: FilterOption[]; total: number } {
  const of = values[key];
  const others = rows.filter((row) => passes(row, values, filters, key));
  return {
    options: candidates.map((candidate) => ({
      ...candidate,
      count: of
        ? others.filter((row) => of(row).includes(candidate.value)).length
        : 0,
    })),
    total: others.length,
  };
}
