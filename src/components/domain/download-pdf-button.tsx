"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { getReportPdfLink } from "@/lib/actions/reading";

/**
 * Téléchargement du PDF signé.
 *
 * Le lien est demandé **au clic** : c'est une adresse pré-signée, valable
 * quelques minutes — calculée à l'affichage de la page, elle aurait
 * expiré avant qu'on s'en serve. Le premier téléchargement par la
 * clinique marque aussi l'examen comme livré ; la page est rafraîchie
 * pour le refléter.
 *
 * @param reportId Compte-rendu signé ; `null` tant qu'il n'existe pas.
 */
export function DownloadPdfButton({
  reportId,
  size = "sm",
}: {
  reportId: string | null;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const t = useMessages();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      size={size}
      disabled={!reportId}
      loading={pending}
      onClick={() =>
        reportId &&
        startTransition(async () => {
          const result = await getReportPdfLink(reportId);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          window.location.assign(result.data);
          router.refresh();
        })
      }
    >
      <Download />
      {t.clinic.reports.downloadPdf}
    </Button>
  );
}
