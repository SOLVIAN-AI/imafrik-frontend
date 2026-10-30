"use server";

import { revalidatePath } from "next/cache";

import {
  isReportLayout,
  type ReportLayout,
  type ReportSections,
} from "@/components/editor/sections";
import { getMessages } from "@/i18n/server";
import { apiGet, apiSend } from "@/lib/api/client";
import {
  addendumSchema,
  aiReviewSchema,
  type ApiAddendumCreate,
  type ApiSignRequest,
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
import type { AiReviewResult } from "@/components/editor/ai-review";
import { isDemoMode } from "@/lib/demo/mode";
import { ADDENDUM_MAX_LENGTH, isSectionsPayload } from "@/lib/editor/payload";
import { parsePinProof, pinBody, type PinProof } from "@/lib/signing";

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
 * rédiger. Le service ne l'accepte que pour un examen attribué au
 * radiologue, ou une urgence de sa liste d'urgence ; il refuse si un
 * confrère a pris l'urgence le premier : deux personnes ne peuvent pas
 * rédiger le même compte-rendu.
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
 * Rend un examen avant de l'avoir signé : il redevient « à attribuer ».
 *
 * Le brouillon commencé est effacé avec lui : sinon le radiologue
 * suivant ne pourrait ni le reprendre ni en ouvrir un autre. Le
 * radiologue ne le voit plus ; la clinique (et l'équipe IMAFRIK qui l'avait
 * attribué) en est prévenue par le service.
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

/**
 * Enregistre un brouillon.
 *
 * La version attendue est transmise : si le brouillon a été modifié
 * ailleurs entre-temps — un second onglet — le service refuse plutôt que
 * d'écraser en silence, et l'écran le dit.
 *
 * La mise en page part avec chaque enregistrement : le service n'écrit
 * que les sections de cette mise en page et retire celles de l'autre.
 * Changer de mise en page n'est donc qu'un enregistrement de plus, avec
 * le texte converti par l'éditeur, sans perte.
 *
 * @param reportId        Compte-rendu concerné.
 * @param sections        Sections de la mise en page, et elles seules.
 * @param expectedVersion Version lue avant cette modification.
 * @param layout          Mise en page du texte.
 * @returns La nouvelle version.
 */
export async function saveReportDraft(
  reportId: string,
  sections: Partial<ReportSections>,
  expectedVersion: number,
  layout: ReportLayout = "structured",
): Promise<ActionResult<{ version: number }>> {
  if (isDemoMode()) return { ok: true, data: { version: expectedVersion + 1 } };
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;
  if (
    !Number.isInteger(expectedVersion) ||
    !isReportLayout(layout) ||
    !isSectionsPayload(sections, layout)
  ) {
    const { t } = await getMessages();
    return { ok: false, error: t.reading.actions.invalidDraft, status: 422 };
  }
  return run(async () => {
    const saved = await apiSend(
      `/reports/${encodeURIComponent(reportId)}`,
      "PATCH",
      { sections, layout, expected_version: expectedVersion },
      reportSchema,
    );
    return { version: saved.version };
  });
}

/**
 * Version d'un brouillon actuellement en base.
 *
 * Sert à résoudre un conflit d'enregistrement quand le radiologue choisit
 * de garder le texte qu'il a sous les yeux : l'écriture suivante vise
 * alors la version lue ici, et remplace celle enregistrée ailleurs (un
 * second onglet, ou un enregistrement dont la réponse s'est perdue).
 *
 * @param reportId Compte-rendu concerné.
 * @returns La version, et l'état du compte-rendu : un document signé
 *          entre-temps ne se réécrit plus.
 */
export async function readDraftVersion(
  reportId: string,
): Promise<ActionResult<{ version: number; signed: boolean }>> {
  if (isDemoMode()) return { ok: true, data: { version: 0, signed: false } };
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;
  return run(async () => {
    const report = await apiGet(
      `/reports/${encodeURIComponent(reportId)}`,
      reportSchema,
    );
    return { version: report.version, signed: report.status === "signed" };
  });
}

/**
 * Signe un compte-rendu.
 *
 * **Irréversible.** Le service vérifie à nouveau les sections
 * obligatoires, l'auteur, la prise en charge et la version ; un
 * déclencheur verrouille ensuite le document en base.
 *
 * La version envoyée est celle que le radiologue a sous les yeux, après
 * l'enregistrement de ses dernières modifications : si un autre onglet a
 * enregistré entre-temps, le service refuse (409) plutôt que de figer un
 * texte que le signataire n'a pas relu.
 *
 * Le code personnel du signataire accompagne la demande : il est
 * obligatoire, vérifié par le service **avant** la production du PDF. Un
 * radiologue qui n'en a pas encore le crée dans la fenêtre de signature :
 * la preuve porte alors `definePin` et la seconde saisie.
 *
 * @param reportId        Compte-rendu à signer.
 * @param expectedVersion Version relue à l'écran.
 * @param proof           Code personnel, saisi ou créé à l'instant.
 */
export async function signReport(
  reportId: string,
  expectedVersion: number,
  proof: PinProof,
): Promise<ActionResult> {
  const { t } = await getMessages();
  const pin = parsePinProof(proof);
  if (!pin) {
    return {
      ok: false,
      error: t.settings.signing.pin.problems.format,
      status: 422,
      reason: { code: "pin_format" },
    };
  }
  if (isDemoMode()) {
    return await demoUnavailable(t.reading.actions.signDemoAction);
  }
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return { ok: false, error: t.reading.actions.invalidDraft, status: 422 };
  }
  const body: ApiSignRequest = {
    expected_version: expectedVersion,
    ...pinBody(pin),
  };
  const result = await run(async () => {
    await apiSend(
      `/reports/${encodeURIComponent(reportId)}/sign`,
      "POST",
      body,
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

/**
 * Ajoute un addendum à un compte-rendu signé.
 *
 * Le compte-rendu signé reste intact ; la correction s'y ajoute, datée et
 * signée au nom de son auteur, visible de la clinique comme du radiologue.
 * **Irréversible**, comme la signature : un addendum se corrige par un
 * autre addendum.
 *
 * Comme la signature, il exige le code personnel de son auteur, ou sa
 * création dans le même geste.
 *
 * @param reportId Compte-rendu signé.
 * @param body     Texte de la correction.
 * @param proof    Code personnel, saisi ou créé à l'instant.
 */
export async function addAddendum(
  reportId: string,
  body: string,
  proof: PinProof,
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
  const pin = parsePinProof(proof);
  if (!pin) {
    return {
      ok: false,
      error: t.settings.signing.pin.problems.format,
      status: 422,
      reason: { code: "pin_format" },
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
      { body: text, ...pinBody(pin) } satisfies ApiAddendumCreate,
      addendumSchema,
    );
    return undefined;
  });
  revalidatePath(`/comptes-rendus/${reportId}`);
  revalidatePath("/examens");
  return result;
}

/**
 * Fait relire un brouillon par l'IA.
 *
 * Le service relit le brouillon **tel qu'il est enregistré** : l'écran
 * enregistre donc avant d'appeler. Il rend des signalements dont chaque
 * citation a été vérifiée mot pour mot, et ne modifie rien.
 *
 * Une panne du modèle n'est pas un échec de l'action : le service répond
 * alors « indisponible » (`available: false`), et la signature reste
 * possible. Un échec, ici, c'est un refus du service — fonction non
 * activée, plafond horaire atteint — que l'écran présente de la même
 * façon, sans jamais bloquer.
 *
 * @param reportId Brouillon à relire.
 */
export async function reviewDraft(
  reportId: string,
): Promise<ActionResult<AiReviewResult>> {
  if (isDemoMode()) {
    const { t } = await getMessages();
    return await demoUnavailable(t.reading.actions.aiReviewDemoAction);
  }
  const invalid = await rejectInvalidIds(reportId);
  if (invalid) return invalid;
  return await run(async () => {
    const review = await apiSend(
      `/reports/${encodeURIComponent(reportId)}/review`,
      "POST",
      undefined,
      aiReviewSchema,
    );
    return {
      runId: review.run_id,
      available: review.available,
      findings: review.findings.map((finding, index) => ({
        index,
        kind: finding.kind,
        section: finding.section,
        quote: finding.quote,
        relatedSection: finding.related_section ?? null,
        relatedQuote: finding.related_quote ?? null,
        note: finding.note,
      })),
    };
  });
}

/**
 * Dit au service ce que le radiologue a fait d'un signalement.
 *
 * C'est la mesure qui juge la relecture : un type de signalement presque
 * toujours écarté sera retiré ou retravaillé. Seuls le rang et la
 * décision partent, jamais de texte. L'appelant n'attend pas la réponse
 * et n'en affiche pas l'échec : perdre une mesure ne doit rien coûter au
 * radiologue.
 *
 * @param runId    Exécution à laquelle le signalement appartient.
 * @param index    Rang du signalement dans la réponse de la relecture.
 * @param decision Corrigé dans le texte, ou écarté.
 */
export async function sendFindingDecision(
  runId: string,
  index: number,
  decision: "corrected" | "dismissed",
): Promise<ActionResult> {
  if (isDemoMode()) return { ok: true, data: undefined };
  const invalid = await rejectInvalidIds(runId);
  if (invalid) return invalid;
  if (!Number.isInteger(index) || index < 0 || index > 50) {
    const { t } = await getMessages();
    return { ok: false, error: t.common.errors.unexpected, status: 422 };
  }
  return await run(async () => {
    await apiSend(
      `/assist/runs/${encodeURIComponent(runId)}/feedback`,
      "POST",
      { index, decision },
    );
    return undefined;
  });
}
