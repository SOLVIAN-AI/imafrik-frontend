"use client";

import { FilePlus2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DateTime } from "@/components/domain/date-time";
import { Panel } from "@/components/layout/app-shell";
import { PinEntry, usePinGesture } from "@/components/signing/pin-entry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { addAddendum } from "@/lib/actions/reading";
import type { Addendum } from "@/lib/data/reports";
import type { SigningContext } from "@/lib/data/signing";

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
 * @param signing  Code personnel du radiologue, pour la fenêtre de
 *                 signature de l'addendum.
 */
export function AddendaPanel({
  reportId,
  addenda,
  canAdd,
  signing = null,
}: {
  reportId: string;
  addenda: Addendum[];
  canAdd: boolean;
  signing?: SigningContext | null;
}) {
  const labels = useMessages().reading.addenda;
  if (addenda.length === 0 && !canAdd) return null;

  return (
    // Ancre `#addenda` : l'écran de lecture y mène pour corriger un
    // compte-rendu signé.
    <Panel
      className="mt-4 flex scroll-mt-4 flex-col overflow-hidden"
      id="addenda"
    >
      <h2 className="label-eyebrow flex h-11 items-center border-b border-border-subtle px-4">
        {labels.title}
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
                  ` · ${labels.license(addendum.authorLicense)}`}{" "}
                · <DateTime date={addendum.createdAt} />
              </p>
              <p className="mt-1.5 text-sm whitespace-pre-wrap">
                {addendum.body}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-3 text-xs text-tertiary">{labels.none}</p>
      )}

      {canAdd && <AddendumForm reportId={reportId} signing={signing} />}
    </Panel>
  );
}

/**
 * Formulaire d'ajout. L'envoi est irréversible, comme la signature : une
 * fenêtre le rappelle et demande le code personnel de l'auteur (ou le
 * lui fait créer, s'il n'en a pas encore).
 */
function AddendumForm({
  reportId,
  signing,
}: {
  reportId: string;
  signing: SigningContext | null;
}) {
  const t = useMessages();
  const labels = t.reading.addenda;
  const [body, setBody] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const gesture = usePinGesture(signing?.status ?? null);

  const changeOpen = (next: boolean) => {
    if (pending) return;
    if (!next) {
      gesture.clear();
      setError(null);
    }
    setConfirming(next);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await addAddendum(reportId, body, gesture.proof());
      if (!result.ok) {
        if (!(await gesture.fail(result))) setError(result.error);
        return;
      }
      gesture.succeed();
      setConfirming(false);
      setBody("");
      toast.success(labels.added);
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (body.trim()) changeOpen(true);
      }}
      className="flex flex-col gap-3 border-t border-border-subtle p-4"
    >
      <Field id="addendum" label={labels.label}>
        <Textarea
          id="addendum"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          maxLength={10_000}
          placeholder={labels.placeholder}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!body.trim()}>
          <FilePlus2 />
          {labels.submit}
        </Button>
      </div>

      <Dialog open={confirming} onOpenChange={changeOpen}>
        <DialogContent aria-describedby="addendum-consequences">
          <DialogHeader>
            <DialogTitle>{labels.dialogTitle}</DialogTitle>
            <DialogDescription id="addendum-consequences">
              {labels.dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-5 pb-5">
            <PinEntry gesture={gesture} idPrefix="addendum" autoFocus />
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
              onClick={() => changeOpen(false)}
            >
              {t.common.actions.cancel}
            </Button>
            <Button
              type="button"
              size="sm"
              loading={pending}
              disabled={!gesture.ready}
              onClick={submit}
            >
              <FilePlus2 />
              {labels.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
