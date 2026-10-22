/**
 * Le Togo, pour la carte du parcours.
 *
 * Contour tiré de Natural Earth (« Admin 0 – Countries », 1:50 m), du
 * domaine public, projeté en équirectangulaire dans un repère de 200 px de
 * large : à cette latitude, l'écart avec une projection conforme est
 * invisible. Les villes sont placées par leurs coordonnées réelles, dans
 * le même repère.
 */

/** Taille du repère de la carte, en unités SVG. */
export const TOGO_VIEWBOX = { width: 200, height: 538.1 } as const;

/** Contour du pays. */
export const TOGO_PATH =
  "M106.1 13.1 L103.3 24.6 L97.6 38.9 L94.0 43.4 L91.4 78.0 L93.2 80.9 L94.5 81.8 L112.3 93.5 L135.6 108.9 L152.1 119.8 L153.4 123.4 L153.7 146.2 L153.9 165.7 L157.3 176.9 L158.0 187.8 L162.1 196.0 L177.3 211.8 L181.0 221.1 L181.4 251.0 L181.7 273.7 L183.6 304.5 L183.6 330.3 L183.6 362.9 L183.6 401.1 L183.6 440.9 L173.6 441.4 L179.0 453.8 L180.0 465.0 L181.3 468.7 L178.5 474.1 L180.8 482.3 L185.2 485.4 L196.3 502.0 L200.0 516.1 L182.1 520.8 L183.4 524.5 L150.0 532.0 L136.8 538.1 L136.5 532.2 L131.7 531.1 L125.8 529.1 L122.1 526.0 L116.9 518.9 L115.1 513.4 L107.3 512.5 L97.7 506.3 L88.5 499.2 L85.4 492.1 L86.2 488.9 L84.8 485.5 L81.7 484.2 L73.4 468.2 L68.3 461.8 L65.9 456.6 L66.8 452.6 L65.7 447.2 L67.3 442.8 L71.7 440.2 L73.1 437.0 L73.5 430.3 L76.0 416.4 L77.6 402.8 L72.9 399.0 L67.2 397.9 L64.2 394.0 L63.1 387.6 L63.2 382.1 L74.4 362.7 L72.1 317.9 L73.8 311.1 L78.9 306.4 L83.3 301.0 L83.1 295.6 L75.6 282.2 L61.4 272.0 L54.1 263.7 L50.2 256.3 L49.5 252.3 L58.2 246.4 L62.0 242.4 L62.5 237.7 L58.9 229.3 L59.6 214.2 L62.9 202.8 L66.3 188.1 L65.9 183.8 L57.6 175.1 L53.0 173.9 L49.4 174.5 L40.6 180.3 L37.5 180.9 L35.5 179.2 L34.6 176.9 L37.7 173.4 L36.6 169.2 L39.1 165.4 L44.7 163.7 L46.3 161.8 L38.9 160.0 L38.0 157.5 L38.5 155.0 L40.7 154.5 L43.0 154.7 L44.3 152.9 L45.5 140.4 L46.4 136.1 L47.3 127.5 L48.5 94.1 L50.2 90.7 L50.4 88.2 L45.2 86.6 L32.8 77.6 L25.5 70.7 L19.2 63.7 L13.9 59.1 L3.5 51.9 L0.4 47.4 L0.0 42.8 L3.2 33.7 L8.2 24.0 L10.7 10.1 L9.1 6.4 L2.3 0.0 L26.7 4.9 L61.5 13.2 L62.2 14.7 L62.4 17.2 L68.4 17.2 L78.5 14.2 L106.1 13.1 Z";

/** Une ville de la carte. */
export interface City {
  /** Nom affiché. */
  name: string;
  /** Position dans le repère de la carte. */
  x: number;
  y: number;
}

/** Kara (9,55° N ; 1,19° E), d'où part l'examen. */
export const KARA: City = { name: "Kara", x: 136.6, y: 167.5 };

/** Lomé (6,14° N ; 1,21° E), où le radiologue le lit. */
export const LOME: City = { name: "Lomé", x: 139.4, y: 533 };
