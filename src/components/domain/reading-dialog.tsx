"use client";

import { Siren, SlidersHorizontal } from "lucide-react";
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
import type { ModalityGroup } from "@/lib/api/contracts";
import { MODALITY_GROUPS } from "@/lib/modalities";
import { cn } from "@/lib/utils";

/**
 * Réglage de la lecture d'un radiologue de la clinique : les modalités
 * qu'il lit, et sa place sur la liste d'urgence.
 *
 * Toutes les modalités cochées valent « il lit tout » ; il en faut au
 * moins une. Le service range la liste et la tient pour nulle quand tout
 * est coché.
 *
 * @param membershipId   Appartenance du radiologue à la clinique.
 * @param name           Son nom, pour le titre.
 * @param readModalities Groupes lus ; `null` pour tous.
 * @param urgentReader   Sur la liste d'urgence.
 */
export function ReadingDialog({
  membershipId,
  name,
  readModalities,
  urgentReader,
}: {
  membershipId: string;
  name: string;
  readModalities: ModalityGroup[] | null;
  urgentReader: boolean;
}) {
  const t = useMessages();
  const text = t.assignment.reading;
  const labels = t.assignment.modalities;
  const [open, setOpen] = React.useState(false);
  const [modalities, setModalities] = React.useState<Set<ModalityGroup>>(
    () => new Set(readModalities ?? MODALITY_GROUPS),
  );
  const [urgent, setUrgent] = React.useState(urgentReader);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    setModalities(new Set(readModalities ?? MODALITY_GROUPS));
    setUrgent(urgentReader);
    setError(null);
  };

  const toggle = (group: ModalityGroup) =>
    setModalities((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (modalities.size === 0) return;
    setError(null);
    const chosen =
      modalities.size === MODALITY_GROUPS.length
        ? null
        : MODALITY_GROUPS.filter((group) => modalities.has(group));
    startTransition(async () => {
      const result = await updateMemberReading(membershipId, chosen, urgent);
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
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          aria-label={text.triggerLabel(name)}
          title={text.trigger}
        >
          <SlidersHorizontal />
          <span className="hidden lg:inline">{text.trigger}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.title(name)}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 px-5 pb-5">
            <fieldset className="flex flex-col gap-2">
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
                      modalities.has(group)
                        ? "border-accent/40 bg-accent-muted"
                        : "border-border-subtle hover:bg-surface-hover",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={modalities.has(group)}
                      onChange={() => toggle(group)}
                      className="size-3.5 accent-[var(--accent)]"
                    />
                    {labels[group]}
                  </label>
                ))}
              </div>
            </fieldset>

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
              disabled={pending || modalities.size === 0}
            >
              {text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
