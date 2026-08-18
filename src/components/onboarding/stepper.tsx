"use client";

import { Check } from "lucide-react";
import Link from "next/link";

import type { OnboardingStep } from "@/lib/onboarding/steps";
import { cn } from "@/lib/utils";

/**
 * Fil des étapes.
 *
 * Il répond à deux questions qu'on se pose dans tout formulaire long :
 * où en suis-je, et combien en reste-t-il. Sans réponse, un parcours de
 * cinq écrans paraît sans fin.
 *
 * Les étapes franchies sont cliquables, les suivantes non : revenir
 * corriger doit être immédiat, sauter en avant ne le doit pas — l'étape
 * suivante dépend souvent de la précédente.
 */
export function Stepper({
  steps,
  currentIndex,
}: {
  steps: OnboardingStep[];
  currentIndex: number;
}) {
  return (
    <ol className="flex items-center gap-1.5">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;

        const content = (
          <>
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-2xs font-medium",
                "transition-colors duration-150",
                done && "bg-accent text-accent-contrast",
                current && "bg-accent-muted text-accent ring-1 ring-accent/40",
                !done && !current && "bg-surface-active text-tertiary",
              )}
              aria-hidden
            >
              {done ? <Check className="size-3" /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs whitespace-nowrap md:block",
                current ? "font-medium text-primary" : "text-tertiary",
              )}
            >
              {step.title}
            </span>
          </>
        );

        return (
          <li key={step.slug} className="flex items-center gap-1.5">
            {done ? (
              <Link
                href={`/bienvenue/${step.slug}`}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-hover"
              >
                {content}
                <span className="sr-only">Revenir à l’étape {step.title}</span>
              </Link>
            ) : (
              <span
                className="flex items-center gap-2 px-1.5 py-1"
                aria-current={current ? "step" : undefined}
              >
                {content}
              </span>
            )}

            {index < steps.length - 1 && (
              <span
                className={cn(
                  "h-px w-4 md:w-8",
                  done ? "bg-accent/40" : "bg-border-default",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
