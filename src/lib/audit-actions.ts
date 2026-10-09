import type { AppMessages } from "@/i18n";
import type { operations } from "@/lib/api/schema";

/**
 * Actions du journal d'audit.
 *
 * Leurs libellés vivent dans les textes de la tour de contrôle
 * (`admin.audit.actions`), dans chaque langue. La liste fait foi côté
 * service (`AuditAction`, dans `app/models.py`), où un test la confronte
 * aux actions réellement écrites par les migrations et par le code ; elle
 * arrive ici par le contrat OpenAPI, et la vérification de types ci-dessous
 * exige un libellé pour chacune. Une action inconnue s'affiche telle
 * quelle : le journal ne doit rien masquer, même ce que l'interface ne
 * sait pas encore nommer.
 */

/** Code d'une action connue, par exemple `report.signed`. */
export type AuditAction = keyof AppMessages["admin"]["audit"]["actions"];

/** Actions que le service enregistre, d'après le filtre du journal. */
export type ApiAuditAction = NonNullable<
  NonNullable<
    operations["list_audit_admin_audit_get"]["parameters"]["query"]
  >["action"]
>;

/**
 * Ne compile que si les libellés couvrent exactement les actions du
 * service : un libellé manquant (`profile.identity_changed` l'était) ou en
 * trop casse `npm run typecheck`.
 */
const _labelsMatchService: [ApiAuditAction] extends [AuditAction]
  ? [AuditAction] extends [ApiAuditAction]
    ? true
    : false
  : false = true;
void _labelsMatchService;

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
