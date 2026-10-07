"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { setOpenToPool } from "@/lib/actions/organization";
import { changePassword, updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/data/profile";
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
  submitLabel = "Enregistrer",
  children,
}: {
  title: string;
  description: React.ReactNode;
  onSubmit: (form: FormData) => void;
  pending: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}) {
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
            {submitLabel}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/**
 * Profil : nom, titre et — pour un radiologue — numéro d'ordre.
 *
 * Ces informations sont imprimées sur les comptes-rendus signés
 * **ensuite** ; ceux déjà signés gardent l'identité figée à leur signature.
 */
export function ProfileForm({
  profile,
  isRadiologist,
}: {
  profile: Profile;
  isRadiologist: boolean;
}) {
  const [pending, startTransition] = React.useTransition();

  const submit = (form: FormData) =>
    startTransition(async () => {
      const result = await updateProfile({
        fullName: String(form.get("fullName") ?? ""),
        title: String(form.get("title") ?? ""),
        licenseNumber: String(form.get("licenseNumber") ?? ""),
      });
      if (result.ok) toast.success("Profil enregistré.");
      else toast.error(result.error);
    });

  return (
    <Section
      title="Profil"
      description={
        isRadiologist
          ? "Imprimé sur les comptes-rendus que vous signerez. Ceux déjà signés ne changent pas."
          : "Votre identité au sein de l’établissement. Elle figure dans le journal d’accès aux examens."
      }
      onSubmit={submit}
      pending={pending}
    >
      <Field id="fullName" label="Nom complet">
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
        label="Titre"
        hint={
          isRadiologist
            ? "Imprimé devant votre nom, par exemple « Dr » ou « Pr »."
            : "Fonction dans l’établissement."
        }
      >
        <Input
          id="title"
          name="title"
          defaultValue={profile.title}
          maxLength={100}
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
            defaultValue={profile.licenseNumber}
            maxLength={50}
          />
        </Field>
      )}
      {!isRadiologist && (
        <input
          type="hidden"
          name="licenseNumber"
          value={profile.licenseNumber}
        />
      )}
    </Section>
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
  const [value, setValue] = React.useState(openToPool);
  const [pending, startTransition] = React.useTransition();

  const options = [
    {
      value: true,
      title: "Tous les radiologues de la plateforme",
      detail:
        "Vos examens entrent dans la file commune. Le premier radiologue disponible les prend en charge.",
    },
    {
      value: false,
      title: "Nos radiologues uniquement",
      detail:
        "Seuls les radiologues que vous avez invités dans votre équipe voient vos examens. Personne d’autre.",
    },
  ];

  return (
    <Section
      title="Qui lit vos examens"
      description="Le réglage s’applique immédiatement ; un examen déjà pris en charge ne change pas de main."
      pending={pending}
      onSubmit={() =>
        startTransition(async () => {
          const result = await setOpenToPool(value);
          if (result.ok) toast.success("Réglage enregistré.");
          else toast.error(result.error);
        })
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Qui lit vos examens</legend>
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
          Aucun radiologue de la plateforme ne pourra lire vos examens, y
          compris la nuit et le week-end. Assurez-vous que vos propres
          radiologues couvrent ces périodes.
        </p>
      )}
    </Section>
  );
}

/**
 * Changement de mot de passe.
 *
 * Les autres sessions ouvertes sous ce compte sont fermées : un mot de
 * passe changé parce qu'il a fuité ne doit pas laisser ouverte la session
 * de celui qui l'a utilisé.
 */
export function PasswordForm() {
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={formRef}>
      <Section
        title="Mot de passe"
        description="Vos sessions ouvertes sur d’autres appareils seront fermées."
        submitLabel="Changer le mot de passe"
        pending={pending}
        onSubmit={(form) =>
          startTransition(async () => {
            const result = await changePassword(
              String(form.get("password") ?? ""),
              String(form.get("confirmation") ?? ""),
            );
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Mot de passe changé.");
            formRef.current?.querySelector("form")?.reset();
          })
        }
      >
        <Field
          id="password"
          label="Nouveau mot de passe"
          hint={PASSWORD_RULES.map((rule) => rule.label).join(" · ")}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field id="confirmation" label="Confirmation">
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
