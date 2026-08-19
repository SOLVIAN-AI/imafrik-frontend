/**
 * Paramètres de connexion à Supabase.
 *
 * Les deux valeurs sont **publiques** : elles partent dans le navigateur
 * à chaque chargement, et c'est prévu. La clé anonyme n'ouvre aucun
 * accès par elle-même — tout ce qu'elle permet est encadré par les
 * politiques RLS, qui sont la seule barrière réelle. La clé de service,
 * elle, ne doit jamais approcher ce dépôt.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Indique si l'authentification réelle est configurée.
 *
 * **Tant qu'elle ne l'est pas, l'application tourne sur le jeu de
 * démonstration.** Ce repli est délibéré et explicite : il permet de
 * travailler l'interface, de la montrer et de la déployer en aperçu sans
 * dépendre d'un projet Supabase, et il bascule sur la vraie session dès
 * que les deux variables sont renseignées — sans changer une ligne de
 * code.
 *
 * Ce qu'il ne fait **pas** : masquer une erreur de configuration en
 * production. L'intergiciel refuse alors de servir le moindre écran et
 * affiche à la place ce qui manque — voir `mustRefuseToServe`.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Renvoie les paramètres, en supposant la configuration présente.
 *
 * @throws Si l'un des deux paramètres manque.
 */
export function supabaseEnv(): { url: string; anonKey: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase n'est pas configuré. Renseignez NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.",
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
