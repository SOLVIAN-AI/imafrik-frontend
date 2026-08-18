"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  PartyPopper,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { DicomSettingsCard } from "@/components/domain/dicom-settings";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useOnboardingDraft } from "@/lib/onboarding/draft";
import {
  facilitySchema,
  pacsSchema,
  teamSchema,
} from "@/lib/onboarding/schema";
import type { OnboardingStep } from "@/lib/onboarding/steps";
import { cn } from "@/lib/utils";

/** Propriétés communes à toutes les étapes. */
export interface StepProps {
  step: OnboardingStep;
  previousSlug?: string;
  nextSlug?: string;
}

/**
 * Étape 1 — identité de l'établissement.
 *
 * Le contact d'urgence est demandé ici, et non dans les paramètres :
 * c'est la seule information dont l'équipe de garde a besoin à trois
 * heures du matin, et personne ne pense à la renseigner après coup.
 */
export function FacilityStep({ step, nextSlug }: StepProps) {
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
      name: draft.name ?? "",
      city: draft.city ?? "",
      address: draft.address ?? "",
      contactName: draft.contactName ?? "",
      contactPhone: draft.contactPhone ?? "",
    }),
    [draft],
  );

  const form = useForm<z.infer<typeof facilitySchema>>({
    resolver: zodResolver(facilitySchema),
    defaultValues: values,
    values,
  });

  const submit = form.handleSubmit((values) => {
    merge(values);
    router.push(`/bienvenue/${nextSlug}`);
  });

  return (
    <StepShell step={step} onSubmit={submit}>
      <Field
        id="name"
        label="Nom de l’établissement"
        error={form.formState.errors.name?.message}
      >
        <Input id="name" className="h-10" {...form.register("name")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="city"
          label="Ville"
          error={form.formState.errors.city?.message}
        >
          <Input id="city" className="h-10" {...form.register("city")} />
        </Field>
        <Field
          id="address"
          label="Adresse"
          error={form.formState.errors.address?.message}
        >
          <Input id="address" className="h-10" {...form.register("address")} />
        </Field>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-raised p-5">
        <p className="text-xs font-medium">Contact d’urgence</p>
        <p className="mt-1 text-2xs leading-relaxed text-tertiary">
          Qui appeler lorsqu’un examen urgent demande une précision clinique, y
          compris la nuit et le week-end.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field
            id="contactName"
            label="Responsable médical"
            error={form.formState.errors.contactName?.message}
          >
            <Input
              id="contactName"
              className="h-10"
              {...form.register("contactName")}
            />
          </Field>
          <Field
            id="contactPhone"
            label="Téléphone"
            error={form.formState.errors.contactPhone?.message}
          >
            <Input
              id="contactPhone"
              type="tel"
              className="h-10"
              {...form.register("contactPhone")}
            />
          </Field>
        </div>
      </div>
    </StepShell>
  );
}

/**
 * Étape 2 — raccordement du PACS.
 *
 * **L'étape la plus délicate du parcours**, et souvent la seule qui se
 * fasse à deux, au téléphone avec un technicien. D'où les trois partis
 * pris : les valeurs à recopier sont affichées avant qu'on demande quoi
 * que ce soit, chacune est copiable en un clic, et l'AET de
 * l'établissement — la seule valeur que l'utilisateur doit choisir — est
 * pré-rempli à partir du nom saisi à l'étape précédente.
 */
export function PacsStep({ step, previousSlug, nextSlug }: StepProps) {
  const router = useRouter();
  const { draft, merge } = useOnboardingDraft();

  // Un AET plausible dérivé du nom : « Clinique Saint-Joseph » devient
  // « SAINTJOSEPH ». Le technicien pourra le corriger, mais il n'aura
  // pas à l'inventer.
  const suggestedAet = React.useMemo(() => {
    const base = (draft.name ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/^(CLINIQUE|POLYCLINIQUE|CENTRE|HOPITAL)\s+/, "")
      .replace(/[^A-Z0-9]/g, "");
    return base.slice(0, 16) || "";
  }, [draft.name]);

  // Le brouillon n'est lu qu'après l'hydratation : il vit dans le
  // navigateur, que le rendu serveur ne connaît pas. `values` — mémoïsé,
  // donc d'identité stable tant que le brouillon ne change pas —
  // resynchronise le formulaire à ce moment-là. Sans lui, un chargement
  // direct de l'étape afficherait des champs vides alors que la saisie
  // précédente est bien enregistrée ; avec un objet non mémoïsé, chaque
  // frappe serait écrasée.
  const values = React.useMemo(
    () => ({
      callingAet: draft.callingAet ?? suggestedAet,
      vendor: draft.vendor ?? "",
      technicianEmail: draft.technicianEmail ?? "",
    }),
    [draft, suggestedAet],
  );

  const form = useForm<z.infer<typeof pacsSchema>>({
    resolver: zodResolver(pacsSchema),
    defaultValues: values,
    values,
  });

  // `useWatch` plutôt que `form.watch()` : la seconde renvoie une
  // fonction que le compilateur React ne sait pas mémoïser, ce qui lui
  // fait abandonner l'optimisation de tout le composant.
  const callingAet = useWatch({ control: form.control, name: "callingAet" });

  const submit = form.handleSubmit((values) => {
    merge(values);
    router.push(`/bienvenue/${nextSlug}`);
  });

  return (
    <StepShell step={step} previousSlug={previousSlug} onSubmit={submit}>
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
        <p className="border-b border-border-subtle px-4 py-3 text-xs leading-relaxed text-secondary">
          Ces valeurs se recopient dans la configuration de votre PACS, en tant
          que nouvelle destination d’envoi.
        </p>
        <DicomSettingsCard
          settings={{
            calledAet: "IMAFRIK",
            callingAet: callingAet || "VOTRE_AET",
            host: "dicom.imafrik.com",
            port: 11112,
          }}
        />
      </div>

      <Field
        id="callingAet"
        label="AET de votre établissement"
        hint="C’est lui qui identifie vos envois. Seize caractères au plus, sans espace ni accent."
        error={form.formState.errors.callingAet?.message}
      >
        <Input
          id="callingAet"
          className="h-10 font-mono uppercase"
          {...form.register("callingAet")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="vendor" label="Éditeur du PACS" hint="Facultatif.">
          <Input
            id="vendor"
            className="h-10"
            placeholder="Carestream, Agfa, dcm4chee…"
            {...form.register("vendor")}
          />
        </Field>
        <Field
          id="technicianEmail"
          label="Technicien à mettre en copie"
          hint="Facultatif."
          error={form.formState.errors.technicianEmail?.message}
        >
          <Input
            id="technicianEmail"
            type="email"
            className="h-10"
            {...form.register("technicianEmail")}
          />
        </Field>
      </div>
    </StepShell>
  );
}

/**
 * Étape 3 — attente du premier examen.
 *
 * **Une étape qui ne demande rien, et qui est pourtant la plus
 * importante.** Elle transforme une configuration abstraite en preuve :
 * tant qu'aucune image n'est arrivée, personne ne sait si la liaison
 * fonctionne, et un établissement qui découvre le problème le jour d'une
 * urgence ne reviendra pas.
 *
 * L'attente est active — on écoute réellement l'arrivée d'un examen — et
 * l'écran propose une issue à celui qui n'y arrive pas, plutôt que de le
 * laisser devant une animation.
 */
export function FirstStudyStep({ step, previousSlug, nextSlug }: StepProps) {
  const router = useRouter();
  const [received, setReceived] = React.useState(false);

  // Réception simulée. Sera remplacée par une souscription temps réel à
  // l'arrivée d'un examen portant l'AET déclaré.
  React.useEffect(() => {
    const timer = setTimeout(() => setReceived(true), 6_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <StepShell
      step={step}
      previousSlug={previousSlug}
      submitLabel={received ? "Continuer" : "En attente…"}
      onSubmit={(event) => {
        event.preventDefault();
        if (received) router.push(`/bienvenue/${nextSlug}`);
      }}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center",
          received
            ? "border-done/30 bg-done-muted/40"
            : "border-border-subtle bg-surface-raised",
        )}
        role="status"
        aria-live="polite"
      >
        {received ? (
          <>
            <CheckCircle2 className="size-7 text-done" aria-hidden />
            <p className="text-base font-medium">Premier examen reçu</p>
            <p className="max-w-sm text-xs leading-relaxed text-secondary">
              La liaison fonctionne. Les examens validés sur votre console
              arriveront désormais automatiquement dans la file de lecture.
            </p>
          </>
        ) : (
          <>
            {/* Un halo qui bat lentement : l'écoute est réelle, l'écran
                doit le montrer sans devenir agité. */}
            <span className="relative flex size-10 items-center justify-center">
              <span className="absolute inline-flex size-10 animate-ping rounded-full bg-accent/20" />
              <Radio className="relative size-5 text-accent" aria-hidden />
            </span>
            <p className="text-base font-medium">En attente d’un examen</p>
            <p className="max-w-sm text-xs leading-relaxed text-secondary">
              Envoyez n’importe quel examen depuis votre console — un examen de
              test suffit. Cette page se met à jour toute seule.
            </p>
            <Loader2
              className="mt-2 size-3.5 animate-spin text-tertiary"
              aria-hidden
            />
          </>
        )}
      </div>

      {!received && (
        <p className="text-center text-2xs text-tertiary">
          Rien n’arrive au bout de quelques minutes ?{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Faites-vous accompagner
          </Link>{" "}
          — c’est souvent un pare-feu qui bloque le port 11112.
        </p>
      )}
    </StepShell>
  );
}

/**
 * Étape 4 — invitation de l'équipe.
 *
 * Facultative, et présentée comme telle : la personne qui met en service
 * n'a pas toujours la liste des adresses sous la main, et bloquer là
 * pour une invitation qui peut être envoyée depuis les paramètres serait
 * absurde.
 */
export function TeamStep({ step, previousSlug, nextSlug }: StepProps) {
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
    () => ({ invites: draft.invites ?? "" }),
    [draft],
  );

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: values,
    values,
  });

  const go = (values: z.infer<typeof teamSchema>) => {
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
        id="invites"
        label="Adresses à inviter"
        hint="Une par ligne. Chaque personne recevra un lien pour choisir son propre mot de passe."
      >
        <Textarea
          id="invites"
          rows={5}
          placeholder={"k.dogbe@etablissement.tg\ns.amoussou@etablissement.tg"}
          {...form.register("invites")}
        />
      </Field>

      <p className="text-2xs leading-relaxed text-tertiary">
        Un compte est personnel : dans un service qui trace chaque accès aux
        images, il doit appartenir à une personne, pas à un poste.
      </p>
    </StepShell>
  );
}

/**
 * Étape 5 — mise en service terminée.
 *
 * Elle récapitule ce qui a été configuré. Un écran de félicitations sans
 * contenu donnerait l'impression que rien n'a été enregistré.
 */
export function ClinicDoneStep() {
  const { draft, reset } = useOnboardingDraft();

  return (
    <div className="animate-[rise-in_300ms_var(--ease-out-quart)] text-center">
      <span
        className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-muted ring-1 ring-accent/25 ring-inset"
        aria-hidden
      >
        <PartyPopper className="size-6 text-accent" />
      </span>

      <h1 className="mt-6 text-2xl font-semibold">Votre service est ouvert</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
        {draft.name ?? "Votre établissement"} peut envoyer ses examens. Le
        premier compte-rendu vous parviendra dans le portail, et par courriel.
      </p>

      <dl className="mt-10 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-surface-raised text-left">
        <Summary label="Établissement" value={draft.name ?? "—"} />
        <Summary label="Ville" value={draft.city ?? "—"} />
        <Summary label="AET déclaré" value={draft.callingAet ?? "—"} mono />
        <Summary
          label="Contact d’urgence"
          value={
            draft.contactName
              ? `${draft.contactName} · ${draft.contactPhone ?? ""}`
              : "—"
          }
        />
      </dl>

      <Button size="lg" className="mt-8 h-10" asChild onClick={reset}>
        <Link href="/tableau-de-bord">
          Accéder au portail
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

/** Une ligne du récapitulatif. */
function Summary({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-4 px-4 py-3 text-xs">
      <dt className="w-36 shrink-0 text-tertiary">{label}</dt>
      <dd className={cn("min-w-0 truncate", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
