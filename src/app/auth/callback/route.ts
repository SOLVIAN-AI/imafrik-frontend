import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/env";
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
  const suite = searchParams.get("suite") ?? "/worklist";

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(`${origin}/connexion?motif=lien-invalide`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?motif=lien-expire`);
  }

  // `suite` vient d'un lien que nous avons nous-mêmes fabriqué, mais il
  // transite par le courriel : on le traite comme une entrée non fiable.
  const target =
    suite.startsWith("/") && !suite.startsWith("//") ? suite : "/worklist";
  return NextResponse.redirect(`${origin}${target}`);
}
