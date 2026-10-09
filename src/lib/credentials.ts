import type { Session } from "@/lib/session/types";

/**
 * Validation du numéro d'ordre d'un radiologue par l'équipe IMAFRIK.
 *
 * Un compte-rendu signé engage un médecin : avant le moindre accès aux
 * examens, l'équipe IMAFRIK vérifie auprès de l'Ordre le numéro que le
 * radiologue a déclaré. Tant que ce n'est pas fait, la base lui masque
 * tous les examens et le service refuse prise en charge, rédaction et
 * signature. Ce module ne décide de rien : il traduit l'état du profil
 * en ce que l'écran doit dire.
 */

/**
 * État de la validation :
 *
 * - `verified` — numéro renseigné et validé : accès ouvert ;
 * - `pending` — numéro renseigné, vérification en cours ;
 * - `missing` — aucun numéro : rien ne peut être vérifié.
 */
export type CredentialStatus = "verified" | "pending" | "missing";

/** Ce que l'état demande de savoir du profil. */
export interface CredentialFacts {
  /** Un numéro d'ordre non vide figure au profil. */
  hasLicenseNumber: boolean;
  /** L'équipe IMAFRIK l'a validé. */
  credentialsVerified: boolean;
}

/**
 * État de la validation, avec la même règle que la base
 * (`radiologist_credentialed()`) : une validation sans numéro ne vaut
 * rien, le numéro est alors « manquant ».
 *
 * @param facts Numéro renseigné, validation posée.
 */
export function credentialStatus(facts: CredentialFacts): CredentialStatus {
  if (!facts.hasLicenseNumber) return "missing";
  return facts.credentialsVerified ? "verified" : "pending";
}

/**
 * Ce qui empêche le radiologue connecté d'accéder aux examens.
 *
 * @param session Session courante.
 * @returns `missing` ou `pending` pour un radiologue non validé ; `null`
 *          pour un radiologue validé et pour tout autre rôle, que la
 *          validation ne concerne pas.
 */
export function credentialBlock(
  session: Pick<Session, "user" | "active">,
): Exclude<CredentialStatus, "verified"> | null {
  if (session.active.role !== "radiologist") return null;
  const status = credentialStatus(session.user);
  return status === "verified" ? null : status;
}

/**
 * Normalise un numéro d'ordre saisi : espaces de bord retirés.
 *
 * @param value Saisie brute.
 */
export function normalizeLicenseNumber(value: string): string {
  return value.trim();
}

/**
 * Vrai si l'enregistrement remplacerait un numéro d'ordre existant par un
 * autre, ou l'effacerait : le serveur annule alors sa validation.
 *
 * Ajouter un premier numéro n'est pas un changement : il n'y avait rien
 * de validé à perdre.
 *
 * @param previous Numéro enregistré.
 * @param next     Numéro saisi.
 */
export function licenseChangeResetsValidation(
  previous: string,
  next: string,
): boolean {
  const before = normalizeLicenseNumber(previous);
  return before !== "" && before !== normalizeLicenseNumber(next);
}

/** Ce qu'un compte-rendu imprime du signataire. */
export interface SignerIdentity {
  fullName: string;
  title: string;
  licenseNumber: string;
}

/**
 * Vrai si l'enregistrement changerait le nom ou le titre d'un radiologue
 * qui a déjà un numéro d'ordre : le serveur annule alors la validation,
 * comme pour un nouveau numéro, car tous trois s'impriment sous la
 * signature.
 *
 * Vider le titre l'efface côté serveur : c'est un changement comme un
 * autre, qui annule aussi la validation. Seuls les espaces de bord, que
 * le serveur retire, ne comptent pas.
 *
 * @param previous Identité enregistrée.
 * @param next     Identité saisie.
 */
export function identityChangeResetsValidation(
  previous: SignerIdentity,
  next: SignerIdentity,
): boolean {
  if (normalizeLicenseNumber(previous.licenseNumber) === "") return false;
  return (
    next.fullName.trim() !== previous.fullName.trim() ||
    next.title.trim() !== previous.title.trim()
  );
}
