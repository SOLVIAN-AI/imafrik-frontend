import type { NextRequest } from "next/server";

import { assertConfiguredInProduction } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Intergiciel de session.
 *
 * Il s'exécute avant chaque rendu pour deux raisons qui ne peuvent être
 * traitées ailleurs : renouveler le jeton d'accès — un composant serveur
 * rendu ne peut plus écrire de cookie — et refuser l'accès aux écrans
 * protégés avant que la moindre donnée ne soit lue.
 */
export async function middleware(request: NextRequest) {
  // Premier point de passage de toute requête : c'est ici qu'un
  // déploiement de production mal configuré doit s'arrêter, avant de
  // servir le moindre écran. Sans cet appel, la garantie documentée
  // n'existerait que sur le papier — ce qui a failli arriver.
  assertConfiguredInProduction();

  return updateSession(request);
}

export const config = {
  /**
   * Tout, sauf ce qui n'a pas de session à rafraîchir.
   *
   * Les fichiers statiques, les images optimisées et le favicon
   * représentent l'essentiel des requêtes : les faire passer par une
   * vérification de session ajouterait un aller-retour vers le serveur
   * d'authentification pour rien.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
