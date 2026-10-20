import { isUsableBox, type Box } from "@/components/tour/geometry";
import type { TourStep } from "@/components/tour/tours";

/**
 * Repères de la visite dans la page : les éléments marqués `data-tour`.
 *
 * Un même repère peut exister plusieurs fois : l'entrée de la barre
 * latérale et celle du tiroir de navigation, le bouton de recherche du
 * téléphone et celui de l'ordinateur. Seul compte celui qui est
 * réellement affiché.
 */

/**
 * Rectangle d'un élément, dans le repère de la fenêtre.
 *
 * Un élément marqué `data-tour-fit="content"` est mesuré sans ses marges
 * intérieures : une grille qui porte la marge de la page est montrée par
 * ses cartes, pas par la marge qui les entoure.
 */
export function boxOf(element: Element): Box {
  const rect = element.getBoundingClientRect();
  if (element.getAttribute("data-tour-fit") !== "content") {
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }
  const style = window.getComputedStyle(element);
  const top = parseFloat(style.paddingTop) || 0;
  const right = parseFloat(style.paddingRight) || 0;
  const bottom = parseFloat(style.paddingBottom) || 0;
  const left = parseFloat(style.paddingLeft) || 0;
  return {
    top: rect.top + top,
    left: rect.left + left,
    width: Math.max(0, rect.width - left - right),
    height: Math.max(0, rect.height - top - bottom),
  };
}

/**
 * Vrai si l'élément est affiché : une taille non nulle, et ni masqué ni
 * rendu invisible par lui-même ou par un parent. Le volet d'images de
 * l'écran de lecture, sur téléphone, est `invisible` sans quitter la mise
 * en page : sa taille seule ne suffit pas à le dire.
 */
function isDisplayed(element: Element): boolean {
  if (!isUsableBox(boxOf(element))) return false;
  if (typeof element.checkVisibility === "function") {
    // Les deux noms de l'option : l'ancien pour Safari, le nouveau pour
    // les navigateurs qui ont retiré le premier. L'opacité n'est pas
    // vérifiée : un élément qui apparaît en fondu partirait de zéro.
    return element.checkVisibility({
      checkVisibilityCSS: true,
      visibilityProperty: true,
    });
  }
  return window.getComputedStyle(element).visibility !== "hidden";
}

/**
 * Premier élément affiché portant ce repère.
 *
 * @param name Valeur de l'attribut `data-tour`.
 */
export function findTarget(name: string): Element | null {
  const candidates = document.querySelectorAll(
    `[data-tour="${CSS.escape(name)}"]`,
  );
  for (const candidate of candidates) {
    if (isDisplayed(candidate)) return candidate;
  }
  return null;
}

/**
 * Élément que montre une étape : son repère, sinon son repère de
 * remplacement.
 *
 * @returns L'élément, `null` s'il n'y en a aucun d'affiché (ou si l'étape
 *          n'en vise pas).
 */
export function resolveStep(step: TourStep): Element | null {
  if (!step.target) return null;
  return (
    findTarget(step.target) ??
    (step.fallback ? findTarget(step.fallback) : null)
  );
}

/**
 * Étapes à montrer, dans l'ordre : une étape facultative dont aucun repère
 * n'est affiché est écartée ; les autres restent, centrées au besoin.
 * Calculé au démarrage, pour que « Étape 2 sur 6 » ne change pas en route.
 */
export function visibleSteps(steps: readonly TourStep[]): TourStep[] {
  return steps.filter((step) => !step.optional || resolveStep(step) !== null);
}
