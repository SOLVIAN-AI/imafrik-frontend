"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { setClinicRetention } from "@/lib/actions/control";

/** Durées courantes, en jours, proposées en un clic. */
const PRESETS = [
  { days: 90, label: "3 mois" },
  { days: 365, label: "1 an" },
  { days: 365 * 5, label: "5 ans" },
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
  const [value, setValue] = React.useState(days === null ? "" : String(days));
  const [pending, startTransition] = React.useTransition();
  const next = value.trim() === "" ? null : Number(value);
  const dirty = next !== days;

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (next !== null && !Number.isInteger(next)) {
      toast.error("Durée : un nombre entier de jours.");
      return;
    }
    const shorter = next !== null && (days === null || next < days);
    if (
      shorter &&
      !window.confirm(
        `Purger les images des examens de ${clinicName} remis depuis plus de ${next} jours ?\n\n` +
          "La purge commence au prochain passage quotidien et ne se défait pas. " +
          "Les comptes-rendus restent ; la clinique garde ses originaux.",
      )
    )
      return;
    startTransition(async () => {
      const result = await setClinicRetention(clinicId, next);
      if (result.ok) toast.success("Durée de conservation enregistrée.");
      else toast.error(result.error);
    });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-tertiary">
        Durée prévue au contrat, après la remise du compte-rendu. Au-delà, les
        images quittent le PACS central ; la fiche de l’examen et le
        compte-rendu signé restent, et la clinique garde ses originaux. Vide :
        conservées pour toute la durée du contrat.
      </p>
      <Field
        id="retention-days"
        label="Conservation des images (jours)"
        hint={
          purged > 0
            ? `${purged} examen${purged > 1 ? "s" : ""} déjà purgé${purged > 1 ? "s" : ""} · entre 30 et 7 300 jours`
            : "Entre 30 et 7 300 jours · vide = durée du contrat"
        }
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
          placeholder="Durée du contrat"
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
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setValue("")}
          className="h-7 rounded-full border border-border-subtle px-2.5 text-2xs text-secondary transition-colors hover:bg-surface-hover"
        >
          Durée du contrat
        </button>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          loading={pending}
          disabled={!dirty}
          className="ml-auto"
        >
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
