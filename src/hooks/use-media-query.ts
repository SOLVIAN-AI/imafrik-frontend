"use client";

import * as React from "react";

/**
 * Suit une requête média, par exemple `(min-width: 1024px)`.
 *
 * Utile quand la **structure** d'un écran change selon la largeur — pas
 * seulement son apparence, ce que font les classes Tailwind. Rendre les
 * deux structures et masquer l'une monterait deux fois le viewer et
 * l'éditeur.
 *
 * Le serveur ne connaît pas la largeur de l'écran : il rend la valeur
 * `serverValue`, et React bascule à l'hydratation, sans effet en cascade
 * (`useSyncExternalStore`).
 *
 * @param query       Requête média CSS.
 * @param serverValue Valeur supposée au rendu serveur.
 */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
