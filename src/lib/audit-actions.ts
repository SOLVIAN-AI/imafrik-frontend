/**
 * Actions du journal d'audit, en français.
 *
 * La liste reprend les actions écrites par le service et par les
 * fonctions de la base. Une action inconnue ici s'affiche telle quelle :
 * le journal ne doit rien masquer, même ce que l'interface ne sait pas
 * encore nommer.
 */
export const AUDIT_ACTIONS: Record<string, string> = {
  "study.viewed": "Examen consulté",
  "study.claimed": "Examen pris en charge",
  "study.released": "Examen rendu au pool",
  "report.signed": "Compte-rendu signé",
  "report.addendum": "Addendum ajouté",
  "report.delivered": "Compte-rendu remis",
  "membership.created": "Membre ajouté",
  "membership.removed": "Membre retiré",
  "organization.state_changed": "Organisation activée ou suspendue",
  "organization.pool_changed": "Ouverture au pool modifiée",
  "platform.settings_changed": "Réglages modifiés",
  "contact_request.tracked": "Demande reçue suivie",
};

/**
 * Libellé d'une action.
 *
 * @param action Code de l'action, par exemple `report.signed`.
 */
export function auditLabel(action: string): string {
  return AUDIT_ACTIONS[action] ?? action;
}
