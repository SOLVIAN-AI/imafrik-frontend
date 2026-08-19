"use client";

import { CheckCircle2, Mail, MapPin } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Volumes proposés, en tranches larges plutôt qu'en chiffre libre. */
const VOLUMES = [
  "Moins de 50 examens par mois",
  "50 à 200 examens par mois",
  "200 à 500 examens par mois",
  "Plus de 500 examens par mois",
  "Je ne sais pas encore",
] as const;

/** Modalités disponibles à l'envoi. */
const MODALITIES = [
  "Scanner (CT)",
  "IRM (MR)",
  "Radiographie (CR/DX)",
  "Échographie (US)",
] as const;

/**
 * Demande de démonstration.
 *
 * **Le formulaire demande ce qui sert à préparer l'entretien, rien de
 * plus.** Volume et modalités permettent d'arriver avec une grille
 * chiffrée ; le reste se dit de vive voix. Chaque champ supplémentaire
 * fait chuter le taux de remplissage, et un formulaire long sur une page
 * publique ressemble à une collecte de données.
 *
 * Aucune donnée patient n'est demandée, et la page le dit — c'est le
 * genre de précision qui rassure justement les gens qui font attention.
 */
export default function ContactPage() {
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    organization: "",
    role: "",
    email: "",
    phone: "",
    volume: VOLUMES[1],
    message: "",
  });
  const [modalities, setModalities] = React.useState<string[]>([]);

  const valid =
    form.name.trim().length >= 3 &&
    form.organization.trim().length >= 2 &&
    form.email.includes("@");

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setPending(false);
    setSent(true);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="label-eyebrow text-accent">Contact</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
          Parlons de votre installation
        </h1>
        <p className="prose-justify mt-5 text-base leading-relaxed text-secondary">
          Trente minutes suffisent : vous décrivez votre installation et votre
          volume, nous vous montrons le parcours complet d’un examen, de
          l’acquisition au compte-rendu signé.
        </p>

        <dl className="mt-10 flex flex-col gap-5">
          <div className="flex gap-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <div>
              <dt className="text-sm font-medium">contact@imafrik.com</dt>
              <dd className="mt-0.5 text-xs text-tertiary">
                Nous vous rappelons pour convenir d’un créneau.
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-accent"
              aria-hidden
            />
            <div>
              <dt className="text-sm font-medium">Lomé, Togo</dt>
              <dd className="mt-0.5 text-xs text-tertiary">SOLVIAN AI LLC</dd>
            </div>
          </div>
        </dl>

        <p className="prose-justify mt-10 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5 text-xs leading-relaxed text-tertiary">
          La démonstration se fait sur des examens de test. Ne nous transmettez
          aucune donnée de patient avant la signature d’un contrat et de son
          annexe de traitement des données.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-raised">
        {sent ? (
          <div className="flex flex-col items-start py-8">
            <span
              className="flex size-11 items-center justify-center rounded-xl bg-accent-muted ring-1 ring-accent/25 ring-inset"
              aria-hidden
            >
              <CheckCircle2 className="size-5 text-accent" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Demande envoyée</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              Merci {form.name.split(" ")[0]}. Nous revenons vers vous à
              l’adresse <span className="text-primary">{form.email}</span> avec
              une proposition de créneau.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name" label="Nom complet">
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => update("name")(event.target.value)}
                  autoComplete="name"
                  className="h-10"
                />
              </Field>
              <Field id="role" label="Fonction">
                <Input
                  id="role"
                  value={form.role}
                  onChange={(event) => update("role")(event.target.value)}
                  placeholder="Directeur, manipulateur, radiologue…"
                  className="h-10"
                />
              </Field>
            </div>

            <Field id="organization" label="Établissement">
              <Input
                id="organization"
                value={form.organization}
                onChange={(event) => update("organization")(event.target.value)}
                autoComplete="organization"
                className="h-10"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="email" label="Adresse électronique">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email")(event.target.value)}
                  autoComplete="email"
                  className="h-10"
                />
              </Field>
              <Field id="phone" label="Téléphone" hint="Facultatif.">
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone")(event.target.value)}
                  autoComplete="tel"
                  className="h-10"
                />
              </Field>
            </div>

            <Field id="volume" label="Volume mensuel estimé">
              <select
                id="volume"
                value={form.volume}
                onChange={(event) => update("volume")(event.target.value)}
                className={cn(
                  "h-10 w-full rounded-md px-2.5 text-sm",
                  "border border-border-default bg-surface-base",
                  "transition-colors hover:border-border-strong",
                  "focus:border-accent focus:outline-none",
                )}
              >
                {VOLUMES.map((volume) => (
                  <option key={volume} value={volume}>
                    {volume}
                  </option>
                ))}
              </select>
            </Field>

            <fieldset>
              <legend className="text-xs font-medium text-secondary">
                Modalités concernées
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {MODALITIES.map((modality) => {
                  const selected = modalities.includes(modality);
                  return (
                    <button
                      key={modality}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setModalities((current) =>
                          selected
                            ? current.filter((item) => item !== modality)
                            : [...current, modality],
                        )
                      }
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
            </fieldset>

            <Field id="message" label="Message" hint="Facultatif.">
              <Textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(event) => update("message")(event.target.value)}
                placeholder="Vos modalités, vos délais actuels, ce qui vous pose problème aujourd’hui…"
              />
            </Field>

            <Button
              type="submit"
              size="lg"
              loading={pending}
              disabled={!valid}
              className="mt-2 h-10"
            >
              Envoyer la demande
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
