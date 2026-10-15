"use client";

import { useMessages } from "@/i18n/client";
import type { PracticeStatus } from "@/lib/credentials";
import { cn } from "@/lib/utils";

/** Les deux exercices, dans l'ordre où l'écran les propose. */
const PRACTICES: PracticeStatus[] = ["registered", "resident"];

/**
 * Choix de l'exercice : inscrit à l'Ordre, ou en cours de spécialisation.
 *
 * Deux cartes à cocher plutôt qu'une liste : chacune dit ce qu'elle
 * demandera ensuite (diplôme et numéro, ou attestation datée), ce qui
 * évite de choisir à l'aveugle. Le choix ne s'enregistre pas ici : le
 * parent décide quand (étape suivante, bouton d'enregistrement).
 *
 * @param value    Exercice choisi, ou `null` tant qu'aucun ne l'est.
 * @param onChange Appelé au choix.
 */
export function PracticeChoice({
  value,
  onChange,
}: {
  value: PracticeStatus | null;
  onChange: (value: PracticeStatus) => void;
}) {
  const t = useMessages().credentials.practice;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{t.legend}</legend>
      {PRACTICES.map((practice) => (
        <label
          key={practice}
          data-practice={practice}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
            value === practice
              ? "border-accent/40 bg-accent-muted"
              : "border-border-subtle hover:bg-surface-hover",
          )}
        >
          <input
            type="radio"
            name="practiceStatus"
            value={practice}
            checked={value === practice}
            onChange={() => onChange(practice)}
            required
            className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
          />
          <span>
            <span className="block text-sm font-medium">
              {t[practice].title}
            </span>
            <span className="mt-1 block text-xs text-secondary">
              {t[practice].detail}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
