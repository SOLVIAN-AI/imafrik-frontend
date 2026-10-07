"use client";

import { Megaphone } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { updatePlatformSettings } from "@/lib/actions/control";
import { formatDuration } from "@/lib/format";

/** Longueur maximale du bandeau — même borne qu'en base. */
const BANNER_MAX = 280;

/**
 * Réglages de la plateforme : délais promis et bandeau de maintenance.
 *
 * Les délais promis définissent ce qui est « en retard » partout — cockpit,
 * alertes, analyses. Le bandeau s'affiche en tête de tous les écrans, pour
 * tous les utilisateurs, dès leur prochain affichage : c'est le seul moyen
 * de prévenir d'une intervention sans écrire à chacun.
 */
export function SettingsForm({
  urgent,
  routine,
  maintenanceMessage,
}: {
  urgent: number;
  routine: number;
  maintenanceMessage: string | null;
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.admin.settings;
  const [urgentMinutes, setUrgentMinutes] = React.useState(String(urgent));
  const [routineMinutes, setRoutineMinutes] = React.useState(String(routine));
  const [banner, setBanner] = React.useState(maintenanceMessage ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const dirty =
    Number(urgentMinutes) !== urgent ||
    Number(routineMinutes) !== routine ||
    banner.trim() !== (maintenanceMessage ?? "");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updatePlatformSettings({
        // Un champ vide devient NaN, que la validation refuse avec un
        // message clair plutôt que de l'enregistrer comme zéro.
        urgentMinutes: urgentMinutes.trim()
          ? Number(urgentMinutes)
          : Number.NaN,
        routineMinutes: routineMinutes.trim()
          ? Number(routineMinutes)
          : Number.NaN,
        maintenanceMessage: banner,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(text.saved);
    });
  };

  const preview = (value: string) => {
    const minutes = Number(value);
    return Number.isInteger(minutes) && minutes > 0
      ? text.typedValue(formatDuration(minutes, locale))
      : "";
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="label-eyebrow mb-3">{text.targets}</legend>
        <Field
          id="sla-urgent"
          label={t.admin.shared.urgent}
          hint={text.urgentHint(preview(urgentMinutes))}
        >
          <Input
            id="sla-urgent"
            type="number"
            inputMode="numeric"
            min={5}
            max={720}
            step={1}
            required
            value={urgentMinutes}
            onChange={(event) => setUrgentMinutes(event.target.value)}
          />
        </Field>
        <Field
          id="sla-routine"
          label={t.admin.shared.routine}
          hint={text.routineHint(preview(routineMinutes))}
        >
          <Input
            id="sla-routine"
            type="number"
            inputMode="numeric"
            min={15}
            max={2880}
            step={1}
            required
            value={routineMinutes}
            onChange={(event) => setRoutineMinutes(event.target.value)}
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="label-eyebrow mb-3">{text.banner}</legend>
        <Field
          id="banner"
          label={text.bannerLabel}
          hint={text.bannerHint(banner.length, BANNER_MAX)}
        >
          <Textarea
            id="banner"
            rows={2}
            maxLength={BANNER_MAX}
            value={banner}
            onChange={(event) => setBanner(event.target.value)}
            placeholder={text.bannerPlaceholder}
          />
        </Field>
        {banner.trim() && (
          <div
            className="flex items-start gap-2.5 rounded-lg border border-progress/30 bg-progress-muted px-3 py-2 text-xs"
            aria-label={text.bannerPreview}
          >
            <Megaphone
              className="mt-0.5 size-3.5 shrink-0 text-progress"
              aria-hidden
            />
            <span className="min-w-0 break-words">{banner.trim()}</span>
          </div>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="text-xs text-urgent">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending} disabled={!dirty}>
          {t.common.actions.save}
        </Button>
      </div>
    </form>
  );
}
