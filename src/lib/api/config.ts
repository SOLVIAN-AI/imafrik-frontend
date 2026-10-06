/**
 * Configuration de l'API, sans dépendance.
 *
 * Isolée du client (`lib/api/client.ts`) pour pouvoir être lue depuis le
 * proxy, qui ne doit embarquer ni le client Supabase serveur ni
 * `next/headers`.
 */

/** Base du service FastAPI. Vide en mode démonstration. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Indique si l'API est configurée.
 *
 * Son absence fait retomber l'application sur le jeu de démonstration —
 * explicitement, et jamais en production : voir `lib/demo/mode.ts` et
 * `lib/deployment.ts`.
 */
export function isApiConfigured(): boolean {
  return Boolean(API_URL);
}
