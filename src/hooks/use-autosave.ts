"use client";

import * as React from "react";

/** État de l'enregistrement, tel qu'il est présenté à l'utilisateur. */
export type AutosaveState =
  | "idle"
  | "saving"
  | "saved"
  /** Le service est injoignable : la copie de secours locale tient. */
  | "offline"
  /**
   * Le brouillon a été modifié ailleurs : l'enregistrement est suspendu,
   * le texte est gardé sur le poste (`keep`) jusqu'à ce que l'utilisateur
   * tranche (`resume` pour garder son texte, ou rechargement).
   */
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
   * Garde la valeur sur le poste quand le service ne peut plus la
   * recevoir : appelée dès le conflit, puis à chaque modification tant
   * qu'il dure. Sans elle, tout ce qui était tapé après un conflit ne
   * vivait que dans la mémoire de l'onglet, et le rechargement demandé
   * pour le résoudre le perdait.
   *
   * @returns `true` si la valeur est gardée (copie de secours écrite).
   */
  keep?: (value: T) => Promise<boolean>;
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
 * 3. *Aucune perte silencieuse.* Un échec — réponse d'erreur ou
 *    exception — laisse la modification marquée « à écrire » : la frappe
 *    suivante, ou `flush`, la réémet, et quitter la page demande
 *    confirmation. La chaîne d'écritures ne reste jamais rejetée.
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
  keep,
  delay = 1_200,
  disabled = false,
}: UseAutosaveOptions<T>): {
  state: AutosaveState;
  flush: () => Promise<boolean>;
  resume: () => Promise<boolean>;
} {
  const [state, setState] = React.useState<AutosaveState>("idle");

  // Hors du cycle de rendu : ces informations ne changent rien à
  // l'affichage, et les placer dans un état provoquerait un rendu par
  // frappe.
  const latest = React.useRef(value);
  const saveFn = React.useRef(save);
  const keepFn = React.useRef(keep);
  const chain = React.useRef<Promise<void>>(Promise.resolve());
  const dirty = React.useRef(false);
  const conflicted = React.useRef(false);
  // Valeur gardée sur le poste pendant un conflit : tant que c'est la
  // valeur affichée, quitter la page ne perd rien.
  const kept = React.useRef<T | null>(null);

  React.useEffect(() => {
    latest.current = value;
    saveFn.current = save;
    keepFn.current = keep;
  }, [value, save, keep]);

  /** Garde la valeur courante sur le poste ; ne lève jamais. */
  const keepLatest = React.useCallback(async (): Promise<void> => {
    const snapshot = latest.current;
    let ok = false;
    try {
      ok = (await keepFn.current?.(snapshot)) ?? false;
    } catch {
      ok = false;
    }
    kept.current = ok ? snapshot : null;
  }, []);

  /** Ajoute une écriture à la chaîne ; renvoie la fin de la chaîne. */
  const enqueue = React.useCallback((): Promise<void> => {
    chain.current = chain.current.then(async () => {
      if (!dirty.current) return;
      // Écrire écraserait le travail d'un autre onglet : le texte est
      // seulement gardé sur le poste, en attendant la décision.
      if (conflicted.current) {
        await keepLatest();
        return;
      }

      const snapshot = latest.current;
      // Marqué propre *avant* l'envoi : une frappe pendant l'écriture le
      // remarquera sale, et l'écriture suivante partira.
      dirty.current = false;
      setState("saving");

      // Une fonction qui lève — un appel d'action serveur, quand le réseau
      // tombe, rejette au lieu de répondre — compte comme une coupure. Sans
      // ce filet, la chaîne restait rejetée : plus aucune écriture ne
      // partait, même le réseau revenu, et l'indicateur restait figé sur
      // « enregistrement ».
      let outcome: SaveOutcome;
      try {
        outcome = await saveFn.current(snapshot);
      } catch {
        outcome = "failed";
      }
      if (outcome === "saved") {
        setState("saved");
      } else if (outcome === "conflict") {
        dirty.current = true;
        conflicted.current = true;
        setState("conflict");
        await keepLatest();
      } else {
        dirty.current = true;
        setState("offline");
      }
    });
    return chain.current;
  }, [keepLatest]);

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
      // Pendant un conflit, la valeur affichée gardée sur le poste sera
      // proposée à la réouverture : recharger, comme l'écran l'invite à
      // le faire, ne perd rien.
      const safe = conflicted.current && kept.current === latest.current;
      if (dirty.current && !safe) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const flush = React.useCallback(async () => {
    await enqueue();
    return !dirty.current && !conflicted.current;
  }, [enqueue]);

  /**
   * Lève la suspension d'un conflit et réécrit la valeur affichée.
   *
   * À appeler une fois que l'utilisateur a choisi de garder son texte, et
   * que la fonction d'enregistrement vise la version désormais en base.
   *
   * @returns `true` si la valeur affichée est enregistrée.
   */
  const resume = React.useCallback(async () => {
    // Attendre la fin des écritures en cours avant de lever la suspension.
    await chain.current;
    conflicted.current = false;
    kept.current = null;
    dirty.current = true;
    return flush();
  }, [flush]);

  return { state, flush, resume };
}
