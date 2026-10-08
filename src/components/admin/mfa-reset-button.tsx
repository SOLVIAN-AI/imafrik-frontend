"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
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
  const text = useMessages().admin.mfaReset;
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    if (!window.confirm(text.confirm(fullName))) return;
    startTransition(async () => {
      const result = await resetUserMfa(profileId);
      if (result.ok) {
        toast.success(text.done(fullName));
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
      title={text.title}
    >
      <RotateCcw aria-hidden />
      {text.button}
    </Button>
  );
}
