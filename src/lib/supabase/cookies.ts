import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Options des cookies de session Supabase.
 *
 * **`httpOnly: true` n'est pas la valeur par défaut de `@supabase/ssr`**,
 * qui laisse les jetons lisibles par le script de la page pour permettre
 * un client Supabase dans le navigateur. Cette application n'en a pas :
 * tout passe par le serveur. Un jeton lisible par du script est un jeton
 * qu'une seule faille d'injection suffit à voler — et il ouvrirait ici
 * l'accès à des images médicales.
 *
 * `secure` hors développement : en production et sur les aperçus, le site
 * n'est servi qu'en HTTPS ; en local, `http://localhost` doit continuer
 * de fonctionner.
 *
 * Ces options s'appliquent partout où un client Supabase écrit un cookie —
 * le proxy, qui rafraîchit la session, et les actions serveur. Les
 * déclarer à un seul endroit évite qu'un des deux chemins les oublie.
 */
export const SESSION_COOKIE_OPTIONS: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development",
  sameSite: "lax",
  path: "/",
};
