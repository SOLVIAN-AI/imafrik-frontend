"use server";

import type { StudyStatus } from "@/components/domain/study-status";
import { type ActionResult, run } from "@/lib/actions/result";
import { listStudies } from "@/lib/data/studies";

/** Un examen trouvé, réduit à ce que la palette affiche. */
export interface StudyHit {
  id: string;
  patientName: string;
  patientId: string;
  modality: string;
  bodyPart: string | null;
  clinic: string;
  status: StudyStatus;
  urgent: boolean;
}

/**
 * Recherche d'examens pour la palette de commandes.
 *
 * La recherche est faite par le service, sur le périmètre de
 * l'utilisateur — RLS en base, comme pour toute liste : la palette ne
 * peut pas trouver un examen que son écran ne montrerait pas.
 *
 * Huit résultats au plus : la palette sert à aller vite vers un examen
 * précis, pas à parcourir une liste — la liste complète reste à un
 * « Entrée » de là.
 *
 * @param query Nom ou identifiant du patient, modalité.
 */
export async function searchStudies(
  query: string,
): Promise<ActionResult<StudyHit[]>> {
  const needle = query.trim().slice(0, 100);
  if (needle.length < 2) return { ok: true, data: [] };
  return run(async () =>
    (await listStudies({ search: needle, limit: 8 })).map((study) => ({
      id: study.id,
      patientName: study.patientName,
      patientId: study.patientId,
      modality: study.modality,
      bodyPart: study.bodyPart,
      clinic: study.clinic,
      status: study.status,
      urgent: study.urgent,
    })),
  );
}
