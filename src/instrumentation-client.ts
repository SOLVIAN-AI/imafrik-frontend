import { isPublicSitePath } from "@/lib/i18n/routes";
import { errorTrackingOptions } from "@/lib/monitoring/error-tracking";

// Navigateur : suivi des erreurs, s'il est configuré. Le SDK de base
// plutôt que celui de Next, qui embarque la mesure de performance même
// éteinte : mesuré le 19 octobre 2026, 90 Ko de JavaScript en plus sur
// chaque page au lieu de 220, sur des connexions qui les sentent. Ni
// enregistrement de session ni mesure de performance : voir
// `lib/monitoring/error-tracking.ts`.
//
// Le SDK est chargé à part, et seulement si le suivi est configuré : il ne
// retarde plus l'hydratation. Sur l'application, il démarre aussitôt ; sur
// le site public, au premier moment libre après le chargement, pour ne pas
// disputer le processeur et la bande passante d'un téléphone à l'image et
// au texte du premier écran.
const options = errorTrackingOptions();
if (options) {
  const start = () =>
    void import("@sentry/browser").then(({ init }) => init(options));
  if (!isPublicSitePath(window.location.pathname)) start();
  else if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(start, { timeout: 4000 });
  else window.setTimeout(start, 2000);
}
