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
 * Origine des redirections : celle du site déclaré, à défaut celle de la
 * requête.
 *
 * L'origine de la requête n'est pas fiable hors de Vercel : servi par
 * `next start` (un conteneur, un serveur derrière un mandataire), un
 * gestionnaire de route reçoit l'adresse sur laquelle le serveur écoute,
 * `http://localhost:3000`, et non celle que le visiteur a ouverte. La
 * session, posée en cookie sur le domaine du lien, était alors perdue à
 * la redirection, et l'invité renvoyé à la connexion. Les parcours réels
 * de la CI l'ont révélé. Les liens des courriels sont bâtis sur l'adresse
 * du site : la redirection y reste.
 */
function redirectOrigin(request: NextRequest): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try {
      const origin = new URL(site).origin;
      if (origin !== "null") return origin;
    } catch {
      // Adresse invalide : signalée par l'écran de configuration requise.
    }
  }
  return request.nextUrl.origin;
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
  const origin = redirectOrigin(request);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const invalid = () =>
    NextResponse.redirect(`${origin}/connexion?motif=lien-invalide`);
  const expired = () =>
    NextResponse.redirect(`${origin}/connexion?motif=lien-expire`);

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
    return NextResponse.redirect(`${origin}${suite ?? LINK_TYPES[type]}`);
  }

  if (!code) return invalid();

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return expired();

  // À défaut, la connexion : le proxy y renvoie un utilisateur connecté
  // vers l’accueil de son portail.
  return NextResponse.redirect(`${origin}${suite ?? "/connexion"}`);
}
