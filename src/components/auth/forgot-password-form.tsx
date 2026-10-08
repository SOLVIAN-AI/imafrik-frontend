"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { LanguageSwitch } from "@/components/marketing/language-switch";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { authCopy } from "@/content/auth";
import { fill } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Demande de réinitialisation du mot de passe.
 *
 * **La réponse est la même que l'adresse existe ou non.** Un message du
 * type « aucun compte à cette adresse » permettrait à quiconque de
 * vérifier qui travaille dans quel établissement — une fuite discrète
 * mais réelle sur un service de santé. On confirme donc l'envoi dans
 * tous les cas.
 *
 * @param locale Langue de l'écran, choisie sur le site public.
 */
export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = authCopy(locale).forgot;
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    // La confirmation s'affiche quelle que soit l'issue : voir la
    // remarque sur la divulgation d'existence de compte.
    await requestPasswordReset(email);
    setPending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
        <span
          className="flex size-11 items-center justify-center rounded-xl bg-accent-muted ring-1 ring-accent/25 ring-inset"
          aria-hidden
        >
          <MailCheck className="size-5 text-accent" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold">{t.sentTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          {fill(t.sentText, { email: email.trim() })}
        </p>
        <p className="mt-4 text-xs text-tertiary">{t.sentHint}</p>
        <Button variant="secondary" size="sm" className="mt-6" asChild>
          <Link href="/connexion" prefetch={false}>
            <ArrowLeft />
            {t.back}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
      <div className="mb-8 flex justify-end">
        <LanguageSwitch locale={locale} />
      </div>
      <h2 className="text-2xl font-semibold">{t.title}</h2>
      <p className="mt-1.5 text-sm text-tertiary">{t.subtitle}</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Field id="email" label={t.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={authCopy(locale).signIn.emailPlaceholder}
            className="h-10"
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={!email.includes("@")}
          className="mt-2 h-10 w-full"
        >
          {t.submit}
        </Button>
      </form>

      <Link
        href="/connexion"
        prefetch={false}
        className="mt-5 inline-flex items-center gap-1.5 py-1 text-xs text-tertiary transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {t.back}
      </Link>
    </div>
  );
}
