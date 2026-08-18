"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Mark } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useSession } from "@/lib/demo/session";
import { homeFor } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Connexion.
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
 * L'authentification réelle passera par Supabase, en rendu serveur, avec
 * des cookies `httpOnly` : le jeton ne doit jamais être lisible par du
 * script, sans quoi une seule faille d'injection exposerait l'accès aux
 * images.
 */
export default function SignInPage() {
  const router = useRouter();
  const { active } = useSession();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.includes("@") || password.length === 0) {
      // Un message qui dit quoi corriger, jamais « identifiants
      // invalides » quand le problème est un champ vide.
      setError("Renseignez votre adresse et votre mot de passe.");
      return;
    }

    setPending(true);
    // Latence simulée : l'écran doit montrer qu'il travaille, sinon le
    // bouton paraît sans effet et l'utilisateur clique deux fois.
    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push(homeFor(active.role));
  };

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

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Field id="email" label="Adresse électronique">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            // Le focus arrive sur le premier champ : sur un écran qu'on
            // franchit plusieurs fois par jour, c'est une frappe gagnée
            // à chaque fois.
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="prenom.nom@etablissement.tg"
            aria-invalid={error !== null}
            className="h-10"
          />
        </Field>

        <Field id="password" label="Mot de passe">
          <div className="relative">
            <Input
              id="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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

        <Button type="submit" size="lg" loading={pending} className="mt-2 h-10 w-full">
          Se connecter
          <ArrowRight />
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5">
        <p className="text-xs font-medium">Pas encore de compte ?</p>
        <p className="mt-1 text-xs leading-relaxed text-tertiary">
          L’accès à IMAFRIK se fait sur invitation : votre établissement, ou
          l’équipe IMAFRIK pour un radiologue, vous envoie un lien.{" "}
          <Link href="/contact" className="text-accent hover:underline">
            Demander un accès
          </Link>
        </p>
      </div>
    </div>
  );
}
