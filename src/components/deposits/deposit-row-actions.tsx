"use client";

import { AlertTriangle, Play, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useResumeDeposit } from "@/components/deposits/deposit-uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMessages } from "@/i18n/client";
import { cancelDeposit } from "@/lib/actions/deposits";
import type { InterruptedDeposit } from "@/lib/deposits";

/**
 * Gestes sur un envoi interrompu, depuis la liste : le reprendre (choisir
 * de nouveau le même fichier), ou l'annuler (ce qui en est reçu est
 * effacé, après confirmation).
 *
 * @param deposit Envoi interrompu.
 * @param team    `true` depuis la console de l'équipe IMAFRIK.
 */
export function DepositRowActions({
  deposit,
  team,
}: {
  deposit: InterruptedDeposit;
  team: boolean;
}) {
  const t = useMessages();
  const text = t.deposits.list;
  const resume = useResumeDeposit();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const cancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelDeposit(deposit.id, team);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      toast.success(text.cancelled);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => resume(deposit)}
        aria-label={text.resumeLabel(deposit.fileName)}
      >
        <Play />
        {text.resume}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label={text.cancelLabel(deposit.fileName)}
      >
        <X />
        {text.cancel}
      </Button>
      {confirming && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !pending) setConfirming(false);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{text.cancelLabel(deposit.fileName)}</DialogTitle>
              <DialogDescription>
                {text.cancelConfirm(deposit.fileName)}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <p
                role="alert"
                className="mx-5 mb-4 flex gap-2 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs text-urgent"
              >
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={pending}
              >
                {text.keep}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={pending}
                onClick={cancel}
              >
                {t.deposits.uploader.cancel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
