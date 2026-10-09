import type { OrgKind, UserRole } from "@/lib/session/types";

/**
 * Rôles qu'une appartenance peut porter, selon la nature de
 * l'organisation, le premier proposé par défaut.
 *
 * **Miroir de la règle du service** (`ROLES_BY_ORGANIZATION_KIND`, dans
 * `app/models.py`), qui la fait respecter à l'invitation par la clinique,
 * à l'invitation par l'équipe IMAFRIK et au rattachement d'un compte
 * existant. Ce miroir ne décide de rien : il évite de proposer dans un
 * formulaire un rôle que le service refuserait. Trois écrans en gardaient
 * chacun leur copie, et deux d'entre elles divergeaient.
 *
 * - une clinique emploie son personnel et, parfois, ses propres
 *   radiologues ;
 * - un groupe de radiologie réunit des radiologues ; l'équipe IMAFRIK est
 *   elle-même un groupe.
 */
export const ROLES_BY_KIND = {
  clinic: ["clinic_staff", "radiologist"],
  radiology_group: ["radiologist", "platform_admin"],
} as const satisfies Record<OrgKind, readonly UserRole[]>;

/** Rôle qu'une clinique peut attribuer chez elle. */
export type ClinicRole = (typeof ROLES_BY_KIND.clinic)[number];

/**
 * Indique si un rôle convient à une nature d'organisation.
 *
 * @param role Rôle proposé.
 * @param kind Nature de l'organisation d'accueil.
 */
export function roleFitsOrganization(role: UserRole, kind: OrgKind): boolean {
  return (ROLES_BY_KIND[kind] as readonly UserRole[]).includes(role);
}
