import type { RequesterKind } from "@/lib/contact-status";

/**
 * Règles du formulaire de contact du site public.
 *
 * Module pur, partagé par le formulaire (messages sous chaque champ,
 * avant tout envoi) et par l'action serveur (qui revérifie : un
 * formulaire se contourne). Mêmes bornes que le service (`POST /contact`).
 *
 * Deux demandeurs : un établissement de santé, qui doit se nommer, et un
 * radiologue, qui doit déclarer son numéro d'ordre. Celui-ci est vérifié
 * par l'équipe IMAFRIK auprès de l'Ordre avant tout accès aux examens ;
 * l'établissement où il exerce reste facultatif.
 */

/** Longueur maximale d'un numéro d'ordre, comme en base. */
export const LICENSE_NUMBER_MAX_LENGTH = 50;

/** Valeur d'adresse qui présélectionne le demandeur (`/contact?profil=…`). */
export const REQUESTER_PARAM: Record<RequesterKind, string> = {
  clinic: "etablissement",
  radiologist: "radiologue",
};

/** Champs que les règles examinent. */
export interface ContactFormValues {
  /** `null` tant que la personne n'a pas choisi. */
  requesterKind: RequesterKind | null;
  name: string;
  organization: string;
  email: string;
  licenseNumber: string;
}

/** Champ en défaut, clé de son message dans `contactPage.errors`. */
export type ContactFieldError =
  "requesterKind" | "name" | "organization" | "email" | "licenseNumber";

/** Adresse plausible : une partie locale, un domaine avec un point. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Champs en défaut, dans l'ordre du formulaire.
 *
 * @param values Saisie.
 * @returns Les champs à corriger ; vide si la demande peut partir.
 */
export function validateContactForm(
  values: ContactFormValues,
): ContactFieldError[] {
  const errors: ContactFieldError[] = [];
  if (values.requesterKind === null) errors.push("requesterKind");
  if (values.name.trim().length < 2) errors.push("name");
  if (
    values.requesterKind === "clinic" &&
    values.organization.trim().length < 2
  )
    errors.push("organization");
  if (!EMAIL.test(values.email.trim())) errors.push("email");
  if (values.requesterKind === "radiologist") {
    const license = values.licenseNumber.trim();
    if (license.length === 0 || license.length > LICENSE_NUMBER_MAX_LENGTH)
      errors.push("licenseNumber");
  }
  return errors;
}

/**
 * Demandeur présélectionné par l'adresse, par exemple depuis le bouton
 * « Rejoindre le réseau » de la page d'accueil.
 *
 * @param search Partie `?…` de l'adresse.
 * @returns Le demandeur, ou `null` si l'adresse n'en désigne aucun.
 */
export function requesterFromSearch(search: string): RequesterKind | null {
  const value = new URLSearchParams(search).get("profil");
  const match = (
    Object.entries(REQUESTER_PARAM) as [RequesterKind, string][]
  ).find(([, param]) => param === value);
  return match?.[0] ?? null;
}
