"use client";

import * as React from "react";

/** État de l'enregistrement, tel qu'il est présenté à l'utilisateur. */
export type AutosaveState =
  | "idle"
  | "saving"
  | "saved"
  /** Le service est injoignable : la copie de secours locale tient. */
  | "offline"
  /** Le brouillon a été modifié ailleurs : il faut recharger. */
  | "conflict";

/** Issue d'une tentative d'enregistrement. */
export type SaveOutcome = "saved" | "conflict" | "failed";

export interface UseAutosaveOptions<T> {
  /** Valeur suivie. Toute nouvelle référence déclenche un enregistrement. */
  value: T;
  /**
   * Fonction d'enregistrement. Ne lève pas : elle dit ce qui s'est passé,
   * pour que l'état affiché distingue une coupure (on réessaiera) d'un
   * conflit (réessayer écraserait le travail d'un autre onglet).
   */
  save: (value: T) => Promise<SaveOutcome>;
  /**
   * Délai d'inactivité avant enregistrement, en millisecondes.
   *
   * 1,2 s : assez long pour ne pas écrire à chaque frappe, assez court
   * pour qu'une coupure ne coûte qu'une phrase.
   */
  delay?: number;
  /** Suspend l'enregistrement — compte-rendu signé ou en lecture seule. */
  disabled?: boolean;
}

/**
 * Enregistrement automatique d'un brouillon.
 *
 * **Pourquoi automatique.** Un radiologue dicte, relit, corrige, passe à
 * l'examen suivant. Lui demander d'enregistrer, c'est garantir qu'un jour
 * un compte-rendu sera perdu — et le perdre signifie relire l'examen.
 *
 * **Quatre garanties.**
 *
 * 1. *Aucun enregistrement au montage.* La première valeur vient du
 *    serveur ; la réécrire produirait une version identique.
 * 2. *Une seule écriture en vol, toujours la plus récente.* Les écritures
 *    sont chaînées : chacune attend la fin de la précédente, puis écrit la
 *    valeur **courante** — les intermédiaires, périmées, ne partent jamais.
 *    Deux requêtes concurrentes pourraient arriver dans le désordre, et
 *    une version ancienne écraserait alors la récente.
 * 3. *Aucune perte silencieuse.* Un échec laisse la modification marquée
 *    « à écrire » : la frappe suivante, ou `flush`, la réémet, et quitter
 *    la page demande confirmation.
 * 4. *`flush` dit la vérité.* Il attend la fin de **toutes** les écritures
 *    en cours et renvoie `true` seulement si la valeur affichée est bien
 *    enregistrée. La signature s'appuie dessus : signer après un `flush`
 *    qui a échoué, c'était signer une version antérieure à l'écran.
 *
 * @returns L'état courant et `flush`, qui force l'écriture immédiate.
 */
export function useAutosave<T>({
  value,
  save,
  delay = 1_200,
  disabled = false,
}: UseAutosaveOptions<T>): {
  state: AutosaveState;
  flush: () => Promise<boolean>;
} {
  const [state, setState] = React.useState<AutosaveState>("idle");

  // Hors du cycle de rendu : ces informations ne changent rien à
  // l'affichage, et les placer dans un état provoquerait un rendu par
  // frappe.
  const latest = React.useRef(value);
  const saveFn = React.useRef(save);
  const chain = React.useRef<Promise<void>>(Promise.resolve());
  const dirty = React.useRef(false);
  const conflicted = React.useRef(false);

  React.useEffect(() => {
    latest.current = value;
    saveFn.current = save;
  }, [value, save]);

  /** Ajoute une écriture à la chaîne ; renvoie la fin de la chaîne. */
  const enqueue = React.useCallback((): Promise<void> => {
    chain.current = chain.current.then(async () => {
      // Rien à écrire, ou écrire écraserait le travail d'un autre onglet.
      if (!dirty.current || conflicted.current) return;

      const snapshot = latest.current;
      // Marqué propre *avant* l'envoi : une frappe pendant l'écriture le
      // remarquera sale, et l'écriture suivante partira.
      dirty.current = false;
      setState("saving");

      const outcome = await saveFn.current(snapshot);
      if (outcome === "saved") {
        setState("saved");
      } else if (outcome === "conflict") {
        dirty.current = true;
        conflicted.current = true;
        setState("conflict");
      } else {
        dirty.current = true;
        setState("offline");
      }
    });
    return chain.current;
  }, []);

  // Dernière valeur ayant déclenché un enregistrement. Comparer les
  // références — plutôt que compter les montages — rend le garde-fou
  // insensible au double montage du mode strict de React.
  const scheduled = React.useRef(value);

  React.useEffect(() => {
    if (value === scheduled.current || disabled) return;
    scheduled.current = value;
    dirty.current = true;
    const timer = setTimeout(() => void enqueue(), delay);
    return () => clearTimeout(timer);
  }, [value, delay, disabled, enqueue]);

  // Fermer l'onglet avec une modification non enregistrée demande
  // confirmation. Le navigateur impose son libellé ; seul le fait de
  // retenir l'utilisateur est de notre ressort.
  React.useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const flush = React.useCallback(async () => {
    await enqueue();
    return !dirty.current && !conflicted.current;
  }, [enqueue]);

  return { state, flush };
}
