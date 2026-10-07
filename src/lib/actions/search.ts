"use server";

import { cookies } from "next/headers";

import type { StudyStatus } from "@/components/domain/study-status";
import { type ActionResult, run } from "@/lib/actions/result";
import { listStudies } from "@/lib/data/studies";
import {
  encodeListSearch,
  isListSearchScope,
  LIST_SEARCH_MAX_AGE,
  listSearchCookie,
  normalizeListSearch,
} from "@/lib/search/list-search";
import { getSession } from "@/lib/session/server";

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

/**
 * Applique — ou efface — la recherche d'une liste d'examens.
 *
 * La recherche est écrite dans un cookie httpOnly lié au compte et à
 * l'organisation active, jamais dans l'adresse : elle porte un nom de
 * patient (voir `lib/search/list-search.ts`). Modifier un cookie depuis
 * une action fait relire l'écran courant par Next, qui affiche aussitôt
 * la liste filtrée.
 *
 * @param scope Liste concernée.
 * @param raw   Saisie de l'utilisateur ; vide pour effacer.
 */
export async function setListSearch(
  scope: string,
  raw: string,
): Promise<ActionResult> {
  if (!isListSearchScope(scope) || typeof raw !== "string")
    return { ok: false, error: "Recherche invalide.", status: 400 };
  const session = await getSession();
  if (!session) return { ok: false, error: "Session expirée.", status: 401 };

  const store = await cookies();
  const name = listSearchCookie(scope);
  const search = normalizeListSearch(raw);
  if (!search) {
    store.delete(name);
    return { ok: true, data: undefined };
  }
  store.set(
    name,
    encodeListSearch(
      { userId: session.user.id, membershipId: session.active.id },
      search,
    ),
    {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LIST_SEARCH_MAX_AGE,
    },
  );
  return { ok: true, data: undefined };
}
