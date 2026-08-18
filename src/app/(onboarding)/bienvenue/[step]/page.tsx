"use client";

import { notFound } from "next/navigation";
import * as React from "react";

import {
  ClinicDoneStep,
  FacilityStep,
  FirstStudyStep,
  PacsStep,
  TeamStep,
  type StepProps,
} from "@/components/onboarding/steps/clinic-steps";
import {
  PreferencesStep,
  ProfileStep,
  QualificationsStep,
  SignatureStep,
  ValidationStep,
} from "@/components/onboarding/steps/radiologist-steps";
import { useSession } from "@/lib/demo/session";
import { stepsFor } from "@/lib/onboarding/steps";

/**
 * Correspondance entre segment d'URL et composant d'étape.
 *
 * Les deux parcours partagent la table : les segments sont distincts
 * d'un rôle à l'autre, et c'est la liste d'étapes du rôle — pas cette
 * table — qui décide de ce qui est atteignable. Une clinique ne peut
 * donc pas tomber sur l'étape « signature » en modifiant l'URL : le
 * segment n'appartient pas à son parcours, et la page renvoie une 404.
 */
const STEP_COMPONENTS: Record<
  string,
  React.ComponentType<StepProps> | React.ComponentType
> = {
  // Clinique
  etablissement: FacilityStep,
  "connexion-pacs": PacsStep,
  "premier-envoi": FirstStudyStep,
  equipe: TeamStep,
  termine: ClinicDoneStep,
  // Radiologue
  profil: ProfileStep,
  qualifications: QualificationsStep,
  signature: SignatureStep,
  preferences: PreferencesStep,
  validation: ValidationStep,
};

/**
 * Une étape du parcours de mise en service.
 *
 * L'étape vit dans l'URL — et non dans un état de composant — pour trois
 * raisons : on peut fermer l'onglet et reprendre où l'on en était, le
 * bouton « précédent » du navigateur fait ce qu'on attend, et le lien
 * d'une étape peut être envoyé à la personne qui saura la remplir.
 */
export default function OnboardingStepPage({
  params,
}: PageProps<"/bienvenue/[step]">) {
  const { step: slug } = React.use(params);
  const { active } = useSession();

  const steps = stepsFor(active.role);
  const index = steps.findIndex((candidate) => candidate.slug === slug);

  if (index === -1) notFound();

  const step = steps[index];
  const Component = STEP_COMPONENTS[slug];

  if (!Component) notFound();

  return (
    <Component
      step={step}
      previousSlug={index > 0 ? steps[index - 1].slug : undefined}
      nextSlug={index < steps.length - 1 ? steps[index + 1].slug : undefined}
    />
  );
}
