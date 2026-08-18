import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/env";

/**
 * Adresses accessibles sans session.
 *
 * Tout le reste est protégé par défaut. C'est le bon sens de la liste
 * blanche : ajouter un écran ne doit pas pouvoir l'exposer par oubli, et
 * dans une application qui manipule des données de santé, l'oubli se
 * paie cher.
 */
const PUBLIC_ROUTES = [
  "/",
  "/securite",
  "/tarifs",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
  "/cgu",
  "/verifier",
  "/connexion",
  "/mot-de-passe-oublie",
  "/nouveau-mot-de-passe",
  "/invitation",
  "/auth",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Rafraîchit la session et protège les routes.
 *
 * **Cette fonction doit s'exécuter avant tout rendu.** Un jeton d'accès
 * Supabase expire au bout d'une heure ; c'est ici, et seulement ici,
 * qu'on peut le renouveler, parce qu'un composant serveur rendu n'a plus
 * le droit d'écrire un cookie de réponse. Sans elle, un radiologue
 * verrait sa session tomber en pleine rédaction.
 *
 * `getUser()` plutôt que `getSession()` : le second se contente de lire
 * le cookie, que le navigateur peut avoir falsifié. Le premier fait
 * valider le jeton par le serveur d'authentification — c'est la seule
 * vérification qui vaille pour décider d'un accès.
 *
 * Quand Supabase n'est pas configuré, la fonction laisse tout passer :
 * l'application tourne alors sur le jeu de démonstration. Voir
 * `isSupabaseConfigured`.
 */
export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Les cookies rafraîchis doivent être posés **à la fois** sur la
        // requête — pour que le rendu qui suit voie la nouvelle session —
        // et sur la réponse, pour que le navigateur les conserve.
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = "/connexion";
    // On mémorise l'écran demandé pour y revenir après la connexion :
    // quelqu'un qui suit le lien d'un examen urgent ne doit pas atterrir
    // sur une file de travail générique.
    target.searchParams.set("suite", pathname);
    return NextResponse.redirect(target);
  }

  if (user && (pathname === "/connexion" || pathname === "/")) {
    const target = request.nextUrl.clone();
    target.pathname = "/worklist";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return response;
}
