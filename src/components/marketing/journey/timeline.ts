/**
 * Chorégraphie du parcours : ce que montre la scène, selon l'avancement.
 *
 * Fonctions pures. L'avancement `p` (de 0 à 1) vient du défilement de la
 * page sur ordinateur, d'une minuterie sur téléphone, et vaut la fin de
 * chaque acte quand les animations sont désactivées : la même scène sert
 * les trois cas, et se teste sans navigateur.
 *
 * Quatre actes, dans l'ordre du service :
 *
 * 1. la passerelle de la clinique reçoit l'examen, coupe après coupe ;
 * 2. il traverse vers le radiologue, compressé et chiffré ;
 * 3. le radiologue le trouve en tête de sa file, le lit et rédige ;
 * 4. le compte-rendu signé revient à la clinique.
 */

/** Nombre d'actes. */
export const ACT_COUNT = 4;

/** Bornes de chaque acte sur l'avancement total. */
export const ACTS: readonly (readonly [number, number])[] = [
  [0, 0.24],
  [0.24, 0.44],
  [0.44, 0.76],
  [0.76, 1],
];

/** Nombre de coupes de scanner animées (public/marketing/parcours). */
export const FRAME_COUNT = 25;

/** Coupes reçues par la passerelle, affichées au compteur : celles de l'examen réel. */
export const SERIES_IMAGES = 133;

/** Ramène une valeur entre 0 et 1. */
export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

/** Courbe de sortie douce : rapide au départ, posée à l'arrivée. */
export function easeOut(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) ** 3;
}

/**
 * Avancement local d'un intervalle : 0 avant son début, 1 après sa fin.
 *
 * @param p     Avancement total.
 * @param start Début de l'intervalle.
 * @param end   Fin de l'intervalle.
 */
export function segment(p: number, start: number, end: number): number {
  if (end <= start) return p >= end ? 1 : 0;
  return clamp01((p - start) / (end - start));
}

/**
 * Acte en cours.
 *
 * @returns De 0 à 3 ; la fin exacte d'un acte appartient au suivant,
 *          sauf la fin du dernier.
 */
export function actAt(p: number): number {
  const x = clamp01(p);
  const index = ACTS.findIndex(([, end]) => x < end);
  return index === -1 ? ACT_COUNT - 1 : index;
}

/**
 * Avancement à l'intérieur d'un acte.
 *
 * @param p   Avancement total.
 * @param act Acte, de 0 à 3.
 */
export function actProgress(p: number, act: number): number {
  const [start, end] = ACTS[act];
  return segment(p, start, end);
}

/**
 * Avancement total qui montre un acte achevé : ce qu'on affiche quand les
 * animations sont désactivées, et ce vers quoi tend chaque carte sur
 * téléphone.
 *
 * Un peu avant la borne, pour rester dans l'acte (voir {@link actAt}).
 */
export function actEnd(act: number): number {
  const [start, end] = ACTS[act];
  return act === ACT_COUNT - 1 ? 1 : start + (end - start) * 0.98;
}

/** Coupe où le nodule est le plus large : celle de la mesure. */
export const NODULE_FRAME = 13;

/**
 * Temps de la lecture, en avancement de l'acte 3 : la file (0 à 0,3),
 * le parcours de la pile, le retour sur le nodule, sa mesure, puis la
 * conclusion et la signature.
 */
export const READING = {
  scrollStart: 0.3,
  scrollEnd: 0.54,
  backEnd: 0.64,
  measureStart: 0.66,
  measureEnd: 0.74,
  typeStart: 0.74,
  typeEnd: 0.92,
  signed: 0.95,
} as const;

/**
 * Coupe affichée au viewer, pendant la lecture.
 *
 * Le radiologue parcourt la pile jusqu'en bas, puis revient sur le
 * nodule, où il s'arrête pour le mesurer.
 *
 * @returns Indice de 0 à FRAME_COUNT - 1.
 */
export function frameAt(p: number): number {
  const t = actProgress(p, 2);
  const last = FRAME_COUNT - 1;
  const position =
    t <= READING.scrollEnd
      ? segment(t, READING.scrollStart, READING.scrollEnd) * last
      : last -
        segment(t, READING.scrollEnd, READING.backEnd) * (last - NODULE_FRAME);
  return Math.round(Math.min(last, Math.max(0, position)));
}

/** Point du trajet sur la carte. */
export interface Point {
  x: number;
  y: number;
}

/**
 * Position sur le trajet de Kara à Lomé : une courbe de Bézier
 * quadratique, infléchie vers l'est pour ne pas longer la frontière.
 *
 * @param t    Avancement du trajet, de 0 à 1.
 * @param from Départ.
 * @param to   Arrivée.
 */
export function routePoint(t: number, from: Point, to: Point): Point {
  const u = clamp01(t);
  const control = { x: Math.max(from.x, to.x) + 46, y: (from.y + to.y) / 2 };
  const a = (1 - u) ** 2;
  const b = 2 * (1 - u) * u;
  const c = u ** 2;
  return {
    x: a * from.x + b * control.x + c * to.x,
    y: a * from.y + b * control.y + c * to.y,
  };
}

/** Le même trajet, en chemin SVG. */
export function routePath(from: Point, to: Point): string {
  const control = { x: Math.max(from.x, to.x) + 46, y: (from.y + to.y) / 2 };
  return `M${from.x} ${from.y} Q${control.x} ${control.y} ${to.x} ${to.y}`;
}

/**
 * Nombre de caractères d'un texte déjà écrits, à un avancement donné.
 *
 * @param text Texte complet.
 * @param t    Avancement de l'écriture, de 0 à 1.
 */
export function typedLength(text: string, t: number): number {
  return Math.round(text.length * clamp01(t));
}
