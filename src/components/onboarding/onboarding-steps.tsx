"use client";

import { CheckCircle2, Clock, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  AgreementFields,
  useAcceptAgreement,
} from "@/components/agreements/agreement-review";
import { StudyUploader } from "@/components/domain/study-uploader";
import { InviteMemberButton } from "@/components/domain/team-actions";
import { StepShell } from "@/components/onboarding/step-shell";
import { useSession } from "@/components/providers/session-provider";
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { hasReceivedStudy } from "@/lib/actions/onboarding";
import { setOpenToPool } from "@/lib/actions/organization";
import { updateProfile } from "@/lib/actions/profile";
import {
  DocumentHistory,
  DocumentPicker,
  useDocumentUpload,
} from "@/components/credentials/document-upload";
import { PracticeChoice } from "@/components/credentials/practice-choice";
import { declarePractice } from "@/lib/actions/credentials";
import {
  REQUIRED_DOCUMENT,
  credentialBlock,
  credentialNeedsAction,
} from "@/lib/credentials";
import type { AgreementView } from "@/lib/agreements";
import type { CredentialDocument } from "@/lib/data/credentials";
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
  /** Radiologue : ses justificatifs, du plus récent au plus ancien. */
  documents: CredentialDocument[];
  /**
   * Étape « engagement » : le contrat ou la convention dû, avec son
   * texte ; `null` quand aucun n'est dû (démonstration, ou aucune version
   * encore entrée en vigueur) : l'étape se franchit alors d'un clic.
   */
  agreement: AgreementView | null;
}

/** Va à l'étape suivante, ou à l'accueil du portail à la dernière. */
function useAdvance(nextSlug?: string) {
  const router = useRouter();
  const { active } = useSession();
  return () =>
    router.push(nextSlug ? `/bienvenue/${nextSlug}` : homeFor(active.role));
}

/**
 * Étape « engagement » : le contrat d'exercice du radiologue, ou la
 * convention de service de l'établissement.
 *
 * Elle ouvre les deux parcours : le service refuse les opérations du
 * portail tant que l'engagement en vigueur n'est pas accepté. Déjà
 * accepté (une clinique dont un responsable a signé, un radiologue qui
 * reprend son parcours), elle affiche l'acceptation et laisse avancer.
 *
 * Un membre de clinique qui ne peut pas engager l'établissement voit le
 * texte, sans pouvoir avancer : il n'y aurait rien à faire plus loin.
 */
export function AgreementStep({
  step,
  previousSlug,
  nextSlug,
  agreement,
}: StepProps) {
  const t = useMessages().agreements.review;
  const advance = useAdvance(nextSlug);
  const accept = useAcceptAgreement();
  const [pending, startTransition] = React.useTransition();
  const blocked =
    agreement !== null &&
    !agreement.status.acceptedAt &&
    !agreement.status.canAccept;

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitting={pending}
      submitLabel={
        agreement && !agreement.status.acceptedAt
          ? t.submitAndContinue
          : undefined
      }
      submitDisabled={blocked}
      onSubmit={(event) => {
        event.preventDefault();
        if (!agreement) return advance();
        const form = new FormData(event.currentTarget as HTMLFormElement);
        startTransition(async () => {
          if (await accept(agreement, form)) advance();
        });
      }}
    >
      {agreement ? (
        <AgreementFields view={agreement} />
      ) : (
        <p className="text-sm text-secondary">{t.unavailable}</p>
      )}
    </StepShell>
  );
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
  // Un résident signe sans numéro d'ordre : le champ n'est demandé qu'à un
  // inscrit à l'Ordre.
  const asksLicense = isRadiologist && profile.practiceStatus === "registered";

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
            ...(asksLicense
              ? { licenseNumber: String(form.get("licenseNumber") ?? "") }
              : {}),
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
      {asksLicense && (
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
 * Étape « Votre exercice » : radiologue.
 *
 * Enregistrée avant d'avancer : c'est elle qui décide du justificatif
 * demandé à l'étape suivante. Redéclarer le même exercice ne change rien ;
 * en changer suspend l'habilitation, et l'écran le dit avant.
 */
export function PracticeStep({
  step,
  previousSlug,
  nextSlug,
  profile,
}: StepProps) {
  const t = useMessages().credentials.practice;
  const advance = useAdvance(nextSlug);
  const [value, setValue] = React.useState(profile.practiceStatus);
  const [pending, startTransition] = React.useTransition();
  const changing =
    profile.credentialState === "verified" &&
    value !== null &&
    value !== profile.practiceStatus;

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitting={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (!value) return;
        if (value === profile.practiceStatus) {
          advance();
          return;
        }
        startTransition(async () => {
          const result = await declarePractice(value);
          if (result.ok) advance();
          else toast.error(result.error);
        });
      }}
    >
      <PracticeChoice value={value} onChange={setValue} />
      {changing && (
        <p role="status" className="text-xs text-progress">
          {t.changeWarning}
        </p>
      )}
    </StepShell>
  );
}

/**
 * Étape « Votre justificatif » : radiologue.
 *
 * « Continuer » envoie le fichier choisi, puis avance. Un justificatif
 * déjà en attente (ou accepté) permet d'avancer sans nouveau dépôt ; sans
 * lui, l'étape demande le fichier : un parcours qui laisserait passer un
 * dossier vide mènerait à une attente sans objet.
 */
export function DocumentsStep({
  step,
  previousSlug,
  nextSlug,
  profile,
  documents,
}: StepProps) {
  const t = useMessages().credentials;
  const router = useRouter();
  const advance = useAdvance(nextSlug);
  const kind = REQUIRED_DOCUMENT[profile.practiceStatus ?? "registered"];
  const upload = useDocumentUpload(kind);
  const [pending, startTransition] = React.useTransition();
  const onFile = documents.some(
    (document) => document.kind === kind && document.status !== "rejected",
  );

  if (!profile.practiceStatus) {
    // Arrivé ici par l'URL sans avoir déclaré son exercice.
    return (
      <StepShell
        step={step}
        previousSlug={previousSlug}
        submitLabel={t.states.undeclared.action}
        onSubmit={(event) => {
          event.preventDefault();
          if (previousSlug) router.push(`/bienvenue/${previousSlug}`);
        }}
      >
        <p className="text-sm text-secondary">{t.states.undeclared.detail}</p>
      </StepShell>
    );
  }

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitting={pending || upload.progress !== null}
      submitLabel={upload.file ? t.documents.send : undefined}
      onSubmit={(event) => {
        event.preventDefault();
        if (!upload.file && onFile) {
          advance();
          return;
        }
        startTransition(async () => {
          if (await upload.send()) {
            toast.success(t.documents.sent);
            advance();
          }
        });
      }}
    >
      <DocumentPicker upload={upload} />
      <DocumentHistory documents={documents} />
    </StepShell>
  );
}

/**
 * Dernière étape, commune à tous les parcours.
 *
 * Pour un radiologue pas encore habilité, elle dit où en est son dossier :
 * en cours de vérification (rien à faire), ou incomplet (avec le geste qui
 * le complète). Sans cette phrase, la file vide qui suit passerait pour
 * une panne.
 */
export function DoneStep({ step, previousSlug }: StepProps) {
  const advance = useAdvance(undefined);
  const session = useSession();
  const { active } = session;
  const messages = useMessages();
  const t = messages.onboarding.done;
  const block = credentialBlock(session);
  const text = block ? messages.credentials.states[block] : null;

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
      {block && text ? (
        <div
          role="status"
          data-credentials={block}
          className="flex items-start gap-3 rounded-xl border border-progress/30 bg-progress-muted px-4 py-3"
        >
          <Clock className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">{text.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-secondary">
              {text.detail}
            </p>
            {credentialNeedsAction(block) && (
              <Link
                href="/parametres#justificatifs"
                className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
              >
                {text.action}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-done">
          <CheckCircle2 className="size-4" aria-hidden />
          {t.ready}
        </p>
      )}
      {/* Validé ou non, un radiologue peut s'exercer tout de suite : sur
          des examens d'exemple, jamais sur un vrai patient. */}
      {active.role === "radiologist" && (
        <Link
          href="/formation"
          className="mt-4 flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 transition-colors hover:border-accent/40"
        >
          <GraduationCap
            className="mt-0.5 size-4 shrink-0 text-accent"
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-primary">
              {messages.training.onboarding.link}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-secondary">
              {messages.training.onboarding.hint}
            </span>
          </span>
        </Link>
      )}
    </StepShell>
  );
}
