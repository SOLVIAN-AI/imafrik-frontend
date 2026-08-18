import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Client Supabase côté serveur.
 *
 * **Les jetons vivent dans des cookies `httpOnly`, jamais dans le
 * stockage local.** Un jeton lisible par du script est un jeton qu'une
 * seule faille d'injection suffit à voler — et il ouvrirait ici l'accès
 * à des images médicales. Le prix à payer est ce client, qui doit être
 * recréé à chaque requête pour lire les cookies de *cette* requête ; il
 * ne peut donc pas être mis en cache dans un module.
 *
 * L'écriture de cookies est enveloppée dans un `try` : depuis un
 * composant serveur rendu, Next interdit d'écrire un en-tête de réponse.
 * Le rafraîchissement du jeton est alors assuré par l'intergiciel, qui
 * s'exécute avant le rendu et peut, lui, écrire.
 */
export async function createClient() {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Rendu depuis un composant serveur : l'intergiciel a déjà
          // rafraîchi la session, il n'y a rien à écrire ici.
        }
      },
    },
  });
}
