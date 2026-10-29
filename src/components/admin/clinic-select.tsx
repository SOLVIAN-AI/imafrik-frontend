"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { CLINIC_PARAM } from "@/lib/admin-params";
import { CURSOR_PARAM } from "@/lib/pagination";

/**
 * Choix de la clinique en liste, quand les pastilles ne tiennent plus.
 *
 * Le choix part dans l'adresse (`?clinique=`), les autres filtres gardés,
 * la pagination remise au début.
 *
 * @param label   Nom du choix.
 * @param active  Clinique retenue ; `null` pour toutes.
 * @param options Cliniques proposées, avec leur nombre dans le libellé.
 */
export function ClinicSelect({
  label,
  active,
  options,
}: {
  label: string;
  active: string | null;
  options: { id: string | null; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = React.useId();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs whitespace-nowrap text-tertiary">
        {label}
      </label>
      <select
        id={id}
        value={active ?? ""}
        disabled={pending}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          next.delete(CURSOR_PARAM);
          if (event.target.value) next.set(CLINIC_PARAM, event.target.value);
          else next.delete(CLINIC_PARAM);
          const query = next.toString();
          startTransition(() =>
            router.replace(query ? `${pathname}?${query}` : pathname, {
              scroll: false,
            }),
          );
        }}
        className="h-8 max-w-72 rounded-lg border border-border-subtle bg-surface-sunken px-2 text-xs text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {options.map((option) => (
          <option key={option.id ?? "all"} value={option.id ?? ""}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
