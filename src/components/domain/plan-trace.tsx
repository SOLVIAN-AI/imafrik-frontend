"use client";

import { AlertTriangle, CalendarCheck } from "lucide-react";

import { useLocale, useMessages } from "@/i18n/client";
import {
  type AppliedPlanLine,
  type PlanOutcome,
  describeLine,
} from "@/lib/assignment-plan";
import { cn } from "@/lib/utils";

/**
 * Ce que le planning a décidé pour un examen, à son arrivée, figé sur
 * l'examen par le service.
 *
 * - Attribué par le planning : « Attribué par le planning », la règle
 *   appliquée au survol et pour les lecteurs d'écran (`long` : en clair).
 * - Laissé à attribuer : la raison (deux radiologues aussi précis, un
 *   radiologue prévu qui ne pouvait pas le recevoir, hors planning).
 *   L'attribution directe sur l'examen reste le recours.
 *
 * @param rule     Règle qui a attribué l'examen ; `null` pour une personne.
 * @param line     Ligne du planning appliquée.
 * @param outcome  Examen à attribuer : pourquoi le planning ne l'a pas attribué.
 * @param names    En conflit : les radiologues prévus.
 * @param long     Une phrase entière, pour une fiche ou une fenêtre.
 */
export function PlanTrace({
  rule,
  line,
  outcome,
  names,
  long = false,
  className,
}: {
  rule?: "modality" | "schedule" | null;
  line?: AppliedPlanLine | null;
  outcome?: PlanOutcome | null;
  names?: readonly string[] | null;
  long?: boolean;
  className?: string;
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.assignment.plan.trace;

  if (rule) {
    const applied = line ? describeLine(line, t, locale) : null;
    const label =
      rule === "modality"
        ? t.assignment.plan.assignedBy(t.assignment.plan.byRule.modality)
        : long && applied
          ? text.assignedBy(applied)
          : text.byPlanning;
    return (
      <span
        data-testid="plan-assigned"
        title={applied ? text.ruleApplied(applied) : undefined}
        className={cn(
          "inline-flex min-w-0 items-center gap-1 text-2xs text-tertiary",
          className,
        )}
      >
        <CalendarCheck className="size-3 shrink-0 text-accent" aria-hidden />
        <span className={long ? undefined : "truncate"}>{label}</span>
        {applied && !long && (
          <span className="sr-only">, {text.ruleApplied(applied)}</span>
        )}
      </span>
    );
  }

  if (!outcome) return null;
  const all = (names ?? []).join(", ");
  const label = long
    ? outcome === "conflict"
      ? text.conflictLong(all)
      : outcome === "ineligible"
        ? text.ineligibleLong
        : text.uncoveredLong
    : outcome === "conflict"
      ? text.conflict(all)
      : outcome === "ineligible"
        ? text.ineligible
        : text.uncovered;
  return (
    <span
      data-testid={`plan-${outcome}`}
      title={long ? undefined : label}
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1 text-xs font-medium",
        outcome === "uncovered" ? "text-tertiary" : "text-progress",
        className,
      )}
    >
      {outcome !== "uncovered" && (
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      )}
      <span className={long ? undefined : "truncate"}>{label}</span>
    </span>
  );
}
