"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

/**
 * Demande de réinitialisation du mot de passe.
 *
 * **La réponse est la même que l'adresse existe ou non.** Un message du
 * type « aucun compte à cette adresse » permettrait à quiconque de
 * vérifier qui travaille dans quel établissement — une fuite discrète
 * mais réelle sur un service de santé. On confirme donc l'envoi dans
 * tous les cas.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
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
        <h2 className="mt-5 text-2xl font-semibold">Vérifiez vos courriels</h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          Si un compte existe pour{" "}
          <span className="text-primary">{email}</span>, un lien de
          réinitialisation vient d’y être envoyé. Il expire dans une heure.
        </p>
        <p className="mt-4 text-xs text-tertiary">
          Rien reçu au bout de quelques minutes ? Vérifiez les indésirables,
          puis réessayez.
        </p>
        <Button variant="secondary" size="sm" className="mt-6" asChild>
          <Link href="/connexion">
            <ArrowLeft />
            Retour à la connexion
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
      <h2 className="text-2xl font-semibold">Mot de passe oublié</h2>
      <p className="mt-1.5 text-sm text-tertiary">
        Indiquez l’adresse de votre compte : vous recevrez un lien pour en
        choisir un nouveau.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Field id="email" label="Adresse électronique">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="prenom.nom@etablissement.tg"
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
          Envoyer le lien
        </Button>
      </form>

      <Link
        href="/connexion"
        className="mt-6 inline-flex items-center gap-1.5 text-xs text-tertiary transition-colors hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Retour à la connexion
      </Link>
    </div>
  );
}
