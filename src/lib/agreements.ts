import type { UserRole } from "@/lib/session/types";

/**
 * Les engagements contractuels qu'un compte accepte en ligne.
 *
 * Deux documents, versionnés côté service (`app/agreements`, dépôt
 * backend) :
 *
 * - le **contrat d'exercice du radiologue**, accepté par chaque
 *   radiologue, pour lui-même ;
 * - la **convention de service de l'établissement**, acceptée **une fois
 *   par clinique**, par une personne qui déclare pouvoir l'engager.
 *
 * Le service fait foi sur trois points que l'interface ne fait que
 * refléter : quels documents un compte doit avoir acceptés (selon le rôle
 * de son appartenance active), quelle version est en vigueur, et si
 * l'acceptation enregistrée porte sur cette version. Une nouvelle version
 * publiée rouvre l'acceptation : tant qu'elle n'est pas donnée, le
 * service refuse les opérations du portail, et la disposition de
 * l'application renvoie vers `/engagements`.
 *
 * L'acceptation lie toujours la **version française**, qui fait foi ; la
 * traduction anglaise est présentée comme une traduction de courtoisie.
 * C'est pourquoi l'empreinte envoyée à l'acceptation est celle du texte
 * français, quelle que soit la langue d'affichage.
 */

/** Nature d'un engagement (`AgreementKind`, côté service). */
export type AgreementKind = "radiologist_agreement" | "clinic_agreement";

/** Toutes les natures, dans l'ordre où on les présente. */
export const AGREEMENT_KINDS: readonly AgreementKind[] = [
  "radiologist_agreement",
  "clinic_agreement",
];

/**
 * Où un engagement en est pour le compte connecté.
 *
 * @property version      Version en vigueur, par exemple `1.0`.
 * @property effectiveDate Date d'effet de cette version (`AAAA-MM-JJ`).
 * @property sha256       Empreinte du texte français de cette version : ce
 *                        que l'acceptation engage, octet pour octet.
 * @property acceptedAt   Acceptation de **cette** version ; `null` tant
 *                        qu'elle n'est pas donnée, y compris quand une
 *                        version antérieure l'avait été.
 * @property acceptedBy   Qui a accepté : le radiologue lui-même, ou, pour
 *                        une convention, la personne qui a engagé
 *                        l'établissement, avec sa qualité.
 * @property canAccept    Le compte peut-il donner cette acceptation ?
 */
export interface AgreementStatus {
  kind: AgreementKind;
  version: string;
  title: string;
  effectiveDate: string;
  sha256: string;
  acceptedAt: Date | null;
  acceptedBy: string | null;
  canAccept: boolean;
}

/**
 * Le texte d'une version, dans une langue.
 *
 * @property authoritative Vrai pour le texte qui fait foi (le français).
 * @property bodyMarkdown  Corps du document, en Markdown restreint (voir
 *                         `lib/agreement-markdown.ts`), sans en-tête de
 *                         métadonnées.
 */
export interface AgreementDocument {
  kind: AgreementKind;
  version: string;
  title: string;
  effectiveDate: string;
  sha256: string;
  locale: "fr" | "en";
  authoritative: boolean;
  bodyMarkdown: string;
}

/** Un engagement tel qu'un écran le présente : son état et son texte. */
export interface AgreementView {
  status: AgreementStatus;
  document: AgreementDocument;
}

/**
 * Engagement qu'un rôle doit avoir accepté, s'il y en a un.
 *
 * **Miroir de la règle du service**, qui seule décide (il renvoie la
 * liste des engagements dus par `GET /me/agreements`). Ce miroir ne sert
 * qu'à placer l'étape d'acceptation dans le bon parcours de mise en
 * service.
 *
 * @param role Rôle de l'appartenance active.
 */
export function agreementKindFor(role: UserRole): AgreementKind | null {
  switch (role) {
    case "radiologist":
      return "radiologist_agreement";
    case "clinic_staff":
      return "clinic_agreement";
    case "platform_admin":
      return null;
  }
}

/**
 * Engagements encore à accepter.
 *
 * @param statuses Engagements dus par le compte.
 */
export function pendingAgreements(
  statuses: readonly AgreementStatus[],
): AgreementStatus[] {
  return statuses.filter((status) => status.acceptedAt === null);
}

/** Segment d'URL de chaque engagement : lisible, et stable d'une version à l'autre. */
const SLUG_BY_KIND: Record<AgreementKind, string> = {
  radiologist_agreement: "contrat-radiologue",
  clinic_agreement: "convention-etablissement",
};

/**
 * Segment d'URL d'un engagement.
 *
 * @param kind Nature de l'engagement.
 */
export function agreementSlug(kind: AgreementKind): string {
  return SLUG_BY_KIND[kind];
}

/**
 * Nature d'un engagement d'après son segment d'URL.
 *
 * @param slug Segment reçu dans l'adresse ; tout autre texte vaut `null`.
 */
export function agreementKindFromSlug(slug: string): AgreementKind | null {
  for (const kind of AGREEMENT_KINDS) {
    if (SLUG_BY_KIND[kind] === slug) return kind;
  }
  return null;
}

/**
 * Adresse du PDF d'un engagement, relayé depuis le service.
 *
 * Avant acceptation, le PDF reproduit le texte en vigueur ; après, il
 * reproduit la version acceptée, suivie du certificat d'acceptation
 * (qui, quand, quelle empreinte).
 *
 * @param kind Nature de l'engagement.
 */
export function agreementPdfHref(kind: AgreementKind): string {
  return `/engagements/${agreementSlug(kind)}/pdf`;
}

/** Longueur maximale de la qualité du signataire, comme côté service. */
export const SIGNATORY_CAPACITY_MAX_LENGTH = 120;

/**
 * Ce que l'écran envoie à l'acceptation.
 *
 * @property signatoryCapacity  Convention : qualité de la personne qui
 *                              engage l'établissement (« Directeur
 *                              général »).
 * @property declaresAuthority  Convention : déclaration d'être habilité à
 *                              engager l'établissement.
 */
export interface AgreementAcceptanceInput {
  kind: AgreementKind;
  version: string;
  sha256: string;
  signatoryCapacity?: string;
  declaresAuthority?: boolean;
}

/** Motif de refus d'une acceptation, vérifié avant tout appel au service. */
export type AcceptanceProblem = "capacity_missing" | "authority_missing";

/**
 * Vérifie une acceptation avant de l'envoyer.
 *
 * Le service revérifie tout : ce contrôle évite seulement d'émettre une
 * requête qu'il refuserait, et permet à l'écran de dire précisément ce
 * qui manque.
 *
 * @param input Acceptation saisie.
 * @returns Le premier problème trouvé, ou `null`.
 */
export function acceptanceProblem(
  input: AgreementAcceptanceInput,
): AcceptanceProblem | null {
  if (input.kind !== "clinic_agreement") return null;
  if (!input.signatoryCapacity?.trim()) return "capacity_missing";
  if (input.declaresAuthority !== true) return "authority_missing";
  return null;
}

/** Empreinte SHA-256 en hexadécimal minuscule, telle que le service la calcule. */
export const SHA256_HEX = /^[0-9a-f]{64}$/;

/** Version au format `MAJEUR.MINEUR`. */
export const AGREEMENT_VERSION = /^\d{1,3}\.\d{1,3}$/;
