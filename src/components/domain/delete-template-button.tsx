"use client";

import { Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { deleteTemplate } from "@/lib/actions/templates";

/** Supprime un modèle de l'organisation, après confirmation. */
export function DeleteTemplateButton({
  templateId,
  name,
}: {
  templateId: string;
  name: string;
}) {
  const t = useMessages();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() => {
        if (!window.confirm(t.reading.templates.deleteConfirm(name))) return;
        startTransition(async () => {
          const result = await deleteTemplate(templateId);
          if (result.ok) toast.success(t.reading.templates.deleted);
          else toast.error(result.error);
        });
      }}
    >
      <Trash2 />
      {t.common.actions.delete}
    </Button>
  );
}
