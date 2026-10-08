/**
 * Verrouillage après inactivité : les règles, sans le navigateur.
 *
 * **Pourquoi.** Un poste de clinique est partagé, un bureau de
 * radiologue reste ouvert pendant une pause : une session laissée
 * ouverte donne à qui passe accès aux examens et à la signature. Au bout
 * d'un délai sans activité, la session est fermée.
 *
 * **Le visualiseur, cas à part.** Il tourne dans une `iframe` d'une autre
 * origine : ses gestes — défiler les coupes, fenêtrer, mesurer — ne sont
 * pas visibles de l'application. Un radiologue qui lit un scanner thoraco-
 * abdomino-pelvien pendant vingt minutes sans toucher au compte-rendu
 * serait déconnecté en pleine lecture. Tant que le focus est dans le
 * visualiseur, le délai est donc allongé — sans devenir infini.
 */

/** Délai d'inactivité, en minutes. */
export const IDLE_MINUTES = 15;

/** Délai quand le focus est dans le visualiseur d'images, en minutes. */
export const READING_IDLE_MINUTES = 45;

/** Préavis avant verrouillage, en secondes. */
export const WARNING_SECONDS = 60;

/** Clé partagée entre onglets : instant de la dernière activité (ms). */
export const ACTIVITY_KEY = "imafrik.last-activity";

/**
 * Temps restant avant verrouillage.
 *
 * @param now          Instant courant (ms).
 * @param lastActivity Dernière activité, tous onglets confondus (ms).
 * @param reading      Le focus est dans le visualiseur.
 * @returns Millisecondes restantes ; négatif ou nul : verrouiller.
 */
export function remainingMs(
  now: number,
  lastActivity: number,
  reading: boolean,
): number {
  const limit = (reading ? READING_IDLE_MINUTES : IDLE_MINUTES) * 60_000;
  return lastActivity + limit - now;
}

/** Phase de la session, d'après le temps restant. */
export type InactivityPhase = "active" | "warning" | "locked";

/**
 * Phase correspondant à un temps restant.
 *
 * @param remaining Millisecondes restantes (voir {@link remainingMs}).
 */
export function phaseOf(remaining: number): InactivityPhase {
  if (remaining <= 0) return "locked";
  if (remaining <= WARNING_SECONDS * 1000) return "warning";
  return "active";
}

/**
 * Lit la dernière activité partagée, en se méfiant de ce qu'on y trouve :
 * une valeur absente, illisible ou **dans le futur** (horloge modifiée,
 * valeur forgée pour ne jamais verrouiller) ne prolonge rien.
 *
 * @param raw      Valeur stockée.
 * @param fallback Dernière activité connue de cet onglet.
 * @param now      Instant courant.
 */
export function parseActivity(
  raw: string | null,
  fallback: number,
  now: number,
): number {
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value > now) return fallback;
  return Math.max(value, fallback);
}
