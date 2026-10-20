"use server";

import { z } from "zod";

import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { apiSend } from "@/lib/api/client";
import { viewerTokenRenewedSchema } from "@/lib/api/contracts";
import { getViewerUrl } from "@/lib/data/studies";
import { getTrainingViewerUrl } from "@/lib/data/training";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/**
 * Jeton du viewer, prolongé tant que l'examen reste ouvert.
 *
 * Le viewer garde le jeton reçu à l'ouverture : il le lit dans son
 * adresse, puis le retire. Émis pour quinze minutes, il expirait pendant
 * la rédaction, et OHIF refusait ensuite toute série non encore chargée
 * (signalé le 21 octobre 2026). Le volet d'images le prolonge donc à
 * intervalles réguliers ; le service revérifie à chaque fois le droit de
 * voir l'examen.
 */

/** Ce que le viewer affiche : un examen réel, ou l'étude d'un exercice. */
export type ViewerTarget =
  { kind: "study"; studyId: string } | { kind: "training"; slug: string };

/** Forme d'un jeton de visualisation (voir `cache.TOKEN_ENTROPY_BYTES` côté service). */
const tokenSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

/** Nom court d'un cas de formation, tel qu'il paraît dans l'adresse. */
const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/);

/** Chemin du service pour une cible, ou `null` si elle est mal formée. */
async function basePath(
  target: ViewerTarget,
): Promise<ActionResult<string> | string> {
  if (target.kind === "study") {
    const invalid = await rejectInvalidIds(target.studyId);
    if (invalid) return invalid;
    return `/studies/${encodeURIComponent(target.studyId)}`;
  }
  if (!slugSchema.safeParse(target.slug).success) {
    const { t } = await getMessages();
    return { ok: false, error: t.common.errors.unexpected, status: 400 };
  }
  return `/training/cases/${encodeURIComponent(target.slug)}`;
}

/**
 * Prolonge le jeton du viewer ouvert.
 *
 * @param target Examen ou exercice ouvert.
 * @param token  Jeton reçu à l'ouverture, lu dans l'adresse du viewer.
 * @returns La nouvelle durée de vie en secondes. En échec, `status` vaut
 *          404 quand le jeton n'existe plus (expiré, révoqué, au terme de
 *          sa durée de vie) : il faut alors rouvrir le viewer.
 */
export async function renewViewerToken(
  target: ViewerTarget,
  token: string,
): Promise<ActionResult<{ expiresIn: number }>> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return demoUnavailable(t.reading.viewer.name);
  }
  const path = await basePath(target);
  if (typeof path !== "string") return path as ActionResult<never>;
  if (!tokenSchema.safeParse(token).success) {
    const { t } = await getMessages();
    return { ok: false, error: t.common.errors.unexpected, status: 400 };
  }
  return run(async () => {
    const renewed = await apiSend(
      `${path}/viewer-token/renew`,
      "POST",
      { token },
      viewerTokenRenewedSchema,
    );
    return { expiresIn: renewed.expires_in };
  });
}

/**
 * Rouvre le viewer avec un jeton neuf, quand l'ancien n'existe plus.
 *
 * Le viewer se recharge alors : la série et la disposition en cours sont
 * perdues, mais les images s'affichent de nouveau.
 *
 * @param target Examen ou exercice ouvert.
 * @returns L'adresse du viewer, ou un échec si le jeton n'a pas pu être
 *          émis (examen devenu inaccessible, images archivées, panne).
 */
export async function reopenViewer(
  target: ViewerTarget,
): Promise<ActionResult<string>> {
  const { t } = await getMessages();
  if (isDemoMode()) return demoUnavailable(t.reading.viewer.name);
  const path = await basePath(target);
  if (typeof path !== "string") return path;
  const url =
    target.kind === "study"
      ? await getViewerUrl(target.studyId)
      : await getTrainingViewerUrl(target.slug);
  return url
    ? { ok: true, data: url }
    : { ok: false, error: t.reading.viewer.reopenFailed, status: 503 };
}
