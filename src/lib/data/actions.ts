"use server";

import { revalidatePath } from "next/cache";

import type { ReportSections } from "@/components/editor/report-editor";
import { apiFetch, isApiConfigured } from "@/lib/api/client";
import { viewerTokenSchema } from "@/lib/api/contracts";

/**
 * Écritures sur un compte-rendu.
 *
 * Toutes passent par des actions serveur, jamais par un appel depuis le
 * navigateur : le jeton qui autorise l'écriture vit dans un cookie
 * `httpOnly`, et l'exposer au client annulerait l'intérêt du cookie.
 *
 * En mode démonstration, elles ne font rien et n'échouent pas — c'est ce
 * qui permet de dérouler tout le parcours sans backend.
 */

/**
 * Enregistre un brouillon.
 *
 * L'appel est **idempotent** : la même charge envoyée deux fois produit
 * le même état. L'enregistrement automatique peut donc réémettre sans
 * précaution après une coupure réseau.
 *
 * @param reportId Compte-rendu concerné.
 * @param sections Contenu complet des cinq sections.
 */
export async function saveReportDraft(
  reportId: string,
  sections: ReportSections,
): Promise<void> {
  if (!isApiConfigured()) return;

  await apiFetch(`/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ sections }),
  });
}

/**
 * Signe un compte-rendu.
 *
 * **Irréversible.** Un déclencheur en base verrouille le document : les
 * corrections ultérieures prennent la forme d'un addendum. Le contrôle
 * des sections obligatoires est refait côté serveur — celui de
 * l'interface n'est qu'un confort.
 *
 * @param reportId Compte-rendu à signer.
 */
export async function signReport(reportId: string): Promise<void> {
  if (!isApiConfigured()) return;

  await apiFetch(`/reports/${reportId}/sign`, { method: "POST" });
  revalidatePath("/worklist");
  revalidatePath("/mes-examens");
}

/**
 * Prend un examen en charge.
 *
 * Correspond à `claim_study()` en base, qui refuse si un autre
 * radiologue a été plus rapide : deux personnes ne peuvent pas rédiger
 * le même compte-rendu.
 */
export async function claimStudy(studyId: string): Promise<void> {
  if (!isApiConfigured()) return;

  await apiFetch(`/studies/${studyId}/claim`, { method: "POST" });
  revalidatePath("/worklist");
}

/** Relâche un examen pris en charge, et le remet dans la file commune. */
export async function releaseStudy(studyId: string): Promise<void> {
  if (!isApiConfigured()) return;

  await apiFetch(`/studies/${studyId}/release`, { method: "POST" });
  revalidatePath("/worklist");
  revalidatePath("/mes-examens");
}

/**
 * Obtient l'adresse du viewer pour un examen.
 *
 * Le jeton renvoyé est à durée de vie courte et **n'est jamais
 * persisté** : il vit dans Redis côté service, et c'est lui que le
 * plugin d'autorisation d'Orthanc validera à chaque requête DICOMweb.
 * Une adresse de viewer partagée par courriel cesse donc de fonctionner
 * en quelques minutes — ce qui est le comportement voulu.
 *
 * @returns L'adresse du viewer, ou `null` si le jeton n'a pas pu être
 *          obtenu — l'écran affiche alors un état explicite.
 */
export async function getViewerUrl(studyId: string): Promise<string | null> {
  if (!isApiConfigured()) return null;

  try {
    const raw = await apiFetch<unknown>(`/studies/${studyId}/viewer-token`, {
      method: "POST",
    });
    return viewerTokenSchema.parse(raw).viewer_url;
  } catch {
    return null;
  }
}
