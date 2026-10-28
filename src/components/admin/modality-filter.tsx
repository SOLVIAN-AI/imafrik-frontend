"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { useMessages } from "@/i18n/client";
import type { ModalityGroup } from "@/lib/api/contracts";
import {
  MODALITY_GROUPS,
  MODALITY_PARAM,
  MODALITY_SLUGS,
} from "@/lib/modalities";

/**
 * Filtre d'une liste de comptes par modalité lue.
 *
 * Le choix part dans l'adresse (`?modalite=scanner`), les autres
 * paramètres gardés : la liste se relit chez le service, filtrée.
 *
 * @param label  Nom du filtre.
 * @param any    Libellé de l'option « toutes ».
 * @param active Modalité retenue ; `undefined` pour toutes.
 */
export function ModalityFilter({
  label,
  any,
  active,
}: {
  label: string;
  any: string;
  active: ModalityGroup | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const labels = useMessages().assignment.modalities;
  const id = React.useId();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs whitespace-nowrap text-tertiary">
        {label}
      </label>
      <select
        id={id}
        value={active ? MODALITY_SLUGS[active] : ""}
        disabled={pending}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          if (event.target.value) next.set(MODALITY_PARAM, event.target.value);
          else next.delete(MODALITY_PARAM);
          const query = next.toString();
          startTransition(() =>
            router.replace(query ? `${pathname}?${query}` : pathname, {
              scroll: false,
            }),
          );
        }}
        className="h-8 rounded-lg border border-border-subtle bg-surface-sunken px-2 text-xs text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <option value="">{any}</option>
        {MODALITY_GROUPS.map((group) => (
          <option key={group} value={MODALITY_SLUGS[group]}>
            {labels[group]}
          </option>
        ))}
      </select>
    </div>
  );
}
