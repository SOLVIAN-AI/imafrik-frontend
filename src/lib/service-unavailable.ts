/**
 * Service momentanément indisponible : reconnaître la panne de part et
 * d'autre de la frontière serveur / navigateur.
 *
 * **Le problème.** En production, Next.js ne transmet au navigateur ni le
 * message, ni le nom, ni les propriétés d'une erreur levée par un
 * composant serveur : l'écran d'erreur ne reçoit qu'un `digest`, une
 * empreinte calculée à partir du message et de la pile. Il ne peut donc
 * pas distinguer « l'API ne répond pas » d'un défaut de l'application, et
 * affichait « Quelque chose s’est mal passé » avec un code à transmettre
 * au support, pour une panne que le support ne peut que constater.
 *
 * **Le mécanisme.** Next.js respecte le `digest` qu'une erreur porte déjà
 * (`create-error-handler`, « respect the original digest ») et le
 * transmet tel quel au navigateur, où les écrans d'erreur le lisent. Les
 * erreurs de panne reçoivent donc un `digest` fixe et reconnaissable,
 * {@link SERVICE_UNAVAILABLE_DIGEST}. Le détail complet (message, cause,
 * pile) reste dans les journaux du serveur, comme pour toute erreur.
 *
 * Module pur, sans dépendance serveur : il est importé des deux côtés.
 */

/**
 * Empreinte des erreurs de panne.
 *
 * Elle ne commence par aucun des préfixes que Next.js réserve à ses
 * propres signaux (`NEXT_REDIRECT`, `NEXT_HTTP_ERROR_FALLBACK`,
 * `BAILOUT_TO_CLIENT_SIDE_RENDERING`, `DYNAMIC_SERVER_USAGE`…) : elle ne
 * peut pas être prise pour une redirection ou une page introuvable.
 */
export const SERVICE_UNAVAILABLE_DIGEST = "IMAFRIK_SERVICE_UNAVAILABLE";

/**
 * Marque une erreur comme panne du service.
 *
 * @param error Erreur à marquer ; modifiée sur place.
 * @returns La même erreur, pour l'écrire `throw markServiceUnavailable(…)`.
 */
export function markServiceUnavailable<E extends Error>(
  error: E,
): E & { digest: string } {
  return Object.assign(error, { digest: SERVICE_UNAVAILABLE_DIGEST });
}

/**
 * Indique si une erreur reçue par un écran d'erreur est une panne du
 * service, et non un défaut de l'application.
 *
 * @param error Erreur transmise à `error.tsx` (seul le `digest` survit en
 *              production) ou levée côté serveur.
 */
export function isServiceUnavailable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    (error as { digest?: unknown }).digest === SERVICE_UNAVAILABLE_DIGEST
  );
}
