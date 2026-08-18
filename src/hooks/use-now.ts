"use client";

import * as React from "react";

/**
 * Cadence de rafraîchissement de l'horloge partagée, en millisecondes.
 *
 * Trente secondes : les durées affichées sont arrondies à la minute, et
 * un rythme plus rapide ne changerait rien à l'écran tout en réveillant
 * l'onglet pour rien.
 */
const TICK_MS = 30_000;

/**
 * Horloge unique, partagée par tous les composants qui affichent une
 * durée relative.
 *
 * Un minuteur par composant produirait autant de réveils que de lignes
 * dans une worklist, et des lignes voisines pourraient afficher des
 * durées calculées à quelques secondes d'écart.
 */
const listeners = new Set<() => void>();

/**
 * Instant courant mémorisé.
 *
 * Il doit rester stable entre deux tics : `useSyncExternalStore` compare
 * les instantanés d'un rendu à l'autre, et un `Date.now()` renvoyé
 * directement provoquerait une boucle de rendus infinie.
 *
 * `0` signifie « pas encore lu » — c'est la valeur du rendu serveur.
 */
let snapshot = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);

  if (timer === null) {
    snapshot = Date.now();
    timer = setInterval(() => {
      snapshot = Date.now();
      for (const listener of listeners) listener();
    }, TICK_MS);
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => snapshot;

/**
 * Le serveur n'a pas d'horloge exploitable ici.
 *
 * Une durée relative dépend de l'instant où on la calcule : le serveur
 * écrirait « 8 min », le navigateur reprendrait la main quelques secondes
 * plus tard et calculerait « 10 min ». React constaterait la différence,
 * avertirait, et régénérerait l'arbre. On renvoie donc `0` des deux côtés
 * au premier rendu, et la vraie valeur arrive juste après.
 */
const getServerSnapshot = () => 0;

/**
 * Instant courant, rafraîchi périodiquement.
 *
 * Les durées d'attente d'une worklist restent ainsi justes sans que
 * personne ait à recharger la page — un examen arrivé il y a une heure ne
 * doit pas s'afficher indéfiniment comme reçu à l'instant.
 *
 * @returns L'instant courant en millisecondes, ou `0` tant que le rendu
 *          n'a pas atteint le navigateur.
 *
 * @example
 * ```tsx
 * const now = useNow();
 * if (!now) return null; // rendu serveur : aucune durée à afficher
 * return <span>{formatAge(date, new Date(now))}</span>;
 * ```
 */
export function useNow(): number {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
