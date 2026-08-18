/**
 * Rôles, tels que le schéma les définit (`public.user_role`).
 *
 * Le rôle n'est pas porté par l'utilisateur mais par son
 * **appartenance** à une organisation : le même médecin peut être
 * radiologue dans un cabinet et membre du personnel d'une clinique.
 * C'est le rôle de l'appartenance active qui alimente les claims du JWT,
 * et donc toutes les politiques RLS.
 */
export type UserRole = "platform_admin" | "radiologist" | "clinic_staff";

/** Nature d'une organisation (`public.org_kind`). */
export type OrgKind = "clinic" | "radiology_group";

/** Une appartenance : qui, dans quelle organisation, à quel titre. */
export interface Membership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationKind: OrgKind;
  role: UserRole;
  /** Ville, affichée pour distinguer deux établissements homonymes. */
  city: string;
}

/** L'utilisateur connecté et ses appartenances. */
export interface Session {
  user: {
    id: string;
    email: string;
    fullName: string;
    title: string;
  };
  memberships: Membership[];
  active: Membership;
  /**
   * Vraie session Supabase, ou jeu de démonstration.
   *
   * Exposé pour que l'interface puisse le dire — un écran qui affiche
   * des patients inventés doit pouvoir l'annoncer.
   */
  isDemo: boolean;
}

/** Libellés des rôles, du point de vue de l'utilisateur. */
export const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: "Administrateur IMAFRIK",
  radiologist: "Radiologue",
  clinic_staff: "Clinique",
};
