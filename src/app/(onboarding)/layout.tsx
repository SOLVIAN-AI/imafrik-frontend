"use client";

import { CircleHelp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Mark } from "@/components/layout/brand";
import { Stepper } from "@/components/onboarding/stepper";
import { useSession } from "@/lib/demo/session";
import { stepsFor } from "@/lib/onboarding/steps";

/**
 * Disposition du parcours de mise en service.
 *
 * **Ni châssis d'application, ni page publique.** À ce moment, la
 * personne n'a pas encore de portail à visiter : lui afficher une
 * navigation vers des écrans vides serait une invitation à s'y perdre.
 * Elle n'est pas non plus une visiteuse : la marque n'a plus besoin de
 * se vendre. Reste l'essentiel — où j'en suis, ce qu'on me demande, et
 * comment obtenir de l'aide.
 *
 * Le lien d'aide est présent à chaque étape. La mise en service est le
 * seul moment du parcours où l'utilisateur peut être réellement bloqué
 * par quelque chose qui ne dépend pas de lui — un PACS récalcitrant, un
 * pare-feu — et il doit pouvoir décrocher son téléphone sans chercher.
 */
export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  const pathname = usePathname();
  const { active } = useSession();
  const steps = stepsFor(active.role);

  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => pathname === `/bienvenue/${step.slug}`),
  );

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface-base">
      <div
        className="pointer-events-none absolute -top-48 left-1/2 size-[48rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-accent), transparent)",
        }}
        aria-hidden
      />

      <header className="relative flex h-16 shrink-0 items-center gap-6 border-b border-border-subtle px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Mark className="size-6" />
          <span className="text-sm font-semibold tracking-[-0.01em]">
            IMAFRIK
          </span>
        </Link>

        <div className="mx-auto hidden sm:block">
          <Stepper steps={steps} currentIndex={currentIndex} />
        </div>

        <Link
          href="/contact"
          className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-tertiary transition-colors hover:text-accent"
        >
          <CircleHelp className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Besoin d’aide ?</span>
        </Link>
      </header>

      <main className="relative mx-auto w-full max-w-xl flex-1 px-6 py-12 md:py-16">
        <div className="mb-8 sm:hidden">
          <Stepper steps={steps} currentIndex={currentIndex} />
        </div>
        {children}
      </main>
    </div>
  );
}
