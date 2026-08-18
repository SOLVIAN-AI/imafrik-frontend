"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Menu déroulant.
 *
 * Construit sur Radix : la navigation au clavier, le retour du focus au
 * déclencheur, la fermeture par Échap et le positionnement qui évite les
 * bords de fenêtre sont des comportements qu'on ne réécrit pas
 * correctement à la main.
 *
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild><button>…</button></DropdownMenuTrigger>
 *   <DropdownMenuContent align="start">
 *     <DropdownMenuLabel>Organisations</DropdownMenuLabel>
 *     <DropdownMenuItem onSelect={…}>Clinique Saint-Joseph</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-56 overflow-hidden rounded-lg p-1",
          "border border-border-default bg-surface-overlay shadow-overlay",
          "animate-[fade-in_100ms_var(--ease-out-quart)]",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

/** Intitulé d'un groupe d'entrées. Jamais cliquable. */
export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("label-eyebrow px-2 py-1.5", className)}
      {...props}
    />
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none",
        "transition-colors duration-75",
        // `highlighted` couvre le survol souris ET le déplacement clavier :
        // les deux doivent produire exactement le même repère visuel.
        "data-highlighted:bg-surface-hover",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border-subtle", className)}
      {...props}
    />
  );
}
