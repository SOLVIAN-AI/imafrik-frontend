import type { AppMessages } from "@/i18n";

/**
 * Actions du journal d'audit.
 *
 * Leurs libellés vivent dans les textes de la tour de contrôle
 * (`admin.audit.actions`), dans chaque langue. La liste reprend les
 * actions écrites par le service et par les fonctions de la base. Une
 * action inconnue s'affiche telle quelle : le journal ne doit rien
 * masquer, même ce que l'interface ne sait pas encore nommer.
 */

/** Code d'une action connue, par exemple `report.signed`. */
export type AuditAction = keyof AppMessages["admin"]["audit"]["actions"];

/**
 * L'action est-elle connue ?
 *
 * `Object.hasOwn` et non `in` : `?action=toString` ne doit pas passer.
 *
 * @param action Code reçu, par exemple d'un paramètre d'adresse.
 * @param t      Textes de l'application.
 */
export function isAuditAction(
  action: string,
  t: AppMessages,
): action is AuditAction {
  return Object.hasOwn(t.admin.audit.actions, action);
}

/**
 * Libellé d'une action, dans la langue des textes donnés.
 *
 * @param action Code de l'action, par exemple `report.signed`.
 * @param t      Textes de l'application.
 */
export function auditLabel(action: string, t: AppMessages): string {
  return isAuditAction(action, t) ? t.admin.audit.actions[action] : action;
}
