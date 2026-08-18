"use client";

import * as React from "react";

import type { OnboardingDraft } from "@/lib/onboarding/schema";

const STORAGE_KEY = "imafrik.onboarding-draft";

/**
 * Brouillon de mise en service.
 *
 * **Il survit au rechargement, et ce n'est pas un confort.** Le parcours
 * se déroule souvent en plusieurs fois : le directeur remplit l'identité
 * le matin, le technicien branche le PACS l'après-midi. Un état gardé en
 * mémoire disparaîtrait au premier onglet fermé, et il faudrait tout
 * ressaisir — c'est le moment exact où l'on renonce.
 *
 * Le stockage local convient tant qu'aucune donnée patient n'y transite :
 * ce brouillon ne contient que des informations d'établissement et de
 * praticien. Il sera remplacé par une écriture serveur au branchement de
 * l'API, ce qui permettra en plus de reprendre depuis un autre poste.
 */
const listeners = new Set<() => void>();

function read(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? "{}";
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Le rendu serveur ne connaît aucun brouillon. */
const emptyDraft = "{}";

/**
 * Lit le brouillon et fournit de quoi le compléter.
 *
 * @returns Le brouillon courant et `merge`, qui y fusionne les valeurs
 *          d'une étape sans écraser les autres.
 */
export function useOnboardingDraft(): {
  draft: OnboardingDraft;
  merge: (values: OnboardingDraft) => void;
  reset: () => void;
} {
  const raw = React.useSyncExternalStore(subscribe, read, () => emptyDraft);

  // `raw` est une chaîne stable entre deux écritures : l'objet analysé
  // ne change donc d'identité que lorsque le contenu change réellement,
  // ce qui évite de relancer les effets qui en dépendent à chaque rendu.
  const draft = React.useMemo(() => {
    try {
      return JSON.parse(raw) as OnboardingDraft;
    } catch {
      return {};
    }
  }, [raw]);

  const merge = React.useCallback((values: OnboardingDraft) => {
    const current = JSON.parse(read()) as OnboardingDraft;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...values }),
    );
    for (const listener of listeners) listener();
  }, []);

  const reset = React.useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    for (const listener of listeners) listener();
  }, []);

  return { draft, merge, reset };
}
