"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type { OnboardingStep } from "@/lib/onboarding/steps";

/**
 * Cadre commun à toutes les étapes.
 *
 * Il tient la promesse du fil d'étapes : même largeur, même place pour
 * le titre, mêmes boutons au même endroit. Une navigation qui se déplace
 * d'un écran à l'autre force à la chercher à chaque fois, et c'est
 * exactement ce qu'un premier contact avec le produit ne peut pas se
 * permettre.
 *
 * Le bouton de retour est un lien et non un `history.back()` : après un
 * rechargement, l'historique peut être vide, et le lien fonctionne
 * toujours.
 *
 * @param step         Étape courante.
 * @param previousSlug Étape précédente, si elle existe.
 * @param submitLabel  Libellé du bouton d'avancement.
 * @param onSubmit     Déclenché à la validation du formulaire.
 * @param onSkip       Proposé pour une étape facultative.
 */
export function StepShell({
  step,
  previousSlug,
  submitLabel = "Continuer",
  submitting = false,
  onSubmit,
  onSkip,
  children,
}: {
  step: OnboardingStep;
  previousSlug?: string;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onSkip?: () => void;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="animate-[rise-in_300ms_var(--ease-out-quart)]"
    >
      <h1 className="text-2xl font-semibold">{step.title}</h1>
      <p className="mt-1.5 text-sm text-tertiary">{step.lead}</p>

      <div className="mt-8 flex flex-col gap-5">{children}</div>

      <div className="mt-10 flex items-center gap-3 border-t border-border-subtle pt-6">
        {previousSlug ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/bienvenue/${previousSlug}`}>
              <ArrowLeft />
              Retour
            </Link>
          </Button>
        ) : (
          <span />
        )}

        <div className="ml-auto flex items-center gap-2">
          {step.optional && onSkip && (
            <Button variant="ghost" size="sm" type="button" onClick={onSkip}>
              Passer cette étape
            </Button>
          )}
          <Button type="submit" size="lg" loading={submitting} className="h-10">
            {submitLabel}
            <ArrowRight />
          </Button>
        </div>
      </div>
    </form>
  );
}
