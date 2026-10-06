import { notFound } from "next/navigation";
import type * as React from "react";

import {
  DoneStep,
  FirstStudyStep,
  ProfileStep,
  ReadingStep,
  TeamStep,
  type StepProps,
} from "@/components/onboarding/onboarding-steps";
import { getOrganization } from "@/lib/data/organization";
import { getProfile } from "@/lib/data/profile";
import { stepsFor } from "@/lib/onboarding/steps";
import { requireSession } from "@/lib/session/server";

/**
 * Correspondance entre segment d'URL et composant d'étape.
 *
 * C'est la liste d'étapes du rôle — pas cette table — qui décide de ce
 * qui est atteignable : un segment hors du parcours du rôle renvoie 404.
 */
const STEP_COMPONENTS: Record<string, React.ComponentType<StepProps>> = {
  profil: ProfileStep,
  lecture: ReadingStep,
  "premier-envoi": FirstStudyStep,
  equipe: TeamStep,
  termine: DoneStep,
};

/**
 * Une étape du parcours de mise en service.
 *
 * L'étape vit dans l'URL : on peut fermer l'onglet et reprendre, et le
 * bouton « précédent » du navigateur fait ce qu'on attend. Les valeurs
 * actuelles — profil, règle de lecture — sont lues sur le service, pour
 * que chaque étape s'ouvre sur ce qui est réellement enregistré.
 */
export default async function OnboardingStepPage({
  params,
}: PageProps<"/bienvenue/[step]">) {
  const session = await requireSession();
  const { step: slug } = await params;

  const steps = stepsFor(session.active.role);
  const index = steps.findIndex((candidate) => candidate.slug === slug);
  const Component = STEP_COMPONENTS[slug];
  if (index === -1 || !Component) notFound();

  const [profile, organization] = await Promise.all([
    getProfile(),
    session.active.role === "clinic_staff"
      ? getOrganization()
      : Promise.resolve(null),
  ]);

  return (
    <Component
      step={steps[index]}
      previousSlug={index > 0 ? steps[index - 1].slug : undefined}
      nextSlug={index < steps.length - 1 ? steps[index + 1].slug : undefined}
      profile={profile}
      openToPool={organization?.openToPool ?? true}
    />
  );
}
