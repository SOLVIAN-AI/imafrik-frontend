"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useMessages } from "@/i18n/client";
import { filterHref } from "@/lib/filters/url";

/**
 * Choix de la clinique au nom de laquelle l'équipe IMAFRIK dépose.
 *
 * Le même paramètre que le filtre « Clinique » de la liste (`?clinique=`) :
 * choisir la clinique montre aussi ses dépôts, et la vue des cliniques y
 * mène avec la clinique déjà choisie. Une liste déroulante native, triée
 * par ordre alphabétique : elle se parcourt au clavier et se tape.
 *
 * @param clinics  Cliniques actives, triées par nom.
 * @param selected Clinique choisie, ou `null`.
 */
export function ClinicPicker({
  clinics,
  selected,
}: {
  clinics: { id: string; name: string }[];
  selected: string | null;
}) {
  const t = useMessages().deposits;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex flex-col gap-1.5 text-xs sm:max-w-sm">
      <span className="font-medium">{t.chooseClinic}</span>
      <select
        className="h-8 rounded-md border border-border-default bg-surface-sunken px-2 text-sm"
        value={selected ?? ""}
        onChange={(event) =>
          router.replace(
            filterHref(pathname, params.toString(), {
              clinic: event.target.value || null,
            }),
            { scroll: false },
          )
        }
      >
        <option value="">{t.chooseClinicPlaceholder}</option>
        {clinics.map((clinic) => (
          <option key={clinic.id} value={clinic.id}>
            {clinic.name}
          </option>
        ))}
      </select>
    </label>
  );
}
