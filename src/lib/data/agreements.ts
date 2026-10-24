import "server-only";

import { z } from "zod";

import { apiGet } from "@/lib/api/client";
import {
  agreementDocumentSchema,
  agreementStatusSchema,
} from "@/lib/api/contracts";
import {
  type AgreementDocument,
  type AgreementKind,
  type AgreementStatus,
  type AgreementView,
  pendingAgreements,
} from "@/lib/agreements";
import { isDemoMode } from "@/lib/demo/mode";
import type { Locale } from "@/lib/i18n/locale";

/** Convertit un engagement dû, tel que le service le renvoie. */
function toStatus(
  row: z.output<typeof agreementStatusSchema>,
): AgreementStatus {
  return {
    kind: row.kind,
    version: row.version,
    title: row.title,
    effectiveDate: row.effective_date,
    sha256: row.sha256,
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
    acceptedBy: row.accepted_by ?? null,
    canAccept: row.can_accept,
  };
}

/** Convertit un texte d'engagement, tel que le service le renvoie. */
function toDocument(
  row: z.output<typeof agreementDocumentSchema>,
): AgreementDocument {
  return {
    kind: row.kind,
    version: row.version,
    title: row.title,
    effectiveDate: row.effective_date,
    sha256: row.sha256,
    locale: row.locale,
    authoritative: row.authoritative,
    bodyMarkdown: row.body_markdown,
  };
}

/**
 * Engagements dus par le compte connecté, selon le rôle de son
 * appartenance active.
 *
 * En démonstration, aucun : le jeu de démonstration n'engage personne, et
 * bloquer ses écrans derrière un contrat qu'il ne peut pas enregistrer
 * n'aurait pas de sens.
 */
export async function getMyAgreements(): Promise<AgreementStatus[]> {
  if (isDemoMode()) return [];
  const rows = await apiGet("/me/agreements", z.array(agreementStatusSchema));
  return rows.map(toStatus);
}

/**
 * Engagements encore à accepter, pour la garde de l'application.
 *
 * **Tolère un service muet** : la garde de l'interface n'est qu'un
 * confort, qui évite d'ouvrir un portail dont le service refuserait les
 * opérations. La protection, elle, est posée par le service, qui refuse
 * tant que l'engagement en vigueur n'est pas accepté. Une panne ne doit
 * donc pas rendre toute l'application inaccessible : chaque écran dira
 * lui-même ce qui ne va pas.
 */
export async function getPendingAgreements(): Promise<AgreementStatus[]> {
  try {
    return pendingAgreements(await getMyAgreements());
  } catch {
    return [];
  }
}

/**
 * Texte en vigueur d'un engagement, dans une langue.
 *
 * @param kind   Nature de l'engagement.
 * @param locale Langue d'affichage ; le service retombe sur le français
 *               s'il n'a pas de traduction.
 */
export async function getAgreementDocument(
  kind: AgreementKind,
  locale: Locale,
): Promise<AgreementDocument> {
  const row = await apiGet(
    `/agreements/${encodeURIComponent(kind)}/current?locale=${encodeURIComponent(locale)}`,
    agreementDocumentSchema,
  );
  return toDocument(row);
}

/**
 * Un engagement dû, prêt à présenter : son état et son texte.
 *
 * @param kind   Nature de l'engagement.
 * @param locale Langue d'affichage.
 * @returns `null` si le compte ne doit pas cet engagement, ou en
 *          démonstration.
 */
export async function getAgreementView(
  kind: AgreementKind,
  locale: Locale,
): Promise<AgreementView | null> {
  const statuses = await getMyAgreements();
  const status = statuses.find((candidate) => candidate.kind === kind);
  if (!status) return null;
  const document = await getAgreementDocument(kind, locale);
  return { status, document };
}

/**
 * Tous les engagements encore à accepter, avec leur texte.
 *
 * @param locale Langue d'affichage.
 */
export async function getPendingAgreementViews(
  locale: Locale,
): Promise<AgreementView[]> {
  const pending = pendingAgreements(await getMyAgreements());
  return Promise.all(
    pending.map(async (status) => ({
      status,
      document: await getAgreementDocument(status.kind, locale),
    })),
  );
}
