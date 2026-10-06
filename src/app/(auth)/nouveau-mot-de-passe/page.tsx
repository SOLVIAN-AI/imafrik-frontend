"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { changePassword } from "@/lib/actions/profile";
import { PASSWORD_RULES } from "@/lib/security/password";
import { cn } from "@/lib/utils";

/**
 * Choix d'un mot de passe, après réception d'un lien par courriel.
 *
 * Deux chemins y mènent : la réinitialisation d'un mot de passe oublié,
 * et la première connexion d'une personne invitée. Dans les deux cas, le
 * lien a ouvert la session (voir `/auth/callback`) ; cet écran n'a plus
 * qu'à enregistrer le mot de passe — personne d'autre ne le connaît.
 *
 * La confirmation par un second champ est conservée alors qu'un
 * affichage en clair suffirait souvent : ici, se tromper signifie perdre
 * l'accès à un compte qu'on ne peut pas récupérer soi-même en pleine
 * garde.
 */
export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

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
      // La session est ouverte : le proxy conduit à l'accueil du portail.
      router.replace("/connexion");
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
      <h2 className="text-2xl font-semibold">Nouveau mot de passe</h2>
      <p className="mt-1.5 text-sm text-tertiary">
        Vos sessions ouvertes sur d’autres appareils seront fermées.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Field id="password" label="Nouveau mot de passe">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
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
                key={rule.label}
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
                {rule.label}
              </li>
            );
          })}
        </ul>

        <Field
          id="confirm"
          label="Confirmation"
          error={
            confirm.length > 0 && !match
              ? "Les deux saisies diffèrent."
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
          Enregistrer le mot de passe
        </Button>
      </form>
    </div>
  );
}
