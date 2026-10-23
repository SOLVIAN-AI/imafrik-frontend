import type { Session } from "@/lib/session/types";

/**
 * Habilitation d'un radiologue par l'équipe IMAFRIK.
 *
 * Un compte-rendu signé engage un médecin : avant le moindre accès aux
 * examens, l'équipe IMAFRIK examine le justificatif qu'exige l'exercice
 * déclaré : diplôme et numéro d'ordre pour un inscrit à l'Ordre,
 * attestation d'inscription pour un résident, dont l'accès se ferme seul
 * à la fin de l'attestation.
 *
 * **La règle vit en base** (`credential_state`) : l'accès aux examens, le
 * service et cet écran lisent le même calcul. Ce module ne décide de
 * rien : il dit ce que chaque état demande à l'écran.
 */

/**
 * État d'habilitation, tel que la base le calcule :
 *
 * - `undeclared` : exercice pas encore déclaré ;
 * - `license_missing` : inscrit à l'Ordre, sans numéro d'ordre ;
 * - `documents_missing` : aucun justificatif en attente (aucun dépôt,
 *   ou le dernier a été refusé) ;
 * - `pending` : justificatif en attente de la décision de l'équipe ;
 * - `expired` : attestation d'un résident échue, sans nouvelle déposée ;
 * - `verified` : habilité, il lit, rédige et signe.
 */
export type CredentialState =
  | "undeclared"
  | "license_missing"
  | "documents_missing"
  | "pending"
  | "expired"
  | "verified";

/** Exercice déclaré : inscrit à l'Ordre, ou en cours de spécialisation. */
export type PracticeStatus = "registered" | "resident";

/** Nature d'un justificatif. */
export type DocumentKind = "diploma" | "enrollment_certificate";

/** Justificatif qu'exige chaque exercice. */
export const REQUIRED_DOCUMENT: Record<PracticeStatus, DocumentKind> = {
  registered: "diploma",
  resident: "enrollment_certificate",
};

/** Taille maximale d'un justificatif, comme le service la vérifie. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Types de fichier acceptés, pour le sélecteur du navigateur. */
export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png";

/**
 * États où le radiologue a quelque chose à faire, et l'étape ou le
 * paramètre qui le lui permet. Les autres (`pending`, `verified`)
 * n'attendent rien de lui.
 */
export function credentialNeedsAction(state: CredentialState): boolean {
  return state !== "pending" && state !== "verified";
}

/**
 * Ce qui empêche le radiologue connecté d'accéder aux examens.
 *
 * @param session Session courante.
 * @returns L'état d'un radiologue non habilité ; `null` pour un
 *          radiologue habilité et pour tout autre rôle, que
 *          l'habilitation ne concerne pas.
 */
export function credentialBlock(
  session: Pick<Session, "user" | "active">,
): Exclude<CredentialState, "verified"> | null {
  if (session.active.role !== "radiologist") return null;
  const state = session.user.credentialState;
  return state === "verified" ? null : state;
}

/**
 * Jours restants avant la fin d'une attestation, à la date du jour.
 *
 * @param validUntil Dernier jour de validité (`AAAA-MM-JJ`), ou `null`.
 * @param today      Date du jour (`AAAA-MM-JJ`).
 * @returns Le nombre de jours, 0 le dernier jour ; `null` sans date.
 */
export function daysUntil(
  validUntil: string | null,
  today: string,
): number | null {
  if (!validUntil) return null;
  const day = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.parse(`${validUntil}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      day,
  );
}

/** Une attestation qui finit dans ce délai appelle son renouvellement. */
export const RENEWAL_NOTICE_DAYS = 30;

/**
 * Jours restants si une date de fin saisie est anormalement proche,
 * sinon `null`.
 *
 * Une attestation d'inscription vaut une année universitaire : une fin
 * dans moins d'un mois est rare, et le plus souvent une erreur de
 * saisie. Le 17 octobre 2026, une attestation déposée et acceptée « jusqu'au
 * 18/10/2026 » a fermé l'accès d'un résident deux jours plus tard. Le seuil
 * est celui du rappel de renouvellement : en deçà, le rappel partirait
 * aussitôt.
 *
 * @param validUntil Date de fin saisie (`AAAA-MM-JJ`), ou vide.
 * @param today      Date du jour (`AAAA-MM-JJ`).
 * @returns Les jours restants (0 le dernier jour), ou `null` si la date
 *          est absente, passée ou assez lointaine.
 */
export function shortValidity(
  validUntil: string | null,
  today: string,
): number | null {
  const days = daysUntil(validUntil || null, today);
  return days !== null && days >= 0 && days < RENEWAL_NOTICE_DAYS ? days : null;
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
 * Vrai si l'enregistrement changerait le nom ou le titre : le serveur
 * annule alors la validation, comme pour un nouveau numéro, car tous
 * trois s'impriment sous la signature. L'écran ne l'annonce qu'à un
 * radiologue habilité : sans habilitation, il n'y a rien à perdre.
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
  return (
    next.fullName.trim() !== previous.fullName.trim() ||
    next.title.trim() !== previous.title.trim()
  );
}
