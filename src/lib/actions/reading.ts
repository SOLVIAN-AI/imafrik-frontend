"use server";

import { revalidatePath } from "next/cache";

import {
  REPORT_SECTIONS,
  type ReportSections,
} from "@/components/editor/sections";
import { getMessages } from "@/i18n/server";
import { apiGet, apiSend } from "@/lib/api/client";
import {
  addendumSchema,
  pdfLinkSchema,
  reportSchema,
  studySchema,
} from "@/lib/api/contracts";
import {
  type ActionResult,
  demoUnavailable,
  rejectInvalidIds,
  run,
} from "@/lib/actions/result";
import { isDemoMode } from "@/lib/demo/mode";

/**
 * Le circuit de lecture : prise en charge, rédaction, signature.
 *
 * Toutes ces écritures passent par des actions serveur, jamais par un
 * appel depuis le navigateur : le jeton qui les autorise vit dans un
 * cookie `httpOnly`, et l'exposer au client annulerait l'intérêt du
 * cookie.
 *
 * L'ordre est imposé par le service, en base : on ne rédige qu'un examen
 * qu'on a pris en charge, on ne signe que son propre brouillon, et une
 * signature échoue si le texte a changé pendant qu'elle se faisait.
 */

/** Ce que la prise en charge renvoie à l'écran. */
export interface ClaimedStudy {
  studyId: string;
  reportId: string;
  version: number;
}

/**
 * Prend un examen en charge et ouvre son brouillon.
 *
 * Les deux gestes sont liés : prendre un examen, c'est s'apprêter à le
 * rédiger. Le service refuse si un autre radiologue a été plus rapide —
 * deux personnes ne peuvent pas rédiger le même compte-rendu.
 *
 * Idempotent pour celui qui l'a déjà pris : rouvrir son propre examen
 * renvoie le même brouillon.
 *
 * @param studyId Examen à prendre.
 */
export async function claimStudy(
  studyId: string,
): Promise<ActionResult<ClaimedStudy>> {
  if (isDemoMode()) {
    return {
      ok: true,
      data: { studyId, reportId: `draft-${studyId}`, version: 1 },
    };
  }
  const invalid = await rejectInvalidIds(studyId);
  if (invalid) return invalid;
  const result = await run(async () => {
    const id = encodeURIComponent(studyId);
    await apiSend(`/studies/${id}/claim`, "POST", undefined, studySchema);
    const draft = await apiSend(
      `/studies/${id}/report`,
      "POST",
      undefined,
      reportSchema,
    );
    return { studyId, reportId: draft.id, version: draft.version };
  });
  revalidatePath("/worklist");
  revalidatePath("/mes-examens");
  return result;
}

/**
 * Rend un examen au pool.
 *
 * Le brouillon commencé est effacé avec lui : sinon le radiologue
 * suivant ne pourrait ni le reprendre ni en ouvrir un autre.
 */
export async function releaseStudy(studyId: string): Promise<ActionResult> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.reading.actions.releaseDemoAction);
  }
  const invalid = await rejectInvalidIds(studyId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/studies/${encodeURIComponent(studyId)}/release`,
      "POST",
      undefined,
      studySchema,
    );
    return undefined;
  });
  revalidatePath("/worklist");
  revalidatePath("/mes-examens");
  return result;
}

/** Taille maximale d'une section, en caractères de HTML. */
const SECTION_MAX_LENGTH = 200_000;

/**
 * Vrai si le brouillon reçu a la forme attendue : les sections connues,
 * chacune du texte de taille raisonnable, et rien d'autre.
 *
 * Le service valide aussi ; ce contrôle évite de lui relayer n'importe
 * quel objet venu du navigateur.
 */
function isSectionsPayload(value: unknown): value is ReportSections {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const known = new Set<string>(REPORT_SECTIONS.map((section) => section.key));
  return Object.entries(value).every(
    ([key, html]) =>
      known.has(key) &&
      typeof html === "string" &&
      html.length <= SECTION_MAX_LENGTH,
  );
}

/**
 * Enregistre un brouillon.
 *
 * La version attendue est transmise : si le brouillon a été modifié
 * ailleurs entre-temps — un second onglet — le service refuse plutôt que
 * d'écraser en silence, et l'écran le dit.
 *
 * @param reportId        Compte-rendu concerné.
 * @param sections        Contenu des cinq sections.
 * @param expectedVersion Version lue avant cette modification.
 * @returns La nouvelle version.
 */
export async function saveReportDraft(
  reportId: string,
  sections: ReportSections,
  expectedVersion: number,
): Promise<ActionResult<{ version: number }>> {
  if (isDemoMode()) return { ok: true, data: { version: expectedVersion + 1 } };
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;
  if (!Number.isInteger(expectedVersion) || !isSectionsPayload(sections)) {
    const { t } = await getMessages();
    return { ok: false, error: t.reading.actions.invalidDraft, status: 422 };
  }
  return run(async () => {
    const saved = await apiSend(
      `/reports/${encodeURIComponent(reportId)}`,
      "PATCH",
      { sections, expected_version: expectedVersion },
      reportSchema,
    );
    return { version: saved.version };
  });
}

/**
 * Signe un compte-rendu.
 *
 * **Irréversible.** Le service vérifie à nouveau les sections
 * obligatoires, l'auteur, la prise en charge et la version ; un
 * déclencheur verrouille ensuite le document en base.
 */
export async function signReport(reportId: string): Promise<ActionResult> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.reading.actions.signDemoAction);
  }
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;
  const result = await run(async () => {
    await apiSend(
      `/reports/${encodeURIComponent(reportId)}/sign`,
      "POST",
      undefined,
      reportSchema,
    );
    return undefined;
  });
  revalidatePath("/worklist");
  revalidatePath("/mes-examens");
  revalidatePath("/comptes-rendus");
  return result;
}

/**
 * Lien de téléchargement du PDF signé, valable quelques minutes.
 *
 * Demandé au clic plutôt qu'au rendu de la page : un lien pré-signé
 * affiché dans la page expirerait avant qu'on s'en serve, et le premier
 * téléchargement par la clinique marque l'examen comme livré.
 */
export async function getReportPdfLink(
  reportId: string,
): Promise<ActionResult<string>> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.reading.actions.pdfDemoAction);
  }
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;
  const result = await run(async () => {
    const link = await apiGet(
      `/reports/${encodeURIComponent(reportId)}/pdf`,
      pdfLinkSchema,
    );
    return link.url;
  });
  revalidatePath("/comptes-rendus");
  revalidatePath("/tableau-de-bord");
  return result;
}

/** Longueur maximale d'un addendum — celle que le service impose. */
const ADDENDUM_MAX_LENGTH = 10_000;

/**
 * Ajoute un addendum à un compte-rendu signé.
 *
 * Le compte-rendu signé reste intact ; la correction s'y ajoute, datée et
 * signée au nom de son auteur, visible de la clinique comme du radiologue.
 * **Irréversible**, comme la signature : un addendum se corrige par un
 * autre addendum.
 *
 * @param reportId Compte-rendu signé.
 * @param body     Texte de la correction.
 */
export async function addAddendum(
  reportId: string,
  body: string,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) {
    return { ok: false, error: t.reading.actions.addendumEmpty, status: 422 };
  }
  if (text.length > ADDENDUM_MAX_LENGTH) {
    return {
      ok: false,
      error: t.reading.actions.addendumTooLong,
      status: 422,
    };
  }
  if (isDemoMode()) {
    return await demoUnavailable(t.reading.actions.addendumDemoAction);
  }
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;

  const result = await run(async () => {
    await apiSend(
      `/reports/${encodeURIComponent(reportId)}/addenda`,
      "POST",
      { body: text },
      addendumSchema,
    );
    return undefined;
  });
  revalidatePath(`/comptes-rendus/${reportId}`);
  revalidatePath("/examens");
  return result;
}
