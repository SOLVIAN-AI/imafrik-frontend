"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { signIn, type AuthState } from "@/app/(auth)/actions";
import { Wordmark } from "@/components/brand/brand";
import { LanguageSwitch } from "@/components/marketing/language-switch";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { authCopy } from "@/content/auth";
import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";
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
 *
 * L'écran suit la langue choisie sur le site public, et propose lui-même
 * le changement : c'est le pont entre le site et l'application.
 *
 * @param locale Langue de l'écran.
 * @param suite  Destination demandée avant la redirection.
 * @param motif  Raison d'arrivée : lien expiré ou invalide, inactivité.
 */
export function SignInForm({
  locale,
  suite = "",
  motif,
}: {
  locale: Locale;
  suite?: string;
  motif?: string;
}) {
  const t = authCopy(locale).signIn;
  const [visible, setVisible] = React.useState(false);
  const [state, formAction, pending] = React.useActionState<
    AuthState,
    FormData
  >(signIn, {});

  const error =
    state.error ??
    (motif === "lien-expire"
      ? t.errors.linkExpired
      : motif === "lien-invalide"
        ? t.errors.linkInvalid
        : null);
  // Pas une erreur : une information, présentée comme telle.
  const notice =
    motif === "inactivite" && !state.error ? t.inactivityNotice : null;

  return (
    <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
      {/* La marque n'apparaît ici que sur les écrans étroits, où le
          panneau de gauche est masqué : sans elle, on ne saurait pas sur
          quel service on se connecte. */}
      <div className="mb-8 flex items-center justify-between gap-2.5">
        <Wordmark className="h-5 lg:invisible" />
        <LanguageSwitch locale={locale} />
      </div>

      <h2 className="text-2xl font-semibold">{t.title}</h2>
      <p className="mt-1.5 text-sm text-tertiary">{t.subtitle}</p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        {/* La destination demandée avant la redirection vers la connexion,
            reportée telle quelle : l’action serveur en vérifie le
            caractère interne avant de l’utiliser. */}
        <input type="hidden" name="suite" value={suite} />
        <input type="hidden" name="locale" value={locale} />
        <Field id="email" label={t.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            // Le focus arrive sur le premier champ : sur un écran qu'on
            // franchit plusieurs fois par jour, c'est une frappe gagnée
            // à chaque fois.
            autoFocus
            placeholder={t.emailPlaceholder}
            aria-invalid={error !== null}
            className="h-10"
          />
        </Field>

        <Field id="password" label={t.password}>
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
              aria-label={visible ? t.hidePassword : t.showPassword}
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

        {notice && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-lg bg-accent-muted px-3 py-2.5 text-xs"
          >
            <Lock className="mt-px size-3.5 shrink-0 text-accent" aria-hidden />
            {notice}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs text-urgent"
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        {/* Pas de case « Rester connecté » : la durée de la session est
            fixée par Supabase, que la bibliothèque de cookies ne laisse pas
            raccourcir, et une case sans effet serait un mensonge. La
            protection d'un poste partagé est le verrouillage après
            inactivité. */}
        <div className="flex items-center justify-end">
          <Link
            href="/mot-de-passe-oublie"
            prefetch={false}
            className="-my-1 inline-block py-1 text-xs text-tertiary transition-colors hover:text-accent"
          >
            {t.forgot}
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={pending}
          className="mt-2 h-10 w-full"
        >
          {t.submit}
          <ArrowRight />
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5">
        <p className="text-xs font-medium">{t.noAccountTitle}</p>
        <p className="mt-1 text-xs leading-relaxed text-tertiary">
          {t.noAccountText}{" "}
          {/* Lien au fil du texte : souligné en permanence, la couleur
              seule ne le distinguerait pas du texte voisin (WCAG 1.4.1). */}
          <Link
            href={localizePath("/contact", locale)}
            className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
          >
            {t.requestAccess}
          </Link>
        </p>
      </div>
    </div>
  );
}
