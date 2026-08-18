import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Connexion" };

/**
 * Connexion.
 *
 * Composant serveur : les paramètres d'adresse — la destination
 * demandée avant redirection, le motif d'un lien invalide — sont lus ici
 * plutôt que dans le navigateur. Les lire côté client obligerait à
 * envelopper la page d'une frontière de suspension pour que le rendu
 * statique reste possible, et rendrait le premier affichage dépendant de
 * l'exécution de script.
 *
 * **Aucune inscription depuis cet écran, et c'est un choix.** Une
 * clinique arrive avec un contrat de service, un radiologue avec un
 * dossier de qualifications vérifié : les deux entrent par invitation.
 * Un formulaire d'inscription libre créerait des comptes non validés en
 * face de données de santé.
 */
export default async function SignInPage({
  searchParams,
}: PageProps<"/connexion">) {
  const { suite, motif } = await searchParams;

  return (
    <SignInForm
      suite={typeof suite === "string" ? suite : ""}
      motif={typeof motif === "string" ? motif : undefined}
    />
  );
}
