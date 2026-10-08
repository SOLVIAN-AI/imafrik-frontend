"use client";

import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { StudyUploader } from "@/components/domain/study-uploader";
import { InviteMemberButton } from "@/components/domain/team-actions";
import { StepShell } from "@/components/onboarding/step-shell";
import { useSession } from "@/components/providers/session-provider";
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { hasReceivedStudy } from "@/lib/actions/onboarding";
import { setOpenToPool } from "@/lib/actions/organization";
import { updateProfile } from "@/lib/actions/profile";
import { credentialBlock } from "@/lib/credentials";
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
  const t = useMessages().onboarding.profile;
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
      <Field id="fullName" label={t.fullName}>
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
        label={t.title}
        hint={isRadiologist ? t.titleHintRadiologist : t.titleHintStaff}
      >
        <Input
          id="title"
          name="title"
          className="h-10"
          defaultValue={profile.title}
        />
      </Field>
      {isRadiologist && (
        <Field id="licenseNumber" label={t.license} hint={t.licenseHint}>
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
  const t = useMessages().onboarding.reading;
  const advance = useAdvance(nextSlug);
  const [value, setValue] = React.useState(openToPool);
  const [pending, startTransition] = React.useTransition();

  const options = [
    {
      value: true,
      title: t.poolTitle,
      detail: t.poolDetail,
    },
    {
      value: false,
      title: t.ownTitle,
      detail: t.ownDetail,
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
        <legend className="sr-only">{t.legend}</legend>
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
      <p className="text-xs text-tertiary">{t.note}</p>
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
  const t = useMessages().onboarding;
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
      submitLabel={received ? t.continue : t.firstStudy.waiting}
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
        {received ? t.firstStudy.received : t.firstStudy.instructions}
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
  const t = useMessages().onboarding.team;

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
      <p className="text-sm text-secondary">{t.intro}</p>
      <div>
        <InviteMemberButton organizationName={active.organizationName} />
      </div>
    </StepShell>
  );
}

/**
 * Dernière étape, commune aux deux parcours.
 *
 * Pour un radiologue dont le numéro d'ordre n'est pas encore validé, elle
 * explique l'attente : sa file restera vide jusqu'à la vérification de
 * l'équipe IMAFRIK, et il n'a rien d'autre à faire. Sans cette phrase, la
 * file vide qui suit passerait pour une panne.
 */
export function DoneStep({ step, previousSlug }: StepProps) {
  const advance = useAdvance(undefined);
  const session = useSession();
  const { active } = session;
  const t = useMessages().onboarding.done;
  const block = credentialBlock(session);

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitLabel={
        active.role === "clinic_staff"
          ? t.openDashboard
          : active.role === "platform_admin"
            ? t.openControlTower
            : t.openWorklist
      }
      onSubmit={(event) => {
        event.preventDefault();
        advance();
      }}
    >
      {block ? (
        <div
          role="status"
          data-credentials={block}
          className="flex items-start gap-3 rounded-xl border border-progress/30 bg-progress-muted px-4 py-3"
        >
          <Clock className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">
              {block === "pending" ? t.pendingTitle : t.missingTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-secondary">
              {block === "pending" ? t.pendingDetail : t.missingDetail}
            </p>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-done">
          <CheckCircle2 className="size-4" aria-hidden />
          {t.ready}
        </p>
      )}
    </StepShell>
  );
}
