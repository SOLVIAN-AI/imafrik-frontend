"use client";

import { ClinicDropdown } from "@/components/domain/clinic-dropdown";
import { useMessages } from "@/i18n/client";

/**
 * Filtre par clinique, porté par l'adresse (`?clinique=<id>`), des écrans
 * qui ne comptent pas d'examens par clinique (activité, flux d'images).
 *
 * La même liste déroulante que celle des examens (`ClinicDropdown`) :
 * « Toutes les cliniques », puis les cliniques par ordre alphabétique, avec une
 * recherche quand elles sont nombreuses. L'adresse plutôt qu'un état
 * local : une vue filtrée se partage, se met en favori, et survit à un
 * rechargement. Les autres paramètres (la période, la rubrique) restent.
 *
 * @param clinics Cliniques proposées.
 * @param active  Clinique retenue, lue de l'adresse ; `null` pour toutes.
 * @param param   Nom du paramètre d'adresse.
 */
export function ClinicFilter({
  clinics,
  active,
  param = "clinique",
}: {
  clinics: { id: string; name: string }[];
  active: string | null;
  param?: string;
}) {
  const t = useMessages();
  return (
    <ClinicDropdown
      label={t.worklist.filters.clinic}
      allLabel={t.filters.allClinics}
      clinics={clinics}
      active={active}
      param={param}
      reset={[]}
    />
  );
}
