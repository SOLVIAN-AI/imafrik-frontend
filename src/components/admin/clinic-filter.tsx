"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Select } from "@/components/ui/input";

/**
 * Filtre par clinique, porté par l'adresse (`?clinique=<id>`).
 *
 * L'adresse plutôt qu'un état local : une vue filtrée se partage, se met
 * en favori, et survit à un rechargement. Les autres paramètres — la
 * période, par exemple — sont conservés.
 *
 * @param clinics Cliniques proposées.
 * @param param   Nom du paramètre d'adresse.
 */
export function ClinicFilter({
  clinics,
  param = "clinique",
}: {
  clinics: { id: string; name: string }[];
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();
  const current = searchParams.get(param) ?? "";

  const change = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams);
    if (event.target.value) next.set(param, event.target.value);
    else next.delete(param);
    const query = next.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <Select
      aria-label="Filtrer par clinique"
      value={current}
      onChange={change}
      disabled={pending}
      className="w-auto max-w-[14rem] min-w-[10rem]"
    >
      <option value="">Tout le réseau</option>
      {clinics.map((clinic) => (
        <option key={clinic.id} value={clinic.id}>
          {clinic.name}
        </option>
      ))}
    </Select>
  );
}
