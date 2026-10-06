import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { mustRefuseToServe } from "@/lib/deployment";
import { isDemoMode } from "@/lib/demo/mode";
import { homeFor, isPublicRoute, isRouteAllowed } from "@/lib/navigation";
import { contentSecurityPolicy, createNonce } from "@/lib/security/csp";
import type { UserRole } from "@/lib/session/types";
import { SESSION_COOKIE_OPTIONS } from "@/lib/supabase/cookies";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Proxy : s'exécute avant chaque rendu.
 *
 * Quatre responsabilités, dans cet ordre :
 *
 * 1. **Refuser un déploiement de production incomplet** — avant de servir
 *    le moindre écran. Voir `lib/deployment.ts`.
 * 2. **Poser la politique de sécurité du contenu** avec un nonce propre à
 *    la requête. Voir `lib/security/csp.ts`.
 * 3. **Rafraîchir la session** : un composant serveur rendu ne peut plus
 *    écrire de cookie, et un jeton Supabase expire au bout d'une heure.
 * 4. **Trier les accès** : un visiteur anonyme ne dépasse pas les pages
 *    publiques, et un utilisateur connecté ne dépasse pas son portail.
 *
 * Le tri par rôle repose sur les claims du jeton, vérifiés localement
 * (`getClaims`). C'est une première barrière, rapide ; chaque disposition
 * le refait sur la session relue en base, et les données restent de toute
 * façon protégées par le service et RLS.
 */
export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  // Derrière Vercel, la requête arrive en HTTP interne : le protocole vu
  // par le visiteur est dans x-forwarded-proto.
  const secure =
    (request.headers.get("x-forwarded-proto") ??
      request.nextUrl.protocol.replace(":", "")) === "https";
  const csp = contentSecurityPolicy(nonce, secure);

  // Next lit le nonce dans l'en-tête CSP **de la requête** pour le
  // reporter sur ses propres scripts ; la disposition racine le lit dans
  // x-nonce pour le transmettre à next-themes.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const withCsp = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };
  const next = () =>
    NextResponse.next({ request: { headers: requestHeaders } });

  if (mustRefuseToServe()) {
    if (request.nextUrl.pathname === "/configuration-requise")
      return withCsp(next());
    const target = request.nextUrl.clone();
    target.pathname = "/configuration-requise";
    target.search = "";
    return withCsp(
      NextResponse.rewrite(target, {
        status: 503,
        request: { headers: requestHeaders },
      }),
    );
  }

  const { pathname } = request.nextUrl;

  // Démonstration : aucune session réelle à protéger ni à rafraîchir.
  if (isDemoMode()) return withCsp(next());

  // Pages publiques sans rapport avec la session : aucun appel au service
  // d'authentification. La connexion fait exception — un utilisateur déjà
  // connecté doit en être redirigé.
  const authScreen = pathname === "/connexion";
  if (isPublicRoute(pathname) && !authScreen) return withCsp(next());

  let response = next();
  const { url, anonKey } = supabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Les cookies rafraîchis sont posés **à la fois** sur la requête —
        // pour que le rendu qui suit voie la nouvelle session — et sur la
        // réponse, pour que le navigateur les conserve.
        for (const { name, value } of cookiesToSet)
          request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const role = (claims?.user_role as UserRole | null | undefined) ?? null;

  const redirectTo = (target: string, keepSuite = false) => {
    const destination = request.nextUrl.clone();
    destination.pathname = target;
    destination.search = "";
    // On mémorise l'écran demandé pour y revenir après la connexion :
    // quelqu'un qui suit le lien d'un examen urgent ne doit pas atterrir
    // sur une file de travail générique.
    if (keepSuite) destination.searchParams.set("suite", pathname);
    const redirect = NextResponse.redirect(destination);
    // Les cookies rafraîchis ne doivent pas se perdre dans la redirection.
    for (const cookie of response.cookies.getAll())
      redirect.cookies.set(cookie);
    return withCsp(redirect);
  };

  if (!claims) {
    return authScreen ? withCsp(response) : redirectTo("/connexion", true);
  }

  // Connecté, mais rattaché à aucune organisation active : un seul écran.
  if (!role) {
    return pathname === "/en-attente"
      ? withCsp(response)
      : redirectTo("/en-attente");
  }

  if (authScreen || pathname === "/en-attente")
    return redirectTo(homeFor(role));
  if (!isRouteAllowed(role, pathname)) return redirectTo(homeFor(role));

  return withCsp(response);
}

export const config = {
  /**
   * Tout, sauf les fichiers statiques et les préchargements de liens.
   *
   * Les préchargements n'ont pas besoin de CSP — ce ne sont pas des pages
   * affichées — et les faire passer par la vérification de session
   * multiplierait les appels pour rien.
   */
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
