"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { changePassword } from "@/lib/actions/profile";
import { PASSWORD_RULES } from "@/lib/security/password";
import { cn } from "@/lib/utils";

/**
 * Choix d'un mot de passe : saisie, règles cochées en direct, confirmation.
 *
 * Partagé par la réinitialisation (`/nouveau-mot-de-passe`) et l'accueil
 * d'une personne invitée (`/invitation`). Dans les deux cas, le lien reçu
 * par courriel a ouvert la session ; ce formulaire n'a plus qu'à
 * enregistrer le mot de passe, puis à conduire à l'étape suivante.
 *
 * La confirmation par un second champ est conservée alors qu'un
 * affichage en clair suffirait souvent : ici, se tromper signifie perdre
 * l'accès à un compte qu'on ne peut pas récupérer soi-même en pleine
 * garde.
 *
 * Les règles affichées sont celles que l'action serveur revérifie
 * (`lib/security/password.ts`) : un formulaire se contourne.
 *
 * @param next        Destination une fois le mot de passe enregistré.
 * @param submitLabel Libellé du bouton ; celui de la réinitialisation à défaut.
 * @param autoFocus   Place le focus sur le premier champ. Faux quand un
 *                    texte le précède et doit être lu d'abord.
 */
export function NewPasswordForm({
  next,
  submitLabel,
  autoFocus = true,
}: {
  next: string;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const t = useMessages();
  const rulesOk = PASSWORD_RULES.every((rule) => rule.test(password));
  const match = confirm.length > 0 && confirm === password;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!rulesOk || !match) return;
    setError(null);
    startTransition(async () => {
      const result = await changePassword(password, confirm);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(next);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field id="password" label={t.session.newPassword.password}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus={autoFocus}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10"
        />
      </Field>

      <ul className="flex flex-col gap-1.5">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-2 text-2xs transition-colors",
                ok ? "text-done" : "text-tertiary",
              )}
            >
              {ok ? (
                <Check className="size-3 shrink-0" aria-hidden />
              ) : (
                <X className="size-3 shrink-0 opacity-50" aria-hidden />
              )}
              {t.settings.password.rules[rule.id]}
            </li>
          );
        })}
      </ul>

      <Field
        id="confirm"
        label={t.session.newPassword.confirmation}
        error={
          confirm.length > 0 && !match
            ? t.session.newPassword.mismatch
            : undefined
        }
      >
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          aria-invalid={confirm.length > 0 && !match}
          className="h-10"
        />
      </Field>

      {error && (
        <p role="alert" className="text-xs text-urgent">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        loading={pending}
        disabled={!rulesOk || !match}
        className="mt-2 h-10 w-full"
      >
        {submitLabel ?? t.session.newPassword.submit}
      </Button>
    </form>
  );
}
