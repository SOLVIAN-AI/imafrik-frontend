/**
 * Précisions machine d'un refus, lues à côté de `detail`.
 *
 * Le service les ajoute quand l'écran doit adapter son geste et non
 * seulement son texte : un code personnel à créer, à ressaisir, ou
 * verrouillé jusqu'à une heure donnée. L'écran ne lit jamais le message
 * pour le deviner.
 */
export interface ApiErrorReason {
  /** Code stable, par exemple `pin_wrong` ou `pin_not_set`. */
  code?: string;
  /** Fin d'un verrou, en ISO 8601. */
  lockedUntil?: string;
  /** Essais restants avant un verrou. */
  attemptsLeft?: number;
}
