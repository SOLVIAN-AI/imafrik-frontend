"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { StudyUploader } from "@/components/domain/study-uploader";
import { InviteMemberButton } from "@/components/domain/team-actions";
import { StepShell } from "@/components/onboarding/step-shell";
import { useSession } from "@/components/providers/session-provider";
import { Field, Input } from "@/components/ui/input";
import { hasReceivedStudy } from "@/lib/actions/onboarding";
import { setOpenToPool } from "@/lib/actions/organization";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/data/profile";
import { homeFor } from "@/lib/navigation";
import type { OnboardingStep } from "@/lib/onboarding/steps";
import { cn } from "@/lib/utils";

/** Ce que reçoit chaque étape. */
export interface StepProps {
  step: OnboardingStep;
  previousSlug?: string;
  nextSlug?: string;
  profile: Profile;
  openToPool: boolean;
}

/** Va à l'étape suivante, ou à l'accueil du portail à la dernière. */
function useAdvance(nextSlug?: string) {
  const router = useRouter();
  const { active } = useSession();
  return () =>
    router.push(nextSlug ? `/bienvenue/${nextSlug}` : homeFor(active.role));
}

/**
 * Étape « Votre profil » — commune aux deux parcours.
 *
 * Enregistrée sur le service avant d'avancer : le profil est ce qui sera
 * imprimé sous la signature d'un radiologue, ou tracé dans le journal
 * d'accès pour le personnel d'une clinique.
 */
export function ProfileStep({
  step,
  previousSlug,
  nextSlug,
  profile,
}: StepProps) {
  const { active } = useSession();
  const advance = useAdvance(nextSlug);
  const [pending, startTransition] = React.useTransition();
  const isRadiologist = active.role === "radiologist";

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitting={pending}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget as HTMLFormElement);
        startTransition(async () => {
          const result = await updateProfile({
            fullName: String(form.get("fullName") ?? ""),
            title: String(form.get("title") ?? ""),
            licenseNumber: String(
              form.get("licenseNumber") ?? profile.licenseNumber,
            ),
          });
          if (result.ok) advance();
          else toast.error(result.error);
        });
      }}
    >
      <Field id="fullName" label="Nom complet">
        <Input
          id="fullName"
          name="fullName"
          className="h-10"
          defaultValue={profile.fullName}
          required
        />
      </Field>
      <Field
        id="title"
        label="Titre"
        hint={
          isRadiologist
            ? "Imprimé devant votre nom — « Dr », « Pr »."
            : "Votre fonction dans l’établissement."
        }
      >
        <Input
          id="title"
          name="title"
          className="h-10"
          defaultValue={profile.title}
        />
      </Field>
      {isRadiologist && (
        <Field
          id="licenseNumber"
          label="Numéro d’ordre"
          hint="Imprimé sous votre signature."
        >
          <Input
            id="licenseNumber"
            name="licenseNumber"
            className="h-10"
            defaultValue={profile.licenseNumber}
            required
          />
        </Field>
      )}
    </StepShell>
  );
}

/** Étape « Qui lit vos examens » — clinique. */
export function ReadingStep({
  step,
  previousSlug,
  nextSlug,
  openToPool,
}: StepProps) {
  const advance = useAdvance(nextSlug);
  const [value, setValue] = React.useState(openToPool);
  const [pending, startTransition] = React.useTransition();

  const options = [
    {
      value: true,
      title: "Tous les radiologues de la plateforme",
      detail:
        "Vos examens entrent dans la file commune ; le premier radiologue disponible les prend.",
    },
    {
      value: false,
      title: "Nos radiologues uniquement",
      detail:
        "Seuls les radiologues que vous inviterez dans votre équipe verront vos examens.",
    },
  ];

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitting={pending}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await setOpenToPool(value);
          if (result.ok) advance();
          else toast.error(result.error);
        });
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Qui lit vos examens</legend>
        {options.map((option) => (
          <label
            key={option.title}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
              value === option.value
                ? "border-accent/40 bg-accent-muted"
                : "border-border-subtle hover:bg-surface-hover",
            )}
          >
            <input
              type="radio"
              name="openToPool"
              checked={value === option.value}
              onChange={() => setValue(option.value)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-sm font-medium">{option.title}</span>
              <span className="mt-1 block text-xs text-tertiary">
                {option.detail}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="text-xs text-tertiary">
        Ce réglage se change à tout moment dans les paramètres.
      </p>
    </StepShell>
  );
}

/** Délai entre deux vérifications de l'arrivée d'un examen. */
const POLL_MS = 10_000;

/**
 * Étape « Premier envoi » — clinique.
 *
 * **L'attente est réelle.** L'écran interroge le service toutes les dix
 * secondes et ne propose de continuer qu'une fois un examen effectivement
 * arrivé dans le périmètre de la clinique — par la passerelle ou par un
 * dépôt depuis cet écran. C'est la seule preuve que la liaison
 * fonctionne ; l'apprendre le jour d'une urgence serait trop tard.
 */
export function FirstStudyStep({ step, previousSlug, nextSlug }: StepProps) {
  const advance = useAdvance(nextSlug);
  const [received, setReceived] = React.useState(false);

  React.useEffect(() => {
    if (received) return;
    let cancelled = false;
    const check = async () => {
      if (await hasReceivedStudy()) {
        if (!cancelled) setReceived(true);
      }
    };
    void check();
    const timer = setInterval(() => void check(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [received]);

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitLabel={received ? "Continuer" : "En attente d’un examen…"}
      onSubmit={(event) => {
        event.preventDefault();
        if (received) advance();
      }}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
          received
            ? "border-done/30 bg-done-muted/40 text-done"
            : "border-border-subtle text-secondary",
        )}
      >
        {received ? (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        ) : (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        )}
        {received
          ? "Un examen est arrivé : la liaison fonctionne."
          : "Envoyez un examen depuis votre console — ou déposez-le ci-dessous. Cet écran se met à jour seul."}
      </div>
      {!received && (
        <div className="rounded-xl border border-border-subtle">
          <StudyUploader />
        </div>
      )}
    </StepShell>
  );
}

/** Étape « Équipe » — clinique, facultative. */
export function TeamStep({ step, previousSlug, nextSlug }: StepProps) {
  const advance = useAdvance(nextSlug);
  const { active } = useSession();

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      onSubmit={(event) => {
        event.preventDefault();
        advance();
      }}
      onSkip={advance}
    >
      <p className="text-sm text-secondary">
        Invitez les personnes qui suivront les examens, et les radiologues que
        vous employez. Chacune reçoit un lien et choisit son propre mot de
        passe.
      </p>
      <div>
        <InviteMemberButton organizationName={active.organizationName} />
      </div>
    </StepShell>
  );
}

/** Dernière étape, commune aux deux parcours. */
export function DoneStep({ step, previousSlug }: StepProps) {
  const advance = useAdvance(undefined);
  const { active } = useSession();

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitLabel={
        active.role === "clinic_staff"
          ? "Ouvrir le tableau de bord"
          : "Ouvrir la file de lecture"
      }
      onSubmit={(event) => {
        event.preventDefault();
        advance();
      }}
    >
      <p className="flex items-center gap-2 text-sm text-done">
        <CheckCircle2 className="size-4" aria-hidden />
        Tout est en place.
      </p>
    </StepShell>
  );
}
