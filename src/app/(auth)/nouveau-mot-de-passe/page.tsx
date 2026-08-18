"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Mêmes exigences qu'à la création d'un accès — voir `/invitation`. */
const PASSWORD_RULES = [
  { label: "Douze caractères au minimum", test: (v: string) => v.length >= 12 },
  { label: "Une lettre majuscule", test: (v: string) => /[A-ZÀ-Ý]/.test(v) },
  {
    label: "Un chiffre ou un symbole",
    test: (v: string) => /[^\p{L}]/u.test(v),
  },
] as const;

/**
 * Choix d'un nouveau mot de passe, après réception du lien.
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
  const [pending, setPending] = React.useState(false);

  const rulesOk = PASSWORD_RULES.every((rule) => rule.test(password));
  const match = confirm.length > 0 && confirm === password;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rulesOk || !match) return;
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push("/connexion");
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

        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={!rulesOk || !match}
          className="mt-2 h-10 w-full"
        >
          Enregistrer et se connecter
        </Button>
      </form>
    </div>
  );
}
