import type { Locale } from "@/lib/i18n/locale";

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
  /**
   * Langue des comptes-rendus de l'organisation
   * (`organizations.report_language`) : pour une clinique, aussi celle de
   * son paquet de raccordement, dont l'écran d'envoi cite les fichiers.
   */
  reportLanguage: Locale;
}

/** L'utilisateur connecté et ses appartenances. */
export interface Session {
  user: {
    id: string;
    email: string;
    fullName: string;
    title: string;
    /**
     * Numéro d'ordre renseigné au profil (`profiles.license_number`) :
     * un radiologue sans numéro ne peut pas être validé.
     */
    hasLicenseNumber: boolean;
    /**
     * Numéro d'ordre validé par l'équipe IMAFRIK
     * (`profiles.credentials_verified_at`). Sans cette validation, un
     * radiologue n'accède à aucun examen : la base les lui masque et le
     * service refuse prise en charge, rédaction et signature. Sans objet
     * pour les autres rôles.
     */
    credentialsVerified: boolean;
  };
  memberships: Membership[];
  active: Membership;
  /**
   * Langue de l'utilisateur : celle de son profil (`profiles.locale`), qui
   * régit ses écrans, les messages du service et ses courriels.
   */
  locale: Locale;
  /**
   * Vraie session Supabase, ou jeu de démonstration.
   *
   * Exposé pour que l'interface puisse le dire — un écran qui affiche
   * des patients inventés doit pouvoir l'annoncer.
   */
  isDemo: boolean;
}
