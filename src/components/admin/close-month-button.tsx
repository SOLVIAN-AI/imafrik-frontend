"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMessages } from "@/i18n/client";
import { closeBillingMonth } from "@/lib/actions/billing";

/**
 * « Clore le mois » : fige le relevé de chaque clinique. Définitif.
 *
 * Une confirmation dit ce que la clôture fige et qu'elle ne se défait
 * pas ; le geste ne part qu'au second clic.
 *
 * @param month      Mois `AAAA-MM`.
 * @param monthLabel Le mois en toutes lettres, pour les textes.
 */
export function CloseMonthButton({
  month,
  monthLabel,
}: {
  month: string;
  monthLabel: string;
}) {
  const t = useMessages();
  const text = t.admin.billing;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const close = () => {
    setError(null);
    startTransition(async () => {
      const result = await closeBillingMonth(month);
      if (result.ok) {
        setOpen(false);
        toast.success(text.closed(monthLabel));
        router.refresh();
        return;
      }
      setError(result.error);
      // Clos entre-temps par une autre session : l'écran le montre.
      if (result.status === 409) router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Lock aria-hidden />
          {text.close}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{text.closeTitle(monthLabel)}</DialogTitle>
          <DialogDescription>{text.closeDetail}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="px-5 pb-3 text-xs text-urgent">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {t.common.actions.cancel}
          </Button>
          <Button size="sm" onClick={close} loading={pending}>
            {text.closeConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
