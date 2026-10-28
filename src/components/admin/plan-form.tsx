"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { saveClinicPlan } from "@/lib/actions/billing";
import type { Plan } from "@/lib/api/contracts";
import { PLANS } from "@/lib/billing";
import { formatCount } from "@/lib/format";
import { SUBSCRIPTIONS } from "@/content/marketing/pricing";
import { cn } from "@/lib/utils";

/**
 * Formule d'abonnement d'une clinique, renseignée par l'équipe IMAFRIK.
 *
 * Essentiel et Pro ont le prix de la grille ; Établissement se chiffre
 * sur devis, à partir de 100 000 FCFA HT : son prix se saisit. Le service
 * revérifie la grille et trace le changement. La formule vaut pour les
 * mois encore ouverts ; un mois clos garde la sienne.
 *
 * @param clinicId Clinique.
 * @param plan     Formule actuelle, ou `null` tant qu'elle n'est pas
 *                 renseignée.
 * @param fee      Prix mensuel actuel, FCFA HT.
 */
export function PlanForm({
  clinicId,
  plan,
  fee,
}: {
  clinicId: string;
  plan: Plan | null;
  fee: number | null;
}) {
  const t = useMessages();
  const locale = useLocale();
  const text = t.admin.plan;
  const names = t.clinic.activity.billing.plans;
  const minimum = SUBSCRIPTIONS.facility.monthly;
  const [value, setValue] = React.useState<Plan | null>(plan);
  const [amount, setAmount] = React.useState(
    plan === "facility" && fee !== null ? String(fee) : String(minimum),
  );
  const [pending, startTransition] = React.useTransition();

  const typed = Number(amount);
  const feeOk = Number.isSafeInteger(typed) && typed >= minimum;
  const dirty =
    value !== plan || (value === "facility" && feeOk && typed !== fee);
  const ready = value !== null && dirty && (value !== "facility" || feeOk);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || value === null) return;
    startTransition(async () => {
      const result = await saveClinicPlan(
        clinicId,
        value,
        value === "facility" ? typed : null,
      );
      if (result.ok) toast.success(text.saved);
      else toast.error(result.error);
    });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-xs leading-relaxed text-tertiary">
        {text.explanation}
      </p>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{text.label}</legend>
        {PLANS.map((option) => {
          const selected = value === option;
          return (
            <label
              key={option}
              className={cn(
                "flex h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs transition-colors duration-100",
                selected
                  ? "border-accent/40 bg-accent-muted font-medium"
                  : "border-border-subtle text-secondary hover:bg-surface-hover",
              )}
            >
              <input
                type="radio"
                name="clinic-plan"
                value={option}
                checked={selected}
                onChange={() => setValue(option)}
                className="size-3.5 shrink-0 accent-[var(--accent)]"
              />
              {names[option]}
              {option !== "facility" && (
                <span className="text-tertiary tabular-nums">
                  {formatCount(SUBSCRIPTIONS[option].monthly, locale)}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
      {value === "facility" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="clinic-plan-fee" className="text-xs font-medium">
            {text.monthlyFee}
          </label>
          <Input
            id="clinic-plan-fee"
            type="number"
            inputMode="numeric"
            min={minimum}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={!feeOk}
            aria-describedby="clinic-plan-fee-hint"
            className="h-9 max-w-48"
          />
          <p
            id="clinic-plan-fee-hint"
            className={cn("text-2xs", feeOk ? "text-tertiary" : "text-urgent")}
          >
            {text.monthlyFeeHint}
          </p>
        </div>
      )}
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        loading={pending}
        disabled={!ready}
        className="self-end"
      >
        {t.common.actions.save}
      </Button>
    </form>
  );
}
