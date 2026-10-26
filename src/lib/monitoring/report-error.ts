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
 * Le SDK est chargé à la demande, comme dans `instrumentation-client.ts` :
 * l'écran d'erreur racine fait partie de chaque page, et une importation
 * statique remettait le SDK dans le JavaScript de toutes, vitrine
 * comprise.
 *
 * Le détail part aussi dans la console, pour qui diagnostique sur place.
 *
 * @param error Erreur reçue par l'écran.
 * @returns Une promesse résolue une fois l'erreur confiée au SDK.
 */
export async function reportScreenError(
  error: Error & { digest?: string },
): Promise<void> {
  console.error("[imafrik]", error.digest ?? error.message);
  if (error.digest) return;
  const { captureException } = await import("@sentry/browser");
  captureException(error);
}
