"use server";

import { redirect } from "next/navigation";

import { homeFor } from "@/lib/navigation";
import { getSession } from "@/lib/session/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Résultat d'une tentative d'authentification. */
export interface AuthState {
  error?: string;
}

/**
 * Vérifie qu'une destination de retour est interne.
 *
 * Un paramètre d'URL contrôlé par l'appelant ne doit jamais servir de
 * cible de redirection sans contrôle : `?suite=https://exemple.test`
 * transformerait la page de connexion en tremplin d'hameçonnage — on
 * arrive sur le vrai domaine, on se connecte, et on repart sur un faux.
 *
 * @param target Valeur reçue du paramètre.
 * @returns Le chemin, s'il est interne ; `null` sinon.
 */
function safeRedirect(target: string | null): string | null {
  if (!target) return null;
  // Une barre unique, jamais deux : « //exemple.test » est une adresse
  // absolue pour le navigateur.
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  return target;
}

/**
 * Connexion par adresse et mot de passe.
 *
 * Le message d'erreur est **volontairement identique** que l'adresse
 * soit inconnue ou le mot de passe faux : distinguer les deux
 * permettrait de découvrir qui possède un compte, donc qui travaille
 * dans quel établissement.
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
  const suite = safeRedirect(String(formData.get("suite") ?? "") || null);

  if (!email.includes("@") || password.length === 0) {
    return { error: "Renseignez votre adresse et votre mot de passe." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: "Adresse ou mot de passe incorrect." };
    }
  }

  const session = await getSession();
  if (!session) {
    // Compte valide mais sans appartenance : c'est le cas d'un radiologue
    // dont le dossier attend encore sa validation.
    return {
      error:
        "Votre compte n’est rattaché à aucune organisation. Si vous venez " +
        "de déposer votre dossier, il est en cours de vérification.",
    };
  }

  redirect(suite ?? homeFor(session.active.role));
}

/**
 * Demande de réinitialisation du mot de passe.
 *
 * La réponse est la même que l'adresse existe ou non, pour la raison
 * exposée plus haut. L'appelant affiche donc toujours la confirmation.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?suite=/nouveau-mot-de-passe`,
  });
}

/**
 * Enregistre un nouveau mot de passe.
 *
 * Suppose une session ouverte par le lien de réinitialisation : c'est le
 * lien lui-même qui authentifie, et il n'est valable qu'une fois.
 */
export async function updatePassword(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
  }

  redirect("/connexion");
}
