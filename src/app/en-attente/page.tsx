import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { StatusScreen } from "@/components/layout/status-screen";
import { homeFor } from "@/lib/navigation";
import { getAuthState } from "@/lib/session/server";

export const metadata: Metadata = {
  title: "Compte en attente",
  robots: { index: false, follow: false },
};

/**
 * Compte valide, rattaché à aucune organisation active.
 *
 * Deux situations y mènent : un radiologue dont le dossier attend sa
 * validation par l'équipe IMAFRIK, ou le membre d'une organisation
 * suspendue ou dont il a été retiré. Dans les deux cas, la connexion a
 * réussi — renvoyer vers l'écran de connexion produisait une boucle,
 * celui-ci renvoyant aussitôt vers un portail qui refusait l'entrée.
 *
 * L'écran dit donc ce qui se passe, et offre la seule sortie utile : se
 * déconnecter, pour se reconnecter sous un autre compte.
 */
export default async function PendingAccountPage() {
  const state = await getAuthState();
  if (state === "anonymous") redirect("/connexion");
  if (state === "mfa-required") redirect("/double-authentification");
  if (state !== "no-membership") redirect(homeFor(state.active.role));

  return (
    <StatusScreen
      code="En attente"
      title="Votre compte n’ouvre encore aucun espace"
      detail={
        <>
          <p>
            Vous êtes bien connecté, mais votre compte n’est rattaché à aucun
            établissement ni groupe de radiologie actif.
          </p>
          <p className="mt-3">
            Si vous venez de déposer votre dossier, il est en cours de
            vérification. Si vous utilisiez déjà IMAFRIK, votre accès a pu être
            retiré par votre établissement : rapprochez-vous de lui, ou
            écrivez-nous à contact@imafrik.tech.
          </p>
        </>
      }
      actions={<SignOutButton />}
    />
  );
}
