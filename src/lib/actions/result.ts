import "server-only";

import { z } from "zod";

import { ApiError } from "@/lib/api/client";

/**
 * Résultat d'une action serveur.
 *
 * Les actions ne lèvent pas d'exception vers le navigateur : Next la
 * remplacerait en production par un message générique, et l'écran ne
 * pourrait pas dire *pourquoi* une signature a échoué. Elles renvoient
 * donc un résultat explicite, que le composant affiche tel quel.
 *
 * `status` reprend le code HTTP du service : un 409 sur une signature
 * appelle « relisez », un 503 « réessayez » — l'interface peut adapter
 * son geste, pas seulement son texte.
 */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; status: number };

/**
 * Exécute une opération et traduit son échec en résultat.
 *
 * Seules les {@link ApiError} — dont le message a été écrit pour
 * l'utilisateur par le service — sont transmises telles quelles. Toute
 * autre erreur est journalisée côté serveur et remplacée par un message
 * neutre : son texte pourrait contenir n'importe quoi.
 *
 * @param operation Opération à exécuter.
 */
export async function run<T>(
  operation: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message, status: error.status };
    }
    console.error("Action en échec", error);
    return {
      ok: false,
      error: "Une erreur inattendue est survenue. Réessayez.",
      status: 500,
    };
  }
}

/** Résultat d'une action indisponible en démonstration. */
export function demoUnavailable<T>(what: string): ActionResult<T> {
  return {
    ok: false,
    error: `${what} n’est pas disponible en démonstration : aucun service n’est branché.`,
    status: 503,
  };
}

/** Identifiant de ressource : un UUID, comme en base. */
const resourceId = z.string().uuid();

/**
 * Refuse un identifiant mal formé avant tout appel au service.
 *
 * Une action serveur est un point d'entrée public : ses arguments
 * viennent du navigateur, quel que soit le typage TypeScript. Le service
 * revérifie tout, et `encodeURIComponent` empêche déjà de sortir du
 * chemin — ce contrôle évite d'émettre une requête qu'il refuserait de
 * toute façon, et garde ses journaux propres.
 *
 * À placer **après** la branche de démonstration : les identifiants du
 * jeu de démonstration ne sont pas des UUID, et rien n'y est à protéger.
 *
 * @param ids Identifiants reçus.
 * @returns Un refus si l'un d'eux n'est pas un UUID, sinon `null`.
 */
export function rejectInvalidIds(
  ...ids: unknown[]
): { ok: false; error: string; status: number } | null {
  return ids.every((id) => resourceId.safeParse(id).success)
    ? null
    : { ok: false, error: "Identifiant invalide.", status: 422 };
}
