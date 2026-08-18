"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Boîte de dialogue modale.
 *
 * Réservée aux décisions qui méritent d'interrompre : une action
 * irréversible, une saisie qui ne peut pas attendre. Tout le reste —
 * détails, réglages, aperçus — se loge dans la page ou dans un panneau
 * latéral, qui laissent le contexte visible.
 *
 * Construite sur Radix : le piège à focus, le retour du focus à
 * l'élément déclencheur, la fermeture par Échap et le verrouillage du
 * défilement d'arrière-plan sont des comportements qu'on ne réécrit pas
 * correctement à la main.
 *
 * @example
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Signer le compte-rendu</DialogTitle>
 *       <DialogDescription>Cette action est définitive.</DialogDescription>
 *     </DialogHeader>
 *     …
 *     <DialogFooter>…</DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * Contenu de la modale, voile compris.
 *
 * Le voile est sombre et flouté plutôt que simplement opaque : en thème
 * sombre, un noir semi-transparent sur un fond déjà noir ne se voit pas,
 * et rien ne signalerait alors que l'arrière-plan est devenu inactif.
 */
export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-[2px]",
          "animate-[fade-in_120ms_var(--ease-out-quart)]",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "animate-[dialog-in_140ms_var(--ease-out-quart)]",
          "rounded-xl border border-border-default bg-surface-overlay shadow-overlay",
          "focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Fermer"
          className={cn(
            "absolute top-3.5 right-3.5 flex size-6 items-center justify-center rounded-md",
            "text-tertiary transition-colors hover:bg-surface-hover hover:text-primary",
          )}
        >
          <X className="size-3.5" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** En-tête : titre et, si nécessaire, la conséquence de l'action. */
export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-5 pt-5 pb-4", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "pr-8 text-base font-semibold tracking-[-0.01em]",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-xs leading-relaxed text-secondary", className)}
      {...props}
    />
  );
}

/**
 * Pied de modale.
 *
 * Les actions sont alignées à droite, l'action principale en dernier :
 * c'est là que le regard finit sa lecture, et l'ordre inverse pousse à
 * confirmer sans avoir lu.
 */
export function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2",
        "border-t border-border-subtle px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}
