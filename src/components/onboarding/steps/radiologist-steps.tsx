"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, FileCheck2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import type { StepProps } from "@/components/onboarding/steps/clinic-steps";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useOnboardingDraft } from "@/lib/onboarding/draft";
import {
  preferencesSchema,
  profileSchema,
  qualificationsSchema,
  signatureSchema,
} from "@/lib/onboarding/schema";
import { cn } from "@/lib/utils";

/** Modalités qu'un radiologue peut déclarer lire. */
const MODALITIES = [
  "Scanner (CT)",
  "IRM (MR)",
  "Radiographie (CR/DX)",
  "Échographie (US)",
  "Mammographie (MG)",
] as const;

/** Rythmes de disponibilité proposés. */
const AVAILABILITIES = [
  "Journée, en semaine",
  "Soirées et nuits",
  "Week-ends",
  "Sans contrainte",
] as const;

/**
 * Étape 1 — identité professionnelle.
 *
 * Les modalités déclarées ne sont pas décoratives : elles déterminent
 * les examens qui seront proposés. Un radiologue à qui l'on présente des
 * mammographies qu'il ne lit pas cesse de regarder la file.
 */
export function ProfileStep({ step, nextSlug }: StepProps) {
  const router = useRouter();
  const { draft, merge } = useOnboardingDraft();
  const [specialties, setSpecialties] = React.useState<string[]>(
    draft.specialties ?? [],
  );

  // Le brouillon n'est lu qu'après l'hydratation : il vit dans le
  // navigateur, que le rendu serveur ne connaît pas. `values` — mémoïsé,
  // donc d'identité stable tant que le brouillon ne change pas —
  // resynchronise le formulaire à ce moment-là. Sans lui, un chargement
  // direct de l'étape afficherait des champs vides alors que la saisie
  // précédente est bien enregistrée ; avec un objet non mémoïsé, chaque
  // frappe serait écrasée.
  const values = React.useMemo(
    () => ({
      fullName: draft.fullName ?? "",
      title: draft.title ?? "",
      specialties: draft.specialties ?? [],
    }),
    [draft],
  );

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: values,
    values,
  });

  // Les puces de modalité ne sont pas des champs natifs : leur valeur est
  // reportée dans le formulaire à chaque changement pour que la
  // validation la voie.
  const toggle = (modality: string) => {
    const next = specialties.includes(modality)
      ? specialties.filter((item) => item !== modality)
      : [...specialties, modality];
    setSpecialties(next);
    form.setValue("specialties", next, { shouldValidate: true });
  };

  const submit = form.handleSubmit((values) => {
    merge(values);
    router.push(`/bienvenue/${nextSlug}`);
  });

  return (
    <StepShell step={step} onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="fullName"
          label="Nom complet"
          error={form.formState.errors.fullName?.message}
        >
          <Input
            id="fullName"
            className="h-10"
            {...form.register("fullName")}
          />
        </Field>
        <Field
          id="title"
          label="Titre"
          hint="Tel qu’il apparaîtra sous votre signature."
          error={form.formState.errors.title?.message}
        >
          <Input
            id="title"
            className="h-10"
            placeholder="Radiologue"
            {...form.register("title")}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-secondary">
          Modalités que vous lisez
        </legend>
        <p className="mt-1 text-2xs text-tertiary">
          Seuls les examens correspondants vous seront proposés.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MODALITIES.map((modality) => {
            const selected = specialties.includes(modality);
            return (
              <button
                key={modality}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(modality)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  selected
                    ? "border-accent/40 bg-accent-muted text-accent"
                    : "border-border-default text-secondary hover:border-border-strong hover:text-primary",
                )}
              >
                {modality}
              </button>
            );
          })}
        </div>
        {form.formState.errors.specialties && (
          <p className="mt-2 text-2xs text-urgent">
            {form.formState.errors.specialties.message}
          </p>
        )}
      </fieldset>
    </StepShell>
  );
}

/**
 * Étape 2 — qualifications.
 *
 * Le numéro d'ordre conditionne la signature : il est imprimé sur chaque
 * compte-rendu, et c'est lui qui rend l'interprétation opposable. Le
 * dépôt des pièces est présenté ici mais leur vérification est humaine —
 * l'écran ne prétend pas valider ce qu'il ne peut pas contrôler.
 */
export function QualificationsStep({
  step,
  previousSlug,
  nextSlug,
}: StepProps) {
  const router = useRouter();
  const { draft, merge } = useOnboardingDraft();

  // Le brouillon n'est lu qu'après l'hydratation : il vit dans le
  // navigateur, que le rendu serveur ne connaît pas. `values` — mémoïsé,
  // donc d'identité stable tant que le brouillon ne change pas —
  // resynchronise le formulaire à ce moment-là. Sans lui, un chargement
  // direct de l'étape afficherait des champs vides alors que la saisie
  // précédente est bien enregistrée ; avec un objet non mémoïsé, chaque
  // frappe serait écrasée.
  const values = React.useMemo(
    () => ({
      licenseNumber: draft.licenseNumber ?? "",
      licenseCountry: draft.licenseCountry ?? "Togo",
      insurer: draft.insurer ?? "",
    }),
    [draft],
  );

  const form = useForm<z.infer<typeof qualificationsSchema>>({
    resolver: zodResolver(qualificationsSchema),
    defaultValues: values,
    values,
  });

  const submit = form.handleSubmit((values) => {
    merge(values);
    router.push(`/bienvenue/${nextSlug}`);
  });

  return (
    <StepShell step={step} previousSlug={previousSlug} onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="licenseNumber"
          label="Numéro d’inscription à l’ordre"
          error={form.formState.errors.licenseNumber?.message}
        >
          <Input
            id="licenseNumber"
            className="h-10 font-mono"
            placeholder="TG-1284"
            {...form.register("licenseNumber")}
          />
        </Field>
        <Field
          id="licenseCountry"
          label="Pays d’inscription"
          error={form.formState.errors.licenseCountry?.message}
        >
          <Input
            id="licenseCountry"
            className="h-10"
            {...form.register("licenseCountry")}
          />
        </Field>
      </div>

      <Field
        id="insurer"
        label="Assurance en responsabilité civile professionnelle"
        hint="Nom de l’assureur. Facultatif à ce stade, exigé avant la première lecture."
      >
        <Input id="insurer" className="h-10" {...form.register("insurer")} />
      </Field>

      <div className="rounded-xl border border-dashed border-border-default px-5 py-8 text-center">
        <Upload className="mx-auto size-5 text-tertiary" aria-hidden />
        <p className="mt-3 text-sm font-medium">Pièces justificatives</p>
        <p className="mx-auto mt-1 max-w-sm text-2xs leading-relaxed text-tertiary">
          Diplôme, attestation d’inscription à l’ordre, attestation d’assurance.
          Vous pourrez aussi les déposer plus tard, depuis vos paramètres.
        </p>
        <Button variant="secondary" size="sm" type="button" className="mt-4">
          Choisir des fichiers
        </Button>
      </div>
    </StepShell>
  );
}

/**
 * Étape 3 — bloc de signature.
 *
 * Il est pré-rempli à partir des étapes précédentes, puis modifiable :
 * personne n'a envie de retaper son numéro d'ordre, mais chacun tient à
 * la formulation exacte qui figure sous son nom.
 */
export function SignatureStep({ step, previousSlug, nextSlug }: StepProps) {
  const router = useRouter();
  const { draft, merge } = useOnboardingDraft();

  const suggestion = [
    draft.title ?? "Radiologue",
    draft.licenseNumber
      ? `Ordre des médecins${draft.licenseCountry ? ` (${draft.licenseCountry})` : ""} n° ${draft.licenseNumber}`
      : null,
    "Compte-rendu établi à distance à partir des images transmises.",
  ]
    .filter(Boolean)
    .join("\n");

  // Le brouillon n'est lu qu'après l'hydratation : il vit dans le
  // navigateur, que le rendu serveur ne connaît pas. `values` — mémoïsé,
  // donc d'identité stable tant que le brouillon ne change pas —
  // resynchronise le formulaire à ce moment-là. Sans lui, un chargement
  // direct de l'étape afficherait des champs vides alors que la saisie
  // précédente est bien enregistrée ; avec un objet non mémoïsé, chaque
  // frappe serait écrasée.
  const values = React.useMemo(
    () => ({ signatureBlock: draft.signatureBlock ?? suggestion }),
    [draft, suggestion],
  );

  const form = useForm<z.infer<typeof signatureSchema>>({
    resolver: zodResolver(signatureSchema),
    defaultValues: values,
    values,
  });

  // Voir `PacsStep` : `useWatch` préserve la mémoïsation du composant là
  // où `form.watch()` la ferait abandonner.
  const signatureBlock = useWatch({
    control: form.control,
    name: "signatureBlock",
  });

  const submit = form.handleSubmit((formValues) => {
    merge(formValues);
    router.push(`/bienvenue/${nextSlug}`);
  });

  return (
    <StepShell step={step} previousSlug={previousSlug} onSubmit={submit}>
      <Field
        id="signatureBlock"
        label="Mentions apposées sous votre nom"
        error={form.formState.errors.signatureBlock?.message}
      >
        <Textarea
          id="signatureBlock"
          rows={4}
          {...form.register("signatureBlock")}
        />
      </Field>

      {/* Aperçu tel qu'il sortira sur le PDF. Un bloc de signature se
            juge à sa mise en page, pas à son contenu brut. */}
      <div className="rounded-xl border border-border-subtle bg-surface-raised p-6">
        <p className="label-eyebrow">Aperçu sur le compte-rendu</p>
        <div className="mt-4 border-t border-border-subtle pt-4 text-right">
          <p className="text-sm font-medium">{draft.fullName ?? "Votre nom"}</p>
          <p className="mt-1 text-2xs whitespace-pre-line text-tertiary">
            {signatureBlock}
          </p>
        </div>
      </div>
    </StepShell>
  );
}

/** Étape 4 — disponibilités et alertes. Facultative. */
export function PreferencesStep({ step, previousSlug, nextSlug }: StepProps) {
  const router = useRouter();
  const { draft, merge } = useOnboardingDraft();

  // Voir `ProfileStep` : mémoïsé pour ne resynchroniser qu'à l'arrivée
  // du brouillon, jamais à chaque frappe.
  const values = React.useMemo(
    () => ({
      availability: draft.availability ?? AVAILABILITIES[0],
      urgentAlerts: draft.urgentAlerts ?? true,
    }),
    [draft],
  );

  const form = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: values,
    values,
  });

  const go = (values: z.infer<typeof preferencesSchema>) => {
    merge(values);
    router.push(`/bienvenue/${nextSlug}`);
  };

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      onSubmit={form.handleSubmit(go)}
      onSkip={() => router.push(`/bienvenue/${nextSlug}`)}
    >
      <Field
        id="availability"
        label="Disponibilité habituelle"
        hint="Indicatif : rien ne vous empêche de prendre un examen en dehors."
      >
        <select
          id="availability"
          className={cn(
            "h-10 w-full rounded-md px-2.5 text-sm",
            "border border-border-default bg-surface-base",
            "transition-colors hover:border-border-strong",
            "focus:border-accent focus:outline-none",
          )}
          {...form.register("availability")}
        >
          {AVAILABILITIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <label
        htmlFor="urgentAlerts"
        className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border-subtle bg-surface-raised p-5"
      >
        <span>
          <span className="block text-xs font-medium">
            M’alerter des examens urgents
          </span>
          <span className="mt-1 block text-2xs leading-relaxed text-tertiary">
            Notification dès qu’un examen marqué urgent entre dans la file, y
            compris en dehors de vos disponibilités déclarées.
          </span>
        </span>
        <input
          id="urgentAlerts"
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded-xs accent-[var(--accent)]"
          {...form.register("urgentAlerts")}
        />
      </label>
    </StepShell>
  );
}

/**
 * Étape 5 — dossier soumis, en attente de validation.
 *
 * **Le parcours s'achève sur une attente, et il faut le dire.** Un
 * radiologue qui vient de remplir cinq écrans s'attend à lire ; lui
 * présenter un portail vide sans explication serait pire que l'attente
 * elle-même. On annonce donc le délai et ce qui se passe ensuite.
 */
export function ValidationStep() {
  const { draft, reset } = useOnboardingDraft();

  return (
    <div className="animate-[rise-in_300ms_var(--ease-out-quart)] text-center">
      <span
        className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-progress-muted ring-1 ring-progress/25 ring-inset"
        aria-hidden
      >
        <Clock3 className="size-6 text-progress" />
      </span>

      <h1 className="mt-6 text-2xl font-semibold">Dossier transmis</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
        Merci {draft.fullName?.split(" ")[0] ?? ""}. Vos qualifications sont
        vérifiées par l’équipe IMAFRIK — comptez un à deux jours ouvrés. Vous
        recevrez un courriel dès l’ouverture de votre accès à la file de
        lecture.
      </p>

      <ul className="mx-auto mt-10 flex max-w-sm flex-col gap-3 text-left">
        {[
          "Vérification de votre inscription à l’ordre",
          "Contrôle des pièces déposées",
          "Ouverture de l’accès à la file de lecture",
        ].map((item) => (
          <li key={item} className="flex gap-2.5 text-xs text-secondary">
            <FileCheck2
              className="mt-0.5 size-3.5 shrink-0 text-tertiary"
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        size="lg"
        className="mt-8 h-10"
        asChild
        onClick={reset}
      >
        <Link href="/worklist">Voir mon portail</Link>
      </Button>
    </div>
  );
}
