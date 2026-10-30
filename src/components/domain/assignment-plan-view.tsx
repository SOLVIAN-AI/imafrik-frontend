"use client";

import {
  AlertTriangle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  Moon,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { PlanLineDialog } from "@/components/domain/plan-line-dialog";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColumnLabel } from "@/components/ui/info-tip";
import { useLocale, useMessages } from "@/i18n/client";
import { copyPlanWeek, removePlanLine } from "@/lib/actions/assignment-plan";
import type { ModalityGroup } from "@/lib/api/contracts";
import {
  type AssignmentPlan,
  type CalendarDay,
  type PlanLine,
  type PlanRadiologist,
  conflictsOfWeek,
  dayAsDate,
  daysSummary,
  isCalendarDay,
  isDated,
  isOvernight,
  linesOfWeek,
  mondayOf,
  readsGroup,
  startsOnDay,
  weekCopyPreview,
  weekDays,
  weekdayOf,
  addDays,
} from "@/lib/assignment-plan";
import type { BarDimension } from "@/lib/filters/dimensions";
import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { readFilters } from "@/lib/filters/url";
import { formatDate, formatDayShort } from "@/lib/format";
import { MODALITY_GROUPS } from "@/lib/modalities";
import { cn } from "@/lib/utils";

/** Paramètre d'adresse de la semaine affichée : son lundi. */
export const WEEK_PARAM = "semaine";

/** Paramètre d'adresse de la présentation : par modalité, ou par radiologue. */
export const VIEW_PARAM = "vue";

/** Valeur de la présentation par modalité ; sans elle, par radiologue. */
const BY_MODALITY = "modalite";

/**
 * Valeurs d'une ligne pour chaque filtre. Une ligne pour toutes les
 * modalités vaut pour chacune : filtrée sur l'IRM, elle reste, car elle
 * couvre aussi les IRM.
 */
const LINE_VALUES: RowValues<PlanLine> = {
  radiologist: (line) => [line.radiologistId],
  modality: (line) => (line.modality ? [line.modality] : MODALITY_GROUPS),
};

/** Ordre des lignes : chaque semaine d'abord, puis datées, puis par heure. */
function byStart(a: PlanLine, b: PlanLine): number {
  return (
    Number(isDated(a)) - Number(isDated(b)) ||
    (a.startsOn ?? "").localeCompare(b.startsOn ?? "") ||
    (a.startsAt ?? "").localeCompare(b.startsAt ?? "") ||
    a.id.localeCompare(b.id)
  );
}

/**
 * Le planning d'attribution d'une clinique, semaine par semaine.
 *
 * - **Une vue de la semaine** : les jours en colonnes, une rangée par
 *   radiologue ou par modalité ; sur un téléphone, ou une fenêtre étroite,
 *   une liste jour par jour (rien ne défile en largeur).
 * - **La semaine, la présentation et les filtres sont dans l'adresse**
 *   (`?semaine=`, `?vue=`, `?radiologue=`, `?modalite=`) : une vue se
 *   partage et survit au rechargement. « Cette semaine » est celle de la
 *   clinique, à son heure.
 * - **Les conflits sont signalés** : deux lignes aussi précises pour deux
 *   radiologues, qui se recouvrent, ne proposent personne.
 * - **Recopier la semaine précédente** reprend ses lignes datées.
 *
 * Partagé par le responsable (« Équipe › Planning d'attribution », ses
 * radiologues ; ceux du réseau que l'équipe IMAFRIK a placés, il les
 * retire sans les modifier) et l'équipe IMAFRIK (fiche de la clinique et
 * vue des cliniques, radiologues du réseau compris).
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour le
 *                 responsable.
 * @param plan     Planning lu par la page.
 * @param readOnly Contrat terminé : le planning se consulte seulement.
 */
export function AssignmentPlanView({
  clinicId,
  plan,
  readOnly = false,
}: {
  clinicId: string | null;
  plan: AssignmentPlan;
  readOnly?: boolean;
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.assignment.plan;
  const pathname = usePathname();
  const params = useSearchParams();

  const currentMonday = mondayOf(plan.today);
  const asked = params.get(WEEK_PARAM);
  const monday =
    asked && isCalendarDay(asked) && weekdayOf(asked) === 1
      ? asked
      : currentMonday;
  const byModality = params.get(VIEW_PARAM) === BY_MODALITY;
  const filters = readFilters(
    Object.fromEntries(params.entries()),
    LIST_FILTERS.planning,
  );

  /** L'adresse de la page, avec ces paramètres changés (`null` : retiré). */
  const href = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const weekHref = (day: CalendarDay) =>
    href({ [WEEK_PARAM]: day === currentMonday ? null : day });

  const byId = new Map(plan.radiologists.map((r) => [r.profileId, r]));
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const days = weekDays(monday);
  const sunday = days[6];
  const weekLines = linesOfWeek(plan.lines, monday).sort(
    (a, b) =>
      nameOf(a.radiologistId).localeCompare(nameOf(b.radiologistId), locale) ||
      byStart(a, b),
  );
  const shown = filterRows(weekLines, LINE_VALUES, filters);
  const shownIds = new Set(shown.map((line) => line.id));

  // Une ligne compte si son radiologue peut recevoir des examens et lit
  // sa modalité : sinon le service l'ignore, et elle ne fait pas conflit.
  const counts = (line: PlanLine) => {
    const radiologist = byId.get(line.radiologistId);
    return (
      radiologist !== undefined &&
      radiologist.canReceive &&
      (line.modality === null || readsGroup(radiologist, line.modality))
    );
  };
  const conflicts = conflictsOfWeek(plan.lines, monday, counts).filter(
    (conflict) => shownIds.has(conflict.first) || shownIds.has(conflict.second),
  );
  const inConflict = new Set(
    conflicts.flatMap((conflict) =>
      conflict.days.flatMap((day) => [
        `${conflict.first}|${day}`,
        `${conflict.second}|${day}`,
      ]),
    ),
  );
  const lineById = new Map(plan.lines.map((line) => [line.id, line]));
  const blocked = plan.radiologists.filter(
    (radiologist) =>
      !radiologist.canReceive &&
      shown.some((line) => line.radiologistId === radiologist.profileId),
  );
  const notReading = shown.filter((line) => {
    const radiologist = byId.get(line.radiologistId);
    return (
      line.modality !== null &&
      radiologist !== undefined &&
      !readsGroup(radiologist, line.modality)
    );
  });

  const dimensions: BarDimension[] = [
    {
      key: "radiologist",
      ...countOptions(
        weekLines,
        LINE_VALUES,
        filters,
        "radiologist",
        [...new Set(weekLines.map((line) => line.radiologistId))].map(
          (value) => ({ value, label: nameOf(value) }),
        ),
      ),
    },
    {
      key: "modality",
      ...countOptions(
        weekLines,
        LINE_VALUES,
        filters,
        "modality",
        MODALITY_GROUPS.map((value) => ({ value })),
      ),
    },
  ];

  const canEdit = (line: PlanLine) =>
    !readOnly && (clinicId !== null || !byId.get(line.radiologistId)?.viaPool);
  const choosable = plan.radiologists.filter(
    (radiologist) => clinicId !== null || !radiologist.viaPool,
  );

  const preview = weekCopyPreview(plan.lines, monday);
  const pastWeek = monday < currentMonday;

  const hours = (line: PlanLine) =>
    line.startsAt === null || line.endsAt === null
      ? text.allDay
      : text.hours(line.startsAt, line.endsAt);
  const modalityName = (group: ModalityGroup | null) =>
    group === null ? text.allModalities : t.assignment.modalities[group];
  const daysOf = (line: PlanLine) =>
    daysSummary(line.weekdays, text.dayShort, text.allWeek, text.daysRange);
  const durationOf = (line: PlanLine) =>
    line.startsOn !== null && line.endsOn !== null
      ? text.dated(
          formatDayShort(dayAsDate(line.startsOn), locale),
          formatDayShort(dayAsDate(line.endsOn), locale),
        )
      : text.weekly;
  const describe = (line: PlanLine) =>
    [
      nameOf(line.radiologistId),
      modalityName(line.modality),
      daysOf(line),
      hours(line),
      durationOf(line),
    ].join(" · ");

  // Rangées de la vue : un radiologue, ou une modalité (« Toutes » d'abord).
  const rows: { key: string; label: string; lines: PlanLine[] }[] = byModality
    ? [null, ...MODALITY_GROUPS]
        .map((group) => ({
          key: group ?? "all",
          label: modalityName(group),
          lines: shown.filter((line) => line.modality === group),
        }))
        .filter((row) => row.lines.length > 0)
    : [...new Set(shown.map((line) => line.radiologistId))].map((id) => ({
        key: id,
        label: nameOf(id),
        lines: shown.filter((line) => line.radiologistId === id),
      }));

  /** Une ligne dans une case de la semaine. */
  const entry = (line: PlanLine, day: CalendarDay) => {
    const conflict = inConflict.has(`${line.id}|${day}`);
    const ignored = !counts(line);
    return (
      <li
        key={line.id}
        className={cn(
          "flex min-w-0 flex-col gap-0.5 rounded-md border px-1.5 py-1 text-2xs leading-tight",
          conflict
            ? "border-progress/50 bg-progress-muted"
            : "border-border-subtle bg-surface-raised",
          ignored && "opacity-60",
        )}
      >
        <span className="flex min-w-0 items-center gap-1 font-medium text-primary">
          {isDated(line) ? (
            <CalendarRange
              className="size-3 shrink-0 text-accent"
              aria-hidden
            />
          ) : (
            <Repeat className="size-3 shrink-0 text-tertiary" aria-hidden />
          )}
          <span className="truncate">
            {byModality
              ? nameOf(line.radiologistId)
              : modalityName(line.modality)}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1 text-secondary">
          {isOvernight(line) && (
            <Moon className="size-3 shrink-0" aria-hidden />
          )}
          <span className="truncate">{hours(line)}</span>
        </span>
        <span className="sr-only">
          {isDated(line) ? durationOf(line) : text.weekly}
        </span>
        {conflict && (
          <span className="inline-flex items-center gap-1 font-medium text-progress">
            <AlertTriangle className="size-3 shrink-0" aria-hidden />
            {text.conflictBadge}
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="assignment-plan">
      <p className="text-xs leading-relaxed text-secondary">
        {text.howItWorks}
      </p>

      {/* La semaine : précédente, suivante, et les deux repères du propriétaire. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav
          aria-label={text.weekLabel(
            formatDayShort(dayAsDate(monday), locale),
            formatDate(dayAsDate(sunday), locale),
          )}
          className="flex flex-wrap items-center gap-1.5"
        >
          <Button asChild variant="ghost" size="icon">
            <Link
              href={weekHref(addDays(monday, -7))}
              replace
              scroll={false}
              aria-label={text.previousWeek}
              title={text.previousWeek}
            >
              <ChevronLeft aria-hidden />
            </Link>
          </Button>
          <h2 className="text-sm font-semibold text-primary">
            {text.weekLabel(
              formatDayShort(dayAsDate(monday), locale),
              formatDate(dayAsDate(sunday), locale),
            )}
          </h2>
          <Button asChild variant="ghost" size="icon">
            <Link
              href={weekHref(addDays(monday, 7))}
              replace
              scroll={false}
              aria-label={text.nextWeek}
              title={text.nextWeek}
            >
              <ChevronRight aria-hidden />
            </Link>
          </Button>
          {(
            [
              [currentMonday, text.thisWeek],
              [addDays(currentMonday, 7), text.followingWeek],
            ] as const
          ).map(([day, label]) => (
            <Button
              key={day}
              asChild
              variant={day === monday ? "secondary" : "ghost"}
              size="sm"
            >
              <Link
                href={weekHref(day)}
                replace
                scroll={false}
                aria-current={day === monday ? "date" : undefined}
              >
                {label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-1.5">
          {!readOnly && (
            <CopyWeekButton
              clinicId={clinicId}
              monday={monday}
              sources={preview.sources.length}
              replaced={preview.replaced.length}
              disabled={pastWeek}
            />
          )}
          {!readOnly && choosable.length > 0 && (
            <PlanLineDialog clinicId={clinicId} plan={plan} monday={monday}>
              <Button size="sm">
                <Plus aria-hidden />
                {text.add}
              </Button>
            </PlanLineDialog>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterBar
          dimensions={dimensions}
          active={filters}
          result={{ count: shown.length, noun: "planLines" }}
        />
        <div
          role="group"
          aria-label={text.view}
          className="inline-flex rounded-lg border border-border-subtle p-0.5"
        >
          {(
            [
              [false, text.byRadiologist],
              [true, text.byModality],
            ] as const
          ).map(([modality, label]) => (
            <Link
              key={label}
              href={href({ [VIEW_PARAM]: modality ? BY_MODALITY : null })}
              replace
              scroll={false}
              aria-current={byModality === modality ? "true" : undefined}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-accent",
                byModality === modality
                  ? "bg-accent-muted text-primary"
                  : "text-secondary hover:bg-surface-hover",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-2xs text-tertiary">{text.timeZone(plan.timeZone)}</p>

      {(conflicts.length > 0 ||
        blocked.length > 0 ||
        notReading.length > 0) && (
        <ul className="flex flex-col gap-1" data-testid="plan-warnings">
          {conflicts.map((conflict) => {
            const first = lineById.get(conflict.first)!;
            const second = lineById.get(conflict.second)!;
            return (
              <li
                key={`${conflict.first}|${conflict.second}`}
                className="flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2 text-xs text-progress"
              >
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                {text.conflict(
                  nameOf(first.radiologistId),
                  nameOf(second.radiologistId),
                  conflict.days
                    .map((day) => text.dayNames[weekdayOf(day) - 1])
                    .join(", "),
                )}
              </li>
            );
          })}
          {blocked.map((radiologist) => (
            <li
              key={radiologist.profileId}
              className="flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2 text-xs text-progress"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {text.cannotReceive(radiologist.name)}
            </li>
          ))}
          {notReading.map((line) => (
            <li
              key={line.id}
              className="flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2 text-xs text-progress"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {text.notReading(
                nameOf(line.radiologistId),
                modalityName(line.modality),
              )}
            </li>
          ))}
        </ul>
      )}

      {weekLines.length > 0 && shown.length === 0 && (
        <FilteredEmpty
          dimensions={dimensions}
          active={filters}
          noun="planLines"
        />
      )}
      {weekLines.length === 0 && (
        <p className="rounded-lg border border-dashed border-border-default px-3 py-3 text-xs text-secondary">
          {text.noLines}
        </p>
      )}

      {shown.length > 0 && (
        <>
          {/* Grand écran : la semaine en colonnes. */}
          <div className="hidden xl:block">
            <table className="w-full table-fixed border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th scope="col" className="w-44 pb-2 align-bottom">
                    <span className="label-eyebrow">
                      {byModality
                        ? text.modalityColumn
                        : text.radiologistColumn}
                    </span>
                  </th>
                  {days.map((day, index) => (
                    <th
                      key={day}
                      scope="col"
                      className={cn(
                        "px-1 pb-2 align-bottom text-xs font-medium whitespace-nowrap",
                        day === plan.today ? "text-accent" : "text-secondary",
                      )}
                    >
                      <abbr
                        title={text.dayNames[index]}
                        className="no-underline"
                      >
                        {text.dayShort[index]}
                      </abbr>{" "}
                      {formatDayShort(dayAsDate(day), locale)}
                      {day === plan.today && (
                        <span className="sr-only">, {text.today}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th
                      scope="row"
                      className="truncate border-t border-border-subtle py-2 pr-2 align-top text-xs font-medium text-primary"
                    >
                      {row.label}
                    </th>
                    {days.map((day) => {
                      const entries = row.lines.filter((line) =>
                        startsOnDay(line, day),
                      );
                      return (
                        <td
                          key={day}
                          className={cn(
                            "border-t border-border-subtle px-1 py-2 align-top",
                            day === plan.today && "bg-accent-muted/40",
                          )}
                        >
                          {entries.length > 0 && (
                            <ul className="flex flex-col gap-1">
                              {entries.map((line) => entry(line, day))}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Téléphone et fenêtre étroite : la semaine jour par jour. */}
          <ol className="flex flex-col gap-2 xl:hidden">
            {days.map((day, index) => {
              const entries = shown
                .filter((line) => startsOnDay(line, day))
                .sort((a, b) =>
                  byModality
                    ? (a.modality ?? "").localeCompare(b.modality ?? "") ||
                      byStart(a, b)
                    : nameOf(a.radiologistId).localeCompare(
                        nameOf(b.radiologistId),
                        locale,
                      ) || byStart(a, b),
                );
              return (
                <li
                  key={day}
                  className={cn(
                    "rounded-lg border px-3 py-2",
                    day === plan.today
                      ? "border-accent/40"
                      : "border-border-subtle",
                  )}
                >
                  <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <span className="capitalize">{text.dayNames[index]}</span>
                    <span className="font-normal text-secondary">
                      {formatDayShort(dayAsDate(day), locale)}
                    </span>
                    {day === plan.today && (
                      <span className="rounded-full bg-accent-muted px-1.5 text-2xs font-medium text-accent">
                        {text.today}
                      </span>
                    )}
                  </p>
                  {entries.length === 0 ? (
                    <p className="mt-1 text-2xs text-tertiary">
                      {text.nobodyThatDay}
                    </p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {entries.map((line) => {
                        const conflict = inConflict.has(`${line.id}|${day}`);
                        return (
                          <li
                            key={line.id}
                            className={cn(
                              "flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-2 py-1 text-xs",
                              conflict
                                ? "bg-progress-muted"
                                : "bg-surface-raised",
                              !counts(line) && "opacity-60",
                            )}
                          >
                            {isDated(line) ? (
                              <CalendarRange
                                className="size-3 shrink-0 text-accent"
                                aria-hidden
                              />
                            ) : (
                              <Repeat
                                className="size-3 shrink-0 text-tertiary"
                                aria-hidden
                              />
                            )}
                            <span className="min-w-0 font-medium text-primary">
                              {nameOf(line.radiologistId)}
                            </span>
                            <span className="text-secondary">
                              {modalityName(line.modality)} · {hours(line)}
                            </span>
                            <span className="sr-only">{durationOf(line)}</span>
                            {conflict && (
                              <span className="inline-flex items-center gap-1 text-2xs font-medium text-progress">
                                <AlertTriangle className="size-3" aria-hidden />
                                {text.conflictBadge}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}

      {shown.length > 0 && (
        <section aria-labelledby="plan-lines" className="flex flex-col gap-2">
          <h3 id="plan-lines" className="flex items-center gap-2">
            <ColumnLabel
              label={text.linesTitle}
              info={{ text: text.linesInfo, term: "planning" }}
            />
          </h3>
          <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
            {shown.map((line) => (
              <LineRow
                key={line.id}
                line={line}
                plan={plan}
                clinicId={clinicId}
                monday={monday}
                radiologist={byId.get(line.radiologistId)}
                description={describe(line)}
                editable={canEdit(line)}
                removable={!readOnly}
                summary={[
                  modalityName(line.modality),
                  daysOf(line),
                  hours(line),
                ].join(" · ")}
                duration={durationOf(line)}
              />
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-secondary">
        {text.summary(
          plan.lines.filter((line) => !isDated(line)).length,
          plan.lines.filter(
            (line) => isDated(line) && (line.endsOn ?? "") >= plan.today,
          ).length,
        )}
      </p>
    </div>
  );
}

/** Une ligne de la liste, avec ses gestes. */
function LineRow({
  line,
  plan,
  clinicId,
  monday,
  radiologist,
  description,
  summary,
  duration,
  editable,
  removable,
}: {
  line: PlanLine;
  plan: AssignmentPlan;
  clinicId: string | null;
  monday: CalendarDay;
  radiologist: PlanRadiologist | undefined;
  description: string;
  summary: string;
  duration: string;
  editable: boolean;
  removable: boolean;
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.assignment.plan;
  const locked = clinicId === null && radiologist?.viaPool === true;
  return (
    <li
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5"
      data-testid="plan-line"
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-primary">
          <span className="min-w-0 truncate">
            {radiologist?.name ?? line.radiologistId}
          </span>
          {radiologist?.viaPool && (
            <span className="text-2xs font-normal text-tertiary">
              {text.network}
            </span>
          )}
        </p>
        <p className="text-xs text-secondary">{summary}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-2xs text-tertiary">
          <span className="inline-flex items-center gap-1">
            {isDated(line) ? (
              <CalendarRange className="size-3 text-accent" aria-hidden />
            ) : (
              <Repeat className="size-3" aria-hidden />
            )}
            {duration}
          </span>
          {line.updatedByName && (
            <span>
              {text.updatedBy(
                line.updatedByName,
                formatDate(line.updatedAt, locale),
              )}
            </span>
          )}
        </p>
        {locked && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-2xs text-tertiary">
            <Lock className="size-3" aria-hidden />
            {text.networkLocked}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {editable && (
          <PlanLineDialog
            clinicId={clinicId}
            plan={plan}
            monday={monday}
            line={line}
          >
            <Button
              variant="ghost"
              size="sm"
              aria-label={text.editLabel(description)}
            >
              <Pencil aria-hidden />
              <span className="hidden sm:inline">{text.edit}</span>
            </Button>
          </PlanLineDialog>
        )}
        {removable && (
          <RemoveLineButton
            clinicId={clinicId}
            lineId={line.id}
            description={description}
          />
        )}
      </div>
    </li>
  );
}

/** Retirer une ligne, après confirmation. */
function RemoveLineButton({
  clinicId,
  lineId,
  description,
}: {
  clinicId: string | null;
  lineId: string;
  description: string;
}) {
  const t = useMessages();
  const text = t.assignment.plan;
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const remove = () =>
    startTransition(async () => {
      const result = await removePlanLine(clinicId, lineId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(text.removed);
      setOpen(false);
    });
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label={text.removeLabel(description)}
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden />
        <span className="hidden sm:inline">{text.remove}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text.removeTitle}</DialogTitle>
            <DialogDescription>
              {text.removeDescription(description)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t.common.actions.cancel}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={pending}
              disabled={pending}
              onClick={remove}
            >
              {text.remove}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * « Recopier la semaine précédente » : direct s'il n'y a rien à remplacer,
 * après confirmation sinon.
 */
function CopyWeekButton({
  clinicId,
  monday,
  sources,
  replaced,
  disabled,
}: {
  clinicId: string | null;
  monday: CalendarDay;
  sources: number;
  replaced: number;
  disabled: boolean;
}) {
  const t = useMessages();
  const text = t.assignment.plan;
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const nothing = sources === 0;

  const copy = (replace: boolean) =>
    startTransition(async () => {
      const result = await copyPlanWeek(clinicId, monday, replace);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(text.copied(result.data.copied, result.data.skipped));
      setOpen(false);
    });

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || nothing || pending}
        loading={pending && !open}
        title={nothing ? text.copyNothing : text.copyInfo}
        onClick={() => (replaced > 0 ? setOpen(true) : copy(false))}
      >
        <Copy aria-hidden />
        {text.copy}
      </Button>
      {nothing && !disabled && (
        <span className="sr-only">{text.copyNothing}</span>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text.copyTitle}</DialogTitle>
            <DialogDescription>
              {text.copyDescription(replaced)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t.common.actions.cancel}
            </Button>
            <Button
              size="sm"
              loading={pending}
              disabled={pending}
              onClick={() => copy(true)}
            >
              {text.copyReplace}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
