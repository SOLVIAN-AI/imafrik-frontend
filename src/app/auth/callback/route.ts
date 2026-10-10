import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isDemoMode } from "@/lib/demo/mode";
import { safeRedirect } from "@/lib/security/redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Types de lien acceptés, et la page où chacun conduit à défaut de `suite`.
 *
 * Liste fermée : ce sont les deux seuls courriels qui mènent ici
 * (modèles générés par `tools/email_templates.py` dans le dépôt backend).
 * L'inscription libre est fermée et l'application ne change jamais
 * d'adresse de courriel : `signup` et `email_change` n'ont rien à faire
 * ici, et un type inconnu ne doit pas ouvrir de session.
 */
const LINK_TYPES = {
  invite: "/invitation",
  recovery: "/nouveau-mot-de-passe",
} as const satisfies Partial<Record<EmailOtpType, string>>;

type LinkType = keyof typeof LINK_TYPES;

/** Vrai si `value` est l'un des types de lien acceptés. */
function isLinkType(value: string | null): value is LinkType {
  return value !== null && Object.hasOwn(LINK_TYPES, value);
}

/**
 * Redirection relative : le navigateur la résout sur l'adresse qu'il a
 * lui-même ouverte.
 *
 * `request.nextUrl.origin` ne convient pas : hors de Vercel (`next start`,
 * derrière un mandataire), Next.js y met le nom d'hôte sur lequel le
 * serveur écoute, et non celui du lien suivi. Ouvert sur
 * `http://127.0.0.1:5173`, le lien d'invitation renvoyait ainsi vers
 * `http://localhost:5173/invitation` : les cookies de session, posés sur
 * 127.0.0.1, ne suivaient pas, et l'invité retombait sur l'écran de
 * connexion. Constaté lors de la répétition générale du 10 octobre 2026.
 *
 * @param path Chemin de destination, déjà validé (`safeRedirect`).
 */
function redirectTo(path: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

/**
 * Retour des liens envoyés par courriel.
 *
 * Deux formes arrivent ici :
 *
 * - **`token_hash` + `type`** : invitation et réinitialisation de mot de
 *   passe. Le jeton est vérifié côté serveur (`verifyOtp`), ce qui ouvre
 *   la session depuis n'importe quel appareil. Le lien par défaut de
 *   Supabase ne le permettait pas : une invitation faite par l'API
 *   renvoyait la session dans le fragment de l'adresse, que le serveur ne
 *   voit jamais, et une réinitialisation ouverte dans un autre navigateur
 *   échouait faute du vérificateur PKCE ;
 * - **`code`** (flux PKCE) : conservé pour les liens émis avant ce
 *   changement et pour tout flux qui le produirait encore.
 *
 * La destination suit dans `suite` : `/invitation` pour une personne
 * invitée (accueil, puis mot de passe), `/nouveau-mot-de-passe` pour une
 * réinitialisation. Le jeton voyage dans l'URL, donc dans l'historique du
 * navigateur et les journaux du serveur, ce qui est acceptable **parce
 * qu'il est à usage unique et de courte durée** ; la session, elle,
 * repart dans un cookie `httpOnly`.
 *
 * En cas d'échec, on renvoie vers la connexion avec un motif lisible
 * plutôt que vers une page d'erreur : un lien expiré est le cas normal,
 * pas un incident.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const invalid = () => redirectTo("/connexion?motif=lien-invalide");
  const expired = () => redirectTo("/connexion?motif=lien-expire");

  if (isDemoMode()) return invalid();

  // `suite` vient d'un lien que nous avons nous-mêmes fabriqué, mais il
  // transite par le courriel : on le traite comme une entrée non fiable.
  const suite = safeRedirect(searchParams.get("suite"));

  if (tokenHash) {
    if (!isLinkType(type)) return invalid();
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) return expired();
    return redirectTo(suite ?? LINK_TYPES[type]);
  }

  if (!code) return invalid();

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return expired();

  // À défaut, la connexion : le proxy y renvoie un utilisateur connecté
  // vers l’accueil de son portail.
  return redirectTo(suite ?? "/connexion");
}
