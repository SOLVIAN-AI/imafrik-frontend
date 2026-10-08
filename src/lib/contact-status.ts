/**
 * Étapes du suivi d'une demande reçue par le site — mêmes valeurs que la
 * contrainte `contact_requests_status_known` en base.
 *
 * Module pur, partagé par l'écran (rendu au serveur) et le formulaire de
 * suivi (exécuté dans le navigateur) : une constante exportée d'un module
 * client n'est, côté serveur, qu'une référence opaque. Les libellés
 * vivent dans les textes de la tour de contrôle (`admin.requests.status`).
 */
export const CONTACT_STATUSES = [
  "new",
  "contacted",
  "converted",
  "dismissed",
] as const;

/** Étape du suivi d'une demande. */
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
