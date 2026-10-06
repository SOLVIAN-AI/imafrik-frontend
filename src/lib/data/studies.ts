import "server-only";

import type { StudyStatus } from "@/components/domain/study-status";
import { apiFetch, apiGet } from "@/lib/api/client";
import {
  studyPageSchema,
  studySchema,
  viewerTokenSchema,
  type ApiStudy,
} from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_STUDIES, DEMO_USER_ID } from "@/lib/demo/studies";
import { getSession } from "@/lib/session/server";

/**
 * Un examen, tel que l'interface le manipule.
 *
 * Les noms sont ceux du métier en français et les dates sont des `Date` :
 * la conversion depuis la forme de l'API a lieu **une fois**, ici. Sans
 * cette frontière, chaque écran devrait connaître le nommage de l'API,
 * et un renommage côté service se propagerait dans toute l'interface.
 */
export interface Study {
  id: string;
  studyInstanceUid: string;
  /** Nom au format DICOM, `NOM^Prénom`. Vide si la console ne l'a pas transmis. */
  patientName: string;
  /** Identifiant patient propre à la clinique. */
  patientId: string;
  /** Sexe DICOM : `M`, `F`, `O`, ou `null` s'il n'a pas été transmis. */
  patientSex: string | null;
  /** Date de naissance, `AAAA-MM-JJ`, si la console l'a transmise. */
  patientBirthDate: string | null;
  modality: string;
  bodyPart: string | null;
  /** Renseignement clinique saisi par la clinique. */
  clinicalInfo: string | null;
  clinic: string;
  clinicId: string;
  status: StudyStatus;
  urgent: boolean;
  seriesCount: number;
  instanceCount: number;
  receivedAt: Date;
  /** Profil du radiologue qui a pris l'examen en charge. */
  assignedTo: string | null;
  /** Son nom, quand l'utilisateur a le droit de le voir. */
  assignedToName: string | null;
  /** Compte-rendu visible par l'utilisateur, s'il existe. */
  reportId: string | null;
  /** Date de signature du compte-rendu. */
  reportedAt: Date | null;
  /** Signataire, figé à la signature. */
  reportedBy: string | null;
}

/** Traduit la forme de l'API vers celle de l'interface. */
function toStudy(row: ApiStudy): Study {
  return {
    id: row.id,
    studyInstanceUid: row.study_instance_uid,
    patientName: row.patient_name ?? "",
    patientId: row.patient_id_local ?? "",
    patientSex: row.patient_sex,
    patientBirthDate: row.patient_birthdate,
    modality: row.modality ?? "—",
    bodyPart: row.body_part,
    clinicalInfo: row.clinical_info,
    clinic: row.clinic_name,
    clinicId: row.organization_id,
    status: row.status,
    urgent: row.priority === "urgent",
    seriesCount: row.series_count,
    instanceCount: row.instance_count,
    receivedAt: new Date(row.received_at),
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    reportId: row.report_id,
    reportedAt: row.reported_at ? new Date(row.reported_at) : null,
    reportedBy: row.reported_by_name,
  };
}

export interface StudyQuery {
  status?: StudyStatus[];
  /** Recherche libre : nom ou identifiant du patient, modalité. */
  search?: string;
  /** Seulement les examens que l'utilisateur a pris en charge. */
  mine?: boolean;
  limit?: number;
}

/**
 * Examens visibles par l'utilisateur courant.
 *
 * **Aucun filtre d'organisation n'est passé, et c'est volontaire.** La
 * restriction est appliquée par les politiques RLS à partir des claims du
 * jeton : une clinique ne peut pas voir les examens d'une autre, même en
 * fabriquant la requête à la main. Filtrer aussi côté client donnerait
 * l'illusion que c'est l'interface qui protège.
 *
 * @param query Filtres facultatifs.
 */
export async function listStudies(query: StudyQuery = {}): Promise<Study[]> {
  if (isDemoMode()) return filterDemo(await demoScope(), query);

  const params = new URLSearchParams();
  for (const status of query.status ?? []) params.append("status", status);
  if (query.search) params.set("q", query.search);
  if (query.mine) params.set("mine", "true");
  params.set("limit", String(query.limit ?? 200));

  const page = await apiGet(`/studies?${params.toString()}`, studyPageSchema);
  return page.items.map(toStudy);
}

/**
 * Un examen précis.
 *
 * @returns L'examen, ou `null` s'il n'existe pas — ou s'il appartient à
 *          une organisation que l'utilisateur ne sert pas, cas que l'API
 *          rend indiscernable du précédent, à dessein.
 * @throws ApiError pour toute autre erreur : une panne doit s'afficher
 *         comme une panne, pas comme un examen introuvable.
 */
export async function getStudy(id: string): Promise<Study | null> {
  if (isDemoMode()) {
    return (await demoScope()).find((study) => study.id === id) ?? null;
  }
  const row = await apiGet(`/studies/${encodeURIComponent(id)}`, studySchema, {
    notFoundAsNull: true,
  });
  return row ? toStudy(row) : null;
}

/**
 * Restreint le jeu de démonstration à ce que verrait l'organisation
 * active — **simule les politiques RLS**, et rien de plus. Sans cette
 * restriction, la démonstration montrerait à une clinique les patients
 * d'une autre, ce qui donnerait une idée fausse des garanties.
 */
async function demoScope(): Promise<Study[]> {
  const session = await getSession();
  if (session?.active?.organizationKind !== "clinic") return DEMO_STUDIES;
  return DEMO_STUDIES.filter(
    (study) => study.clinic === session.active?.organizationName,
  );
}

/** Applique les filtres au jeu de démonstration. */
function filterDemo(studies: Study[], query: StudyQuery): Study[] {
  let result = studies;

  if (query.status?.length) {
    result = result.filter((study) => query.status!.includes(study.status));
  }
  if (query.mine) {
    result = result.filter((study) => study.assignedTo === DEMO_USER_ID);
  }
  if (query.search) {
    const needle = query.search.toLowerCase();
    result = result.filter((study) =>
      `${study.patientName} ${study.patientId} ${study.modality}`
        .toLowerCase()
        .includes(needle),
    );
  }
  return query.limit ? result.slice(0, query.limit) : result;
}

/**
 * Adresse du viewer pour un examen, avec un jeton de visualisation neuf.
 *
 * Le jeton est **à durée de vie courte et n'est jamais persisté** : il
 * vit quinze minutes dans le cache du service, et c'est lui que le plugin
 * d'autorisation d'Orthanc vérifie à chaque requête d'image. Une adresse
 * copiée cesse donc de fonctionner d'elle-même. Le service trace chaque
 * émission dans le journal d'audit : ouvrir les images d'un examen est un
 * accès à des données de santé.
 *
 * @returns L'adresse, ou `null` si le jeton n'a pas pu être obtenu — le
 *          volet d'images affiche alors un état explicite plutôt qu'un
 *          cadre vide.
 */
export async function getViewerUrl(studyId: string): Promise<string | null> {
  if (isDemoMode()) return null;
  try {
    const response = await apiFetch(
      `/studies/${encodeURIComponent(studyId)}/viewer-token`,
      {
        method: "POST",
      },
    );
    return viewerTokenSchema.parse(await response.json()).viewer_url;
  } catch (error) {
    console.error("Jeton de visualisation indisponible", error);
    return null;
  }
}
