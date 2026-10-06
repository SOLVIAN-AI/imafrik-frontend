import { NextResponse, type NextRequest } from "next/server";

import { isDemoMode } from "@/lib/demo/mode";
import { safeRedirect } from "@/lib/security/redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Retour des liens envoyés par courriel.
 *
 * Invitation, réinitialisation de mot de passe, confirmation d'adresse :
 * tous ces courriels renvoient ici avec un code à usage unique, qui est
 * échangé contre une session. Le code voyage dans l'URL — donc dans
 * l'historique du navigateur et les journaux du serveur — ce qui est
 * acceptable **parce qu'il est à usage unique et de courte durée** ; la
 * session, elle, repart dans un cookie `httpOnly`.
 *
 * En cas d'échec, on renvoie vers la connexion avec un motif lisible
 * plutôt que vers une page d'erreur : un lien expiré est le cas normal,
 * pas un incident.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // `suite` vient d'un lien que nous avons nous-mêmes fabriqué, mais il
  // transite par le courriel : on le traite comme une entrée non fiable.
  // À défaut, la connexion : le proxy y renvoie un utilisateur connecté
  // vers l’accueil de son portail.
  const target = safeRedirect(searchParams.get("suite")) ?? "/connexion";

  if (isDemoMode() || !code) {
    return NextResponse.redirect(`${origin}/connexion?motif=lien-invalide`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?motif=lien-expire`);
  }

  return NextResponse.redirect(`${origin}${target}`);
}
