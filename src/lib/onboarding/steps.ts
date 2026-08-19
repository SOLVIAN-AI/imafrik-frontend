import type { UserRole } from "@/lib/session/types";

/**
 * Une étape de la mise en service.
 *
 * @property slug   Segment d'URL. Il rend l'étape adressable : on peut
 *                  fermer l'onglet, revenir par le bouton précédent, ou
 *                  envoyer un lien au technicien pour qu'il fasse « sa »
 *                  partie.
 * @property title  Intitulé affiché dans le fil d'étapes.
 * @property lead   Ce que l'étape demande, en une phrase.
 * @property optional Une étape franchissable sans rien saisir.
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
 * L'ordre n'est pas administratif mais opérationnel : on identifie
 * l'établissement, on raccorde les modalités, **on vérifie que ça
 * marche**, puis seulement on invite l'équipe. Rien ne rassure autant qu'une
 * première image arrivée ; inviter des collègues avant que le flux
 * fonctionne reviendrait à leur montrer un écran vide.
 */
const CLINIC_STEPS: OnboardingStep[] = [
  {
    slug: "etablissement",
    title: "Établissement",
    lead: "Qui vous êtes, et qui appeler en cas d’urgence.",
  },
  {
    slug: "connexion-pacs",
    title: "Passerelle",
    lead: "Les paramètres à saisir sur vos consoles d’acquisition.",
  },
  {
    slug: "premier-envoi",
    title: "Premier envoi",
    lead: "Nous attendons un examen pour valider la liaison.",
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
 * Il se termine par une attente : le dossier passe en validation. Le
 * dire dès le fil d'étapes évite la déception de celui qui croyait
 * pouvoir lire immédiatement.
 */
const RADIOLOGIST_STEPS: OnboardingStep[] = [
  {
    slug: "profil",
    title: "Profil",
    lead: "Votre identité professionnelle et ce que vous lisez.",
  },
  {
    slug: "qualifications",
    title: "Qualifications",
    lead: "Inscription à l’ordre et assurance professionnelle.",
  },
  {
    slug: "signature",
    title: "Signature",
    lead: "Le bloc apposé au bas de vos comptes-rendus.",
  },
  {
    slug: "preferences",
    title: "Préférences",
    lead: "Vos disponibilités et vos alertes.",
    optional: true,
  },
  {
    slug: "validation",
    title: "Validation",
    lead: "Dernière étape avant l’ouverture de votre accès.",
  },
];

/**
 * Étapes correspondant à un rôle.
 *
 * @param role Rôle de l'appartenance active.
 */
export function stepsFor(role: UserRole): OnboardingStep[] {
  return role === "clinic_staff" ? CLINIC_STEPS : RADIOLOGIST_STEPS;
}
