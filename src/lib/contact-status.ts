/**
 * Étapes du suivi d'une demande reçue par le site — mêmes valeurs que la
 * contrainte `contact_requests_status_known` en base.
 *
 * Module pur, partagé par l'écran (rendu au serveur) et le formulaire de
 * suivi (exécuté dans le navigateur) : une constante exportée d'un module
 * client n'est, côté serveur, qu'une référence opaque.
 */
export const CONTACT_STATUSES = [
  "new",
  "contacted",
  "converted",
  "dismissed",
] as const;

/** Étape du suivi d'une demande. */
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

/** Libellés des étapes. */
export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: "Nouvelle",
  contacted: "Contactée",
  converted: "Convertie",
  dismissed: "Écartée",
};
