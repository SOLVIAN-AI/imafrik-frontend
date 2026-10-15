"use client";

import * as React from "react";

/** Clé de stockage de la dernière page du portail visitée. */
const STORAGE_KEY = "imafrik-page-precedente";

/**
 * Retient la page du portail en cours, pour y revenir depuis l'écran de
 * lecture.
 *
 * Le stockage de session suffit : il vit le temps de l'onglet, ne quitte
 * pas le navigateur, et ne contient qu'une adresse de l'application.
 *
 * @param pathname Adresse courante, pour relancer l'enregistrement à
 *                 chaque changement de page.
 */
export function useRecordReturnPath(pathname: string): void {
  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        window.location.pathname + window.location.search,
      );
    } catch {
      // Stockage indisponible (navigation privée stricte) : le retour
      // retombera sur l'accueil du rôle.
    }
  }, [pathname]);
}

/**
 * Adresse du bouton « Retour » de l'écran de lecture : la page du portail
 * d'où l'on vient (la liste des examens, la file, un compte-rendu), à
 * défaut l'accueil du rôle.
 *
 * Le retour menait toujours à l'accueil, le cockpit pour l'administration,
 * quelle que soit la page d'origine : signalé le 15 octobre 2026.
 *
 * @param fallback Accueil du rôle, utilisé au premier rendu et sans
 *                 historique.
 */
export function useReturnPath(fallback: string): string {
  return React.useSyncExternalStore(
    // La valeur ne change pas pendant que l'écran de lecture est ouvert :
    // elle est lue une fois, sans abonnement.
    noSubscription,
    () => readReturnPath() ?? fallback,
    // Rendu serveur : l'accueil du rôle, remplacé à l'hydratation.
    () => fallback,
  );
}

/** Abonnement vide : la valeur se lit, elle ne s'écoute pas. */
function noSubscription(): () => void {
  return () => {};
}

/** Dernière page du portail retenue, si c'est une adresse interne. */
function readReturnPath(): string | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    // Une adresse interne seulement : jamais un lien vers ailleurs.
    return stored && stored.startsWith("/") && !stored.startsWith("//")
      ? stored
      : null;
  } catch {
    // Stockage indisponible : l'accueil du rôle.
    return null;
  }
}
