"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { CredentialChip } from "@/components/domain/credential-chip";
import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { setOpenToPool } from "@/lib/actions/organization";
import {
  changePassword,
  type ProfileInput,
  setLanguage,
  updateProfile,
} from "@/lib/actions/profile";
import {
  credentialStatus,
  identityChangeResetsValidation,
  licenseChangeResetsValidation,
  normalizeLicenseNumber,
} from "@/lib/credentials";
import type { Profile } from "@/lib/data/profile";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/locale";
import { PASSWORD_RULES } from "@/lib/security/password";
import { cn } from "@/lib/utils";

/**
 * Un bloc de paramètres, avec son propre enregistrement.
 *
 * Un bouton par bloc plutôt qu'un seul en bas de page : on vient changer
 * une chose, pas tout, et un enregistrement global obligerait à relire
 * toute la page avant de cliquer.
 */
function Section({
  title,
  description,
  onSubmit,
  pending,
  submitLabel,
  children,
}: {
  title: string;
  description: React.ReactNode;
  onSubmit: (form: FormData) => void;
  pending: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const t = useMessages();
  return (
    <Panel className="overflow-hidden">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-tertiary">{description}</p>
        </div>
        <div className="flex flex-col gap-4 px-4 py-4">{children}</div>
        <div className="flex justify-end border-t border-border-subtle px-4 py-2.5">
          <Button type="submit" variant="secondary" size="sm" loading={pending}>
            {submitLabel ?? t.common.actions.save}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/**
 * Profil : nom, titre et, pour un radiologue, numéro d'ordre.
 *
 * Ces informations sont imprimées sur les comptes-rendus signés
 * **ensuite** ; ceux déjà signés gardent l'identité figée à leur signature.
 *
 * Le numéro d'ordre d'un radiologue est vérifié par l'équipe IMAFRIK avant
 * tout accès aux examens. Son état est affiché à côté du champ, et le
 * remplacer par un autre annule la validation côté serveur : l'écran le
 * dit pendant la saisie, puis le fait confirmer avant d'enregistrer.
 */
export function ProfileForm({
  profile,
  isRadiologist,
}: {
  profile: Profile;
  isRadiologist: boolean;
}) {
  const t = useMessages();
  const text = t.settings.profile;
  const [pending, startTransition] = React.useTransition();
  const [license, setLicense] = React.useState(profile.licenseNumber);
  // Saisie retenue le temps de la confirmation d'un changement de numéro,
  // de nom ou de titre : tous trois annulent la validation.
  const [awaiting, setAwaiting] = React.useState<{
    input: ProfileInput;
    reason: "license" | "identity";
  } | null>(null);

  const status = credentialStatus({
    hasLicenseNumber: normalizeLicenseNumber(profile.licenseNumber) !== "",
    credentialsVerified: profile.credentialsVerified,
  });
  const resetsValidation =
    isRadiologist &&
    licenseChangeResetsValidation(profile.licenseNumber, license);

  const save = (input: ProfileInput) =>
    startTransition(async () => {
      const result = await updateProfile(input);
      setAwaiting(null);
      if (result.ok) toast.success(text.saved);
      else toast.error(result.error);
    });

  const submit = (form: FormData) => {
    const input: ProfileInput = {
      fullName: String(form.get("fullName") ?? ""),
      title: String(form.get("title") ?? ""),
      licenseNumber: String(form.get("licenseNumber") ?? ""),
    };
    if (resetsValidation) setAwaiting({ input, reason: "license" });
    else if (
      isRadiologist &&
      identityChangeResetsValidation(profile, {
        fullName: input.fullName,
        title: input.title,
        licenseNumber: input.licenseNumber,
      })
    )
      setAwaiting({ input, reason: "identity" });
    else save(input);
  };

  return (
    <>
      <Section
        title={text.title}
        description={
          isRadiologist ? text.descriptionRadiologist : text.descriptionStaff
        }
        onSubmit={submit}
        pending={pending}
      >
        <Field id="fullName" label={text.fullName}>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={profile.fullName}
            required
            maxLength={200}
          />
        </Field>
        <Field
          id="title"
          label={text.titleField}
          hint={isRadiologist ? text.titleHintRadiologist : text.titleHintStaff}
        >
          <Input
            id="title"
            name="title"
            defaultValue={profile.title}
            maxLength={100}
          />
        </Field>
        {isRadiologist && (
          <div className="flex flex-col gap-1.5">
            <Field
              id="licenseNumber"
              label={text.license}
              hint={text.licenseHint}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  value={license}
                  onChange={(event) => setLicense(event.target.value)}
                  maxLength={50}
                  aria-describedby="licenseNumber-status licenseNumber-description"
                  className="sm:flex-1"
                />
                {/* Relié au champ : un lecteur d'écran l'annonce avec lui. */}
                <CredentialChip
                  id="licenseNumber-status"
                  status={status}
                  label={text.licenseStatus[status]}
                  className="self-start sm:self-center"
                />
              </div>
            </Field>
            {resetsValidation && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2.5 text-2xs leading-relaxed text-progress"
              >
                <AlertTriangle
                  className="mt-px size-3.5 shrink-0"
                  aria-hidden
                />
                {text.licenseChangeWarning}
              </p>
            )}
          </div>
        )}
        {!isRadiologist && (
          <input
            type="hidden"
            name="licenseNumber"
            value={profile.licenseNumber}
          />
        )}
      </Section>

      <Dialog
        open={awaiting !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setAwaiting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {awaiting?.reason === "identity"
                ? text.identityChangeConfirm.title
                : text.licenseChangeConfirm.title}
            </DialogTitle>
            <DialogDescription>
              {awaiting?.reason === "identity"
                ? text.identityChangeConfirm.description
                : text.licenseChangeConfirm.description(
                    normalizeLicenseNumber(profile.licenseNumber),
                    normalizeLicenseNumber(awaiting?.input.licenseNumber ?? ""),
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setAwaiting(null)}
            >
              {t.common.actions.cancel}
            </Button>
            <Button
              type="button"
              size="sm"
              loading={pending}
              onClick={() => awaiting && save(awaiting.input)}
            >
              {text.licenseChangeConfirm.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Qui lit les examens de la clinique : ses radiologues, ou le pool.
 *
 * **Deux modes, aucune bascule automatique.** Une règle qui s'explique en
 * une phrase à un directeur d'établissement est une règle qu'il pourra
 * défendre. Un seul booléen la porte en base — `open_to_pool` — et il
 * pilote à la fois la worklist, les recherches d'images et la prise en
 * charge.
 */
export function PoolForm({ openToPool }: { openToPool: boolean }) {
  const t = useMessages().settings.pool;
  const [value, setValue] = React.useState(openToPool);
  const [pending, startTransition] = React.useTransition();

  const options = [
    { value: true, title: t.poolTitle, detail: t.poolDetail },
    { value: false, title: t.ownTitle, detail: t.ownDetail },
  ];

  return (
    <Section
      title={t.title}
      description={t.description}
      pending={pending}
      onSubmit={() =>
        startTransition(async () => {
          const result = await setOpenToPool(value);
          if (result.ok) toast.success(t.saved);
          else toast.error(result.error);
        })
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{t.title}</legend>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.title}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-100",
                selected
                  ? "border-accent/40 bg-accent-muted"
                  : "border-border-subtle hover:border-border-default hover:bg-surface-hover",
              )}
            >
              <input
                type="radio"
                name="openToPool"
                checked={selected}
                onChange={() => setValue(option.value)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium">
                  {option.title}
                </span>
                <span className="mt-1 block text-2xs leading-relaxed text-tertiary">
                  {option.detail}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {!value && (
        <p className="flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2.5 text-2xs leading-relaxed text-progress">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {t.ownWarning}
        </p>
      )}
    </Section>
  );
}

/**
 * Changement de mot de passe.
 *
 * Le mot de passe actuel est exigé, et vérifié par le serveur : une
 * session trouvée ouverte ne suffit pas à changer le mot de passe.
 *
 * Les autres sessions ouvertes sous ce compte sont fermées : un mot de
 * passe changé parce qu'il a fuité ne doit pas laisser ouverte la session
 * de celui qui l'a utilisé.
 */
export function PasswordForm() {
  const t = useMessages().settings.password;
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={formRef}>
      <Section
        title={t.title}
        description={t.description}
        submitLabel={t.submit}
        pending={pending}
        onSubmit={(form) =>
          startTransition(async () => {
            const result = await changePassword(
              String(form.get("currentPassword") ?? ""),
              String(form.get("password") ?? ""),
              String(form.get("confirmation") ?? ""),
            );
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(t.changed);
            formRef.current?.querySelector("form")?.reset();
          })
        }
      >
        <Field id="currentPassword" label={t.currentPassword}>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field
          id="password"
          label={t.newPassword}
          hint={PASSWORD_RULES.map((rule) => t.rules[rule.id]).join(" · ")}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field id="confirmation" label={t.confirmation}>
          <Input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>
      </Section>
    </div>
  );
}

/**
 * Langue de l'utilisateur.
 *
 * Elle régit ses écrans, les messages du service et ses courriels ; la
 * langue des comptes-rendus PDF, elle, est celle de chaque clinique. Le
 * changement s'applique aussitôt : la page est relue dans la nouvelle
 * langue.
 */
export function LanguageForm() {
  const t = useMessages();
  const current = useLocale();
  const [value, setValue] = React.useState<Locale>(current);
  const [pending, startTransition] = React.useTransition();

  return (
    <Section
      title={t.settings.language.title}
      description={t.settings.language.description}
      pending={pending}
      onSubmit={() =>
        startTransition(async () => {
          const result = await setLanguage(value);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          // Rechargement complet : `<html lang>`, titre et textes suivent.
          window.location.reload();
        })
      }
    >
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t.settings.language.title}</legend>
        {LOCALES.map((locale) => {
          const selected = value === locale;
          return (
            <label
              key={locale}
              lang={locale}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm transition-colors duration-100",
                selected
                  ? "border-accent/40 bg-accent-muted font-medium"
                  : "border-border-subtle hover:border-border-default hover:bg-surface-hover",
              )}
            >
              <input
                type="radio"
                name="locale"
                checked={selected}
                onChange={() => setValue(locale)}
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
              {LOCALE_NAMES[locale]}
            </label>
          );
        })}
      </fieldset>
      <p className="text-2xs leading-relaxed text-tertiary">
        {t.settings.language.reportsNote}
      </p>
    </Section>
  );
}
