import type { AppMessages } from "@/i18n";
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

/** Étape sans ses textes, qui dépendent de la langue. */
type StepDefinition = Omit<OnboardingStep, "title" | "lead">;

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
const CLINIC_STEPS: StepDefinition[] = [
  { slug: "profil" },
  { slug: "lecture" },
  { slug: "premier-envoi" },
  { slug: "equipe", optional: true },
  { slug: "termine" },
];

/**
 * Parcours d'un radiologue.
 *
 * Un radiologue arrive ici invité par IMAFRIK ou par la clinique qui
 * l'emploie : son accès est déjà ouvert. Il ne lui reste qu'à vérifier ce
 * qui sera imprimé sous sa signature.
 */
const RADIOLOGIST_STEPS: StepDefinition[] = [
  { slug: "profil" },
  { slug: "termine" },
];

/** Parcours d'un membre de l'équipe IMAFRIK : son profil, rien de plus. */
const ADMIN_STEPS: StepDefinition[] = [{ slug: "profil" }, { slug: "termine" }];

/** Parcours par rôle, et clé de ses textes dans `onboarding.steps`. */
const STEPS_BY_ROLE: Record<
  UserRole,
  { steps: StepDefinition[]; texts: keyof AppMessages["onboarding"]["steps"] }
> = {
  clinic_staff: { steps: CLINIC_STEPS, texts: "clinic" },
  radiologist: { steps: RADIOLOGIST_STEPS, texts: "radiologist" },
  platform_admin: { steps: ADMIN_STEPS, texts: "admin" },
};

/**
 * Étapes correspondant à un rôle, avec leurs textes.
 *
 * @param role     Rôle de l'appartenance active.
 * @param messages Textes du parcours dans la langue de l'utilisateur
 *                 (`t.onboarding`).
 */
export function stepsFor(
  role: UserRole,
  messages: AppMessages["onboarding"],
): OnboardingStep[] {
  const { steps, texts } = STEPS_BY_ROLE[role];
  const labels: Partial<Record<string, { title: string; lead: string }>> =
    messages.steps[texts];
  return steps.map((step) => {
    const label = labels[step.slug];
    if (!label) throw new Error(`Étape sans texte : ${texts}/${step.slug}`);
    return { ...step, ...label };
  });
}
