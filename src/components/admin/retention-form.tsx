"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { setClinicRetention } from "@/lib/actions/control";

/** Durées courantes, en jours, proposées en un clic, et leur libellé. */
const PRESETS = [
  { days: 90, months: 3 },
  { days: 365, years: 1 },
  { days: 365 * 5, years: 5 },
] as const;

/**
 * Durée de conservation des images d'une clinique, telle que le contrat
 * la prévoit.
 *
 * Ce réglage **supprime des images médicales** : il le dit, et il demande
 * confirmation quand il raccourcit une durée — c'est le seul sens dans
 * lequel une erreur est irréversible. Les comptes-rendus ne sont jamais
 * concernés, et la clinique garde ses originaux sur sa passerelle.
 *
 * @param clinicId Clinique.
 * @param clinicName Son nom, rappelé dans la confirmation.
 * @param days     Durée actuelle, ou `null` (durée du contrat).
 * @param purged   Examens déjà purgés.
 */
export function RetentionForm({
  clinicId,
  clinicName,
  days,
  purged,
}: {
  clinicId: string;
  clinicName: string;
  days: number | null;
  purged: number;
}) {
  const t = useMessages();
  const text = t.admin.retention;
  const [value, setValue] = React.useState(days === null ? "" : String(days));
  const [pending, startTransition] = React.useTransition();
  const next = value.trim() === "" ? null : Number(value);
  const dirty = next !== days;

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (next !== null && !Number.isInteger(next)) {
      toast.error(text.integerDays);
      return;
    }
    const shorter = next !== null && (days === null || next < days);
    if (shorter && !window.confirm(text.confirmPurge(clinicName, next))) return;
    startTransition(async () => {
      const result = await setClinicRetention(clinicId, next);
      if (result.ok) toast.success(text.saved);
      else toast.error(result.error);
    });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-tertiary">
        {text.explanation}
      </p>
      <Field
        id="retention-days"
        label={text.label}
        hint={purged > 0 ? text.purgedHint(purged) : text.hint}
      >
        <Input
          id="retention-days"
          type="number"
          inputMode="numeric"
          min={30}
          max={7300}
          step={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={text.contractTerm}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => setValue(String(preset.days))}
            className="h-7 rounded-full border border-border-subtle px-2.5 text-2xs text-secondary transition-colors hover:bg-surface-hover"
          >
            {"months" in preset
              ? t.common.units.months(preset.months)
              : t.common.units.years(preset.years)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setValue("")}
          className="h-7 rounded-full border border-border-subtle px-2.5 text-2xs text-secondary transition-colors hover:bg-surface-hover"
        >
          {text.contractTerm}
        </button>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          loading={pending}
          disabled={!dirty}
          className="ml-auto"
        >
          {t.common.actions.save}
        </Button>
      </div>
    </form>
  );
}
