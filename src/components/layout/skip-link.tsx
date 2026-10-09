import { cn } from "@/lib/utils";

/**
 * Lien d'évitement (WCAG 2.4.1, « Contourner des blocs »).
 *
 * Premier élément atteint à la tabulation : il mène directement au
 * contenu principal, sans traverser l'en-tête ni la navigation. Caché
 * hors de l'écran, il glisse en pastille au premier `Tab`, en haut à
 * gauche, puis repart dès que le focus le quitte.
 *
 * Un lien natif vers une ancre : le navigateur déplace lui-même le focus
 * sur la cible, qui doit porter `id={MAIN_CONTENT_ID}` et `tabIndex={-1}`.
 */

/** Identifiant du contenu principal, cible du lien d'évitement. */
export const MAIN_CONTENT_ID = "contenu";

/**
 * Lien d'évitement vers le contenu principal.
 *
 * @param label Libellé, dans la langue de la page
 *              (`t.common.skipToContent`).
 */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className={cn(
        "fixed top-3 left-3 z-100 rounded-lg border border-border-default bg-surface-overlay px-3 py-2",
        "text-sm font-medium text-primary shadow-overlay",
        // Hors de l'écran tant qu'il n'a pas le focus : contrairement à
        // `sr-only`, la pastille garde sa forme et glisse simplement en vue.
        "-translate-y-[calc(100%+1rem)] transition-transform duration-150 ease-out-quart focus:translate-y-0",
      )}
    >
      {label}
    </a>
  );
}
