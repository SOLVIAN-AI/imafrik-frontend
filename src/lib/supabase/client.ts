"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Client Supabase du navigateur.
 *
 * Il partage ses cookies avec le client serveur : c'est tout l'intérêt
 * de `@supabase/ssr`. Une session ouverte côté serveur est donc
 * immédiatement visible côté client, et inversement — sans quoi il
 * faudrait recharger la page après chaque connexion.
 *
 * À réserver aux gestes qui doivent partir du navigateur : connexion,
 * déconnexion, écoute des changements de session. **Toute lecture de
 * données passe par le serveur**, où le jeton n'est pas exposé à un
 * script tiers.
 */
export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}
