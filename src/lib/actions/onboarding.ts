"use server";

import { listStudies } from "@/lib/data/studies";

/**
 * Indique si la clinique a reçu au moins un examen.
 *
 * Interrogé à intervalle régulier par l'étape « Premier envoi » : c'est
 * l'arrivée réelle d'un examen dans le périmètre de la clinique — par la
 * passerelle ou par un dépôt — qui valide la liaison, et rien d'autre.
 */
export async function hasReceivedStudy(): Promise<boolean> {
  try {
    const studies = await listStudies({ limit: 1 });
    return studies.length > 0;
  } catch {
    return false;
  }
}
