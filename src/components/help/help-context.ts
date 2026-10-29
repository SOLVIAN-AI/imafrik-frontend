"use client";

import * as React from "react";

import type { AppMessages } from "@/i18n";

/** Clé d'un terme du glossaire de l'aide (`help-glossary.ts`). */
export type GlossaryTerm = keyof AppMessages["help"]["glossary"];

/** Ouverture du panneau d'aide, partagée par ce qui l'ouvre. */
export interface HelpState {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  /**
   * Ouvre le panneau sur le glossaire, à la place d'un terme, mis en
   * évidence : le lien « En savoir plus » d'une bulle d'information.
   */
  openTerm: (term: GlossaryTerm) => void;
}

/**
 * Commandes du panneau d'aide, et son ouverture, à laquelle on s'abonne.
 *
 * **La valeur du contexte ne change jamais**, à dessein. `HelpProvider`
 * enveloppe toutes les pages : si ouvrir l'aide changeait sa valeur, une
 * page encore en attente de dévoilement (arrivée en flux, pas encore
 * hydratée) serait reconstruite côté client, et son rendu serveur jeté
 * (voir `hooks/use-theme.ts`). Ouvrir l'aide d'un écran qui finit de se
 * charger suffisait (constaté le 29 octobre 2026 sur les parcours de bout
 * en bout). L'ouverture passe donc par un abonnement : seul ce qui la lit
 * se re-rend.
 */
export interface HelpControls extends Omit<HelpState, "open"> {
  /** Ouverture courante du panneau. */
  isOpen: () => boolean;
  /** S'abonne aux changements d'ouverture ; rend le désabonnement. */
  subscribe: (listener: () => void) => () => void;
}

/**
 * Ouverture du panneau, hors de React : un booléen et ses abonnés.
 *
 * @returns La lecture, l'abonnement et le changement de l'ouverture.
 */
export function createHelpOpenStore(): Pick<
  HelpControls,
  "isOpen" | "subscribe" | "setOpen"
> {
  let open = false;
  const listeners = new Set<() => void>();
  return {
    isOpen: () => open,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setOpen: (next) => {
      if (next === open) return;
      open = next;
      for (const listener of listeners) listener();
    },
  };
}

/**
 * Commandes du panneau d'aide, fournies par `HelpProvider`.
 *
 * À part du panneau : une bulle d'information n'a besoin que de l'ouvrir,
 * sans charger tout le panneau (sa recherche, ses visites guidées).
 */
export const HelpContext = React.createContext<HelpControls | null>(null);

const closed = () => false;
const noSubscribe = () => () => {};

/** État du panneau tiré de ses commandes ; `null` sans `HelpProvider`. */
function useHelpState(controls: HelpControls | null): HelpState | null {
  const open = React.useSyncExternalStore(
    controls?.subscribe ?? noSubscribe,
    controls?.isOpen ?? closed,
    closed,
  );
  return React.useMemo(
    () =>
      controls && {
        open,
        toggle: controls.toggle,
        setOpen: controls.setOpen,
        openTerm: controls.openTerm,
      },
    [controls, open],
  );
}

/** Ouverture du panneau d'aide, pour son bouton. */
export function useHelp(): HelpState {
  const state = useHelpState(React.useContext(HelpContext));
  if (!state) throw new Error("useHelp hors de HelpProvider");
  return state;
}

/**
 * Ouverture du panneau d'aide, ou `null` hors de `HelpProvider` : un
 * composant posé aussi sur des écrans sans aide s'en passe.
 */
export function useOptionalHelp(): HelpState | null {
  return useHelpState(React.useContext(HelpContext));
}
