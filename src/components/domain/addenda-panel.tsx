"use client";

import { FilePlus2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DateTime } from "@/components/domain/date-time";
import { Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { addAddendum } from "@/lib/actions/reading";
import type { Addendum } from "@/lib/data/reports";

/**
 * Addenda d'un compte-rendu signé.
 *
 * Le compte-rendu ne change jamais après signature ; ses corrections
 * s'affichent ici, sous le document, dans l'ordre où elles ont été
 * faites, chacune datée et signée. La clinique les voit comme le
 * radiologue — c'est tout leur intérêt.
 *
 * Seul un radiologue peut en ajouter ; le service le vérifie, l'écran
 * n'affiche le formulaire qu'à lui.
 *
 * @param reportId Compte-rendu signé.
 * @param addenda  Corrections existantes.
 * @param canAdd   Afficher le formulaire d'ajout.
 */
export function AddendaPanel({
  reportId,
  addenda,
  canAdd,
}: {
  reportId: string;
  addenda: Addendum[];
  canAdd: boolean;
}) {
  if (addenda.length === 0 && !canAdd) return null;

  return (
    <Panel className="mt-4 flex flex-col overflow-hidden">
      <h2 className="label-eyebrow flex h-11 items-center border-b border-border-subtle px-4">
        Addenda
      </h2>

      {addenda.length > 0 ? (
        <ol className="divide-y divide-border-subtle">
          {addenda.map((addendum) => (
            <li key={addendum.id} className="px-4 py-3">
              <p className="text-2xs text-tertiary">
                <span className="font-medium text-secondary">
                  {[addendum.authorTitle, addendum.authorName]
                    .filter(Boolean)
                    .join(" ")}
                </span>
                {addendum.authorLicense &&
                  ` · Ordre n° ${addendum.authorLicense}`}{" "}
                · <DateTime date={addendum.createdAt} />
              </p>
              <p className="mt-1.5 text-sm whitespace-pre-wrap">
                {addendum.body}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-3 text-xs text-tertiary">
          Aucune correction depuis la signature.
        </p>
      )}

      {canAdd && <AddendumForm reportId={reportId} />}
    </Panel>
  );
}

/** Formulaire d'ajout. L'envoi est irréversible, comme la signature. */
function AddendumForm({ reportId }: { reportId: string }) {
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !window.confirm(
        "Ajouter cet addendum ? Il sera signé à votre nom, visible de la clinique, et ne pourra plus être modifié.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await addAddendum(reportId, body);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBody("");
      toast.success("Addendum ajouté et transmis.");
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 border-t border-border-subtle p-4"
    >
      <Field id="addendum" label="Nouvel addendum">
        <Textarea
          id="addendum"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          maxLength={10_000}
          placeholder="Correction ou complément au compte-rendu signé…"
        />
      </Field>
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          loading={pending}
          disabled={!body.trim()}
        >
          <FilePlus2 />
          Signer l’addendum
        </Button>
      </div>
    </form>
  );
}
