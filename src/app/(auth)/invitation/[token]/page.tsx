"use client";

import { AlertCircle, Building2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useSession } from "@/lib/demo/session";
import { homeFor } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Exigences du mot de passe, vérifiées à la frappe.
 *
 * Elles sont **affichées avant la saisie**, pas révélées après un refus.
 * Une règle qu'on découvre en échouant est une règle mal posée ; ici on
 * voit ce qui reste à satisfaire pendant qu'on tape.
 *
 * La longueur prime sur la complexité : douze caractères valent mieux
 * qu'un « P@ss1 » que son propriétaire notera sur un papier collé à
 * l'écran de la salle de garde.
 */
const PASSWORD_RULES = [
  { label: "Douze caractères au minimum", test: (v: string) => v.length >= 12 },
  { label: "Une lettre majuscule", test: (v: string) => /[A-ZÀ-Ý]/.test(v) },
  { label: "Un chiffre ou un symbole", test: (v: string) => /[^\p{L}]/u.test(v) },
] as const;

/**
 * Invitation à rejoindre une organisation.
 *
 * **Le lien ne crée pas le compte : le destinataire le termine.** Créer
 * le compte à sa place obligerait à lui transmettre un mot de passe par
 * un canal qui n'est jamais sûr. Dans un service qui trace chaque accès
 * aux images, un compte doit appartenir à une personne — pas à un poste,
 * pas à un service.
 *
 * Le jeton est vérifié côté serveur avant l'affichage : il est à usage
 * unique et expire au bout de sept jours. Ce qu'il porte — nom de
 * l'organisation, rôle proposé — est affiché en tête, pour que personne
 * n'accepte une invitation dont il ne comprend pas la portée.
 */
export default function InvitationPage({
  params,
}: PageProps<"/invitation/[token]">) {
  const { token } = React.use(params);
  const router = useRouter();
  const { active } = useSession();

  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);

  // Le jeton porte ces informations, résolues côté serveur. Ici, jeu de
  // démonstration.
  const invitation = {
    organizationName: "Clinique Saint-Joseph",
    city: "Lomé",
    role: "Manipulateur",
    invitedBy: "Akossiwa Amegan",
    email: "k.dogbe@stjoseph.tg",
  };

  const satisfied = PASSWORD_RULES.filter((rule) => rule.test(password));
  const valid = name.trim().length >= 3 && satisfied.length === PASSWORD_RULES.length;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push(homeFor(active.role));
  };

  return (
    <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
      <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted ring-1 ring-accent/25 ring-inset"
          aria-hidden
        >
          <Building2 className="size-4 text-accent" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {invitation.organizationName}
          </p>
          <p className="truncate text-2xs text-tertiary">
            {invitation.role} · invitation de {invitation.invitedBy}
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-2xl font-semibold">Créez votre accès</h2>
      <p className="mt-1.5 text-sm text-tertiary">
        Ce lien vous est personnel et n’est utilisable qu’une fois.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Field
          id="email"
          label="Adresse électronique"
          hint="Définie par l’invitation, elle ne peut pas être modifiée ici."
        >
          <Input
            id="email"
            type="email"
            value={invitation.email}
            readOnly
            disabled
            className="h-10"
          />
        </Field>

        <Field id="name" label="Nom complet">
          <Input
            id="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Komi Dogbe"
            className="h-10"
          />
        </Field>

        <Field id="password" label="Mot de passe">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
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
                <span className="sr-only">{ok ? " : satisfait" : " : non satisfait"}</span>
              </li>
            );
          })}
        </ul>

        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={!valid}
          className="mt-2 h-10 w-full"
        >
          Rejoindre {invitation.organizationName}
        </Button>
      </form>

      <p className="mt-6 flex items-start gap-2 text-2xs leading-relaxed text-tertiary">
        <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
        En créant votre accès, vous acceptez que vos consultations d’examens
        soient enregistrées dans le journal d’audit de l’établissement.
        <span className="sr-only">Jeton d’invitation {token}.</span>
      </p>
    </div>
  );
}
