"use server";

import { revalidatePath } from "next/cache";

import { apiSend } from "@/lib/api/client";
import { API_URL } from "@/lib/api/config";
import { teamUploadGrantSchema, uploadTokenSchema } from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";
import { getMessages } from "@/i18n/server";

/** Ce dont le navigateur a besoin pour envoyer une archive. */
export interface DepositGrant {
  /** Adresse de création des envois (protocole tus) de l'API. */
  endpoint: string;
  /** Jeton à présenter dans l'en-tête `X-Upload-Token`. */
  token: string;
  /** Durée de vie du jeton, en secondes. */
  expiresIn: number;
}

/**
 * Jeton d'envoi d'une archive, pour la clinique active.
 *
 * Le navigateur envoie l'archive directement à l'API, par morceaux : elle
 * pèse jusqu'à 2 Go, et l'hébergement de l'application refuse les
 * requêtes de plus de quelques mégaoctets. Le jeton ne vaut que pour le
 * dépôt, cette clinique et trente minutes ; l'envoi en redemande un
 * avant son expiration, aussi longtemps qu'il dure.
 */
export async function getDepositGrant(): Promise<ActionResult<DepositGrant>> {
  if (isDemoMode() || !API_URL) {
    const { t } = await getMessages();
    return await demoUnavailable(t.deposits.demoAction);
  }
  return run(async () => {
    const grant = await apiSend(
      "/uploads/token",
      "POST",
      undefined,
      uploadTokenSchema,
    );
    return {
      endpoint: `${API_URL}/deposits/files`,
      token: grant.token,
      expiresIn: grant.expires_in,
    };
  });
}

/**
 * Jeton d'envoi d'une archive pour l'équipe IMAFRIK, au nom d'une
 * clinique. Le service le réserve aux archives, tracées au journal avec
 * la mention de l'équipe.
 *
 * @param clinicId Clinique choisie.
 */
export async function getTeamDepositGrant(
  clinicId: string,
): Promise<ActionResult<DepositGrant>> {
  if (isDemoMode() || !API_URL) {
    const { t } = await getMessages();
    return await demoUnavailable(t.deposits.demoAction);
  }
  const invalid = await rejectInvalidIds(clinicId);
  if (invalid) return invalid;
  return run(async () => {
    const grant = await apiSend(
      `/admin/clinics/${encodeURIComponent(clinicId)}/upload-token`,
      "POST",
      undefined,
      teamUploadGrantSchema,
    );
    return {
      endpoint: `${API_URL}/deposits/files`,
      token: grant.token,
      expiresIn: grant.expires_in,
    };
  });
}

/**
 * Annule un envoi interrompu ou en cours : ce qui en est reçu est effacé.
 *
 * @param depositId Dépôt à annuler.
 * @param team      `true` depuis la console de l'équipe IMAFRIK.
 */
export async function cancelDeposit(
  depositId: string,
  team = false,
): Promise<ActionResult> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.deposits.demoCancel);
  }
  const invalid = await rejectInvalidIds(depositId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `${team ? "/admin" : ""}/deposits/${encodeURIComponent(depositId)}/cancel`,
      "POST",
    );
    return undefined;
  });
  if (result.ok) {
    revalidatePath(team ? "/admin/depots" : "/examens/depots");
  }
  return result;
}
