"use client";

import { AlertTriangle } from "lucide-react";

import { useMessages } from "@/i18n/client";
import { blockedReason, type Eligibility } from "@/lib/assignment-blocker";

/**
 * Ce qu'une ligne d'examen à attribuer dit de qui peut le recevoir.
 *
 * Personne : « Personne ne peut le recevoir », en ambre, la raison en
 * info-bulle et pour les lecteurs d'écran ; le bouton « Attribuer » de la
 * ligne reste, et sa fenêtre dit quoi faire. Sinon, le libellé donné
 * (« À attribuer »), ou le nombre de radiologues possibles.
 *
 * @param found    Éligibilité lue par la page ; absente si inconnue.
 * @param modality Code DICOM de l'examen, pour nommer la modalité.
 * @param fallback Libellé d'un examen qu'on peut attribuer ; sans lui, le
 *                 nombre de radiologues possibles.
 * @param compact  Formulation courte, pour une colonne étroite.
 */
export function EligibilityNote({
  found,
  modality,
  fallback,
  compact = false,
}: {
  found: Eligibility | undefined;
  modality: string | null;
  fallback?: string;
  compact?: boolean;
}) {
  const text = useMessages().assignment;
  if (found && found.candidates === 0) {
    const reason = blockedReason(text, found.reason, modality);
    return (
      <span
        title={reason}
        data-testid="nobody-eligible"
        className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-progress"
      >
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">
          {compact ? text.blocked.compact : text.blocked.short}
        </span>
        <span className="sr-only"> : {reason}</span>
      </span>
    );
  }
  if (fallback)
    return (
      <span className="truncate text-xs font-medium text-progress">
        {fallback}
      </span>
    );
  if (!found) return null;
  return (
    <span className="truncate text-2xs text-tertiary">
      {compact
        ? text.blocked.candidatesCompact(found.candidates)
        : text.blocked.candidates(found.candidates)}
    </span>
  );
}
