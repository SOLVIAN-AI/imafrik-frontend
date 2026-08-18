import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Champ de saisie.
 *
 * Hauteur alignée sur celle des boutons `md` : un champ et son bouton
 * placés côte à côte doivent se terminer à la même ligne, faute de quoi
 * la barre paraît bancale.
 *
 * L'état d'erreur est porté par `aria-invalid` plutôt que par une classe :
 * l'attribut renseigne les technologies d'assistance **et** pilote le
 * style, ce qui rend impossible un champ rouge qu'un lecteur d'écran
 * annoncerait comme valide.
 */
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-8 w-full rounded-md px-2.5 text-sm",
        "border border-border-default bg-surface-base",
        "placeholder:text-tertiary",
        "transition-colors duration-100",
        "hover:border-border-strong",
        "focus:border-accent focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-urgent",
        className,
      )}
      {...props}
    />
  );
}

/** Zone de texte, mêmes règles que `Input`. */
export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md px-2.5 py-2 text-sm leading-relaxed",
        "border border-border-default bg-surface-base",
        "placeholder:text-tertiary",
        "transition-colors duration-100",
        "hover:border-border-strong",
        "focus:border-accent focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-urgent",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Un champ de formulaire : intitulé, saisie, aide ou erreur.
 *
 * L'intitulé est **toujours** au-dessus et toujours visible. Les
 * intitulés flottants, qui disparaissent dès qu'on tape, obligent à se
 * souvenir de ce qu'on remplit — perte sèche dès qu'un formulaire compte
 * plus de trois champs, et obstacle réel pour qui est interrompu en
 * cours de saisie.
 *
 * @param label Intitulé, lié au champ par `htmlFor`.
 * @param hint  Aide affichée sous le champ, remplacée par l'erreur.
 * @param error Message d'erreur. Sa présence marque le champ invalide.
 *
 * @example
 * ```tsx
 * <Field id="aet" label="AET de l'établissement" hint="16 caractères maximum">
 *   <Input id="aet" defaultValue="STJOSEPH_LOME" />
 * </Field>
 * ```
 */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-medium text-secondary">
        {label}
      </label>
      {children}
      {(error ?? hint) && (
        <p
          id={`${id}-description`}
          className={cn("text-2xs", error ? "text-urgent" : "text-tertiary")}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
