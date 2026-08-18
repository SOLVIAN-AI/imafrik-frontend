import { redirect } from "next/navigation";

import { getSession } from "@/lib/session/server";
import { stepsFor } from "@/lib/onboarding/steps";

/**
 * Entrée du parcours de mise en service.
 *
 * Elle n'affiche rien : elle envoie sur la première étape du parcours
 * correspondant au rôle. Un écran d'accueil supplémentaire, du type
 * « bienvenue, cliquez pour commencer », ne ferait qu'ajouter un clic à
 * quelqu'un qui vient précisément de cliquer pour commencer.
 *
 * Résolue côté serveur : la redirection part avant le moindre rendu, ce
 * qui évite l'apparition fugace d'un écran vide.
 */
export default async function OnboardingEntryPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  redirect(`/bienvenue/${stepsFor(session.active.role)[0].slug}`);
}
