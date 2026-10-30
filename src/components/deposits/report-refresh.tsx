"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

/** Intervalle entre deux relectures. */
const INTERVAL_MS = 5_000;

/** Au-delà, la page cesse de se relire : un contrôle ne dure pas si longtemps. */
const MAX_MS = 30 * 60_000;

/**
 * Relit la page toutes les cinq secondes tant que le compte rendu attend
 * quelque chose : le contrôle de l'archive, ou l'intégration d'un examen
 * (une minute après sa dernière image). Rien n'est rendu.
 */
export function ReportRefresh() {
  const router = useRouter();
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      // Onglet caché : rien à rafraîchir pour personne.
      if (document.visibilityState === "visible") router.refresh();
    }, INTERVAL_MS);
    const stop = window.setTimeout(() => window.clearInterval(timer), MAX_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [router]);
  return null;
}
