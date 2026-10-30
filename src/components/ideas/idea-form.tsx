"use client";

import { Send, ShieldAlert } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { IdeaContext } from "@/components/ideas/idea-parts";
import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/info-tip";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMessages } from "@/i18n/client";
import { submitIdea } from "@/lib/actions/ideas";
import {
  IDEA_BENEFITS,
  IDEA_BODY_MAX,
  IDEA_BODY_MIN,
  IDEA_CATEGORIES,
  IDEA_TITLE_MAX,
  IDEA_TITLE_MIN,
  type IdeaBenefit,
  type IdeaCategory,
  type IdeaDevice,
  type IdeaField,
  deviceOf,
  validateIdea,
} from "@/lib/ideas";
import { cn } from "@/lib/utils";

/** Une option d’un groupe de choix, en puce. */
const CHOICE_CLASS =
  "flex min-h-9 cursor-pointer items-center rounded-full border border-border-default px-3 text-xs text-secondary transition-colors hover:border-border-strong hover:text-primary has-[:checked]:border-accent has-[:checked]:bg-accent-muted has-[:checked]:text-accent has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-accent/25";

/**
 * Formulaire « Proposer une idée ».
 *
 * Court à dessein : un titre, une description, une catégorie, et ce que
 * l’idée ferait gagner, facultatif. L’avertissement sur l’identité des
 * patients reste sous les yeux, au-dessus du bouton d’envoi. Aucune
 * capture d’écran : elle pourrait montrer un patient.
 *
 * Le contexte joint (l’écran d’où l’on vient, la version, l’appareil) se
 * lit en clair avant l’envoi, et se retire d’une case. La version est
 * celle du déploiement, relue par l’action serveur ; l’appareil se
 * déduit de la fenêtre, une fois la page dans le navigateur.
 *
 * @param screen  Écran d’où l’on vient (`?ecran=`), s’il est reconnu.
 * @param version Version de l’application, pour l’affichage.
 */
export function IdeaForm({
  screen,
  version,
}: {
  screen: { key: string; name: string } | null;
  version: string;
}) {
  const t = useMessages();
  const text = t.ideas.form;
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [category, setCategory] = React.useState<IdeaCategory | null>(null);
  const [benefit, setBenefit] = React.useState<IdeaBenefit | null>(null);
  const [attach, setAttach] = React.useState(true);
  const [errors, setErrors] = React.useState<
    Partial<Record<IdeaField, string>>
  >({});
  const [pending, startTransition] = React.useTransition();
  const titleRef = React.useRef<HTMLInputElement>(null);

  // L’appareil n’est connu que dans le navigateur, une fois la page
  // hydratée : rien avant, pour un rendu serveur identique.
  const hydrated = useHydrated();
  const device: IdeaDevice | null = hydrated
    ? deviceOf(
        window.innerWidth,
        window.matchMedia("(pointer: coarse)").matches,
      )
    : null;

  const messageOf = (
    field: IdeaField,
    problem: "short" | "long" | "missing",
  ) =>
    field === "category"
      ? text.errors.category
      : field === "title"
        ? problem === "short"
          ? text.errors.titleShort(IDEA_TITLE_MIN)
          : text.errors.titleLong(IDEA_TITLE_MAX)
        : problem === "short"
          ? text.errors.bodyShort(IDEA_BODY_MIN)
          : text.errors.bodyLong(IDEA_BODY_MAX);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateIdea({ title, body, category });
    setErrors(
      Object.fromEntries(
        found.map((error) => [
          error.field,
          messageOf(error.field, error.problem),
        ]),
      ),
    );
    if (found.length > 0) {
      document.getElementById(`idee-${found[0].field}`)?.focus();
      return;
    }
    startTransition(async () => {
      const result = await submitIdea({
        title,
        body,
        category,
        benefit,
        screen: screen?.key ?? null,
        device,
        attachContext: attach,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(text.sent);
      setTitle("");
      setBody("");
      setCategory(null);
      setBenefit(null);
      setErrors({});
      titleRef.current?.focus();
    });
  };

  return (
    <Panel className="flex flex-col overflow-hidden" tour="idea-form">
      <h2
        id="idee-formulaire"
        className="flex h-11 shrink-0 items-center border-b border-border-subtle px-4 text-sm font-semibold"
      >
        {text.title}
      </h2>
      <form
        onSubmit={submit}
        noValidate
        aria-labelledby="idee-formulaire"
        className="flex flex-col gap-4 p-4"
      >
        <p className="text-xs text-secondary">{text.intro}</p>

        <Field
          id="idee-title"
          label={text.titleLabel}
          error={errors.title}
          hint={text.counter(title.length, IDEA_TITLE_MAX)}
        >
          <Input
            ref={titleRef}
            id="idee-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={IDEA_TITLE_MAX}
            placeholder={text.titlePlaceholder}
            autoComplete="off"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby="idee-title-description"
            required
          />
        </Field>

        <Field
          id="idee-body"
          label={text.bodyLabel}
          error={errors.body}
          hint={text.counter(body.length, IDEA_BODY_MAX)}
        >
          <Textarea
            id="idee-body"
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            maxLength={IDEA_BODY_MAX}
            placeholder={text.bodyPlaceholder}
            aria-invalid={errors.body ? true : undefined}
            aria-describedby="idee-body-description"
            required
          />
        </Field>

        <fieldset
          className="flex flex-col gap-1.5"
          aria-describedby={errors.category ? "idee-category-error" : undefined}
        >
          <legend className="mb-1.5 text-xs font-medium text-secondary">
            {text.categoryLabel}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {IDEA_CATEGORIES.map((value, index) => (
              <label key={value} className={CHOICE_CLASS}>
                <input
                  type="radio"
                  name="category"
                  value={value}
                  // Le premier choix porte l’identifiant : l’erreur y ramène.
                  id={index === 0 ? "idee-category" : undefined}
                  checked={category === value}
                  onChange={() => setCategory(value)}
                  className="sr-only"
                />
                {t.ideas.categories[value]}
              </label>
            ))}
          </div>
          {errors.category && (
            <p id="idee-category-error" className="text-2xs text-urgent">
              {errors.category}
            </p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 inline-flex items-center text-xs font-medium text-secondary">
            {text.benefitLabel}
            <InfoTip label={text.benefitLabel} text={text.benefitInfo} />
          </legend>
          <div className="flex flex-wrap gap-1.5">
            <label className={CHOICE_CLASS}>
              <input
                type="radio"
                name="benefit"
                value=""
                checked={benefit === null}
                onChange={() => setBenefit(null)}
                className="sr-only"
              />
              {text.benefitNone}
            </label>
            {IDEA_BENEFITS.map((value) => (
              <label key={value} className={CHOICE_CLASS}>
                <input
                  type="radio"
                  name="benefit"
                  value={value}
                  checked={benefit === value}
                  onChange={() => setBenefit(value)}
                  className="sr-only"
                />
                {t.ideas.benefits[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-base/60 px-3 py-2.5">
          <legend className="sr-only">{text.contextLabel}</legend>
          <p className="inline-flex items-center text-xs font-medium text-secondary">
            {text.contextLabel}
            <InfoTip label={text.contextLabel} text={text.contextInfo} />
          </p>
          <p
            className={cn(
              "text-xs text-secondary",
              !attach && "text-tertiary line-through",
            )}
          >
            <IdeaContext
              screenName={screen?.name ?? null}
              version={version}
              device={device}
              t={t}
            />
            {!screen && (
              <span className="ml-1.5 text-tertiary">
                ({text.contextNoScreen})
              </span>
            )}
          </p>
          <label className="flex min-h-6 cursor-pointer items-center gap-2 text-xs text-secondary">
            <input
              type="checkbox"
              checked={attach}
              onChange={(event) => setAttach(event.target.checked)}
              className="size-4 shrink-0 accent-accent"
            />
            {text.attachContext}
          </label>
        </fieldset>

        <div
          role="note"
          className="flex gap-2.5 rounded-lg border border-accent/30 bg-accent-muted px-3 py-2.5"
        >
          <ShieldAlert
            className="mt-0.5 size-4 shrink-0 text-accent"
            aria-hidden
          />
          <p className="text-xs text-primary">
            <span className="font-semibold">{text.patientTitle}.</span>{" "}
            {text.patientWarning}
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            <Send />
            {text.submit}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
