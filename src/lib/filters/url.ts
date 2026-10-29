/**
 * Les filtres d'une liste dans l'adresse : lecture validée, écriture.
 *
 * L'adresse porte l'état des filtres : une vue filtrée se partage, se met
 * en favori et survit au rechargement. Elle ne porte jamais la recherche,
 * qui dit le nom d'une personne (`lib/search/list-search.ts`).
 *
 * Module pur : ni rendu ni requête.
 */

import {
  type ActiveFilters,
  type DimensionKey,
  DIMENSION_ORDER,
  dimension,
} from "@/lib/filters/dimensions";
import { CURSOR_PARAM, type SearchParamsRecord } from "@/lib/pagination";

/**
 * Paramètres d'une page de liste : un autre filtre, une autre liste, on
 * repart de sa première page. `avant` est le curseur du journal d'audit.
 */
export const PAGE_PARAMS: readonly string[] = [CURSOR_PARAM, "avant"];

/** Paramètres d'adresse, sous l'une des formes que fournit Next. */
export type Params = SearchParamsRecord | URLSearchParams | string;

/** Les paramètres reçus, en `URLSearchParams` modifiable. */
function toSearchParams(params: Params): URLSearchParams {
  if (typeof params === "string" || params instanceof URLSearchParams)
    return new URLSearchParams(params);
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value])
      next.append(key, item);
  }
  return next;
}

/**
 * Filtres d'une liste, lus dans l'adresse.
 *
 * Une valeur inconnue ou mal formée est ignorée : la dimension revient à
 * « Tous », au lieu de transmettre au service ce qu'on a tapé. Une
 * dimension tirée des données (la clinique) n'est retenue que parmi les
 * valeurs connues, quand l'écran les donne.
 *
 * @param params Paramètres de la page.
 * @param keys   Dimensions de l'écran.
 * @param known  Valeurs admises des dimensions tirées des données.
 */
export function readFilters(
  params: Params,
  keys: readonly DimensionKey[],
  known: Partial<Record<DimensionKey, readonly string[]>> = {},
): ActiveFilters {
  const search = toSearchParams(params);
  const filters: ActiveFilters = {};
  for (const key of keys) {
    const { param, aliases = [], read, codec } = dimension(key);
    let value: string | null;
    if (codec) {
      value = codec.read(search);
    } else {
      // Le paramètre d'aujourd'hui d'abord, puis ceux d'avant (favoris).
      const raw = [param, ...aliases]
        .map((name) => search.get(name)?.trim())
        .find(Boolean);
      if (!raw) continue;
      value = read(raw);
    }
    if (value === null) continue;
    if (known[key] && !known[key].includes(value)) continue;
    filters[key] = value;
  }
  return filters;
}

/**
 * Adresse de la liste pour une valeur d'un paramètre : les autres
 * paramètres gardés, ceux qui n'ont plus de sens retirés (la page de la
 * liste, qui repart au début).
 *
 * @param pathname Adresse de la liste.
 * @param params   Paramètres de l'adresse courante.
 * @param param    Paramètre changé.
 * @param value    Valeur d'adresse ; `null` pour retirer le paramètre.
 * @param reset    Paramètres retirés au changement.
 */
export function paramHref(
  pathname: string,
  params: Params,
  param: string,
  value: string | null,
  reset: readonly string[] = PAGE_PARAMS,
): string {
  const next = toSearchParams(params);
  for (const key of reset) next.delete(key);
  if (value) next.set(param, value);
  else next.delete(param);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Adresse de la liste après un changement de filtres : les autres
 * paramètres restent (rubrique, autres filtres), la page repart du début.
 *
 * @param pathname Adresse de la liste.
 * @param params   Paramètres de l'adresse courante.
 * @param changes  Valeur interne de chaque dimension changée ; `null`
 *                 pour « Tous ».
 * @param reset    Paramètres retirés au changement (la page de la liste).
 */
export function filterHref(
  pathname: string,
  params: Params,
  changes: Partial<Record<DimensionKey, string | null>>,
  reset: readonly string[] = PAGE_PARAMS,
): string {
  const next = toSearchParams(params);
  for (const key of reset) next.delete(key);
  for (const key of DIMENSION_ORDER) {
    if (!(key in changes)) continue;
    const { param, aliases = [], write, codec } = dimension(key);
    for (const name of [param, ...aliases, ...(codec?.params ?? [])])
      next.delete(name);
    const value = changes[key];
    if (value && codec) next.set(...codec.write(value));
    else if (value) next.set(param, write(value));
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Adresse de la liste sans aucun des filtres de l'écran ; ses autres
 * paramètres (une rubrique) restent.
 *
 * @param pathname Adresse de la liste.
 * @param params   Paramètres de l'adresse courante.
 * @param keys     Dimensions de l'écran.
 */
export function clearFiltersHref(
  pathname: string,
  params: Params,
  keys: readonly DimensionKey[],
): string {
  return filterHref(
    pathname,
    params,
    Object.fromEntries(keys.map((key) => [key, null])),
  );
}

/**
 * Vrai si au moins un filtre est actif.
 *
 * @param filters Filtres lus.
 */
export function hasFilters(filters: ActiveFilters): boolean {
  return Object.values(filters).some(Boolean);
}
