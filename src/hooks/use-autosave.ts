"use client";

import * as React from "react";

/** État de l'enregistrement, tel qu'il est présenté à l'utilisateur. */
export type AutosaveState = "idle" | "saving" | "saved" | "offline";

export interface UseAutosaveOptions<T> {
  /** Valeur suivie. Toute nouvelle référence déclenche un enregistrement. */
  value: T;
  /** Fonction d'enregistrement. Doit rejeter en cas d'échec. */
  save: (value: T) => Promise<void>;
  /**
   * Délai d'inactivité avant enregistrement, en millisecondes.
   *
   * 1,2 s : assez long pour ne pas écrire à chaque frappe, assez court
   * pour qu'une coupure ne coûte qu'une phrase.
   */
  delay?: number;
  /** Suspend l'enregistrement — compte-rendu signé, chargement en cours. */
  disabled?: boolean;
}

/**
 * File d'attente d'écriture, hors du cycle de rendu.
 *
 * Ces trois informations ne changent rien à l'affichage : les stocker
 * dans un état provoquerait des rendus inutiles à chaque frappe.
 */
interface SaveQueue<T> {
  /** Une écriture est en cours. */
  inFlight: boolean;
  /** Valeur arrivée pendant l'écriture, à réémettre juste après. */
  queued: T | null;
  /** Une modification n'a pas encore été écrite avec succès. */
  dirty: boolean;
}

/**
 * Enregistrement automatique d'un brouillon.
 *
 * **Pourquoi automatique.** Un radiologue dicte, relit, corrige, passe à
 * l'examen suivant. Lui demander d'enregistrer, c'est garantir qu'un jour
 * un compte-rendu sera perdu — et le perdre signifie relire l'examen.
 *
 * **Trois garanties.**
 *
 * 1. *Aucun enregistrement au montage.* La première valeur vient du
 *    serveur ; la réécrire immédiatement produirait une version
 *    identique et un horodatage faux.
 * 2. *Une seule écriture en vol.* Si la frappe reprend pendant
 *    l'enregistrement, la valeur suivante attend la fin de la précédente.
 *    Deux requêtes concurrentes pourraient arriver dans le désordre, et
 *    une version ancienne écraserait alors la récente.
 * 3. *Aucune perte silencieuse.* En cas d'échec, l'état passe à
 *    `offline` et la modification reste en mémoire : la frappe suivante
 *    la réémettra, et quitter la page demandera confirmation.
 *
 * @returns L'état courant et `flush`, qui force l'écriture immédiate —
 *          indispensable avant de signer.
 *
 * @example
 * ```tsx
 * const { state, flush } = useAutosave({
 *   value: sections,
 *   save: (s) => api.patchReport(reportId, { sections: s }),
 * });
 * ```
 */
export function useAutosave<T>({
  value,
  save,
  delay = 1_200,
  disabled = false,
}: UseAutosaveOptions<T>): {
  state: AutosaveState;
  flush: () => Promise<void>;
} {
  const [state, setState] = React.useState<AutosaveState>("idle");

  const queue = React.useRef<SaveQueue<T>>({
    inFlight: false,
    queued: null,
    dirty: false,
  });

  // La valeur la plus récente, tenue à jour hors rendu pour que `flush`
  // écrive ce qui est à l'écran et non ce qui l'était au dernier rendu.
  const latest = React.useRef(value);
  const saveFn = React.useRef(save);

  React.useEffect(() => {
    latest.current = value;
    saveFn.current = save;
  }, [value, save]);

  /**
   * Écrit une valeur, en sérialisant les écritures concurrentes.
   *
   * La reprise se fait par boucle et non par appel récursif : une
   * fonction qui se référence elle-même échappe à la mémoïsation du
   * compilateur React, et serait recréée à chaque rendu.
   */
  const write = React.useCallback(async (next: T): Promise<void> => {
    if (queue.current.inFlight) {
      // Une écriture est déjà partie. On garde seulement la dernière
      // valeur : les intermédiaires sont périmées avant d'être écrites.
      queue.current.queued = next;
      return;
    }

    queue.current.inFlight = true;
    try {
      let current: T | null = next;
      while (current !== null) {
        setState("saving");
        try {
          await saveFn.current(current);
          queue.current.dirty = false;
          setState("saved");
        } catch {
          // L'échec ne fait pas disparaître la modification : elle reste
          // à l'écran, et l'utilisateur sait qu'elle n'est pas partie.
          setState("offline");
        }
        current = queue.current.queued;
        queue.current.queued = null;
      }
    } finally {
      queue.current.inFlight = false;
    }
  }, []);

  // Dernière valeur ayant déclenché un enregistrement. Comparer les
  // références — plutôt que compter les montages — rend le garde-fou
  // insensible au double montage du mode strict de React en
  // développement, qui déclencherait sinon une écriture parasite dès
  // l'ouverture de l'écran.
  const scheduled = React.useRef(value);

  React.useEffect(() => {
    if (value === scheduled.current) return;
    if (disabled) return;

    scheduled.current = value;
    queue.current.dirty = true;
    const timer = setTimeout(() => void write(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay, disabled, write]);

  // Fermer l'onglet avec un paragraphe non enregistré doit demander
  // confirmation. L'écouteur est posé une fois pour toutes et consulte la
  // file au moment du départ : le réenregistrer à chaque frappe coûterait
  // plus cher que le test qu'il évite. Le navigateur impose son libellé ;
  // seul le fait de retenir l'utilisateur est de notre ressort.
  React.useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (queue.current.dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  /** Force l'écriture de la valeur courante, sans attendre le délai. */
  const flush = React.useCallback(async () => {
    await write(latest.current);
  }, [write]);

  return { state, flush };
}
