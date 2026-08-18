import type { StudyStatus } from "@/components/domain/study-status";
import { apiFetch, isApiConfigured } from "@/lib/api/client";
import {
  studyListSchema,
  studySchema,
  type ApiStudy,
} from "@/lib/api/contracts";
import { DEMO_STUDIES, type DemoStudy } from "@/lib/demo/studies";
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
  patientName: string;
  patientId: string;
  modality: string;
  bodyPart: string | null;
  description: string | null;
  clinic: string;
  status: StudyStatus;
  urgent: boolean;
  seriesCount: number;
  instanceCount: number;
  receivedAt: Date;
  assignedTo: string | null;
}

/** Traduit la forme de l'API vers celle de l'interface. */
function toStudy(row: ApiStudy): Study {
  return {
    id: row.id,
    studyInstanceUid: row.study_instance_uid,
    patientName: row.patient_name,
    patientId: row.patient_id,
    modality: row.modality,
    bodyPart: row.body_part,
    description: row.description,
    clinic: row.clinic_name,
    status: row.status,
    urgent: row.urgent,
    seriesCount: row.series_count,
    instanceCount: row.instance_count,
    receivedAt: row.received_at,
    assignedTo: row.assigned_to,
  };
}

/** Le jeu de démonstration porte déjà la forme de l'interface. */
function fromDemo(study: DemoStudy): Study {
  return study;
}

export interface StudyQuery {
  status?: StudyStatus[];
  /** Recherche libre : nom, identifiant patient, modalité. */
  search?: string;
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
  if (!isApiConfigured()) {
    return filterDemo(await demoScope(), query);
  }

  const params = new URLSearchParams();
  for (const status of query.status ?? []) params.append("status", status);
  if (query.search) params.set("q", query.search);
  if (query.limit) params.set("limit", String(query.limit));

  const raw = await apiFetch<unknown>(`/studies?${params.toString()}`);
  return studyListSchema.parse(raw).items.map(toStudy);
}

/**
 * Un examen précis.
 *
 * @returns L'examen, ou `null` s'il n'existe pas — ou s'il appartient à
 *          une organisation que l'utilisateur ne sert pas, cas que la
 *          base rend indiscernable du précédent, à dessein.
 */
export async function getStudy(id: string): Promise<Study | null> {
  if (!isApiConfigured()) {
    const visible = await demoScope();
    return visible.find((study) => study.id === id) ?? null;
  }

  try {
    const raw = await apiFetch<unknown>(`/studies/${id}`);
    return toStudy(studySchema.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Restreint le jeu de démonstration à ce que verrait l'organisation
 * active.
 *
 * **Simule ce que font les politiques RLS**, et rien de plus : une
 * clinique ne voit que ses propres examens, un cabinet de radiologie
 * voit ceux des établissements qu'il sert. Sans cette restriction, la
 * démonstration montrerait à une clinique les patients d'une autre — ce
 * qui donnerait une idée fausse du produit, et une très mauvaise idée
 * des garanties.
 */
async function demoScope(): Promise<Study[]> {
  const session = await getSession();
  const studies = DEMO_STUDIES.map(fromDemo);

  if (session?.active.organizationKind !== "clinic") return studies;
  return studies.filter(
    (study) => study.clinic === session.active.organizationName,
  );
}

/** Applique les filtres au jeu de démonstration. */
function filterDemo(studies: Study[], query: StudyQuery): Study[] {
  let result = studies;

  if (query.status?.length) {
    result = result.filter((study) => query.status!.includes(study.status));
  }

  if (query.search) {
    const needle = query.search.toLowerCase();
    result = result.filter((study) =>
      `${study.patientName} ${study.patientId} ${study.modality} ${study.bodyPart ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }

  return query.limit ? result.slice(0, query.limit) : result;
}
