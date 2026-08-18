import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Base du service FastAPI. Vide en mode démonstration. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Indique si l'API est joignable.
 *
 * Comme pour Supabase, l'absence de configuration fait retomber
 * l'application sur le jeu de démonstration — explicitement, et
 * seulement hors production.
 */
export function isApiConfigured(): boolean {
  return Boolean(API_URL);
}

/**
 * Échec d'un appel à l'API.
 *
 * Le statut est conservé : il porte une information que le message ne
 * porte pas. Un 403 sur un examen n'est pas une panne, c'est un examen
 * qui appartient à une autre organisation — et l'écran doit le dire
 * autrement qu'un 500.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Appelle l'API sous l'identité de l'utilisateur courant.
 *
 * **Le jeton est ajouté ici, côté serveur, et nulle part ailleurs.** Il
 * vit dans un cookie `httpOnly` que le navigateur ne peut pas lire ;
 * appeler l'API depuis le client obligerait à le lui exposer, ce qui
 * annulerait tout l'intérêt du cookie.
 *
 * C'est ce jeton qui porte les claims `org_id` et `user_role`, donc les
 * politiques RLS : deux utilisateurs appelant la même adresse ne
 * reçoivent pas les mêmes lignes, et c'est la base qui le décide.
 *
 * @param path    Chemin, à partir de la racine de l'API.
 * @param init    Options `fetch` habituelles.
 * @throws ApiError si la réponse n'est pas un succès.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      503,
      "L’API n’est pas configurée. Renseignez NEXT_PUBLIC_API_URL.",
    );
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

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    // Les données d'un examen changent d'une minute à l'autre : une file
    // de lecture servie depuis un cache serait pire qu'inutile.
    cache: "no-store",
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => undefined);
    }
    throw new ApiError(
      response.status,
      `L’API a répondu ${response.status} sur ${path}.`,
      detail,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
