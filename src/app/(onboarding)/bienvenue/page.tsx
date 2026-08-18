"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useSession } from "@/lib/demo/session";
import { stepsFor } from "@/lib/onboarding/steps";

/**
 * Entrée du parcours de mise en service.
 *
 * Elle n'affiche rien : elle envoie sur la première étape du parcours
 * correspondant au rôle. Un écran d'accueil supplémentaire, du type
 * « bienvenue, cliquez pour commencer », ne ferait qu'ajouter un clic à
 * quelqu'un qui vient précisément de cliquer pour commencer.
 *
 * La redirection a lieu **après le montage**, pas pendant le rendu : le
 * rôle vient de la session côté client, que le serveur ne connaît pas.
 * `replace` plutôt que `push` — cette adresse ne doit pas rester dans
 * l'historique, sinon le bouton « précédent » y ramènerait en boucle.
 */
export default function OnboardingEntryPage() {
  const router = useRouter();
  const { active, ready } = useSession();

  React.useEffect(() => {
    if (!ready) return;
    router.replace(`/bienvenue/${stepsFor(active.role)[0].slug}`);
  }, [ready, active.role, router]);

  return null;
}
