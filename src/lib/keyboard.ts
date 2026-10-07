/**
 * Utilitaires des raccourcis clavier.
 *
 * Un raccourci d'une seule touche ne doit jamais voler la frappe de
 * quelqu'un qui écrit : dans un champ, un éditeur de compte-rendu, une
 * liste déroulante.
 */

/**
 * Vrai si l'élément reçoit du texte.
 *
 * @param target Cible de l'évènement clavier.
 */
export function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(
    element?.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(element?.tagName ?? ""),
  );
}

/**
 * Vrai si l'évènement porte un modificateur : il appartient alors au
 * navigateur ou au système, pas à la page.
 */
export function hasModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}
