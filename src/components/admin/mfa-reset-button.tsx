"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resetUserMfa } from "@/lib/actions/control";

/**
 * Réinitialisation de la double authentification d'un compte.
 *
 * La porte de secours quand un radiologue a perdu son téléphone. Elle ne
 * supprime pas l'exigence — le compte devra enrôler un nouveau facteur —
 * mais elle annule la protection jusque-là : la confirmation rappelle de
 * vérifier l'identité de la personne **par un autre canal** avant, faute
 * de quoi elle servirait d'abord à qui a volé le mot de passe.
 */
export function MfaResetButton({
  profileId,
  fullName,
}: {
  profileId: string;
  fullName: string;
}) {
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    if (
      !window.confirm(
        `Réinitialiser la double authentification de ${fullName} ?\n\n` +
          "Vérifiez d’abord son identité par un autre canal — un appel à un numéro connu. " +
          "À sa prochaine connexion, il ou elle enrôlera un nouveau téléphone.",
      )
    )
      return;
    startTransition(async () => {
      const result = await resetUserMfa(profileId);
      if (result.ok) {
        toast.success(`Double authentification de ${fullName} réinitialisée.`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={reset}
      title="Téléphone perdu ou changé"
    >
      <RotateCcw aria-hidden />
      Réinitialiser
    </Button>
  );
}
