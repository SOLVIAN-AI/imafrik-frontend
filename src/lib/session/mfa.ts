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
 * Niveaux d'assurance, calculés à partir de données **vérifiées**.
 *
 * Même calcul que `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`,
 * mais sur des sources sûres : le claim `aal` d'un jeton dont la
 * signature a été vérifiée (`getClaims()`), et les facteurs de
 * l'utilisateur renvoyés par le service d'authentification
 * (`getUser()`). Appelée sans jeton, la fonction de la bibliothèque lit
 * au contraire la session du cookie sans la vérifier, y compris la liste
 * des facteurs, et le signale par un avertissement à chaque requête.
 *
 * @param aal     Claim `aal` du jeton vérifié.
 * @param factors Facteurs de l'utilisateur, tels que `getUser()` les
 *                renvoie.
 */
export function assuranceFromVerified(
  aal: unknown,
  factors: readonly { status: string }[] | null | undefined,
): AssuranceLevel {
  const current = aal === "aal1" || aal === "aal2" ? aal : null;
  const hasVerifiedFactor = (factors ?? []).some(
    (factor) => factor.status === "verified",
  );
  return { current, next: hasVerifiedFactor ? "aal2" : current };
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
 * Indique si la session attend son second facteur, avant toute lecture
 * en base.
 *
 * Même règle que `second_factor_pending()` côté base (migration
 * `20261010140000`), qui ferme alors la lecture du profil et des
 * appartenances : le hook a exigé le second facteur (`mfa_required` du
 * jeton vérifié), ou le compte en a un vérifié et la session ne l'a pas
 * encore présenté. Une session au second niveau n'attend jamais rien.
 *
 * @param mfaRequired Claim `mfa_required` du jeton vérifié.
 * @param level       Niveaux d'assurance de la session.
 */
export function secondFactorPending(
  mfaRequired: unknown,
  level: AssuranceLevel,
): boolean {
  if (level.current === "aal2") return false;
  return mfaRequired === true || passwordChangeNeedsSecondFactor(level);
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
