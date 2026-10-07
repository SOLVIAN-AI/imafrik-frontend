"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * Relit l'écran serveur à intervalle régulier, tant qu'il est visible.
 *
 * Une file de lecture qui ne bouge pas tant qu'on ne clique pas sur
 * « Actualiser » laisse attendre une urgence arrivée entre-temps. Le
 * rafraîchissement passe par `router.refresh()` : la page serveur refait
 * ses appels au service sous la session de l'utilisateur, et React
 * fusionne le résultat sans remonter l'écran (défilement, focus et
 * sections ouvertes sont conservés).
 *
 * - **Onglet masqué** : aucune requête. Au retour sur l'onglet, une
 *   relecture immédiate, puis le rythme reprend.
 * - **Pas d'empilement** : une relecture n'est pas lancée tant que la
 *   précédente n'est pas terminée.
 *
 * @param intervalMs Intervalle entre deux relectures, en millisecondes.
 * @returns `refreshing`, vrai pendant une relecture, et `refresh`, pour
 *          la déclencher à la main.
 */
export function useAutoRefresh(intervalMs: number): {
  refreshing: boolean;
  refresh: () => void;
} {
  const router = useRouter();
  const [refreshing, startTransition] = React.useTransition();
  const busy = React.useRef(false);

  const refresh = React.useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // La transition se termine quand le nouvel arbre est rendu.
  React.useEffect(() => {
    if (!refreshing) busy.current = false;
  }, [refreshing]);

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer === null) timer = setInterval(refresh, intervalMs);
    };
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, refresh]);

  return { refreshing, refresh };
}
