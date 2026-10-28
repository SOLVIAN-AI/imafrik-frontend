"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { apiGet, apiSend } from "@/lib/api/client";
import { clinicViewPath } from "@/lib/clinic-view";
import {
  type ApiUrgentReader,
  type ModalityGroup,
  urgentReaderSchema,
  userMembershipSchema,
} from "@/lib/api/contracts";
import { demoUrgentReaders } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Liste d'urgence d'une clinique et modalités d'un radiologue, réglées
 * par l'équipe IMAFRIK.
 *
 * La liste d'urgence réunit les radiologues autorisés à prendre une
 * urgence de la clinique sans attribution, radiologues du réseau compris :
 * le premier qui la prend l'obtient. L'équipe règle la liste entière ; le
 * responsable de la clinique règle les siens un par un, depuis « Équipe ».
 */

/** Un radiologue qui peut lire la clinique, et sa place sur la liste. */
export interface UrgentReader {
  profileId: string;
  name: string;
  organizationName: string;
  viaPool: boolean;
  readModalities: ModalityGroup[] | null;
  urgentReader: boolean;
}

function toReader(row: ApiUrgentReader): UrgentReader {
  return {
    profileId: row.profile_id,
    name: row.name,
    organizationName: row.organization_name,
    viaPool: row.via_pool,
    readModalities: row.read_modalities,
    urgentReader: row.urgent_reader,
  };
}

const path = (clinicId: string) =>
  `/admin/clinics/${encodeURIComponent(clinicId)}/urgent-readers`;

/**
 * Radiologues qui peuvent lire la clinique, ceux de la liste d'urgence
 * d'abord.
 *
 * @param clinicId Clinique.
 */
export async function getUrgentReaders(
  clinicId: string,
): Promise<ActionResult<UrgentReader[]>> {
  if (isDemoMode()) {
    return { ok: true, data: demoUrgentReaders(clinicId).map(toReader) };
  }
  const invalid = await rejectInvalidIds(clinicId);
  if (invalid) return invalid;
  return run(async () =>
    (await apiGet(path(clinicId), z.array(urgentReaderSchema))).map(toReader),
  );
}

/**
 * Remplace la liste d'urgence de la clinique.
 *
 * @param clinicId   Clinique.
 * @param profileIds Radiologues retenus.
 */
export async function setUrgentReaders(
  clinicId: string,
  profileIds: string[],
): Promise<ActionResult<UrgentReader[]>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  const invalid = await rejectInvalidIds(clinicId, ...profileIds);
  if (invalid) return invalid;
  const result = await run(async () =>
    (
      await apiSend(
        path(clinicId),
        "PUT",
        { profile_ids: profileIds },
        z.array(urgentReaderSchema),
      )
    ).map(toReader),
  );
  if (result.ok) {
    revalidatePath(`/admin/organisations/${clinicId}`);
    // L'équipe de la clinique, dans la vue des cliniques.
    revalidatePath(clinicViewPath(clinicId, "/equipe"));
  }
  return result;
}

/**
 * Modalités lues par un radiologue, par l'appartenance donnée.
 *
 * @param membershipId   Appartenance du radiologue.
 * @param readModalities Groupes lus ; `null` pour tous.
 */
export async function setMembershipModalities(
  membershipId: string,
  readModalities: ModalityGroup[] | null,
): Promise<ActionResult<ModalityGroup[] | null>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.assignment.demoAction);
  const invalid = await rejectInvalidIds(membershipId);
  if (invalid) return invalid;
  if (readModalities !== null && readModalities.length === 0) {
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  const result = await run(
    async () =>
      (
        await apiSend(
          `/admin/memberships/${encodeURIComponent(membershipId)}/modalities`,
          "PUT",
          { read_modalities: readModalities },
          userMembershipSchema,
        )
      ).read_modalities ?? null,
  );
  if (result.ok) revalidatePath("/admin/utilisateurs");
  return result;
}
