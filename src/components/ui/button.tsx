"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Variantes visuelles du bouton.
 *
 * Le choix d'une variante est un choix de **hiérarchie**, pas de goût :
 * un écran ne comporte qu'une seule action principale. En afficher deux
 * revient à n'en désigner aucune, et l'utilisateur hésite.
 *
 * - `primary`   L'action attendue. Une par écran.
 * - `secondary` Une action courante, sans être celle qu'on attend.
 * - `ghost`     Action de service : icônes de barre d'outils, menus.
 * - `danger`    Destructif et irréversible. Le rouge y est mérité — il
 *               reste par ailleurs réservé à l'urgence médicale.
 *
 * Les hauteurs sont volontairement basses. Une worklist affiche quarante
 * lignes : chaque pixel de hauteur y coûte une ligne visible.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-1.5",
    "whitespace-nowrap rounded-md font-medium",
    "transition-[background-color,border-color,color,opacity] duration-100",
    "ease-(--ease-out-quart)",
    "disabled:pointer-events-none disabled:opacity-45",
    // Les icônes ne doivent jamais capter le clic à la place du bouton.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-accent text-accent-contrast",
          "hover:bg-accent-hover",
          "active:brightness-95",
        ],
        secondary: [
          "border border-border-default bg-surface-raised text-primary",
          "hover:border-border-strong hover:bg-surface-hover",
        ],
        ghost: ["text-secondary", "hover:bg-surface-hover hover:text-primary"],
        danger: [
          "border border-transparent bg-urgent-muted text-urgent",
          "hover:bg-urgent hover:text-inverted",
        ],
      },
      size: {
        sm: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
        md: "h-8 px-3 text-sm [&_svg]:size-4",
        lg: "h-9 px-4 text-sm [&_svg]:size-4",
        // Carré, pour une icône seule. Toujours accompagné d'un
        // `aria-label` : une icône n'est pas un nom accessible.
        icon: "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Rend l'élément enfant au lieu d'un `<button>`, en lui transmettant
   * styles et comportement. Sert à styler un `<Link>` sans imbriquer un
   * bouton dans une ancre — ce qui serait invalide et casserait la
   * navigation clavier.
   */
  asChild?: boolean;
  /**
   * Affiche un indicateur d'activité et désactive le bouton.
   *
   * Le libellé reste en place, masqué mais occupant sa largeur : sans
   * cela le bouton rétrécirait pendant la requête, et l'interface
   * sauterait sous le curseur.
   */
  loading?: boolean;
}

/**
 * Bouton de l'interface.
 *
 * @example Action principale d'un écran
 * ```tsx
 * <Button variant="primary" loading={isPending}>Valider &amp; Signer</Button>
 * ```
 *
 * @example Lien stylé en bouton
 * ```tsx
 * <Button asChild variant="secondary">
 *   <Link href="/worklist">Retour à la worklist</Link>
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        // Annonce l'attente aux lecteurs d'écran, que le visuel seul ne
        // transmettrait pas.
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="absolute animate-spin" aria-hidden />
            <span className="invisible contents">{children}</span>
          </>
        ) : (
          children
        )}
      </Component>
    );
  },
);

export { buttonVariants };
