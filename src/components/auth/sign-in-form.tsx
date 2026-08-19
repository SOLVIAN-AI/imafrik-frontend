"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { signIn, type AuthState } from "@/app/(auth)/actions";
import { Mark } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Formulaire de connexion.
 *
 * **Aucune inscription depuis cet écran, et c'est un choix.** Une
 * clinique arrive avec un contrat de service, un radiologue avec un
 * dossier de qualifications vérifié : les deux entrent par invitation.
 * Un formulaire d'inscription libre créerait des comptes non validés en
 * face de données de santé.
 *
 * Le formulaire tient en deux champs. Chaque champ supplémentaire sur un
 * écran de connexion est une occasion d'échouer, et celui-ci est franchi
 * plusieurs fois par jour par les mêmes personnes.
 *
 * **L'authentification s'exécute côté serveur.** Le formulaire appelle
 * une action serveur, qui pose la session dans un cookie `httpOnly` : le
 * jeton n'est jamais lisible par du script, sans quoi une seule faille
 * d'injection exposerait l'accès aux images. Le formulaire fonctionne
 * d'ailleurs sans JavaScript, ce qui n'est pas une coquetterie sur des
 * postes de clinique parfois anciens.
 */
export function SignInForm({
  suite = "",
  motif,
}: {
  suite?: string;
  motif?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const [state, formAction, pending] = React.useActionState<
    AuthState,
    FormData
  >(signIn, {});

  const error =
    state.error ??
    (motif === "lien-expire"
      ? "Ce lien a expiré. Demandez-en un nouveau."
      : motif === "lien-invalide"
        ? "Ce lien n’est pas valide. Demandez-en un nouveau."
        : null);

  return (
    <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
      {/* La marque n'apparaît ici que sur les écrans étroits, où le
          panneau de gauche est masqué : sans elle, on ne saurait pas sur
          quel service on se connecte. */}
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <Mark className="size-7" />
        <span className="text-base font-semibold tracking-[-0.01em]">
          IMAFRIK
        </span>
      </div>

      <h2 className="text-2xl font-semibold">Connexion</h2>
      <p className="mt-1.5 text-sm text-tertiary">
        Accédez à vos examens et à vos comptes-rendus.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        {/* La destination demandée avant la redirection vers la connexion,
            reportée telle quelle : l’action serveur en vérifie le
            caractère interne avant de l’utiliser. */}
        <input type="hidden" name="suite" value={suite} />
        <Field id="email" label="Adresse électronique">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            // Le focus arrive sur le premier champ : sur un écran qu'on
            // franchit plusieurs fois par jour, c'est une frappe gagnée
            // à chaque fois.
            autoFocus
            placeholder="prenom.nom@etablissement.tg"
            aria-invalid={error !== null}
            className="h-10"
          />
        </Field>

        <Field id="password" label="Mot de passe">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={error !== null}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              aria-label={
                visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
              }
              className={cn(
                "absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md",
                "text-tertiary transition-colors hover:bg-surface-hover hover:text-primary",
              )}
            >
              {visible ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs text-urgent"
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <label
            htmlFor="remember"
            className="flex cursor-pointer items-center gap-2 text-xs text-secondary"
          >
            <input
              id="remember"
              name="remember"
              type="checkbox"
              defaultChecked
              className="size-3.5 rounded-xs border-border-default accent-[var(--accent)]"
            />
            Rester connecté
          </label>
          <Link
            href="/mot-de-passe-oublie"
            className="text-xs text-tertiary transition-colors hover:text-accent"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={pending}
          className="mt-2 h-10 w-full"
        >
          Se connecter
          <ArrowRight />
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5">
        <p className="text-xs font-medium">Pas encore de compte ?</p>
        <p className="mt-1 text-xs leading-relaxed text-tertiary">
          L’accès se fait sur invitation.{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Demander un accès
          </Link>
        </p>
      </div>
    </div>
  );
}
