import { notFound } from "next/navigation";

import { EMPTY_REPORT_SECTIONS } from "@/components/editor/report-editor";
import {
  ReportWorkspace,
  type WorkspaceMode,
} from "@/components/editor/report-workspace";
import { getReportForStudy, type Report } from "@/lib/data/reports";
import {
  getStudy,
  getViewerUrl,
  listStudies,
  type Study,
} from "@/lib/data/studies";
import { listTemplates } from "@/lib/data/templates";
import { reportBackupKey } from "@/lib/editor/backup-key";
import { formatPersonName } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import type { Session } from "@/lib/session/types";

/**
 * Ce que l'utilisateur peut faire de l'examen, décidé à partir du rôle,
 * de la prise en charge et du compte-rendu.
 *
 * Le service revérifie tout à chaque écriture : ce calcul ne décide que
 * des boutons affichés.
 */
function workspaceMode(
  session: Session,
  study: Study,
  report: Report | null,
): WorkspaceMode {
  if (session.active.role !== "radiologist") return { kind: "readonly" };
  if (report?.status === "signed") return { kind: "readonly" };

  const mine = study.assignedTo === session.user.id;
  if (mine && report && report.authorId === session.user.id) {
    return {
      kind: "author",
      reportId: report.id,
      version: report.version,
      backupKey: reportBackupKey(session.user.id),
    };
  }
  // Pris en charge sans brouillon ouvert, ou libre : un même geste — la
  // prise en charge est idempotente et ouvre le brouillon.
  if (mine || (study.assignedTo === null && study.status === "received")) {
    return { kind: "claimable" };
  }
  return {
    kind: "readonly",
    notice: study.assignedToName
      ? `Examen pris en charge par ${study.assignedToName}.`
      : "Examen pris en charge par un autre radiologue.",
  };
}

/**
 * Prochain examen à lire : la première urgence, sinon l'attente la plus
 * longue — l'ordre dans lequel un radiologue vide sa file.
 *
 * Un échec n'empêche pas d'ouvrir l'examen courant : le bouton « Examen
 * suivant » n'est qu'un raccourci.
 */
async function findNextStudy(currentId: string): Promise<string | null> {
  try {
    const waiting = (await listStudies({ status: ["received"] })).filter(
      (study) => study.id !== currentId,
    );
    const byAge = (a: Study, b: Study) =>
      a.receivedAt.getTime() - b.receivedAt.getTime();
    const next =
      waiting.filter((study) => study.urgent).sort(byAge)[0] ??
      waiting.sort(byAge)[0];
    return next?.id ?? null;
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
  const session = await requireSession(["radiologist", "clinic_staff"]);
  const { studyId } = await params;

  const radiologist = session.active.role === "radiologist";
  const [study, report, viewerUrl, nextStudyId] = await Promise.all([
    getStudy(studyId),
    getReportForStudy(studyId),
    getViewerUrl(studyId),
    radiologist ? findNextStudy(studyId) : null,
  ]);
  if (!study) notFound();

  const mode = workspaceMode(session, study, report);
  // Les modèles ne servent qu'à l'auteur ; inutile de les charger sinon.
  const templates =
    mode.kind === "author" ? await listTemplates(study.modality) : [];

  return (
    <ReportWorkspace
      // Une nouvelle clé à chaque changement de brouillon remet l'éditeur
      // à l'état du serveur après une prise en charge ou une signature.
      key={`${report?.id ?? "none"}:${report?.status ?? ""}`}
      study={study}
      viewerUrl={viewerUrl}
      mode={mode}
      initial={report?.sections ?? EMPTY_REPORT_SECTIONS}
      signed={report?.status === "signed"}
      signerName={formatPersonName(session.user.title, session.user.fullName)}
      templates={templates}
      nextStudyId={nextStudyId}
    />
  );
}
