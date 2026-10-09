import type { UserRole } from "@/lib/session/types";

/**
 * Double authentification : qui y est tenu, et quand la demander.
 *
 * **La protection n'est pas ici.** Elle est posée à l'émission du jeton
 * (hook Supabase, migration `20261008120000_mfa_enforcement.sql`) : sans
 * second facteur, le jeton d'un rôle sensible n'ouvre aucune donnée,
 * quel que soit l'écran. Ce module ne fait qu'aiguiller vers l'écran qui
 * permet de le satisfaire, avec la même règle.
 */

/** Rôles soumis à la double authentification — même liste qu'en base. */
export const MFA_ROLES: readonly UserRole[] = ["radiologist", "platform_admin"];

/** Indique si un rôle exige la double authentification. */
export function roleRequiresMfa(role: UserRole): boolean {
  return MFA_ROLES.includes(role);
}

/** Niveaux d'assurance de la session, au sens de Supabase. */
export interface AssuranceLevel {
  /** Niveau atteint : `aal1` (mot de passe) ou `aal2` (et code). */
  current: string | null;
  /** Niveau atteignable : `aal2` dès qu'un facteur vérifié existe. */
  next: string | null;
}

/**
 * Indique si la session doit encore vérifier un second facteur.
 *
 * Même règle que le hook : rôle sensible, **ou** facteur déjà activé
 * — quelqu'un qui a activé la double authentification y est tenu, quel
 * que soit son rôle.
 *
 * @param role  Rôle de l'appartenance active.
 * @param level Niveaux d'assurance de la session.
 */
export function needsSecondFactor(
  role: UserRole,
  level: AssuranceLevel,
): boolean {
  if (level.current === "aal2") return false;
  return roleRequiresMfa(role) || level.next === "aal2";
}

/**
 * Indique si un changement de mot de passe doit attendre le second facteur.
 *
 * Un compte qui a activé la double authentification ne change pas son
 * mot de passe sur une session ouverte au seul premier niveau : sinon,
 * un mot de passe dérobé suffirait à évincer son titulaire. La règle vaut
 * quel que soit le rôle, et GoTrue l'applique aussi de son côté.
 *
 * @param level Niveaux d'assurance de la session.
 */
export function passwordChangeNeedsSecondFactor(
  level: AssuranceLevel,
): boolean {
  return level.next === "aal2" && level.current !== "aal2";
}

/**
 * Valide un code à usage unique : six chiffres, espaces tolérés — on
 * recopie souvent « 123 456 » tel que l'application l'affiche.
 *
 * @returns Le code sans espace, ou `null` s'il est mal formé.
 */
export function normalizeOtp(input: string): string | null {
  const code = input.replace(/\s+/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}
