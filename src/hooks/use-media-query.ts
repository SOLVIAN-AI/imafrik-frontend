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
 * (`useSyncExternalStore`). Avec `null`, l'écran sait qu'il ne sait pas
 * encore, et peut rendre une forme neutre plutôt que de parier sur une
 * disposition : un pari perdu s'affiche jusqu'à la fin du chargement.
 *
 * @param query       Requête média CSS.
 * @param serverValue Valeur supposée au rendu serveur, ou `null` pour
 *                    « inconnue ».
 */
export function useMediaQuery<T extends boolean | null>(
  query: string,
  serverValue: T,
): boolean | T {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return React.useSyncExternalStore<boolean | T>(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
