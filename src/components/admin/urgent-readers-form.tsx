"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import {
  type UrgentReader,
  setUrgentReaders,
} from "@/lib/actions/urgent-readers";
import { describeModalities } from "@/lib/modalities";
import { cn } from "@/lib/utils";

/**
 * Liste d'urgence d'une clinique, réglée par l'équipe IMAFRIK.
 *
 * Elle montre tous les radiologues qui peuvent lire la clinique : les
 * siens, et ceux du réseau sous contrat. Ceux qu'on coche peuvent prendre
 * une urgence sans attribution, dans leurs modalités, et en sont prévenus
 * par courriel ; le premier qui la prend l'obtient. Le responsable de la
 * clinique règle aussi les siens, un par un, depuis « Équipe » : la liste
 * est relue à chaque ouverture de la fiche.
 *
 * @param clinicId Clinique.
 * @param readers  Radiologues qui peuvent la lire, avec leur place.
 * @param readOnly Contrat terminé : la liste se consulte seulement.
 */
export function UrgentReadersForm({
  clinicId,
  readers,
  readOnly = false,
}: {
  clinicId: string;
  readers: UrgentReader[];
  readOnly?: boolean;
}) {
  const t = useMessages();
  const text = t.assignment.urgentReaders;
  const dialog = t.assignment.dialog;
  const initial = React.useMemo(
    () =>
      new Set(
        readers.filter((reader) => reader.urgentReader).map((r) => r.profileId),
      ),
    [readers],
  );
  const [chosen, setChosen] = React.useState<ReadonlySet<string>>(initial);
  const [pending, startTransition] = React.useTransition();
  const changed =
    chosen.size !== initial.size || [...chosen].some((id) => !initial.has(id));

  if (readers.length === 0) {
    return <p className="text-xs text-secondary">{text.empty}</p>;
  }

  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await setUrgentReaders(clinicId, [...chosen]);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(text.saved);
    });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-3">
      <p className="text-xs text-secondary">
        {chosen.size === 0 ? text.none : text.count(chosen.size)}
      </p>
      <fieldset className="flex flex-col gap-1.5" disabled={readOnly}>
        <legend className="sr-only">{text.title}</legend>
        {readers.map((reader) => (
          <label
            key={reader.profileId}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors duration-100",
              chosen.has(reader.profileId)
                ? "border-accent/40 bg-accent-muted"
                : "border-border-subtle hover:bg-surface-hover",
            )}
          >
            <input
              type="checkbox"
              checked={chosen.has(reader.profileId)}
              onChange={() => toggle(reader.profileId)}
              className="size-3.5 shrink-0 accent-[var(--accent)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {reader.name}
              </span>
              <span className="block truncate text-xs text-secondary">
                {reader.viaPool ? dialog.pool : dialog.clinicRadiologist}
                {" · "}
                {describeModalities(
                  reader.readModalities,
                  t.assignment.modalities,
                )}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {!readOnly && (
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            loading={pending}
            disabled={!changed || pending}
          >
            {text.submit}
          </Button>
        </div>
      )}
    </form>
  );
}
