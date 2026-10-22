"use client";

import { UserCheck } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DateTime } from "@/components/domain/date-time";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useMessages } from "@/i18n/client";
import {
  type AssignmentState,
  assignStudy,
  getAssignment,
  unassignStudy,
} from "@/lib/actions/assignment";
import { cn } from "@/lib/utils";

/** Statuts d'un examen encore attribuable : pas encore signé. */
const ASSIGNABLE = new Set(["received", "assigned", "in_progress"]);

/**
 * Attribution d'un examen à un radiologue par l'équipe IMAFRIK.
 *
 * Demandé le 21 octobre 2026 : les radiologues libéraux lisent les
 * examens que l'équipe leur attribue. La fenêtre montre le titulaire
 * actuel et les seuls radiologues qui verraient l'examen, les moins
 * chargés d'abord : le service n'en accepterait pas d'autre. Réattribuer
 * un examen dont le compte-rendu est commencé demande de cocher
 * l'effacement du brouillon, que le service exige aussi.
 *
 * @param studyId Examen à attribuer.
 * @param patient Nom du patient, pour l'intitulé accessible du bouton.
 * @param compact Bouton réduit à son icône (liste sur téléphone).
 */
export function AssignDialog({
  studyId,
  patient,
  compact = false,
}: {
  studyId: string;
  patient: string;
  compact?: boolean;
}) {
  const t = useMessages();
  const text = t.admin.assign;
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<AssignmentState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [choice, setChoice] = React.useState<string | null>(null);
  const [discard, setDiscard] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(() => {
    setState(null);
    setError(null);
    setChoice(null);
    setDiscard(false);
    startTransition(async () => {
      const result = await getAssignment(studyId);
      if (result.ok) setState(result.data);
      else setError(result.error);
    });
  }, [studyId]);

  const assignable = state ? ASSIGNABLE.has(state.status) : false;
  const changing = Boolean(choice && choice !== state?.assignedTo);
  const needsConfirmation = Boolean(state?.draftInProgress && changing);
  const chosen = state?.candidates.find((c) => c.profileId === choice);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!choice || !chosen) return;
    setError(null);
    startTransition(async () => {
      const result = await assignStudy(studyId, choice, discard);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.notified === false) {
        toast.warning(text.assignedNotNotified(chosen.name));
      } else {
        toast.success(text.assigned(chosen.name));
      }
      setOpen(false);
    });
  };

  const release = () => {
    setError(null);
    startTransition(async () => {
      const result = await unassignStudy(studyId, discard);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.released);
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) load();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          aria-label={text.triggerLabel(patient)}
          className={cn(compact && "px-2")}
        >
          <UserCheck />
          {!compact && text.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.title}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-5">
            {!state && !error && (
              <div aria-label={text.loading} className="flex flex-col gap-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            )}

            {state && (
              <>
                <section>
                  <h3 className="label-eyebrow mb-1.5">{text.current}</h3>
                  <p className="text-sm">
                    {state.assignedToName ? (
                      <>
                        <span className="font-medium">
                          {state.assignedToName}
                        </span>
                        <span className="text-secondary">
                          {" · "}
                          {state.assignedAt ? (
                            <>
                              {text.currentSince}{" "}
                              <DateTime date={new Date(state.assignedAt)} />
                            </>
                          ) : (
                            text.claimedByRadiologist
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-secondary">{text.nobody}</span>
                    )}
                  </p>
                </section>

                {!assignable ? (
                  <p className="text-sm text-secondary">{text.signed}</p>
                ) : (
                  <fieldset className="flex flex-col gap-1.5">
                    <legend className="label-eyebrow mb-1.5">
                      {text.candidates}
                    </legend>
                    {state.candidates.length === 0 && (
                      <p className="text-sm text-secondary">
                        {text.noCandidates}
                      </p>
                    )}
                    <div className="flex max-h-72 flex-col gap-1.5 overflow-auto">
                      {state.candidates.map((candidate) => {
                        const holder = candidate.profileId === state.assignedTo;
                        const selected = choice === candidate.profileId;
                        return (
                          <label
                            key={candidate.profileId}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors duration-100",
                              selected
                                ? "border-accent/40 bg-accent-muted"
                                : "border-border-subtle hover:bg-surface-hover",
                              holder && "cursor-default opacity-60",
                            )}
                          >
                            <input
                              type="radio"
                              name="assign-radiologist"
                              value={candidate.profileId}
                              checked={selected}
                              disabled={holder}
                              onChange={() => {
                                setChoice(candidate.profileId);
                                setDiscard(false);
                              }}
                              className="size-3.5 shrink-0 accent-[var(--accent)]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {candidate.name}
                              </span>
                              <span className="block truncate text-xs text-secondary">
                                {candidate.viaPool
                                  ? text.pool
                                  : text.clinicRadiologist}
                                {" · "}
                                {candidate.organizationName}
                              </span>
                            </span>
                            <span className="shrink-0 text-2xs text-secondary tabular-nums">
                              {text.load(candidate.openStudies)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {assignable && state.draftInProgress && (
                  <div className="flex flex-col gap-2 rounded-lg border border-progress/30 bg-progress-muted px-3 py-2.5 text-xs">
                    <p>{text.draftWarning(state.assignedToName ?? "")}</p>
                    <label className="flex cursor-pointer items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={discard}
                        onChange={(event) => setDiscard(event.target.checked)}
                        className="size-3.5 accent-[var(--accent)]"
                      />
                      {text.confirmDraft}
                    </label>
                  </div>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="text-xs text-urgent">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            {state?.assignedTo && assignable && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mr-auto"
                loading={pending && !choice}
                disabled={pending || (state.draftInProgress && !discard)}
                onClick={release}
              >
                {text.release}
              </Button>
            )}
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
              loading={pending && Boolean(choice)}
              disabled={
                !assignable ||
                !changing ||
                pending ||
                (needsConfirmation && !discard)
              }
            >
              {state?.assignedTo ? text.reassign : text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
