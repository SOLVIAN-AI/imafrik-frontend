import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { WorkspaceMode } from "@/components/editor/report-workspace";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/sections";
import { TrainingWorkspace } from "@/components/training/training-workspace";
import { getMessages } from "@/i18n/server";
import { listTemplatesOrNone } from "@/lib/data/templates";
import {
  getTrainingCase,
  getTrainingViewerUrl,
  trainingStudy,
  type TrainingAttempt,
  type TrainingCase,
} from "@/lib/data/training";
import { reportBackupKey } from "@/lib/editor/backup-key";
import { formatPersonName } from "@/lib/format";
import { requireSession } from "@/lib/session/server";

/** Titre de l'onglet : le cas, et l'espace de formation. */
export async function generateMetadata({
  params,
}: PageProps<"/formation/[slug]">): Promise<Metadata> {
  const { t } = await getMessages();
  const detail = await getTrainingCase((await params).slug).catch(() => null);
  return {
    title: detail
      ? `${detail.trainingCase.title} · ${t.training.page.title}`
      : t.training.page.title,
  };
}

/**
 * Ce que l'utilisateur peut faire de l'exercice.
 *
 * - en relecture (équipe IMAFRIK) : prévisualisation, sans exercice ;
 * - pas encore pris en charge : le bouton le prend, comme un vrai examen ;
 * - pris en charge : il rédige et signe ; signé, le texte est figé.
 *
 * Aucune condition de dossier : on s'exerce avant d'être validé.
 */
function trainingMode(
  trainingCase: TrainingCase,
  attempt: TrainingAttempt | null,
  userId: string,
): WorkspaceMode {
  if (!trainingCase.published) return { kind: "readonly" };
  if (!attempt) return { kind: "claimable" };
  if (attempt.submittedAt) return { kind: "readonly" };
  return {
    kind: "author",
    reportId: attempt.id,
    version: attempt.version,
    backupKey: reportBackupKey(userId),
  };
}

/**
 * Écran d'un exercice : l'écran de lecture réel, en mode formation.
 *
 * Tout est résolu côté serveur avant le premier rendu, comme pour un vrai
 * examen : le cas, l'exercice, et un jeton de visualisation limité à
 * l'étude du cas.
 */
export default async function TrainingCasePage({
  params,
}: PageProps<"/formation/[slug]">) {
  const session = await requireSession(["radiologist", "platform_admin"]);
  const { slug } = await params;
  const [{ locale }, detail, viewerUrl] = await Promise.all([
    getMessages(),
    getTrainingCase(slug),
    getTrainingViewerUrl(slug),
  ]);
  if (!detail) notFound();

  const { trainingCase, attempt } = detail;
  const mode = trainingMode(trainingCase, attempt, session.user.id);
  const study = await trainingStudy(trainingCase, attempt, locale);
  const templates =
    mode.kind === "author"
      ? await listTemplatesOrNone(trainingCase.modality)
      : [];

  return (
    <TrainingWorkspace
      slug={trainingCase.slug}
      title={trainingCase.title}
      instructions={trainingCase.instructions}
      preview={!trainingCase.published}
      attempt={attempt}
      draftKey={`${attempt?.id ?? "none"}:${attempt?.submittedAt ? "signed" : "draft"}`}
      study={study}
      viewerUrl={viewerUrl}
      mode={mode}
      initial={attempt?.sections ?? EMPTY_REPORT_SECTIONS}
      signed={Boolean(attempt?.submittedAt)}
      signerName={formatPersonName(session.user.title, session.user.fullName)}
      templates={templates}
    />
  );
}
