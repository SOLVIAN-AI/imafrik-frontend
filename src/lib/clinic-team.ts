/**
 * Équipe d'une clinique qu'on crée : règles partagées par la fenêtre de
 * création et son action serveur.
 *
 * Module pur : ni rendu ni requête, pour être testé seul. Les règles qui
 * font foi sont celles du service (`POST /admin/clinics`) : une clinique
 * naît avec au moins un responsable, et ses propres radiologues ou les
 * radiologues du réseau IMAFRIK, jamais aucun des deux ; chaque personne
 * n'est invitée qu'une fois.
 */

/** Responsables invités à la création, au plus : même borne que le service. */
export const MAX_CLINIC_MANAGERS = 10;

/** Radiologues invités à la création, au plus : même borne que le service. */
export const MAX_CLINIC_RADIOLOGISTS = 30;

/** Qui lit les examens : ses propres radiologues, ou le réseau IMAFRIK. */
export type ClinicReaders = "own" | "network";

/** Une personne de l'équipe, telle que la fenêtre la saisit. */
export interface TeamPerson {
  fullName: string;
  email: string;
}

/** Une ligne vide, prête à saisir. */
export const EMPTY_PERSON: TeamPerson = { fullName: "", email: "" };

/**
 * Les personnes réellement saisies : une ligne restée vide (ni nom ni
 * adresse) ne compte pas, et ne bloque pas la création.
 *
 * @param people Lignes de la fenêtre.
 */
export function filledPeople(people: readonly TeamPerson[]): TeamPerson[] {
  return people.filter(
    (person) => person.fullName.trim() !== "" || person.email.trim() !== "",
  );
}

/**
 * Première adresse saisie deux fois, sans tenir compte de la casse.
 *
 * Une même personne ne peut être à la fois responsable et radiologue de
 * la clinique : le service refuserait la seconde invitation.
 *
 * @param people Toute l'équipe, responsables et radiologues.
 * @returns L'adresse en double, en minuscules, ou `null`.
 */
export function duplicateEmail(people: readonly TeamPerson[]): string | null {
  const seen = new Set<string>();
  for (const person of people) {
    const email = person.email.trim().toLowerCase();
    if (!email) continue;
    if (seen.has(email)) return email;
    seen.add(email);
  }
  return null;
}
