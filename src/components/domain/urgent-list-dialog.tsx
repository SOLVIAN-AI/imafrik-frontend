"use client";

import { Siren } from "lucide-react";
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
import { updateMemberReading } from "@/lib/actions/organization";

/**
 * La place d'un radiologue de la clinique sur sa liste d'urgence.
 *
 * Le responsable ne règle plus les modalités qu'un radiologue lit (décision
 * du 30 octobre 2026) : l'équipe IMAFRIK seule le fait, dans « Comptes ».
 * Il garde la liste d'urgence : un radiologue qui y figure peut prendre une
 * urgence sans attendre qu'on la lui confie.
 *
 * @param membershipId Appartenance du radiologue à la clinique.
 * @param name         Son nom, pour le titre.
 * @param urgentReader Sur la liste d'urgence.
 */
export function UrgentListDialog({
  membershipId,
  name,
  urgentReader,
}: {
  membershipId: string;
  name: string;
  urgentReader: boolean;
}) {
  const t = useMessages();
  const text = t.assignment.reading;
  const [open, setOpen] = React.useState(false);
  const [urgent, setUrgent] = React.useState(urgentReader);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateMemberReading(membershipId, urgent);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.urgentSaved(name));
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setUrgent(urgentReader);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          aria-label={text.triggerLabel(name)}
          title={text.trigger}
        >
          <Siren />
          <span className="hidden lg:inline">{text.trigger}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.urgentTitle(name)}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 px-5 pb-5">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle px-3 py-2.5 hover:bg-surface-hover">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(event) => setUrgent(event.target.checked)}
                className="mt-0.5 size-3.5 accent-[var(--accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Siren className="size-3.5 text-urgent" aria-hidden />
                  {text.urgent}
                </span>
                <span className="mt-0.5 block text-xs text-secondary">
                  {text.urgentHint}
                </span>
              </span>
            </label>

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
              onClick={() => setOpen(false)}
            >
              {t.common.actions.cancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={pending}
              disabled={pending || urgent === urgentReader}
            >
              {text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
