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
 * État du panneau d'aide, fourni par `HelpProvider`.
 *
 * À part du panneau : une bulle d'information n'a besoin que de l'ouvrir,
 * sans charger tout le panneau (sa recherche, ses visites guidées).
 */
export const HelpContext = React.createContext<HelpState | null>(null);

/** Ouverture du panneau d'aide, pour son bouton. */
export function useHelp(): HelpState {
  const state = React.useContext(HelpContext);
  if (!state) throw new Error("useHelp hors de HelpProvider");
  return state;
}

/**
 * Ouverture du panneau d'aide, ou `null` hors de `HelpProvider` : un
 * composant posé aussi sur des écrans sans aide s'en passe.
 */
export function useOptionalHelp(): HelpState | null {
  return React.useContext(HelpContext);
}
