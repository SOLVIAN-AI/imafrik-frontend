import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { ApiError, apiGet, apiSend } from "@/lib/api/client";
import { clinicViewSchema } from "@/lib/api/contracts";
import {
  type ClinicConsultation,
  clinicViewApi,
  type ViewableClinic,
} from "@/lib/clinic-view";
import { listOrganizations } from "@/lib/data/admin";
import { DEMO_NETWORK } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";
import { requireSession } from "@/lib/session/server";

/**
 * Vue des cliniques : la clinique consultée, et celles qu'on peut choisir.
 *
 * Deux lectures de la clinique, et ce n'est pas un doublon :
 *
 * - **l'ouverture** (`POST`), faite une fois par la disposition de la vue
 *   quand on y entre ou qu'on change de clinique : le service la trace au
 *   journal d'audit (`organization.viewed`), au nom du membre de l'équipe ;
 * - **la lecture** (`GET`), faite par chaque écran pour son en-tête : passer
 *   des examens à l'équipe d'une même clinique n'est pas une nouvelle
 *   ouverture.
 */

/** La clinique de démonstration, telle que le service la décrirait. */
function demoClinic(clinicId: string): ClinicConsultation | null {
  const clinic = DEMO_NETWORK.find((candidate) => candidate.id === clinicId);
  return clinic
    ? {
        clinicId: clinic.id,
        name: clinic.name,
        city: clinic.city,
        isActive: true,
      }
    : null;
}

function toConsultation(row: {
  id: string;
  name: string;
  city: string | null;
  is_active: boolean;
}): ClinicConsultation {
  return {
    clinicId: row.id,
    name: row.name,
    city: row.city,
    isActive: row.is_active,
  };
}

/**
 * Ouvre la vue d'une clinique : le service trace l'ouverture.
 *
 * Une fois par rendu : la disposition et son écran partagent l'appel.
 *
 * @param clinicId Clinique choisie, lue dans l'adresse.
 * @returns La clinique, ou `null` si ce n'en est pas une.
 */
export const openClinicView = cache(
  async (clinicId: string): Promise<ClinicConsultation | null> => {
    if (isDemoMode()) return demoClinic(clinicId);
    try {
      return toConsultation(
        await apiSend(
          clinicViewApi(clinicId),
          "POST",
          undefined,
          clinicViewSchema,
        ),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
);

/**
 * La clinique consultée, sans tracer d'ouverture : l'en-tête d'un écran.
 *
 * @param clinicId Clinique choisie, lue dans l'adresse.
 */
export const readClinicView = cache(
  async (clinicId: string): Promise<ClinicConsultation | null> => {
    if (isDemoMode()) return demoClinic(clinicId);
    const row = await apiGet(clinicViewApi(clinicId), clinicViewSchema, {
      notFoundAsNull: true,
    });
    return row ? toConsultation(row) : null;
  },
);

/**
 * Garde d'un écran de la vue des cliniques : l'équipe IMAFRIK seulement,
 * et une clinique qui existe.
 *
 * @param clinicId Clinique choisie, lue dans l'adresse.
 * @returns La clinique consultée.
 */
export async function requireConsultation(
  clinicId: string,
): Promise<ClinicConsultation> {
  await requireSession(["platform_admin"]);
  const consultation = await readClinicView(clinicId);
  if (!consultation) notFound();
  return consultation;
}

/**
 * Les cliniques que l'équipe peut ouvrir, par nom.
 *
 * Lues pour le sélecteur de la navigation : un service muet ne doit pas
 * priver la console de sa navigation, le sélecteur reste alors vide.
 */
export async function listViewableClinics(): Promise<ViewableClinic[]> {
  if (isDemoMode()) {
    return DEMO_NETWORK.map(({ id, name, city }) => ({ id, name, city })).sort(
      (a, b) => a.name.localeCompare(b.name, "fr"),
    );
  }
  try {
    return (await listOrganizations())
      .filter((organization) => organization.kind === "clinic")
      .map(({ id, name, city }) => ({ id, name, city: city || null }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  } catch {
    return [];
  }
}
