"use client";

import { CheckCircle2, Mail, MapPin } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { marketingCopy, fill } from "@/content/marketing";
import { submitContact } from "@/lib/actions/contact";
import {
  type ContactFieldError,
  LICENSE_NUMBER_MAX_LENGTH,
  requesterFromSearch,
  validateContactForm,
} from "@/lib/contact-form";
import { REQUESTER_KINDS, type RequesterKind } from "@/lib/contact-status";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

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
 *
 * La demande est enregistrée par le service, qui limite le débit par
 * adresse ; l'équipe IMAFRIK la retrouve dans le back-office (« Demandes
 * reçues »). Fonction, volume et modalités n'ont pas de colonne à eux : ils
 * sont joints au message, en tête, pour préparer l'entretien. Ce contexte
 * reste en français, la langue du back-office, et porte la langue du
 * demandeur : l'équipe lui répond dans la sienne.
 *
 * **Qui écrit ?** La première question, obligatoire : un établissement de
 * santé ou un radiologue. Les deux demandes ne suivent pas le même chemin.
 * Un établissement se nomme, décrit son volume ; un radiologue déclare son
 * numéro d'ordre, que l'équipe IMAFRIK vérifie auprès de l'Ordre avant de
 * lui ouvrir le moindre accès, et l'établissement où il exerce devient
 * facultatif. Les boutons « Rejoindre le réseau » et « Demander une
 * démonstration » de l'accueil présélectionnent la réponse
 * (`?profil=radiologue`).
 *
 * Les erreurs s'affichent sous chaque champ au premier envoi, puis se
 * mettent à jour pendant la correction ; le focus va au premier champ à
 * corriger.
 *
 * @param locale Langue de la page.
 */
export function ContactPage({ locale }: { locale: Locale }) {
  const t = marketingCopy(locale).contactPage;
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [trap, setTrap] = React.useState("");
  // Choix explicite de la personne ; à défaut, celui de l'adresse
  // (`?profil=radiologue`), posé par les boutons de l'accueil.
  const searchParams = useSearchParams();
  const [chosenKind, setRequesterKind] = React.useState<RequesterKind | null>(
    null,
  );
  const requesterKind =
    chosenKind ?? requesterFromSearch(searchParams.toString());
  const [form, setForm] = React.useState({
    name: "",
    organization: "",
    role: "",
    email: "",
    phone: "",
    licenseNumber: "",
    volume: t.volumes[1],
    message: "",
  });
  const [modalities, setModalities] = React.useState<string[]>([]);
  // Les erreurs ne s'affichent qu'après une première tentative d'envoi :
  // un champ signalé avant même d'avoir été rempli décourage.
  const [showErrors, setShowErrors] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const radiologist = requesterKind === "radiologist";
  const invalid = validateContactForm({
    requesterKind,
    name: form.name,
    organization: form.organization,
    email: form.email,
    licenseNumber: form.licenseNumber,
  });
  const fieldError = (field: ContactFieldError) =>
    showErrors && invalid.includes(field) ? t.errors[field] : undefined;

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (requesterKind === null || invalid.length > 0) {
      setShowErrors(true);
      // Le focus va au premier champ à corriger : son message est lu.
      formRef.current
        ?.querySelector<HTMLElement>(`[data-field="${invalid[0]}"]`)
        ?.focus();
      return;
    }
    setError(null);
    const context = [
      `Langue : ${locale === "en" ? "anglais" : "français"}`,
      !radiologist && form.role && `Fonction : ${form.role}`,
      !radiologist && `Volume : ${form.volume}`,
      modalities.length > 0 && `Modalités : ${modalities.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    startTransition(async () => {
      const result = await submitContact({
        requesterKind,
        fullName: form.name,
        organization: form.organization,
        licenseNumber: radiologist ? form.licenseNumber : "",
        email: form.email,
        phone: form.phone,
        message: form.message.trim()
          ? `${context}\n\n${form.message.trim()}`
          : context,
        website: trap,
        locale,
      });
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="label-eyebrow text-accent">{t.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{t.title}</h1>
        <p className="prose-justify mt-5 text-base leading-relaxed text-secondary">
          {t.lead}
        </p>

        <dl className="mt-10 flex flex-col gap-5">
          <div className="flex gap-3">
            <Mail className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <div>
              <dt className="text-sm font-medium">contact@imafrik.tech</dt>
              <dd className="mt-0.5 text-xs text-tertiary">{t.emailHint}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-accent"
              aria-hidden
            />
            <div>
              <dt className="text-sm font-medium">{t.location}</dt>
              <dd className="mt-0.5 text-xs text-tertiary">SOLVIAN AI LLC</dd>
            </div>
          </div>
        </dl>

        <p className="prose-justify mt-10 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5 text-xs leading-relaxed text-tertiary">
          {t.testDataNotice}
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
            <h2 className="mt-5 text-xl font-semibold">{t.sentTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {fill(radiologist ? t.sentTextRadiologist : t.sentText, {
                name: form.name.trim().split(/\s+/)[0],
                email: form.email.trim(),
              })}
            </p>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={submit}
            noValidate
            className="relative flex flex-col gap-4"
          >
            <fieldset
              aria-describedby={
                fieldError("requesterKind") ? "requesterKind-error" : undefined
              }
            >
              <legend className="text-xs font-medium text-secondary">
                {t.requester.legend}
              </legend>
              <div
                role="radiogroup"
                aria-required="true"
                className="mt-2 grid gap-2 sm:grid-cols-2"
              >
                {REQUESTER_KINDS.map((kind, index) => {
                  const selected = requesterKind === kind;
                  return (
                    <label
                      key={kind}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors duration-100",
                        selected
                          ? "border-accent/40 bg-accent-muted"
                          : fieldError("requesterKind")
                            ? "border-urgent/50 hover:bg-surface-hover"
                            : "border-border-default hover:border-border-strong hover:bg-surface-hover",
                      )}
                    >
                      <input
                        type="radio"
                        name="requesterKind"
                        value={kind}
                        checked={selected}
                        onChange={() => setRequesterKind(kind)}
                        // Le focus d'erreur va à la première option.
                        data-field={index === 0 ? "requesterKind" : undefined}
                        className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {t.requester[kind]}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-tertiary">
                          {kind === "clinic"
                            ? t.requester.clinicDetail
                            : t.requester.radiologistDetail}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {fieldError("requesterKind") && (
                <p
                  id="requesterKind-error"
                  className="mt-1.5 text-2xs text-urgent"
                >
                  {fieldError("requesterKind")}
                </p>
              )}
            </fieldset>

            <div className={cn("grid gap-4", !radiologist && "sm:grid-cols-2")}>
              <Field id="name" label={t.fields.name} error={fieldError("name")}>
                <Input
                  id="name"
                  data-field="name"
                  value={form.name}
                  onChange={(event) => update("name")(event.target.value)}
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(fieldError("name"))}
                  aria-describedby={
                    fieldError("name") ? "name-description" : undefined
                  }
                  className="h-10"
                />
              </Field>
              {!radiologist && (
                <Field id="role" label={t.fields.role}>
                  <Input
                    id="role"
                    value={form.role}
                    onChange={(event) => update("role")(event.target.value)}
                    placeholder={t.fields.rolePlaceholder}
                    className="h-10"
                  />
                </Field>
              )}
            </div>

            {radiologist && (
              <Field
                id="licenseNumber"
                label={t.fields.licenseNumber}
                hint={t.fields.licenseNumberHint}
                error={fieldError("licenseNumber")}
              >
                <Input
                  id="licenseNumber"
                  data-field="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(event) =>
                    update("licenseNumber")(event.target.value)
                  }
                  maxLength={LICENSE_NUMBER_MAX_LENGTH}
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(fieldError("licenseNumber"))}
                  aria-describedby="licenseNumber-description"
                  className="h-10"
                />
              </Field>
            )}

            <Field
              id="organization"
              label={
                radiologist
                  ? t.fields.organizationRadiologist
                  : t.fields.organization
              }
              hint={radiologist ? t.fields.optional : undefined}
              error={fieldError("organization")}
            >
              <Input
                id="organization"
                data-field="organization"
                value={form.organization}
                onChange={(event) => update("organization")(event.target.value)}
                autoComplete="organization"
                required={!radiologist}
                aria-invalid={Boolean(fieldError("organization"))}
                aria-describedby={
                  radiologist || fieldError("organization")
                    ? "organization-description"
                    : undefined
                }
                className="h-10"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="email"
                label={t.fields.email}
                error={fieldError("email")}
              >
                <Input
                  id="email"
                  data-field="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email")(event.target.value)}
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(fieldError("email"))}
                  aria-describedby={
                    fieldError("email") ? "email-description" : undefined
                  }
                  className="h-10"
                />
              </Field>
              <Field id="phone" label={t.fields.phone} hint={t.fields.optional}>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone")(event.target.value)}
                  autoComplete="tel"
                  aria-describedby="phone-description"
                  className="h-10"
                />
              </Field>
            </div>

            {!radiologist && (
              <Field id="volume" label={t.fields.volume}>
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
                  {t.volumes.map((volume) => (
                    <option key={volume} value={volume}>
                      {volume}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <fieldset>
              <legend className="text-xs font-medium text-secondary">
                {t.fields.modalities}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {t.modalityOptions.map((modality) => {
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

            <Field
              id="message"
              label={t.fields.message}
              hint={t.fields.optional}
            >
              <Textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(event) => update("message")(event.target.value)}
                placeholder={t.fields.messagePlaceholder}
              />
            </Field>

            {/* Champ piège : invisible et ignoré par un humain, rempli par les
                robots. Le service ignore alors la demande sans le leur dire. */}
            <div
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
            >
              <label htmlFor="website">Site web</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={(event) => setTrap(event.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={pending}
              className="mt-2 h-10"
            >
              {t.submit}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
