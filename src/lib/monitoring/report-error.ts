import { captureException } from "@sentry/browser";

/**
 * Signale l'erreur qu'affiche un écran d'erreur (`error.tsx`).
 *
 * React intercepte l'erreur pour afficher l'écran : sans cet appel, le
 * suivi du navigateur ne la verrait jamais. Une erreur porteuse d'un
 * `digest` vient du serveur, qui l'a déjà signalée avec sa vraie pile
 * (`onRequestError`, dans `instrumentation.ts`) ; le navigateur n'en
 * reçoit qu'un message générique, qu'il serait inutile d'envoyer une
 * seconde fois. Sans suivi configuré, l'appel au SDK ne fait rien.
 *
 * Le détail part aussi dans la console, pour qui diagnostique sur place.
 *
 * @param error Erreur reçue par l'écran.
 */
export function reportScreenError(error: Error & { digest?: string }): void {
  console.error("[imafrik]", error.digest ?? error.message);
  if (!error.digest) captureException(error);
}
