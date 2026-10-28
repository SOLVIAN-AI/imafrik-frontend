"use client";

import * as React from "react";
import { AlertTriangle, Moon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { saveAssignmentRules } from "@/lib/actions/assignment-rules";
import type { ModalityGroup } from "@/lib/api/contracts";
import {
  type AssignmentRules,
  type ModalityDesignation,
  type RuleRadiologist,
  type RuleSlot,
  WEEKDAYS,
  type Weekday,
  isOvernight,
  overlaps,
  readsGroup,
  slotProblem,
} from "@/lib/assignment-rules";
import { MODALITY_GROUPS } from "@/lib/modalities";
import { cn } from "@/lib/utils";

/** Un créneau en cours d'édition, avec sa clé de liste. */
interface DraftSlot extends RuleSlot {
  key: number;
}

/** Heures proposées quand un créneau cesse de couvrir toute la journée. */
const DEFAULT_HOURS = { startsAt: "08:00", endsAt: "18:00" } as const;

/** Créneaux lus, numérotés dans l'ordre : mêmes clés au serveur et au navigateur. */
const keyed = (slots: RuleSlot[]): DraftSlot[] =>
  slots.map((slot, index) => ({ ...slot, key: index }));

function designationsOf(
  modalities: ModalityDesignation[],
): Partial<Record<ModalityGroup, string>> {
  return Object.fromEntries(
    modalities.map((rule) => [rule.group, rule.radiologistId]),
  );
}

/** Empreinte de l'état édité, pour savoir s'il a changé. */
function fingerprint(
  slots: RuleSlot[],
  designations: Partial<Record<ModalityGroup, string>>,
): string {
  return JSON.stringify({
    slots: slots.map((slot) => [
      slot.radiologistId,
      slot.weekdays,
      slot.startsAt,
      slot.endsAt,
    ]),
    modalities: MODALITY_GROUPS.map((group) => designations[group] ?? ""),
  });
}

/**
 * Règles d'attribution d'une clinique : le radiologue de chaque modalité,
 * puis le planning de la semaine.
 *
 * À rendre avec `key={rules.version}` : une nouvelle lecture du service
 * (enregistrement, rechargement) repart des règles enregistrées.
 *
 * Partagé par le responsable (« Équipe › Règles d'attribution », ses
 * radiologues) et l'équipe IMAFRIK (fiche de la clinique, radiologues du
 * réseau compris). Tout s'enregistre d'un geste ; le service refuse un
 * enregistrement fait sur des règles modifiées entre-temps, et l'écran
 * invite alors à recharger.
 *
 * L'écran prévient de ce qui ne marchera pas comme on le croit : deux
 * radiologues de garde en même temps (l'examen que les deux peuvent lire
 * reste à attribuer), un radiologue qui ne peut pas encore recevoir
 * d'examen (la règle le passe).
 *
 * @param clinicId Clinique, pour l'équipe IMAFRIK ; `null` pour la
 *                 clinique active du responsable.
 * @param rules    Règles lues à l'ouverture.
 * @param readOnly Contrat terminé : les règles se consultent seulement.
 */
export function AssignmentRulesForm({
  clinicId,
  rules,
  readOnly = false,
}: {
  clinicId: string | null;
  rules: AssignmentRules;
  readOnly?: boolean;
}) {
  const t = useMessages();
  const text = t.assignment.rules;
  const [saved, setSaved] = React.useState(rules);
  const [slots, setSlots] = React.useState<DraftSlot[]>(() =>
    keyed(rules.slots),
  );
  const [designations, setDesignations] = React.useState(() =>
    designationsOf(rules.modalities),
  );
  // Clé du prochain créneau ajouté : après ceux qui sont lus.
  const nextKey = React.useRef(rules.slots.length);
  const [pending, startTransition] = React.useTransition();
  const idPrefix = React.useId();

  const radiologists = saved.radiologists;
  const byId = new Map(radiologists.map((r) => [r.profileId, r]));
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const changed =
    fingerprint(slots, designations) !==
    fingerprint(saved.slots, designationsOf(saved.modalities));
  const problems = slots.map(slotProblem);
  const invalid = problems.some((problem) => problem !== null);
  const conflicts = overlaps(slots);
  const used = new Set([
    ...slots.map((slot) => slot.radiologistId),
    ...Object.values(designations),
  ]);
  const blocked = radiologists.filter(
    (radiologist) => used.has(radiologist.profileId) && !radiologist.canReceive,
  );

  if (radiologists.length === 0) {
    return (
      <p className="text-xs text-secondary">
        {clinicId === null ? text.noRadiologists : text.noRadiologistsAdmin}
      </p>
    );
  }

  const update = (key: number, change: Partial<RuleSlot>) =>
    setSlots((current) =>
      current.map((slot) => (slot.key === key ? { ...slot, ...change } : slot)),
    );

  const toggleDay = (slot: DraftSlot, day: Weekday) =>
    update(slot.key, {
      weekdays: slot.weekdays.includes(day)
        ? slot.weekdays.filter((d) => d !== day)
        : [...slot.weekdays, day].sort((a, b) => a - b),
    });

  const addSlot = () =>
    setSlots((current) => [
      ...current,
      {
        key: nextKey.current++,
        radiologistId:
          radiologists.length === 1 ? radiologists[0].profileId : "",
        weekdays: [1, 2, 3, 4, 5],
        startsAt: null,
        endsAt: null,
      },
    ]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid) {
      toast.error(text.invalid);
      return;
    }
    const modalities = MODALITY_GROUPS.flatMap((group) =>
      designations[group]
        ? [{ group, radiologistId: designations[group] as string }]
        : [],
    );
    startTransition(async () => {
      const result = await saveAssignmentRules(
        clinicId,
        saved.version,
        slots.map(({ radiologistId, weekdays, startsAt, endsAt }) => ({
          radiologistId,
          weekdays,
          startsAt,
          endsAt,
        })),
        modalities,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSaved(result.data);
      nextKey.current = result.data.slots.length;
      setSlots(keyed(result.data.slots));
      setDesignations(designationsOf(result.data.modalities));
      toast.success(text.saved);
    });
  };

  const option = (radiologist: RuleRadiologist) => (
    <option key={radiologist.profileId} value={radiologist.profileId}>
      {radiologist.viaPool
        ? `${radiologist.name} · ${text.network}`
        : radiologist.name}
    </option>
  );

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <p className="text-xs leading-relaxed text-secondary">
        {text.howItWorks}
      </p>

      {blocked.length > 0 && (
        <ul className="flex flex-col gap-1">
          {blocked.map((radiologist) => (
            <li
              key={radiologist.profileId}
              className="flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2 text-xs text-progress"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {text.cannotReceive(radiologist.name)}
            </li>
          ))}
        </ul>
      )}

      <fieldset className="flex flex-col gap-2" disabled={readOnly}>
        <legend className="label-eyebrow mb-1">{text.modalitiesTitle}</legend>
        <p className="text-2xs text-tertiary">{text.modalitiesHint}</p>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {MODALITY_GROUPS.map((group) => {
            const id = `${idPrefix}-modality-${group}`;
            const current = designations[group] ?? "";
            const holder = current ? byId.get(current) : undefined;
            const readers = radiologists.filter(
              (radiologist) =>
                readsGroup(radiologist, group) ||
                radiologist.profileId === current,
            );
            return (
              <div key={group} className="flex items-center gap-3">
                <label
                  htmlFor={id}
                  className="w-28 shrink-0 text-xs font-medium text-secondary"
                >
                  {t.assignment.modalities[group]}
                </label>
                <div className="min-w-0 flex-1">
                  <Select
                    id={id}
                    value={current}
                    aria-invalid={holder && !readsGroup(holder, group)}
                    onChange={(event) =>
                      setDesignations((all) => ({
                        ...all,
                        [group]: event.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">{text.nobody}</option>
                    {readers.map(option)}
                  </Select>
                  {holder && !readsGroup(holder, group) && (
                    <p className="mt-0.5 text-2xs text-urgent">
                      {text.notReading(holder.name)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2" disabled={readOnly}>
        <legend className="label-eyebrow mb-1">{text.scheduleTitle}</legend>
        <p className="text-2xs text-tertiary">
          {text.scheduleHint(saved.timeZone)}
        </p>

        {slots.length === 0 && (
          <p className="rounded-lg border border-dashed border-border-default px-3 py-3 text-xs text-secondary">
            {text.noSlots}
          </p>
        )}

        <ol className="flex flex-col gap-2">
          {slots.map((slot, index) => {
            const number = index + 1;
            const problem = problems[index];
            const base = `${idPrefix}-slot-${slot.key}`;
            const allDay = slot.startsAt === null && slot.endsAt === null;
            return (
              <li
                key={slot.key}
                aria-label={text.slotLabel(number)}
                className={cn(
                  "flex flex-col gap-2.5 rounded-lg border px-3 py-2.5",
                  problem
                    ? "border-urgent/40"
                    : "border-border-subtle bg-surface-raised",
                )}
              >
                <div className="flex items-end gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <label
                      htmlFor={`${base}-radiologist`}
                      className="text-2xs font-medium text-secondary"
                    >
                      {text.radiologist}
                    </label>
                    <Select
                      id={`${base}-radiologist`}
                      value={slot.radiologistId}
                      aria-invalid={problem === "radiologist"}
                      onChange={(event) =>
                        update(slot.key, { radiologistId: event.target.value })
                      }
                    >
                      <option value="" disabled>
                        {text.chooseRadiologist}
                      </option>
                      {radiologists.map(option)}
                    </Select>
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={text.removeSlotLabel(number)}
                      onClick={() =>
                        setSlots((current) =>
                          current.filter((other) => other.key !== slot.key),
                        )
                      }
                    >
                      <Trash2 aria-hidden />
                      <span className="hidden sm:inline">
                        {text.removeSlot}
                      </span>
                    </Button>
                  )}
                </div>

                <fieldset className="flex flex-col gap-1">
                  <legend className="text-2xs font-medium text-secondary">
                    {text.days}
                  </legend>
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map((day) => {
                      const on = slot.weekdays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleDay(slot, day)}
                          className={cn(
                            "h-7 min-w-11 rounded-md border px-2 text-xs font-medium transition-colors duration-100",
                            "focus-visible:ring-3 focus-visible:ring-accent/25 focus-visible:outline-none",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            on
                              ? "border-accent/40 bg-accent-muted text-primary"
                              : "border-border-subtle text-secondary hover:bg-surface-hover",
                          )}
                        >
                          {/* Nom complet pour les lecteurs d'écran ; l'abréviation
                              seule, lue « Mer », ne dirait pas le jour. */}
                          <span aria-hidden>{text.dayShort[day - 1]}</span>
                          <span className="sr-only">
                            {text.dayNames[day - 1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allDay}
                      onChange={(event) =>
                        update(
                          slot.key,
                          event.target.checked
                            ? { startsAt: null, endsAt: null }
                            : DEFAULT_HOURS,
                        )
                      }
                      className="size-3.5 accent-[var(--accent)]"
                    />
                    {text.allDay}
                  </label>
                  {!allDay && (
                    <span className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor={`${base}-start`}
                        className="text-secondary"
                      >
                        {text.from}
                      </label>
                      <Input
                        id={`${base}-start`}
                        type="time"
                        required
                        value={slot.startsAt ?? ""}
                        aria-invalid={
                          problem === "hours" || problem === "sameHours"
                        }
                        onChange={(event) =>
                          update(slot.key, {
                            startsAt: event.target.value || null,
                          })
                        }
                        className="w-28"
                      />
                      <label htmlFor={`${base}-end`} className="text-secondary">
                        {text.to}
                      </label>
                      <Input
                        id={`${base}-end`}
                        type="time"
                        required
                        value={slot.endsAt ?? ""}
                        aria-invalid={
                          problem === "hours" || problem === "sameHours"
                        }
                        onChange={(event) =>
                          update(slot.key, {
                            endsAt: event.target.value || null,
                          })
                        }
                        className="w-28"
                      />
                      {isOvernight(slot) && (
                        <span className="inline-flex items-center gap-1 text-2xs text-tertiary">
                          <Moon className="size-3" aria-hidden />
                          {text.overnight}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {problem && (
                  <p role="alert" className="text-2xs text-urgent">
                    {text.problems[problem]}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {!readOnly && (
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addSlot}
            >
              <Plus aria-hidden />
              {text.addSlot}
            </Button>
          </div>
        )}
      </fieldset>

      {conflicts.length > 0 && (
        <ul className="flex flex-col gap-1">
          {conflicts.map((conflict) => (
            <li
              key={`${conflict.first}|${conflict.second}`}
              className="flex items-start gap-2 rounded-lg bg-progress-muted px-3 py-2 text-xs text-progress"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {text.overlap(
                nameOf(conflict.first),
                nameOf(conflict.second),
                conflict.days.map((day) => text.dayNames[day - 1]).join(", "),
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
        <p className="text-xs text-secondary">
          {text.summary(saved.slots.length, saved.modalities.length)}
        </p>
        {!readOnly && (
          <Button
            type="submit"
            size="sm"
            loading={pending}
            disabled={!changed || pending}
          >
            {text.submit}
          </Button>
        )}
      </div>
    </form>
  );
}
