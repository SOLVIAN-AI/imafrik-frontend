"use client";

import { clearReportBackups } from "@/lib/editor/backup";

/**
 * Efface tout ce que l'application a laissé dans ce navigateur.
 *
 * Appelée à chaque déconnexion. Un poste de clinique ou de cabinet est
 * souvent partagé : la copie de secours d'un compte-rendu (texte médical)
 * ne doit pas rester pour le suivant. Les versions précédentes gardaient
 * aussi un brouillon de mise en service dans le navigateur ; sa clé est
 * effacée au passage.
 */
export function clearLocalData(): void {
  clearReportBackups();
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("imafrik.onboarding-draft"))
        window.localStorage.removeItem(key);
    }
  } catch {
    // Stockage bloqué : rien n'y a été écrit.
  }
}
