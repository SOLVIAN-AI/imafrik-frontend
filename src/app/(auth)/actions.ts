"use server";

import { redirect } from "next/navigation";

import { isDemoMode } from "@/lib/demo/mode";
import { homeFor } from "@/lib/navigation";
import { safeRedirect } from "@/lib/security/redirect";
import { getAuthState } from "@/lib/session/server";
import { createClient } from "@/lib/supabase/server";

/** Résultat d'une tentative d'authentification. */
export interface AuthState {
  error?: string;
}

/**
 * Connexion par adresse et mot de passe.
 *
 * Le message d'erreur est **volontairement identique** que l'adresse
 * soit inconnue ou le mot de passe faux : distinguer les deux
 * permettrait de découvrir qui possède un compte, donc qui travaille
 * dans quel établissement.
 *
 * La destination de retour (`suite`) est validée par `safeRedirect` :
 * un paramètre d'URL ne doit jamais pouvoir renvoyer hors de
 * l'application après la connexion.
 *
 * @param _previous État précédent, imposé par `useActionState`.
 * @param formData  Champs du formulaire.
 */
export async function signIn(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const suite = safeRedirect(String(formData.get("suite") ?? ""));

  if (!email.includes("@") || password.length === 0) {
    return { error: "Renseignez votre adresse et votre mot de passe." };
  }

  if (!isDemoMode()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: "Adresse ou mot de passe incorrect." };
  }

  const state = await getAuthState();
  if (state === "anonymous")
    return { error: "Adresse ou mot de passe incorrect." };
  // Second facteur à enrôler ou vérifier : l'écran dédié, en gardant la
  // destination demandée pour y revenir ensuite.
  if (state === "mfa-required")
    redirect(
      suite
        ? `/double-authentification?suite=${encodeURIComponent(suite)}`
        : "/double-authentification",
    );
  // Compte valide sans organisation active : écran dédié, qui l'explique.
  if (state === "no-membership") redirect("/en-attente");

  redirect(suite ?? homeFor(state.active.role));
}

/**
 * Demande de réinitialisation du mot de passe.
 *
 * La réponse est la même que l'adresse existe ou non, pour la raison
 * exposée plus haut. L'appelant affiche donc toujours la confirmation.
 *
 * Le lien envoyé ramène à `/auth/callback`, qui ouvre la session puis
 * conduit au choix du nouveau mot de passe.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (isDemoMode() || !email.includes("@")) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${site}/auth/callback?suite=/nouveau-mot-de-passe`,
  });
}
