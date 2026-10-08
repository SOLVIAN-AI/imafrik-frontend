import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MfaForm } from "@/components/auth/mfa-form";
import { getMessages } from "@/i18n/server";
import { isDemoMode } from "@/lib/demo/mode";
import { homeFor } from "@/lib/navigation";
import { getAuthState } from "@/lib/session/server";
import { createClient } from "@/lib/supabase/server";

/** Titre de l'onglet, dans la langue de l'utilisateur. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.session.mfa.title };
}

/**
 * Double authentification : enrôler une application, ou saisir son code.
 *
 * On n'arrive ici que redirigé — par le proxy, la connexion ou un écran
 * — parce que le jeton de la session n'ouvre aucune donnée tant que le
 * second facteur n'est pas vérifié. Deux cas :
 *
 * - **aucun facteur vérifié** : première connexion d'un radiologue ou
 *   d'un administrateur, ou facteur réinitialisé par l'équipe. On
 *   enrôle ;
 * - **un facteur existe** : on demande le code.
 *
 * S'y ajoute l'activation volontaire (`?activer=1`, depuis les
 * paramètres) : un compte de clinique qui choisit de se protéger. Une
 * fois activée, la double authentification lui est exigée comme aux
 * autres — c'est le hook qui en décide.
 */
export default async function MfaPage({
  searchParams,
}: PageProps<"/double-authentification">) {
  const { suite, activer } = await searchParams;
  const state = await getAuthState();
  if (state === "anonymous") redirect("/connexion");
  if (state === "no-membership") redirect("/en-attente");

  let verifiedFactorId: string | null = null;
  if (!isDemoMode()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    verifiedFactorId =
      data?.totp.find((factor) => factor.status === "verified")?.id ?? null;
  }

  if (state !== "mfa-required") {
    // Session déjà complète : seule l'activation volontaire, et seulement
    // sans facteur existant, a quelque chose à faire ici.
    if (activer !== "1" || verifiedFactorId || isDemoMode())
      redirect(homeFor(state.active.role));
  }

  return (
    <MfaForm
      factorId={verifiedFactorId}
      suite={typeof suite === "string" ? suite : ""}
    />
  );
}
