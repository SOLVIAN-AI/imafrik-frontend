"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteTemplate } from "@/lib/actions/templates";

/** Supprime un modèle de l'organisation, après confirmation. */
export function DeleteTemplateButton({
  templateId,
  name,
}: {
  templateId: string;
  name: string;
}) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Supprimer le modèle « ${name} » pour toute l’organisation ?`,
          )
        )
          return;
        startTransition(async () => {
          const result = await deleteTemplate(templateId);
          if (result.ok) toast.success("Modèle supprimé.");
          else toast.error(result.error);
        });
      }}
    >
      <Trash2 />
      Supprimer
    </Button>
  );
}
