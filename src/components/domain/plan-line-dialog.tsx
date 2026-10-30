"use client";

import { Moon } from "lucide-react";
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
import { Input, Select } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { addPlanLine, updatePlanLine } from "@/lib/actions/assignment-plan";
import type { ModalityGroup } from "@/lib/api/contracts";
import {
  type AssignmentPlan,
  type CalendarDay,
  type PlanLine,
  type PlanLineInput,
  WEEKDAYS,
  type Weekday,
  addDays,
  dayAsDate,
  isOvernight,
  lineProblem,
  readsGroup,
} from "@/lib/assignment-plan";
import { formatDayShort } from "@/lib/format";
import { MODALITY_GROUPS } from "@/lib/modalities";
import { cn } from "@/lib/utils";

/** Heures proposées quand une ligne cesse de couvrir toute la journée. */
const DEFAULT_HOURS = { startsAt: "08:00", endsAt: "18:00" } as const;

/** Durée d'une ligne, telle que la fenêtre la propose. */
type Duration = "weekly" | "shownWeek" | "period";

const ALL_WEEK: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const WORKWEEK: Weekday[] = [1, 2, 3, 4, 5];

/** La durée d'une ligne existante, vue depuis la semaine affichée. */
function durationOf(line: PlanLineInput, monday: CalendarDay): Duration {
  if (line.startsOn === null) return "weekly";
  return line.startsOn === monday && line.endsOn === addDays(monday, 6)
    ? "shownWeek"
    : "period";
}

/** Une puce à bascule de la fenêtre : jour, modalité, raccourci. */
function Toggle({
  on,
  disabled,
  onClick,
  children,
  label,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-7 min-w-11 rounded-md border px-2 text-xs font-medium transition-colors duration-100",
        "focus-visible:ring-3 focus-visible:ring-accent/25 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        on
          ? "border-accent/40 bg-accent-muted text-primary"
          : "border-border-subtle text-secondary hover:bg-surface-hover",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Ajouter ou modifier une ligne du planning : un radiologue, des jours,
 * et au besoin une modalité, des heures, une période.
 *
 * La fenêtre vérifie ce qu'elle peut (jours, heures, période, modalité
 * lue) avant d'envoyer ; le service vérifie de même, et refuse le reste
 * (un radiologue étranger à la clinique). Le responsable ne choisit que
 * ses propres radiologues : ceux du réseau, l'équipe IMAFRIK les place.
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour le
 *                 responsable.
 * @param plan     Planning de la clinique.
 * @param monday   Lundi de la semaine affichée : « cette semaine seulement ».
 * @param line     Ligne à modifier ; absente pour en ajouter une.
 * @param children Bouton qui ouvre la fenêtre.
 */
export function PlanLineDialog({
  clinicId,
  plan,
  monday,
  line,
  children,
}: {
  clinicId: string | null;
  plan: AssignmentPlan;
  monday: CalendarDay;
  line?: PlanLine;
  children: React.ReactNode;
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.assignment.plan;
  const id = React.useId();
  const choosable = plan.radiologists.filter(
    (radiologist) =>
      clinicId !== null ||
      !radiologist.viaPool ||
      radiologist.profileId === line?.radiologistId,
  );
  const blank = (): PlanLineInput => ({
    radiologistId: choosable.length === 1 ? choosable[0].profileId : "",
    weekdays: WORKWEEK,
    startsAt: null,
    endsAt: null,
    modality: null,
    startsOn: null,
    endsOn: null,
  });
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<PlanLineInput>(
    () => line ?? blank(),
  );
  const [duration, setDuration] = React.useState<Duration>(() =>
    line ? durationOf(line, monday) : "weekly",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const reset = () => {
    setDraft(line ?? blank());
    setDuration(line ? durationOf(line, monday) : "weekly");
    setError(null);
    setTouched(false);
  };

  const sunday = addDays(monday, 6);
  const shownWeekLabel = text.shownWeek(
    formatDayShort(dayAsDate(monday), locale),
    formatDayShort(dayAsDate(sunday), locale),
  );
  // La période envoyée : celle de la durée choisie.
  const sent: PlanLineInput =
    duration === "weekly"
      ? { ...draft, startsOn: null, endsOn: null }
      : duration === "shownWeek"
        ? { ...draft, startsOn: monday, endsOn: sunday }
        : draft;
  const radiologist = plan.radiologists.find(
    (candidate) => candidate.profileId === draft.radiologistId,
  );
  const problem = lineProblem(sent, plan.today, radiologist);
  const allDay = draft.startsAt === null && draft.endsAt === null;

  const update = (change: Partial<PlanLineInput>) =>
    setDraft((current) => ({ ...current, ...change }));

  const toggleDay = (day: Weekday) =>
    update({
      weekdays: draft.weekdays.includes(day)
        ? draft.weekdays.filter((other) => other !== day)
        : [...draft.weekdays, day].sort((a, b) => a - b),
    });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (problem) return;
    setError(null);
    startTransition(async () => {
      const result = line
        ? await updatePlanLine(clinicId, line.id, sent)
        : await addPlanLine(clinicId, sent);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(line ? text.updated : text.added);
      setOpen(false);
    });
  };

  const sameDays = (days: Weekday[]) =>
    days.length === draft.weekdays.length &&
    days.every((day) => draft.weekdays.includes(day));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{line ? text.dialogEdit : text.dialogAdd}</DialogTitle>
            <DialogDescription>{text.dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${id}-radiologist`}
                className="text-xs font-medium text-secondary"
              >
                {text.radiologist}
              </label>
              <Select
                id={`${id}-radiologist`}
                value={draft.radiologistId}
                aria-invalid={touched && problem === "radiologist"}
                onChange={(event) =>
                  update({ radiologistId: event.target.value })
                }
              >
                <option value="" disabled>
                  {text.chooseRadiologist}
                </option>
                {choosable.map((candidate) => (
                  <option key={candidate.profileId} value={candidate.profileId}>
                    {candidate.viaPool
                      ? `${candidate.name} · ${text.network}`
                      : candidate.name}
                  </option>
                ))}
              </Select>
            </div>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-xs font-medium text-secondary">
                {text.modality}
              </legend>
              <div className="flex flex-wrap gap-1">
                <Toggle
                  on={draft.modality === null}
                  onClick={() => update({ modality: null })}
                >
                  {text.modalityAll}
                </Toggle>
                {MODALITY_GROUPS.map((group: ModalityGroup) => (
                  <Toggle
                    key={group}
                    on={draft.modality === group}
                    disabled={
                      radiologist !== undefined &&
                      !readsGroup(radiologist, group) &&
                      draft.modality !== group
                    }
                    onClick={() => update({ modality: group })}
                  >
                    {t.assignment.modalities[group]}
                  </Toggle>
                ))}
              </div>
              {radiologist &&
                draft.modality !== null &&
                !readsGroup(radiologist, draft.modality) && (
                  <p className="text-2xs text-urgent">
                    {text.modalityNotRead(radiologist.name)}
                  </p>
                )}
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-xs font-medium text-secondary">
                {text.days}
              </legend>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((day) => (
                  <Toggle
                    key={day}
                    on={draft.weekdays.includes(day)}
                    onClick={() => toggleDay(day)}
                    label={text.dayNames[day - 1]}
                  >
                    {text.dayShort[day - 1]}
                  </Toggle>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                <Toggle
                  on={sameDays(ALL_WEEK)}
                  onClick={() => update({ weekdays: ALL_WEEK })}
                >
                  {text.allWeek}
                </Toggle>
                <Toggle
                  on={sameDays(WORKWEEK)}
                  onClick={() => update({ weekdays: WORKWEEK })}
                >
                  {text.workweek}
                </Toggle>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-xs font-medium text-secondary">
                {text.hoursLabel}
              </legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(event) =>
                    update(
                      event.target.checked
                        ? { startsAt: null, endsAt: null }
                        : DEFAULT_HOURS,
                    )
                  }
                  className="size-3.5 accent-[var(--accent)]"
                />
                {text.allDayLong}
              </label>
              {!allDay && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label htmlFor={`${id}-start`} className="text-secondary">
                    {text.from}
                  </label>
                  <Input
                    id={`${id}-start`}
                    type="time"
                    value={draft.startsAt ?? ""}
                    aria-invalid={
                      touched &&
                      (problem === "hours" || problem === "sameHours")
                    }
                    onChange={(event) =>
                      update({ startsAt: event.target.value || null })
                    }
                    className="w-28"
                  />
                  <label htmlFor={`${id}-end`} className="text-secondary">
                    {text.to}
                  </label>
                  <Input
                    id={`${id}-end`}
                    type="time"
                    value={draft.endsAt ?? ""}
                    aria-invalid={
                      touched &&
                      (problem === "hours" || problem === "sameHours")
                    }
                    onChange={(event) =>
                      update({ endsAt: event.target.value || null })
                    }
                    className="w-28"
                  />
                  {isOvernight(draft) && (
                    <span className="inline-flex items-center gap-1 text-2xs text-tertiary">
                      <Moon className="size-3" aria-hidden />
                      {text.overnight}
                    </span>
                  )}
                </div>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-xs font-medium text-secondary">
                {text.duration}
              </legend>
              {(
                [
                  ["weekly", text.everyWeek],
                  ["shownWeek", shownWeekLabel],
                  ["period", text.period],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name={`${id}-duration`}
                    checked={duration === value}
                    onChange={() => {
                      setDuration(value);
                      if (value === "period" && draft.startsOn === null) {
                        update({ startsOn: monday, endsOn: sunday });
                      }
                    }}
                    className="size-3.5 accent-[var(--accent)]"
                  />
                  {label}
                </label>
              ))}
              {duration === "period" && (
                <div className="flex flex-wrap items-center gap-2 pl-5 text-xs">
                  <label htmlFor={`${id}-from`} className="text-secondary">
                    {text.periodFrom}
                  </label>
                  <Input
                    id={`${id}-from`}
                    type="date"
                    min={plan.today}
                    value={draft.startsOn ?? ""}
                    onChange={(event) =>
                      update({ startsOn: event.target.value || null })
                    }
                    className="w-40"
                  />
                  <label htmlFor={`${id}-to`} className="text-secondary">
                    {text.periodTo}
                  </label>
                  <Input
                    id={`${id}-to`}
                    type="date"
                    min={draft.startsOn ?? plan.today}
                    value={draft.endsOn ?? ""}
                    onChange={(event) =>
                      update({ endsOn: event.target.value || null })
                    }
                    className="w-40"
                  />
                </div>
              )}
            </fieldset>

            {touched && problem && (
              <p role="alert" className="text-xs text-urgent">
                {text.problems[problem]}
              </p>
            )}
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
              disabled={pending}
            >
              {line ? text.submitEdit : text.submitAdd}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
