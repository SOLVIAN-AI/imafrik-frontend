import * as Sentry from "@sentry/nextjs";

import { errorTrackingOptions } from "@/lib/monitoring/error-tracking";

/**
 * Démarrage du serveur Next : suivi des erreurs, s'il est configuré.
 *
 * Le même code sert l'environnement Node et l'environnement « edge » : le
 * paquet du SDK choisit lui-même sa version. Les options, et le retrait
 * des données de santé, sont dans `lib/monitoring/error-tracking.ts`.
 */
export function register(): void {
  const options = errorTrackingOptions();
  if (options) Sentry.init(options);
}

/**
 * Erreur d'un rendu serveur, d'une action ou d'une route : vers le suivi,
 * avec son `digest`, le code que l'écran d'erreur montre à l'utilisateur.
 */
export const onRequestError = Sentry.captureRequestError;
