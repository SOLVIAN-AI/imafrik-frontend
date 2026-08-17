import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en résolvant les conflits.
 *
 * `clsx` gère les classes conditionnelles, `twMerge` arbitre les
 * doublons : sans lui, `px-2` et `px-4` cohabiteraient et c'est l'ordre
 * de la feuille de style — non celui des arguments — qui trancherait.
 * Indispensable dès qu'un composant accepte une prop `className`.
 *
 * @param inputs Classes, éventuellement conditionnelles.
 * @returns La chaîne de classes finale, sans conflit.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
