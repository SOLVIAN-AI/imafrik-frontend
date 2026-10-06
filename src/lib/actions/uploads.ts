"use server";

import { apiSend } from "@/lib/api/client";
import { API_URL } from "@/lib/api/config";
import { uploadTokenSchema } from "@/lib/api/contracts";
import { type ActionResult, demoUnavailable, run } from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";

/** Ce dont le navigateur a besoin pour déposer des fichiers. */
export interface UploadGrant {
  /** Adresse de dépôt de l'API. */
  endpoint: string;
  /** Jeton à présenter dans l'en-tête `X-Upload-Token`. */
  token: string;
  /** Durée de vie du jeton, en secondes. */
  expiresIn: number;
}

/**
 * Obtient un jeton de dépôt d'examens pour la clinique active.
 *
 * Le navigateur envoie les fichiers directement à l'API — un examen pèse
 * des centaines de mégaoctets, et l'hébergement de l'application refuse
 * les requêtes de plus de quelques mégaoctets. Il ne détient pourtant pas
 * la session, qui reste dans un cookie que seul ce serveur lit : ce jeton
 * fait le pont, limité au dépôt, à cette clinique et à trente minutes.
 */
export async function getUploadGrant(): Promise<ActionResult<UploadGrant>> {
  if (isDemoMode() || !API_URL) return demoUnavailable("Le dépôt d’examens");
  return run(async () => {
    const grant = await apiSend(
      "/uploads/token",
      "POST",
      undefined,
      uploadTokenSchema,
    );
    return {
      endpoint: `${API_URL}/uploads`,
      token: grant.token,
      expiresIn: grant.expires_in,
    };
  });
}
