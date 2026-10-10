import { type NextRequest, NextResponse } from "next/server";

import { isSignedOutError } from "@/lib/session/resolve";
import {
  isSessionCookie,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/supabase/cookies";

/**
 * Session révoquée côté Supabase, jeton encore valide localement.
 *
 * **Le problème.** Une déconnexion globale (depuis un autre appareil, ou
 * par l'équipe IMAFRIK) supprime la session dans GoTrue, mais le jeton
 * d'accès déjà émis reste signé et non expiré jusqu'à une heure. Le
 * proxy, qui le vérifie localement (`getClaims`), le tient pour valide et
 * renvoie la connexion vers le portail ; le portail, qui interroge
 * GoTrue (`getUser`), le tient pour déconnecté et renvoie vers la
 * connexion. La page bascule de l'un à l'autre sans fin.
 *
 * **La réponse.** Sur l'écran de connexion seulement, c'est-à-dire là où
 * aboutit toute session refusée par un écran, le proxy confirme auprès de
 * GoTrue une session que le jeton dit ouverte. Refusée, elle est
 * reconnue pour ce qu'elle est : ses cookies sont effacés une fois, et
 * l'écran de connexion s'affiche au lieu de rediriger. La vérification
 * locale n'est en rien affaiblie : elle reste la seule utilisée partout
 * ailleurs, et GoTrue n'est interrogé ici que pour **fermer** un accès,
 * jamais pour en ouvrir un.
 *
 * Une panne de GoTrue (réseau, 5xx, limite de débit) ne vaut pas
 * révocation : le comportement d'avant s'applique, et l'écran d'erreur
 * du portail propose de réessayer.
 */

/** Réponse de `supabase.auth.getUser()`, réduite à ce qui sert ici. */
export interface UserCheck {
  error: unknown;
}

/**
 * Indique si GoTrue tient pour fermée une session dont le jeton est
 * encore valide localement.
 *
 * @param getUser Appel à `supabase.auth.getUser()` sur la requête.
 * @returns `true` si la session est révoquée, expirée côté service ou
 *          le compte supprimé ; `false` si elle est ouverte ou si le
 *          service n'a pas pu répondre.
 */
export async function isRevokedSession(
  getUser: () => Promise<UserCheck>,
): Promise<boolean> {
  try {
    const { error } = await getUser();
    return error ? isSignedOutError(error) : false;
  } catch {
    // Exception hors des erreurs du service (réseau coupé) : on ne sait
    // pas, ce n'est donc pas une révocation.
    return false;
  }
}

/**
 * Réponse qui laisse passer la requête en effaçant sa session révoquée.
 *
 * Les cookies de session sont retirés de la requête, pour que le rendu de
 * l'écran de connexion qui suit ne les voie plus, et expirés sur la
 * réponse, pour que le navigateur les oublie. Les options sont celles qui
 * les ont posés (`path` compris) : un cookie effacé sous un autre chemin
 * survivrait. Les autres cookies (langue, démonstration) sont conservés.
 *
 * @param request        Requête en cours.
 * @param requestHeaders En-têtes transmis au rendu (nonce, CSP, langue) ;
 *                       leur en-tête `cookie` est réécrit.
 * @returns La réponse, et les noms des cookies effacés.
 */
export function clearRevokedSession(
  request: NextRequest,
  requestHeaders: Headers,
): { response: NextResponse; cleared: string[] } {
  const cleared = request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter(isSessionCookie);
  for (const name of cleared) request.cookies.delete(name);
  const remaining = request.cookies.toString();
  if (remaining) requestHeaders.set("cookie", remaining);
  else requestHeaders.delete("cookie");

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const name of cleared)
    response.cookies.set(name, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return { response, cleared };
}
