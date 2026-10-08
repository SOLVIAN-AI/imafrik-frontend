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

/**
 * Qui écrit par le formulaire de contact : un établissement de santé ou
 * un radiologue. Mêmes valeurs que le champ `requester_kind` du service.
 * Les deux demandes ne suivent pas le même chemin : un établissement
 * signe un contrat et crée les comptes de son personnel ; un radiologue
 * déclare son numéro d'ordre, que l'équipe IMAFRIK vérifie.
 */
export const REQUESTER_KINDS = ["clinic", "radiologist"] as const;

/** Nature du demandeur. */
export type RequesterKind = (typeof REQUESTER_KINDS)[number];

/**
 * Vrai si une valeur est une nature de demandeur connue.
 *
 * @param value Valeur reçue (paramètre d'adresse, champ de formulaire).
 */
export function isRequesterKind(value: unknown): value is RequesterKind {
  return (REQUESTER_KINDS as readonly unknown[]).includes(value);
}
