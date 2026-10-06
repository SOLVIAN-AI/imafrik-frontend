import type { UserRole } from "@/lib/session/types";

/**
 * Une étape de la mise en service.
 *
 * @property slug     Segment d'URL. Il rend l'étape adressable : on peut
 *                    fermer l'onglet et reprendre, ou envoyer le lien à la
 *                    personne qui saura la remplir.
 * @property title    Intitulé affiché dans le fil d'étapes.
 * @property lead     Ce que l'étape demande, en une phrase.
 * @property optional Une étape franchissable sans rien faire.
 */
export interface OnboardingStep {
  slug: string;
  title: string;
  lead: string;
  optional?: boolean;
}

/**
 * Parcours d'une clinique.
 *
 * Chaque étape enregistre réellement quelque chose, auprès du service : le
 * profil, la règle de lecture, un premier examen, l'équipe. L'ordre est
 * opérationnel : **on vérifie que ça marche** avant d'inviter l'équipe —
 * rien ne rassure autant qu'une première image arrivée, et inviter des
 * collègues avant reviendrait à leur montrer un écran vide.
 *
 * Le raccordement de la passerelle n'est pas une étape : il se fait avec
 * le paquet d'installation remis par IMAFRIK, sur le poste de la clinique.
 */
const CLINIC_STEPS: OnboardingStep[] = [
  {
    slug: "profil",
    title: "Votre profil",
    lead: "Votre nom, tel qu’il figurera dans le journal d’accès.",
  },
  {
    slug: "lecture",
    title: "Qui lit vos examens",
    lead: "Vos radiologues, ou tous ceux de la plateforme.",
  },
  {
    slug: "premier-envoi",
    title: "Premier envoi",
    lead: "Un examen, par la passerelle ou depuis ce navigateur, pour valider la liaison.",
  },
  {
    slug: "equipe",
    title: "Équipe",
    lead: "Les personnes qui suivront les examens au quotidien.",
    optional: true,
  },
  { slug: "termine", title: "Terminé", lead: "Votre service est ouvert." },
];

/**
 * Parcours d'un radiologue.
 *
 * Un radiologue arrive ici invité par IMAFRIK ou par la clinique qui
 * l'emploie : son accès est déjà ouvert. Il ne lui reste qu'à vérifier ce
 * qui sera imprimé sous sa signature.
 */
const RADIOLOGIST_STEPS: OnboardingStep[] = [
  {
    slug: "profil",
    title: "Votre profil",
    lead: "Ce qui sera imprimé sous votre signature, sur chaque compte-rendu.",
  },
  {
    slug: "termine",
    title: "Terminé",
    lead: "Votre file de lecture vous attend.",
  },
];

/** Parcours d'un membre de l'équipe IMAFRIK : son profil, rien de plus. */
const ADMIN_STEPS: OnboardingStep[] = [
  {
    slug: "profil",
    title: "Votre profil",
    lead: "Votre nom, tel qu’il figurera dans le journal d’audit.",
  },
  { slug: "termine", title: "Terminé", lead: "Le back-office vous attend." },
];

const STEPS_BY_ROLE: Record<UserRole, OnboardingStep[]> = {
  clinic_staff: CLINIC_STEPS,
  radiologist: RADIOLOGIST_STEPS,
  platform_admin: ADMIN_STEPS,
};

/**
 * Étapes correspondant à un rôle.
 *
 * @param role Rôle de l'appartenance active.
 */
export function stepsFor(role: UserRole): OnboardingStep[] {
  return STEPS_BY_ROLE[role];
}
