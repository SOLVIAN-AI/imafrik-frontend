import { notFound } from "next/navigation";

import type { WorkspaceMode } from "@/components/editor/report-workspace";
import { ReadingWorkspace } from "@/components/editor/report-workspace";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/sections";
import type { AppMessages } from "@/i18n";
import { getMessages } from "@/i18n/server";
import { isAiReviewAvailable } from "@/lib/data/assist";
import {
  getLetterhead,
  getReportForStudy,
  type Report,
} from "@/lib/data/reports";
import { getSigningContext } from "@/lib/data/signing";
import {
  findNextStudyId,
  getStudy,
  getViewerUrl,
  listPriors,
  type Study,
} from "@/lib/data/studies";
import { listTemplatesOrNone } from "@/lib/data/templates";
import { credentialBlock } from "@/lib/credentials";
import { reportBackupKey } from "@/lib/editor/backup-key";
import { formatDateTime, formatPersonName } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { requireSession } from "@/lib/session/server";
import type { Session } from "@/lib/session/types";

/**
 * Ce que l'utilisateur peut faire de l'examen, décidé à partir du rôle,
 * de la prise en charge et du compte-rendu.
 *
 * Le service revérifie tout à chaque écriture : ce calcul ne décide que
 * des boutons affichés.
 *
 * @param t Textes de l'application, pour l'avis de consultation.
 */
function workspaceMode(
  session: Session,
  study: Study,
  report: Report | null,
  t: AppMessages,
  locale: Locale,
): WorkspaceMode {
  // Équipe IMAFRIK : tout se contrôle, le brouillon en cours compris
  // (demandé le 23 octobre 2026). Il s'affiche tel qu'il est enregistré,
  // en consultation, et l'écran suit la rédaction ; la clinique, elle, ne
  // voit un compte-rendu qu'une fois signé.
  if (session.active.role === "platform_admin" && report?.status === "draft") {
    return {
      kind: "readonly",
      live: true,
      notice: t.reading.page.adminDraft(
        study.assignedToName ?? t.reading.page.adminDraftAuthorUnknown,
        formatDateTime(report.updatedAt, locale),
      ),
    };
  }
  if (session.active.role !== "radiologist") {
    return {
      kind: "readonly",
      awaitingReport: report?.status !== "signed",
      voidableReportId:
        session.active.role === "platform_admin" && report?.status === "signed"
          ? report.id
          : undefined,
    };
  }
  if (report?.status === "signed") {
    // Signé : la correction passe par un addendum, que seul son auteur,
    // habilité, peut signer. Un radiologue voit le compte-rendu signé d'un
    // confrère sur une antériorité partagée avec lui, sans pouvoir y toucher.
    if (report.authorId !== session.user.id) {
      return { kind: "readonly", notice: t.reading.page.notAuthor };
    }
    return {
      kind: "readonly",
      addendumReportId: credentialBlock(session) ? undefined : report.id,
    };
  }

  // Radiologue pas encore habilité : ni prise en charge ni rédaction. La
  // base masque déjà les examens et le service refuse ces gestes ; l'écran
  // ne propose donc pas un bouton voué au refus, il dit pourquoi.
  const block = credentialBlock(session);
  if (block) {
    const text = t.credentials.states[block];
    return { kind: "readonly", notice: `${text.title}. ${text.detail}` };
  }

  const mine = study.assignedTo === session.user.id;
  if (mine && report && report.authorId === session.user.id) {
    return {
      kind: "author",
      reportId: report.id,
      version: report.version,
      backupKey: reportBackupKey(session.user.id),
    };
  }
  // Attribué sans brouillon ouvert : la prise en charge est idempotente
  // et ouvre le brouillon. Un radiologue ne voit un examen sans titulaire
  // que s'il est une urgence de sa liste d'urgence : la première prise
  // l'obtient.
  if (mine) return { kind: "claimable" };
  if (study.assignedTo === null && study.status === "received") {
    return { kind: "claimable", urgent: true };
  }
  // Ni attribué à lui ni à prendre : une antériorité partagée avec lui.
  return { kind: "readonly", notice: t.reading.page.priorReadonly };
}

/**
 * Prochain examen à lire, dans l'ordre de la file « À lire » : celui dont
 * l'échéance est la plus proche, retards en tête, parmi ceux attribués au
 * radiologue et les urgences de sa liste. L'ordre est celui du service
 * (`findNextStudyId`), sur toute la file.
 *
 * Un échec n'empêche pas d'ouvrir l'examen courant : le bouton « Examen
 * suivant » n'est qu'un raccourci.
 */
async function findNextStudy(currentId: string): Promise<string | null> {
  try {
    return await findNextStudyId(currentId);
  } catch {
    return null;
  }
}

/**
 * Écran de lecture d'un examen.
 *
 * Distinct de `/examens/[id]`, qui reste la fiche de l'examen dans le
 * châssis du portail : ici on **travaille**, là on **consulte**.
 *
 * Tout est résolu côté serveur avant le premier rendu : l'examen, son
 * compte-rendu, et le jeton de visualisation — à durée de vie courte, et
 * jamais persisté.
 */
export default async function ReadingPage({
  params,
}: PageProps<"/lecture/[studyId]">) {
  const session = await requireSession([
    "radiologist",
    "clinic_staff",
    "platform_admin",
  ]);
  const { studyId } = await params;

  const radiologist = session.active.role === "radiologist";
  const [{ t, locale }, study, report, viewerUrl, nextStudyId, priors] =
    await Promise.all([
      getMessages(),
      getStudy(studyId),
      getReportForStudy(studyId),
      getViewerUrl(studyId),
      radiologist ? findNextStudy(studyId) : null,
      // Facultatives : leur échec n'empêche pas d'ouvrir l'examen.
      radiologist ? listPriors(studyId).catch(() => []) : [],
    ]);
  if (!study) notFound();

  const mode = workspaceMode(session, study, report, t, locale);
  // Les modèles ne servent qu'à l'auteur ; inutile de les charger sinon.
  // Facultatifs : leur échec ne bloque pas l'écran.
  const templates =
    mode.kind === "author" ? await listTemplatesOrNone(study.modality) : [];
  // La relecture par IA ne concerne que l'auteur d'un brouillon ; le
  // service dit si elle lui est offerte.
  const aiReview = mode.kind === "author" && (await isAiReviewAvailable());
  // Le code personnel est demandé à la signature : la fenêtre sait s'il
  // faut le saisir ou le créer, et montre ce qui sera apposé.
  const signing =
    mode.kind === "author" ? await getSigningContext() : undefined;
  // L'en-tête du document, montré verrouillé sur la feuille. Facultatif :
  // sans lui, la feuille s'affiche nue, le texte reste là.
  const letterhead = report ? await getLetterhead(report.id) : null;

  return (
    <ReadingWorkspace
      // Une nouvelle clé à chaque changement de brouillon remet l'éditeur
      // à l'état du serveur après une prise en charge ou une signature,
      // sans recharger le viewer.
      // En consultation suivie (l'équipe face à un brouillon), la version
      // en fait partie : chaque enregistrement du radiologue s'affiche. Pas
      // pour l'auteur, dont l'éditeur serait remis à zéro en pleine frappe.
      draftKey={`${report?.id ?? "none"}:${report?.status ?? ""}${
        mode.kind === "readonly" && mode.live ? `:${report?.version}` : ""
      }`}
      study={study}
      viewerUrl={viewerUrl}
      mode={mode}
      initial={report?.sections ?? EMPTY_REPORT_SECTIONS}
      initialLayout={report?.layout}
      letterhead={letterhead}
      signed={report?.status === "signed"}
      signerName={formatPersonName(session.user.title, session.user.fullName)}
      templates={templates}
      nextStudyId={nextStudyId}
      priors={priors}
      aiReview={aiReview}
      signing={signing}
    />
  );
}
