"use client";

import * as React from "react";

/**
 * Vrai si `element` peut encore défiler de côté dans le sens du glissé.
 *
 * @param element Élément sous le pointeur, ou l'un de ses ancêtres.
 * @param deltaX  Défilement horizontal demandé : négatif vers la gauche.
 */
function scrollsSideways(element: Element, deltaX: number): boolean {
  if (!/(auto|scroll)/.test(getComputedStyle(element).overflowX)) return false;
  if (element.scrollWidth <= element.clientWidth) return false;
  return deltaX < 0
    ? element.scrollLeft > 0
    : element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
}

/**
 * Faut-il annuler cette molette pour qu'elle ne fasse pas revenir en
 * arrière ?
 *
 * Oui quand elle est surtout horizontale et qu'aucun élément sous le
 * pointeur ne peut encore défiler de ce côté (un tableau large, par
 * exemple) : elle irait sinon au navigateur, qui en fait le geste « page
 * précédente ». Une molette surtout verticale ne regarde que la page.
 *
 * @param event Molette reçue par le document.
 */
export function blocksSwipeBack(
  event: Pick<WheelEvent, "deltaX" | "deltaY" | "target">,
): boolean {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return false;
  for (
    let element = event.target instanceof Element ? event.target : null;
    element;
    element = element.parentElement
  ) {
    if (scrollsSideways(element, event.deltaX)) return false;
  }
  return true;
}

/**
 * Écran de lecture : un glissé horizontal ne fait jamais revenir en
 * arrière.
 *
 * Signalé le 28 octobre 2026 : un glissé à deux doigts vers la droite sur
 * le pavé tactile faisait glisser toute la page vers l'écran précédent, au
 * risque de quitter un compte-rendu en cours. Chrome et Firefox s'en
 * tiennent à `overscroll-behavior-x: none`, posé sur la page de lecture
 * (`globals.css`, `data-reading-screen`) ; Safari l'ignore pour le retour
 * arrière, d'où cet écouteur : non passif, sans quoi il ne pourrait pas
 * annuler la molette. Le visualiseur, dans son cadre, se protège
 * lui-même. Le retour arrière reste aux boutons et au clavier.
 */
export function SwipeBackGuard() {
  React.useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (blocksSwipeBack(event)) event.preventDefault();
    };
    document.addEventListener("wheel", onWheel, { passive: false });
    return () => document.removeEventListener("wheel", onWheel);
  }, []);
  return null;
}
