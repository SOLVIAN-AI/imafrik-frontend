"use client";

import { FileX2 } from "lucide-react";
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
import { Field, Textarea } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { voidReport } from "@/lib/actions/control";

/** Longueurs du motif, comme le service les vérifie. */
const REASON_MIN = 10;
const REASON_MAX = 500;

/**
 * Annulation d'un compte-rendu signé par erreur, par l'équipe IMAFRIK.
 *
 * Réservée aux erreurs qu'un addendum ne répare pas : un essai signé sur
 * un examen réel, un document rédigé sur le mauvais examen. La fenêtre dit
 * ce que fait le geste avant qu'on le fasse : document archivé, retiré,
 * examen remis dans la file, vérification publique « annulé ». Le motif
 * est exigé ; il reste avec l'archive, jamais au journal ni en public.
 *
 * @param reportId     Compte-rendu signé.
 * @param patientLabel Patient de l'examen, rappelé dans la confirmation.
 */
export function VoidReportButton({
  reportId,
  patientLabel,
}: {
  reportId: string;
  patientLabel: string;
}) {
  const text = useMessages().admin.voidReport;
  const common = useMessages().common;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const length = reason.trim().length;

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await voidReport(reportId, reason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.done(patientLabel));
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) {
          setReason("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <FileX2 aria-hidden />
          {text.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title(patientLabel)}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-5 pb-5">
          <Field id="void-reason" label={text.reason} hint={text.reasonHint}>
            <Textarea
              id="void-reason"
              rows={3}
              maxLength={REASON_MAX}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              autoFocus
            />
          </Field>
          {error && (
            <p role="alert" className="text-xs text-urgent">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {common.actions.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            loading={pending}
            disabled={length < REASON_MIN}
            onClick={confirm}
          >
            {text.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
