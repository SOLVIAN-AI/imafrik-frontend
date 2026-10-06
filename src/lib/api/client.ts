import "server-only";

import type { z } from "zod";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { API_URL } from "@/lib/api/config";

export { isApiConfigured } from "@/lib/api/config";

/**
 * Échec d'un appel à l'API.
 *
 * Le statut est conservé : il porte une information que le message ne
 * porte pas. Un 404 sur un examen n'est pas une panne, c'est un examen
 * qui appartient à une autre organisation ; un 409 sur une signature
 * veut dire « relisez » ; un 503 veut dire « réessayez ». Chaque écran
 * doit pouvoir les distinguer.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Extrait le message d'une réponse d'erreur de l'API.
 *
 * Le service répond `{"detail": "…"}` avec un texte écrit pour
 * l'utilisateur, sans donnée de santé. Une erreur de validation renvoie
 * une liste : on n'en garde alors qu'un résumé.
 */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "detail" in body) {
      const { detail } = body as { detail: unknown };
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return "Requête invalide.";
    }
  } catch {
    // Corps absent ou non JSON : on retombe sur le message générique.
  }
  return response.status >= 500
    ? "Le service est momentanément indisponible. Réessayez dans un instant."
    : "La demande n’a pas abouti.";
}

/**
 * Appelle l'API sous l'identité de l'utilisateur courant.
 *
 * **Le jeton est ajouté ici, côté serveur, et nulle part ailleurs.** Il
 * vit dans un cookie `httpOnly` que le navigateur ne peut pas lire ;
 * appeler l'API depuis le client obligerait à le lui exposer, ce qui
 * annulerait tout l'intérêt du cookie.
 *
 * @param path Chemin, à partir de la racine de l'API.
 * @param init Options `fetch` habituelles.
 * @returns La réponse, déjà vérifiée comme un succès.
 * @throws ApiError si la réponse n'est pas un succès.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!API_URL) {
    throw new ApiError(503, "L’API n’est pas configurée.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      // Les données d'un examen changent d'une minute à l'autre : une
      // file de lecture servie depuis un cache serait pire qu'inutile.
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      503,
      "Le service est injoignable. Vérifiez la connexion, puis réessayez.",
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response));
  }
  return response;
}

/** Options de lecture. */
interface GetOptions {
  /**
   * Traduire un 404 en `null` plutôt qu'en exception. Réservé aux
   * lectures où « absent » est une réponse normale — un examen d'une
   * autre clinique, un compte-rendu pas encore rédigé.
   */
  notFoundAsNull?: boolean;
}

/**
 * Lit une ressource et la valide contre son contrat.
 *
 * @param path   Chemin de la ressource.
 * @param schema Schéma de la réponse, lié au contrat généré — voir
 *               `lib/api/contracts.ts`.
 * @param options Voir {@link GetOptions}.
 * @returns La ressource validée, ou `null` sur un 404 si demandé.
 * @throws ApiError sur toute autre erreur, et quand la réponse ne
 *         respecte pas le contrat — une erreur nette plutôt qu'un
 *         `undefined` au milieu d'un écran.
 */
export async function apiGet<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  options: { notFoundAsNull: true },
): Promise<z.output<S> | null>;
export async function apiGet<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  options?: GetOptions,
): Promise<z.output<S>>;
export async function apiGet<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  options: GetOptions = {},
): Promise<z.output<S> | null> {
  try {
    const response = await apiFetch(path);
    return parseContract(path, schema, await response.json());
  } catch (error) {
    if (
      options.notFoundAsNull &&
      error instanceof ApiError &&
      error.status === 404
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Envoie une écriture et valide la réponse, s'il y en a une.
 *
 * @param path   Chemin de la ressource.
 * @param method Verbe HTTP.
 * @param body   Corps, sérialisé en JSON.
 * @param schema Schéma de la réponse ; omis pour une réponse sans corps.
 */
export async function apiSend<S extends z.ZodTypeAny>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
  schema?: S,
): Promise<z.output<S>> {
  const response = await apiFetch(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!schema || response.status === 204) return undefined as z.output<S>;
  return parseContract(path, schema, await response.json());
}

/** Valide une réponse ; une rupture de contrat devient une ApiError explicite. */
function parseContract<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  raw: unknown,
) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    // Le détail part dans les journaux du serveur, pas vers l'écran : il
    // pourrait contenir des valeurs de la réponse.
    console.error(
      `Rupture de contrat sur ${path}`,
      parsed.error.issues.slice(0, 5),
    );
    throw new ApiError(502, "Le service a renvoyé une réponse inattendue.");
  }
  return parsed.data as z.output<S>;
}
