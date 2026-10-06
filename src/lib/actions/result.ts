import "server-only";

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
