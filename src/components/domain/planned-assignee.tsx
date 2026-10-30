"use client";

import { AlertTriangle, CalendarCheck, CheckCheck } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/info-tip";
import { useMessages } from "@/i18n/client";
import {
  type AssignmentPortal,
  type PlanConfirmation,
  type PlannedRadiologist,
  confirmPlanned,
} from "@/lib/actions/assignment";
import type { PlannedItem } from "@/lib/assignment-plan";
import { cn } from "@/lib/utils";

/** Le compte rendu d'une confirmation, en une ou deux notifications. */
function announce(
  result: PlanConfirmation,
  asked: number,
  text: ReturnType<typeof useMessages>["assignment"]["planned"],
) {
  if (result.assigned > 0) toast.success(text.confirmed(result.assigned));
  const left = asked - result.assigned;
  if (left > 0) toast.warning(text.left(left));
}

/**
 * Ce que le planning prévoit pour un examen à attribuer, sur sa ligne :
 * « Prévu : Dr X », ou les radiologues entre lesquels il hésite. Rien
 * quand personne n'est prévu.
 *
 * @param planned Radiologues prévus de l'examen.
 * @param compact Une colonne étroite : le nom seul, la bulle explique.
 */
export function PlannedNote({
  planned,
  compact = false,
}: {
  planned: readonly PlannedRadiologist[] | undefined;
  compact?: boolean;
}) {
  const text = useMessages().assignment.planned;
  if (!planned || planned.length === 0) return null;
  const names = planned.map((one) => one.name).join(", ");
  if (planned.length > 1) {
    return (
      <span
        data-testid="planned-conflict"
        className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-progress"
        title={text.conflict(names)}
      >
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{text.conflict(names)}</span>
      </span>
    );
  }
  return (
    <span
      data-testid="planned-radiologist"
      className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-accent"
      title={text.info}
    >
      <CalendarCheck className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">
        {compact ? planned[0].name : text.by(planned[0].name)}
      </span>
      {compact && <span className="sr-only">, {text.column}</span>}
    </span>
  );
}

/**
 * « Confirmer » : l'examen va au radiologue que le planning prévoit, d'un
 * geste. N'apparaît que s'il y en a un seul.
 *
 * @param portal  Portail de l'appelant.
 * @param studyId Examen.
 * @param patient Nom du patient, pour le nom accessible du bouton.
 * @param planned Radiologues prévus de l'examen.
 */
export function ConfirmPlannedButton({
  portal,
  studyId,
  patient,
  planned,
  className,
}: {
  portal: AssignmentPortal;
  studyId: string;
  patient: string;
  planned: readonly PlannedRadiologist[] | undefined;
  className?: string;
}) {
  const text = useMessages().assignment.planned;
  const [pending, startTransition] = React.useTransition();
  if (!planned || planned.length !== 1) return null;
  const [radiologist] = planned;
  const confirm = (event: React.MouseEvent) => {
    // Sur une ligne cliquable, le bouton ne l'ouvre pas.
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      const result = await confirmPlanned(portal, [
        { studyId, radiologistId: radiologist.profileId },
      ]);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      announce(result.data, 1, text);
    });
  };
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      disabled={pending}
      onClick={confirm}
      aria-label={text.confirmLabel(patient, radiologist.name)}
      className={cn("border-accent/40 text-accent", className)}
      data-testid="confirm-planned"
    >
      <CalendarCheck aria-hidden />
      {text.confirm}
    </Button>
  );
}

/**
 * « Tout confirmer » : chaque examen de la page qui a un radiologue prévu
 * lui est attribué, d'un geste. Absent s'il n'y en a aucun.
 *
 * @param portal Portail de l'appelant.
 * @param items  Examens et radiologues prévus (voir `confirmable`).
 */
export function ConfirmAllPlannedButton({
  portal,
  items,
  className,
}: {
  portal: AssignmentPortal;
  items: readonly PlannedItem[];
  className?: string;
}) {
  const text = useMessages().assignment.planned;
  const [pending, startTransition] = React.useTransition();
  if (items.length === 0) return null;
  const confirm = () =>
    startTransition(async () => {
      const result = await confirmPlanned(portal, [...items]);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      announce(result.data, items.length, text);
    });
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Button
        size="sm"
        loading={pending}
        disabled={pending}
        onClick={confirm}
        aria-label={text.confirmAllLabel(items.length)}
        data-testid="confirm-all-planned"
      >
        <CheckCheck aria-hidden />
        {text.confirmAll(items.length)}
      </Button>
      <InfoTip
        label={text.confirmAll(items.length)}
        text={text.confirmAllInfo}
        term="planning"
      />
    </span>
  );
}
