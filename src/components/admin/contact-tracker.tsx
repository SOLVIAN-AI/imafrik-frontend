"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { trackContactRequest } from "@/lib/actions/control";
import {
  CONTACT_STATUS_LABELS,
  type ContactStatus,
} from "@/lib/contact-status";

/**
 * Suivi d'une demande : étape et notes de l'équipe.
 *
 * Le bouton n'apparaît qu'en cas de modification : une rangée de boutons
 * « Enregistrer » identiques, sur une liste de vingt demandes, ne dit
 * plus rien de ce qui reste à enregistrer.
 */
export function ContactTracker({
  requestId,
  status,
  notes,
}: {
  requestId: string;
  status: ContactStatus;
  notes: string | null;
}) {
  const [draftStatus, setDraftStatus] = React.useState(status);
  const [draftNotes, setDraftNotes] = React.useState(notes ?? "");
  const [pending, startTransition] = React.useTransition();
  const dirty = draftStatus !== status || draftNotes.trim() !== (notes ?? "");

  const save = () => {
    startTransition(async () => {
      const result = await trackContactRequest({
        requestId,
        status: draftStatus,
        notes: draftNotes,
      });
      if (result.ok) toast.success("Suivi enregistré.");
      else toast.error(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Select
        aria-label="Étape du suivi"
        value={draftStatus}
        onChange={(event) =>
          setDraftStatus(event.target.value as ContactStatus)
        }
        className="sm:w-36"
      >
        {Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Textarea
        aria-label="Notes de l’équipe"
        value={draftNotes}
        onChange={(event) => setDraftNotes(event.target.value)}
        maxLength={4000}
        rows={1}
        placeholder="Notes : rappel prévu, devis envoyé…"
        className="min-h-8 flex-1 resize-y py-1.5 text-xs"
      />
      {dirty && (
        <Button size="sm" onClick={save} loading={pending} className="shrink-0">
          Enregistrer
        </Button>
      )}
    </div>
  );
}
