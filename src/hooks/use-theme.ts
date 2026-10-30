"use client";

import * as React from "react";

import {
  DEFAULT_THEME,
  parseTheme,
  type Theme,
  THEME_STORAGE_KEY,
  THEMES,
} from "@/lib/theme";

/** Composants abonnés au thème. */
const listeners = new Set<() => void>();

/** Thème posé sur `<html>`, par `THEME_SCRIPT` puis par `setTheme`. */
function readTheme(): Theme {
  const classes = document.documentElement.classList;
  return THEMES.find((theme) => classes.contains(theme)) ?? DEFAULT_THEME;
}

/** Pose le thème sur `<html>` et prévient les composants abonnés. */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  // Aucune transition pendant la bascule : chaque couleur de la page
  // s'animerait, spectaculaire une fois, pénible ensuite.
  const freeze = document.createElement("style");
  freeze.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(freeze);
  root.classList.remove(...THEMES);
  root.classList.add(theme);
  root.style.colorScheme = theme;
  // Lire un style en force le calcul : la bascule est faite avant que les
  // transitions reviennent.
  void window.getComputedStyle(document.body).color;
  window.setTimeout(() => freeze.remove(), 1);
  for (const listener of listeners) listener();
}

/** Un autre onglet a changé de thème : celui-ci le suit. */
function onStorage(event: StorageEvent): void {
  if (event.key === THEME_STORAGE_KEY) applyTheme(parseTheme(event.newValue));
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/**
 * Change le thème, et le retient pour les prochaines visites.
 *
 * @param theme Thème choisi.
 */
export function setTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Stockage refusé : le choix vaut pour cette page seulement.
  }
  applyTheme(theme);
}

/**
 * Thème courant, et moyen d'en changer.
 *
 * **Aucun contexte React, à dessein.** next-themes posait un fournisseur
 * autour de toute l'application, et en changeait la valeur dans un effet
 * au montage : son thème « système », lu par `matchMedia` même quand le
 * système n'est pas suivi, passait de sombre à clair sur tout poste réglé
 * en clair. Or un changement de contexte qui atteint une frontière
 * Suspense pas encore hydratée fait renoncer React à l'hydrater : la page
 * arrivée en flux, qui attend son dévoilement (jusqu'à 300 ms depuis
 * React 19.2) dans un `<div hidden>`, était reconstruite côté client. Le
 * HTML du serveur partait à la poubelle, et la page existait deux fois
 * dans le document jusqu'au dévoilement (constaté le 29 octobre 2026 sur
 * les parcours de bout en bout : « strict mode violation »). Ici, chaque
 * composant qui lit le thème s'y abonne lui-même : une bascule ne
 * re-rend que lui.
 *
 * @returns `theme`, `undefined` au rendu serveur et à l'hydratation (le
 *          serveur ne connaît pas le choix), puis le thème posé ; et
 *          `setTheme`.
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useTheme();
 * const dark = theme !== "light";
 * ```
 */
export function useTheme(): {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
} {
  const theme = React.useSyncExternalStore<Theme | undefined>(
    subscribe,
    readTheme,
    () => undefined,
  );
  return { theme, setTheme };
}
