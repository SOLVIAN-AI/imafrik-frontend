/**
 * Géométrie de la visite guidée : où poser la bulle d'une étape.
 *
 * Fonctions pures, sans DOM : elles reçoivent des rectangles et rendent
 * une position. C'est ce qui permet de les tester, et de garder la
 * bulle à l'écran sur un téléphone comme sur un grand moniteur.
 */

/** Rectangle en pixels de la fenêtre, comme `getBoundingClientRect`. */
export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Côté de l'élément où la bulle se pose. */
export type Placement = "bottom" | "top" | "right" | "left";

/** Position calculée de la bulle. */
export interface BubblePosition {
  top: number;
  left: number;
  /** Côté retenu ; `center` quand l'étape n'a pas d'élément à montrer. */
  placement: Placement | "center";
}

/** Écart entre l'élément mis en lumière et sa bulle. */
export const GAP = 12;

/** Marge minimale entre la bulle et le bord de la fenêtre. */
export const EDGE = 12;

/** Marge autour de l'élément mis en lumière. */
export const SPOTLIGHT_PADDING = 6;

/** Ordre d'essai des côtés, à partir du côté préféré. */
const FALLBACKS: Record<Placement, Placement[]> = {
  bottom: ["bottom", "top", "right", "left"],
  top: ["top", "bottom", "right", "left"],
  right: ["right", "left", "bottom", "top"],
  left: ["left", "right", "bottom", "top"],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Zone mise en lumière : l'élément, élargi d'une marge, sans déborder de
 * la fenêtre.
 */
export function spotlight(
  target: Box,
  viewport: { width: number; height: number },
): Box {
  const left = Math.max(0, target.left - SPOTLIGHT_PADDING);
  const top = Math.max(0, target.top - SPOTLIGHT_PADDING);
  const right = Math.min(
    viewport.width,
    target.left + target.width + SPOTLIGHT_PADDING,
  );
  const bottom = Math.min(
    viewport.height,
    target.top + target.height + SPOTLIGHT_PADDING,
  );
  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

/**
 * Position de la bulle autour d'un élément.
 *
 * Le côté préféré est essayé d'abord, puis l'opposé, puis les deux
 * autres ; le premier où la bulle tient entière l'emporte. Si aucun ne
 * convient (élément plus grand que l'écran, téléphone étroit), la bulle
 * se pose en bas de la fenêtre, centrée, par-dessus l'élément. Dans tous
 * les cas, elle reste à `EDGE` pixels au moins des bords.
 *
 * @param target    Élément mis en lumière, ou `null` pour une étape sans
 *                  élément : la bulle se centre.
 * @param bubble    Taille de la bulle.
 * @param viewport  Taille de la fenêtre.
 * @param preferred Côté préféré.
 */
export function placeBubble(
  target: Box | null,
  bubble: { width: number; height: number },
  viewport: { width: number; height: number },
  preferred: Placement = "bottom",
): BubblePosition {
  const maxLeft = viewport.width - bubble.width - EDGE;
  const maxTop = viewport.height - bubble.height - EDGE;

  if (!target) {
    return {
      left: clamp((viewport.width - bubble.width) / 2, EDGE, maxLeft),
      top: clamp((viewport.height - bubble.height) / 2, EDGE, maxTop),
      placement: "center",
    };
  }

  const zone = spotlight(target, viewport);
  const centeredLeft = zone.left + zone.width / 2 - bubble.width / 2;
  const centeredTop = zone.top + zone.height / 2 - bubble.height / 2;

  for (const side of FALLBACKS[preferred]) {
    switch (side) {
      case "bottom": {
        const top = zone.top + zone.height + GAP;
        if (top + bubble.height <= viewport.height - EDGE) {
          return {
            top,
            left: clamp(centeredLeft, EDGE, maxLeft),
            placement: side,
          };
        }
        break;
      }
      case "top": {
        const top = zone.top - GAP - bubble.height;
        if (top >= EDGE) {
          return {
            top,
            left: clamp(centeredLeft, EDGE, maxLeft),
            placement: side,
          };
        }
        break;
      }
      case "right": {
        const left = zone.left + zone.width + GAP;
        if (left + bubble.width <= viewport.width - EDGE) {
          return {
            top: clamp(centeredTop, EDGE, maxTop),
            left,
            placement: side,
          };
        }
        break;
      }
      case "left": {
        const left = zone.left - GAP - bubble.width;
        if (left >= EDGE) {
          return {
            top: clamp(centeredTop, EDGE, maxTop),
            left,
            placement: side,
          };
        }
        break;
      }
    }
  }

  return {
    left: clamp((viewport.width - bubble.width) / 2, EDGE, maxLeft),
    top: maxTop,
    placement: "bottom",
  };
}

/**
 * Vrai si l'élément est visible et utilisable comme repère : affiché,
 * d'une taille non nulle, et dans la page (pas dans un tiroir fermé).
 */
export function isUsableBox(box: Box | null): box is Box {
  return box !== null && box.width > 0 && box.height > 0;
}

/**
 * Vrai si l'élément est entièrement dans la fenêtre : sinon, il faut le
 * faire défiler jusqu'à lui avant de le montrer.
 */
export function isInView(
  box: Box,
  viewport: { width: number; height: number },
): boolean {
  return (
    box.top >= 0 &&
    box.left >= 0 &&
    box.top + box.height <= viewport.height &&
    box.left + box.width <= viewport.width
  );
}
