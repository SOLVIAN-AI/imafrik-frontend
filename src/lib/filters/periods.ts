/**
 * Les périodes d'une date, pour une liste filtrée sur la page : celles
 * qui la contiennent (« 7 jours » contient une date d'hier, et « 30
 * jours » aussi).
 *
 * Module pur, à l'instant près : éprouvé par `periods.test.ts`.
 */

import { PERIODS } from "@/lib/filters/dimensions";

/** Un jour, en millisecondes. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Les périodes qui contiennent une date.
 *
 * @param date Date de la ligne (réception, envoi).
 * @param now  Instant de référence.
 */
export function periodsOf(date: Date, now: number = Date.now()): string[] {
  const age = now - date.getTime();
  return PERIODS.filter((days) => age <= Number(days) * DAY_MS);
}
