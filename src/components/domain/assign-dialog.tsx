"use client";

import { FileCheck2, UserCheck } from "lucide-react";
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
import { useLocale, useMessages } from "@/i18n/client";
import {
  type AssignmentPortal,
  type AssignmentState,
  type PriorCandidate,
  assignStudy,
  getAssignment,
  getPriorCandidates,
  revokePriorShare,
  sharePriors,
  unassignStudy,
} from "@/lib/actions/assignment";
import { formatDate, formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Statuts d'un examen encore attribuable : pas encore signé. */
const ASSIGNABLE = new Set(["received", "assigned", "in_progress"]);

/**
 * Attribution d'un examen à un radiologue, avec ses antériorités.
 *
 * Une même fenêtre pour les deux portails : le responsable de la clinique
 * choisit parmi ses radiologues, l'équipe IMAFRIK parmi ceux du réseau.
 * Elle montre le titulaire actuel et les seuls radiologues qui peuvent
 * recevoir l'examen (habilités, lecteurs de sa modalité), les moins
 * chargés d'abord : le service n'en accepterait pas d'autre.
 *
 * **Antériorités.** La fenêtre cherche les examens antérieurs du patient
 * dans la même clinique : même identifiant d'abord, puis même nom et même
 * date de naissance, « à vérifier », avec de quoi vérifier. Rien n'est
 * coché d'office ; ce qui l'est est partagé avec le radiologue à
 * l'attribution. Pour le titulaire actuel, on ajoute ou on retire une
 * antériorité sans le réattribuer.
 *
 * Réattribuer un examen dont le compte-rendu est commencé demande de
 * cocher l'effacement du brouillon, que le service exige aussi.
 *
 * @param portal    Portail de l'appelant.
 * @param studyId   Examen à attribuer.
 * @param patient   Nom du patient, pour l'intitulé accessible du bouton.
 * @param assigned  L'examen a déjà un titulaire : le bouton dit « Réattribuer ».
 * @param compact   Bouton réduit à son icône (liste sur téléphone).
 */
export function AssignDialog({
  portal,
  studyId,
  patient,
  assigned = false,
  compact = false,
}: {
  portal: AssignmentPortal;
  studyId: string;
  patient: string;
  assigned?: boolean;
  compact?: boolean;
}) {
  const t = useMessages();
  const text = t.assignment.dialog;
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<AssignmentState | null>(null);
  const [priors, setPriors] = React.useState<PriorCandidate[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [choice, setChoice] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [discard, setDiscard] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(() => {
    setState(null);
    setPriors(null);
    setError(null);
    setChoice(null);
    setChecked(new Set());
    setDiscard(false);
    startTransition(async () => {
      const result = await getAssignment(portal, studyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setState(result.data);
      // Les antériorités se lisent pour le titulaire : ce qui lui est déjà
      // partagé s'affiche comme tel.
      const found = await getPriorCandidates(
        portal,
        studyId,
        result.data.assignedTo,
      );
      setPriors(found.ok ? found.data : []);
    });
  }, [portal, studyId]);

  const assignable = state ? ASSIGNABLE.has(state.status) : false;
  const changing = Boolean(choice && choice !== state?.assignedTo);
  const needsConfirmation = Boolean(state?.draftInProgress && changing);
  const chosen = state?.candidates.find((c) => c.profileId === choice);
  // Le radiologue à qui s'adressent les cases : le nouveau, ou le titulaire.
  const target = changing ? choice : (state?.assignedTo ?? null);
  const sharedFor = (prior: PriorCandidate) => !changing && prior.shared;
  const offered = (priors ?? []).filter((prior) => !sharedFor(prior));
  const sharing = !changing && Boolean(state?.assignedTo) && checked.size > 0;

  const toggle = (id: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (changing && choice && chosen) {
      startTransition(async () => {
        const result = await assignStudy(portal, studyId, choice, discard, [
          ...checked,
        ]);
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
      return;
    }
    if (sharing) {
      startTransition(async () => {
        const result = await sharePriors(portal, studyId, [...checked]);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success(text.shared(checked.size));
        setOpen(false);
      });
    }
  };

  const release = (discardDraft: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await unassignStudy(portal, studyId, discardDraft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.released);
      setOpen(false);
    });
  };

  const revoke = (shareId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await revokePriorShare(portal, studyId, shareId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setState(result.data);
      setPriors((current) =>
        (current ?? []).map((prior) =>
          result.data.priorShares.some(
            (share) => share.priorStudyId === prior.studyId,
          )
            ? prior
            : { ...prior, shared: false },
        ),
      );
      toast.success(text.unshared);
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
          aria-label={
            assigned
              ? text.triggerReassignLabel(patient)
              : text.triggerLabel(patient)
          }
          className={cn(compact && "px-2")}
          onClick={(event) => event.stopPropagation()}
        >
          <UserCheck />
          {!compact && (assigned ? text.triggerReassign : text.trigger)}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.title}</DialogTitle>
            <DialogDescription>{text.description}</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-5 pb-5">
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
                        {state.assignedAt && (
                          <span className="text-secondary">
                            {" · "}
                            {text.currentSince}{" "}
                            <DateTime date={new Date(state.assignedAt)} />
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-secondary">{text.nobody}</span>
                    )}
                  </p>
                </section>

                {!assignable ? (
                  <p className="text-sm text-secondary">{text.signed}</p>
                ) : (
                  <CandidateList
                    state={state}
                    portal={portal}
                    choice={choice}
                    onChoose={(id) => {
                      setChoice(id);
                      setDiscard(false);
                    }}
                  />
                )}

                {assignable && (
                  <PriorList
                    priors={priors}
                    state={state}
                    changing={changing}
                    offered={offered}
                    checked={checked}
                    onToggle={toggle}
                    onSelectAll={() =>
                      setChecked(new Set(offered.map((prior) => prior.studyId)))
                    }
                    onRevoke={revoke}
                    disabled={pending || !target}
                  />
                )}

                {assignable && state.draftInProgress && changing && (
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
              <ReleaseButton
                label={text.release}
                draft={state.draftInProgress}
                confirmLabel={text.confirmDraft}
                warning={text.draftWarning(state.assignedToName ?? "")}
                pending={pending}
                onRelease={release}
              />
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
              loading={pending && (changing || sharing)}
              disabled={
                !assignable ||
                pending ||
                !(changing || sharing) ||
                (needsConfirmation && !discard)
              }
            >
              {changing
                ? state?.assignedTo
                  ? text.reassign
                  : text.submit
                : sharing
                  ? text.share
                  : state?.assignedTo
                    ? text.reassign
                    : text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Les radiologues qui peuvent recevoir l'examen, à choisir. */
function CandidateList({
  state,
  portal,
  choice,
  onChoose,
}: {
  state: AssignmentState;
  portal: AssignmentPortal;
  choice: string | null;
  onChoose: (id: string) => void;
}) {
  const text = useMessages().assignment.dialog;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="label-eyebrow mb-1.5">{text.candidates}</legend>
      {state.modality && (
        <p className="-mt-1 mb-1 text-xs text-tertiary">
          {text.candidatesHint(state.modality)}
        </p>
      )}
      {state.candidates.length === 0 && (
        <p className="text-sm text-secondary">
          {portal === "clinic"
            ? text.noCandidatesClinic
            : text.noCandidatesTeam}
        </p>
      )}
      <div className="flex max-h-56 flex-col gap-1.5 overflow-auto">
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
                onChange={() => onChoose(candidate.profileId)}
                className="size-3.5 shrink-0 accent-[var(--accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {candidate.name}
                </span>
                <span className="block truncate text-xs text-secondary">
                  {candidate.viaPool ? text.pool : text.clinicRadiologist}
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
  );
}

/**
 * Antériorités du patient : celles déjà partagées avec le titulaire (à
 * retirer), puis celles à cocher, certaines d'abord, probables ensuite.
 */
function PriorList({
  priors,
  state,
  changing,
  offered,
  checked,
  onToggle,
  onSelectAll,
  onRevoke,
  disabled,
}: {
  priors: PriorCandidate[] | null;
  state: AssignmentState;
  changing: boolean;
  offered: PriorCandidate[];
  checked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onRevoke: (shareId: string) => void;
  disabled: boolean;
}) {
  const text = useMessages().assignment.priors;
  const locale = useLocale();
  if (priors === null) {
    return (
      <div aria-label={text.loading} className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12" />
      </div>
    );
  }
  // Partagées avec le titulaire, quand on ne le change pas : à retirer.
  const kept = changing ? [] : state.priorShares;
  const certain = offered.filter((prior) => prior.match === "certain");
  const probable = offered.filter((prior) => prior.match === "probable");

  const describe = (prior: {
    studyDate: string;
    modality: string | null;
    bodyPart: string | null;
  }) =>
    [
      formatDate(new Date(prior.studyDate), locale),
      [prior.modality, prior.bodyPart].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="label-eyebrow">{text.title}</h3>
        {offered.length > 1 && (
          <button
            type="button"
            onClick={onSelectAll}
            disabled={disabled}
            className="text-2xs font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent disabled:opacity-50"
          >
            {text.selectAll}
          </button>
        )}
      </div>
      {priors.length === 0 ? (
        <p className="text-xs text-secondary">{text.none}</p>
      ) : (
        <>
          <p className="text-xs text-tertiary">{text.hint}</p>

          {kept.length > 0 && state.assignedToName && (
            <div className="flex flex-col gap-1">
              <p className="text-2xs font-medium text-secondary">
                {text.forHolder(state.assignedToName)}
              </p>
              {kept.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-sunken/50 px-3 py-2 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {describe(share)}
                  </span>
                  <ReportMark signed={share.hasSignedReport} />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={disabled}
                    aria-label={text.revokeLabel(describe(share))}
                    onClick={() => onRevoke(share.id)}
                  >
                    {text.revoke}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {[
            {
              key: "certain",
              label: text.certain,
              hint: text.certainHint,
              list: certain,
            },
            {
              key: "probable",
              label: text.probable,
              hint: text.probableHint,
              list: probable,
            },
          ]
            .filter((group) => group.list.length > 0)
            .map((group) => (
              <fieldset key={group.key} className="flex flex-col gap-1">
                <legend
                  className={cn(
                    "mb-1 text-2xs font-medium",
                    group.key === "probable"
                      ? "text-progress"
                      : "text-secondary",
                  )}
                >
                  {group.label}
                  <span className="font-normal text-tertiary">
                    {" · "}
                    {group.hint}
                  </span>
                </legend>
                {group.list.map((prior) => (
                  <label
                    key={prior.studyId}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-xs transition-colors duration-100",
                      checked.has(prior.studyId)
                        ? "border-accent/40 bg-accent-muted"
                        : "border-border-subtle hover:bg-surface-hover",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(prior.studyId)}
                      disabled={disabled}
                      onChange={() => onToggle(prior.studyId)}
                      className="mt-0.5 size-3.5 shrink-0 accent-[var(--accent)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {describe(prior)}
                      </span>
                      {group.key === "probable" && (
                        <span className="block truncate text-2xs text-secondary">
                          {text.identity(
                            formatPatientName(prior.patientName ?? ""),
                            prior.patientId ?? "",
                            prior.patientBirthDate
                              ? formatDate(
                                  new Date(prior.patientBirthDate),
                                  locale,
                                )
                              : "",
                          )}
                        </span>
                      )}
                    </span>
                    <ReportMark signed={prior.hasSignedReport} />
                  </label>
                ))}
              </fieldset>
            ))}
        </>
      )}
    </section>
  );
}

/** Le compte-rendu signé d'une antériorité, s'il existe. */
function ReportMark({ signed }: { signed: boolean }) {
  const text = useMessages().assignment.priors;
  return signed ? (
    <span className="inline-flex shrink-0 items-center gap-1 text-2xs text-done">
      <FileCheck2 className="size-3" aria-hidden />
      {text.signedReport}
    </span>
  ) : (
    <span className="shrink-0 text-2xs text-tertiary">{text.noReport}</span>
  );
}

/**
 * Retrait de l'attribution. Un brouillon commencé s'efface avec, sur
 * confirmation : la case vit ici, à côté du bouton qu'elle débloque.
 */
function ReleaseButton({
  label,
  draft,
  confirmLabel,
  warning,
  pending,
  onRelease,
}: {
  label: string;
  draft: boolean;
  confirmLabel: string;
  warning: string;
  pending: boolean;
  onRelease: (discardDraft: boolean) => void;
}) {
  const [confirmed, setConfirmed] = React.useState(false);
  const [asking, setAsking] = React.useState(false);
  if (draft && asking) {
    return (
      <div className="mr-auto flex flex-col gap-1.5 text-2xs">
        <p className="text-progress">{warning}</p>
        <label className="flex items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="size-3.5 accent-[var(--accent)]"
          />
          {confirmLabel}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!confirmed || pending}
          loading={pending}
          onClick={() => onRelease(true)}
        >
          {label}
        </Button>
      </div>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mr-auto"
      disabled={pending}
      onClick={() => (draft ? setAsking(true) : onRelease(false))}
    >
      {label}
    </Button>
  );
}
