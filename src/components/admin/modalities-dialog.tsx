"use client";

import { SlidersHorizontal } from "lucide-react";
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
import { setMembershipModalities } from "@/lib/actions/urgent-readers";
import type { ModalityGroup } from "@/lib/api/contracts";
import { MODALITY_GROUPS } from "@/lib/modalities";
import { cn } from "@/lib/utils";

/**
 * Modalités lues par un radiologue, par l'une de ses appartenances,
 * réglées par l'équipe IMAFRIK (un radiologue du réseau, surtout : ceux
 * d'une clinique se règlent aussi depuis son écran « Équipe »).
 *
 * Elles bornent ce qu'on peut lui attribuer et les urgences qu'il voit.
 * Toutes cochées : il lit tout.
 *
 * @param membershipId   Appartenance du radiologue.
 * @param name           Son nom.
 * @param organization   Organisation de l'appartenance.
 * @param readModalities Groupes lus ; `null` pour tous.
 */
export function ModalitiesDialog({
  membershipId,
  name,
  organization,
  readModalities,
}: {
  membershipId: string;
  name: string;
  organization: string;
  readModalities: ModalityGroup[] | null;
}) {
  const t = useMessages();
  const text = t.assignment.reading;
  const labels = t.assignment.modalities;
  const [open, setOpen] = React.useState(false);
  const [chosen, setChosen] = React.useState<Set<ModalityGroup>>(
    () => new Set(readModalities ?? MODALITY_GROUPS),
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const toggle = (group: ModalityGroup) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (chosen.size === 0) return;
    setError(null);
    const modalities =
      chosen.size === MODALITY_GROUPS.length
        ? null
        : MODALITY_GROUPS.filter((group) => chosen.has(group));
    startTransition(async () => {
      const result = await setMembershipModalities(membershipId, modalities);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.saved(name));
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setChosen(new Set(readModalities ?? MODALITY_GROUPS));
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          aria-label={text.triggerLabel(`${name} (${organization})`)}
          title={text.modalities}
        >
          <SlidersHorizontal className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.title(name)}</DialogTitle>
            <DialogDescription>{organization}</DialogDescription>
          </DialogHeader>
          <fieldset className="flex flex-col gap-2 px-5 pb-5">
            <legend className="label-eyebrow mb-1">{text.modalities}</legend>
            <p className="-mt-0.5 text-xs text-tertiary">
              {text.modalitiesHint}
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {MODALITY_GROUPS.map((group) => (
                <label
                  key={group}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors duration-100",
                    chosen.has(group)
                      ? "border-accent/40 bg-accent-muted"
                      : "border-border-subtle hover:bg-surface-hover",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={chosen.has(group)}
                    onChange={() => toggle(group)}
                    className="size-3.5 accent-[var(--accent)]"
                  />
                  {labels[group]}
                </label>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}
          </fieldset>
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
              disabled={pending || chosen.size === 0}
            >
              {text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
