/**
 * Calculs des graphiques, séparés de leur dessin pour être testés.
 */

/**
 * Maximum « rond » d'un axe : 1, 2 ou 5 × 10ⁿ, au moins égal à la valeur.
 *
 * Un axe qui s'arrête à 47 se lit mal ; à 50, on situe chaque barre
 * d'un coup d'œil.
 *
 * @param value Plus grande valeur affichée.
 * @returns Le maximum de l'axe, jamais nul.
 */
export function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * base) return step * base;
  }
  return 10 * base;
}

/**
 * Indices des étiquettes d'abscisse à afficher, pour qu'elles ne se
 * chevauchent pas : la première, la dernière, et des intermédiaires
 * régulièrement espacées.
 *
 * @param length Nombre de points.
 * @param maxLabels Nombre d'étiquettes qui tiennent dans la largeur.
 */
export function labelIndices(length: number, maxLabels: number): number[] {
  if (length <= 0) return [];
  if (length <= maxLabels) return Array.from({ length }, (_, index) => index);
  const step = (length - 1) / (maxLabels - 1);
  return [
    ...new Set(
      Array.from({ length: maxLabels }, (_, index) => Math.round(index * step)),
    ),
  ];
}

/**
 * Quantile d'une série (interpolation linéaire), `null` si elle est vide.
 *
 * @param values Valeurs, dans n'importe quel ordre.
 * @param q Quantile entre 0 et 1 — 0,5 pour la médiane.
 */
export function quantile(values: number[], q: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

/**
 * Regroupe une série quotidienne par paquets de `size` jours consécutifs.
 *
 * Trois cent soixante-cinq barres ne se lisent pas ; cinquante-trois
 * semaines, si. Le dernier paquet peut être incomplet : il est gardé —
 * c'est la semaine en cours.
 *
 * @param items Série, dans l'ordre chronologique.
 * @param size  Taille d'un paquet, au moins 1.
 * @returns Les paquets, dans l'ordre.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const step = Math.max(1, Math.floor(size));
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += step) {
    chunks.push(items.slice(index, index + step));
  }
  return chunks;
}

/**
 * Moyenne pondérée, en ignorant les valeurs absentes.
 *
 * Sert à résumer des médianes quotidiennes sur une semaine. Ce n'est pas
 * la médiane de la semaine — celle-ci demande les examens eux-mêmes — et
 * l'écran qui l'affiche le dit.
 *
 * @param pairs Couples (valeur, poids) ; une valeur `null` est ignorée.
 * @returns La moyenne, ou `null` si aucun poids n'est positif.
 */
export function weightedMean(pairs: [number | null, number][]): number | null {
  let total = 0;
  let weight = 0;
  for (const [value, w] of pairs) {
    if (value === null || w <= 0) continue;
    total += value * w;
    weight += w;
  }
  return weight > 0 ? total / weight : null;
}

/** Pas « ronds » d'un axe de durées, en minutes : quart d'heure, heure, jour… */
const MINUTE_STEPS = [5, 10, 15, 30, 60, 120, 180, 240, 360, 720, 1440];

/**
 * Graduations d'un axe, de 0 à un maximum rond.
 *
 * Pour un **comptage**, le maximum suit {@link niceMax} et le nombre
 * d'intervalles est choisi pour que chaque graduation soit ronde : 50 se
 * découpe en 10, 20, 30, 40 — pas en 12,5. Aucune graduation fractionnaire
 * pour des examens : un axe de 0 à 2 compte 0, 1, 2.
 *
 * Pour des **minutes**, les pas sont des durées qu'on lit sans calcul —
 * 15 min, 30 min, 1 h, 2 h — plutôt que « 1 h 03 ».
 *
 * @param value Plus grande valeur affichée.
 * @param unit  Nature des valeurs.
 * @returns Les graduations, de 0 au maximum de l'axe inclus.
 */
export function axisTicks(
  value: number,
  unit: "count" | "minutes" = "count",
): number[] {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  let max: number;
  let intervals: number;
  if (unit === "minutes") {
    const step =
      MINUTE_STEPS.find((candidate) => Math.ceil(safe / candidate) <= 5) ??
      Math.ceil(safe / 5 / 1440) * 1440;
    intervals = Math.max(2, Math.ceil(safe / step));
    max = intervals * step;
  } else {
    max = niceMax(safe);
    const mantissa = max / 10 ** Math.floor(Math.log10(max));
    intervals = mantissa === 2.5 || mantissa === 5 ? 5 : 4;
    // Pas de graduation fractionnaire pour un comptage.
    if (max / intervals < 1) intervals = Math.max(1, max);
  }
  return Array.from({ length: intervals + 1 }, (_, i) => (max / intervals) * i);
}
