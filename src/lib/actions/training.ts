"use server";

import { revalidatePath } from "next/cache";

import type { ReportSections } from "@/components/editor/sections";
import { getMessages } from "@/i18n/server";
import { apiGet, apiSend } from "@/lib/api/client";
import {
  trainingAttemptSchema,
  trainingCaseDetailSchema,
} from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { ADDENDUM_MAX_LENGTH, isSectionsPayload } from "@/lib/editor/payload";

/**
 * Le circuit d'un exercice de formation : prise en charge, rédaction,
 * signature, addendum, recommencer (docs/formation.md du backend).
 *
 * Mêmes règles que celles d'un vrai compte-rendu, et pour les mêmes
 * raisons : actions serveur seulement (le jeton vit dans un cookie
 * `httpOnly`), version attendue à chaque écriture, refus du service
 * relayé tel quel. Rien ici ne touche un examen ni un compte-rendu réels.
 */

/** Nom court d'un cas : celui du catalogue, rien d'autre. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Rafraîchit la liste et l'écran d'un cas. */
function revalidateCase(slug: string) {
  revalidatePath("/formation");
  revalidatePath(`/formation/${slug}`);
}

async function invalidSlug<T = undefined>(
  slug: string,
): Promise<ActionResult<T> | null> {
  if (typeof slug === "string" && SLUG.test(slug)) return null;
  const { t } = await getMessages();
  return { ok: false, error: t.common.errors.invalidId, status: 422 };
}

/** Ce que la prise en charge d'un exercice renvoie à l'écran. */
export interface OpenedAttempt {
  attemptId: string;
  version: number;
}

/**
 * Prend un exercice en charge, ou le reprend.
 *
 * @param slug Nom court du cas.
 */
export async function openTrainingAttempt(
  slug: string,
): Promise<ActionResult<OpenedAttempt>> {
  const invalid = await invalidSlug<OpenedAttempt>(slug);
  if (invalid) return invalid;
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.training.errors.demo);
  }
  const result = await run(async () => {
    const attempt = await apiSend(
      `/training/cases/${encodeURIComponent(slug)}/attempt`,
      "POST",
      undefined,
      trainingAttemptSchema,
    );
    return { attemptId: attempt.id, version: attempt.version };
  });
  revalidateCase(slug);
  return result;
}

/**
 * Enregistre le texte d'un exercice en cours.
 *
 * @param attemptId       Exercice concerné.
 * @param sections        Contenu des cinq sections.
 * @param expectedVersion Version lue avant cette modification.
 * @returns La nouvelle version.
 */
export async function saveTrainingDraft(
  attemptId: string,
  sections: ReportSections,
  expectedVersion: number,
): Promise<ActionResult<{ version: number }>> {
  if (isDemoMode()) return { ok: true, data: { version: expectedVersion + 1 } };
  const invalid = await rejectInvalidIds(attemptId);
  if (invalid) return invalid;
  if (!Number.isInteger(expectedVersion) || !isSectionsPayload(sections)) {
    const { t } = await getMessages();
    return { ok: false, error: t.training.errors.invalidDraft, status: 422 };
  }
  return run(async () => {
    const saved = await apiSend(
      `/training/attempts/${encodeURIComponent(attemptId)}`,
      "PATCH",
      { sections, expected_version: expectedVersion },
      trainingAttemptSchema,
    );
    return { version: saved.version };
  });
}

/**
 * Version de l'exercice actuellement en base, pour résoudre un conflit
 * d'enregistrement en gardant le texte affiché.
 *
 * @param slug Nom court du cas.
 */
export async function readTrainingVersion(
  slug: string,
): Promise<ActionResult<{ version: number; signed: boolean }>> {
  const invalid = await invalidSlug<{ version: number; signed: boolean }>(slug);
  if (invalid) return invalid;
  if (isDemoMode()) return { ok: true, data: { version: 0, signed: false } };
  return run(async () => {
    const detail = await apiGet(
      `/training/cases/${encodeURIComponent(slug)}`,
      trainingCaseDetailSchema,
    );
    return {
      version: detail.attempt?.version ?? 0,
      signed: Boolean(detail.attempt?.submitted_at),
    };
  });
}

/**
 * Signe un exercice : le texte est figé, le PDF spécimen disponible.
 *
 * @param slug            Nom court du cas, pour rafraîchir ses écrans.
 * @param attemptId       Exercice à signer.
 * @param expectedVersion Version relue à l'écran.
 */
export async function submitTraining(
  slug: string,
  attemptId: string,
  expectedVersion: number,
): Promise<ActionResult> {
  const invalidCase = await invalidSlug(slug);
  if (invalidCase) return invalidCase;
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.training.errors.demo);
  }
  const invalid = await rejectInvalidIds(attemptId);
  if (invalid) return invalid;
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    const { t } = await getMessages();
    return { ok: false, error: t.training.errors.invalidDraft, status: 422 };
  }
  const result = await run(async () => {
    await apiSend(
      `/training/attempts/${encodeURIComponent(attemptId)}/submit`,
      "POST",
      { expected_version: expectedVersion },
      trainingAttemptSchema,
    );
    return undefined;
  });
  revalidateCase(slug);
  return result;
}

/**
 * Ajoute un addendum à un exercice signé.
 *
 * @param slug      Nom court du cas.
 * @param attemptId Exercice signé.
 * @param body      Texte de l'addendum.
 */
export async function addTrainingAddendum(
  slug: string,
  attemptId: string,
  body: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) {
    return { ok: false, error: t.training.errors.emptyAddendum, status: 422 };
  }
  if (text.length > ADDENDUM_MAX_LENGTH) {
    return { ok: false, error: t.reading.actions.addendumTooLong, status: 422 };
  }
  const invalidCase = await invalidSlug(slug);
  if (invalidCase) return invalidCase;
  if (isDemoMode()) return await demoUnavailable(t.training.errors.demo);
  const invalid = await rejectInvalidIds(attemptId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/training/attempts/${encodeURIComponent(attemptId)}/addenda`,
      "POST",
      { body: text },
      trainingAttemptSchema,
    );
    return undefined;
  });
  revalidateCase(slug);
  return result;
}

/**
 * Efface un exercice, signé ou non, pour le recommencer.
 *
 * @param slug      Nom court du cas.
 * @param attemptId Exercice à effacer.
 */
export async function resetTraining(
  slug: string,
  attemptId: string,
): Promise<ActionResult> {
  const invalidCase = await invalidSlug(slug);
  if (invalidCase) return invalidCase;
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.training.errors.demo);
  }
  const invalid = await rejectInvalidIds(attemptId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/training/attempts/${encodeURIComponent(attemptId)}`,
      "DELETE",
    );
    return undefined;
  });
  revalidateCase(slug);
  return result;
}
