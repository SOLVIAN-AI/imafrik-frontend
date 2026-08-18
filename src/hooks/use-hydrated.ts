"use client";

import * as React from "react";

/** Aucun abonnement : la valeur ne change qu'une fois, à l'hydratation. */
const noSubscribe = () => () => {};

/**
 * Indique si le composant est passé côté client.
 *
 * **À quoi cela sert.** Certaines informations n'existent pas au moment
 * du rendu serveur — le thème choisi, le contenu de `localStorage`, le
 * fuseau du navigateur. Les afficher directement produirait un HTML
 * différent de celui que React reconstruit à l'hydratation ; React le
 * signale, et l'écran clignote le temps de la correction.
 *
 * **Pourquoi `useSyncExternalStore` plutôt qu'un effet.** Le motif
 * habituel — un état passé à `true` dans un `useEffect` — déclenche un
 * second rendu en cascade, ce que React déconseille désormais
 * explicitement. Ici, le serveur lit `false`, le client lit `true`, et
 * React fait la bascule lui-même, en une seule passe.
 *
 * @returns `false` pendant le rendu serveur, `true` ensuite.
 *
 * @example
 * ```tsx
 * const hydrated = useHydrated();
 * return <button aria-label={hydrated ? label : "Changer de thème"} />;
 * ```
 */
export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}
