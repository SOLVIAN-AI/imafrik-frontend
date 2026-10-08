"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import * as React from "react";

import { Sidebar } from "@/components/layout/sidebar";
import type { NavCounts } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useMessages } from "@/i18n/client";

/**
 * Navigation en tiroir, pour les téléphones et les tablettes.
 *
 * **La même navigation que sur ordinateur**, pas une version réduite :
 * sélecteur d'organisation, compteurs, profil. Un radiologue d'astreinte
 * qui ouvre l'application sur son téléphone doit y trouver exactement
 * ce qu'il connaît.
 *
 * Construit sur le dialogue Radix : piège à focus, fermeture par Échap
 * ou d'un geste sur le voile, défilement de la page bloqué derrière.
 * Le tiroir se referme dès qu'un lien est suivi — sans quoi il resterait
 * ouvert par-dessus l'écran demandé.
 */
export function MobileNav({ counts }: { counts: NavCounts | null }) {
  const t = useMessages();
  const [open, setOpen] = React.useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={t.nav.openNavigation}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-hover hover:text-primary lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-980/70 backdrop-blur-sm animate-[fade-in_150ms_var(--ease-out-quart)] lg:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(19rem,86vw)] shadow-overlay lg:hidden",
            "animate-[drawer-in_220ms_var(--ease-out-quart)]",
          )}
          // Un lien suivi referme le tiroir.
          onClickCapture={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {t.nav.mainNavigation}
          </DialogPrimitive.Title>
          <Sidebar counts={counts} className="w-full bg-surface-base" />
          <DialogPrimitive.Close
            aria-label={t.nav.closeNavigation}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-lg text-tertiary transition-colors hover:bg-surface-hover hover:text-primary"
          >
            <X className="size-4" aria-hidden />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
