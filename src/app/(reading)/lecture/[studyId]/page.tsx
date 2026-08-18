import { notFound } from "next/navigation";

import { ReportWorkspace } from "@/components/editor/report-workspace";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/report-editor";
import { getViewerUrl } from "@/lib/data/actions";
import { getReportForStudy } from "@/lib/data/reports";
import { getStudy } from "@/lib/data/studies";
import { getSession } from "@/lib/session/server";

/**
 * Écran de lecture d'un examen.
 *
 * Distinct de `/examens/[id]`, qui reste la fiche de l'examen dans le
 * châssis du portail : ici on **travaille**, là on **consulte**. Deux
 * verbes, deux écrans, deux adresses — un même écran qui changerait de
 * forme selon le rôle serait impossible à décrire à un utilisateur au
 * téléphone.
 *
 * Tout est résolu côté serveur avant le premier rendu : l'examen, son
 * compte-rendu, et le jeton de visualisation. Ce dernier est **à durée
 * de vie courte et jamais persisté** — c'est lui que le plugin
 * d'autorisation d'Orthanc validera à chaque requête DICOMweb.
 */
export default async function ReadingPage({
  params,
}: PageProps<"/lecture/[studyId]">) {
  const { studyId } = await params;

  const [study, report, viewerUrl, session] = await Promise.all([
    getStudy(studyId),
    getReportForStudy(studyId),
    getViewerUrl(studyId),
    getSession(),
  ]);

  if (!study) notFound();

  return (
    <ReportWorkspace
      study={study}
      viewerUrl={viewerUrl}
      reportId={report?.id ?? null}
      initial={report?.sections ?? EMPTY_REPORT_SECTIONS}
      initiallySigned={report?.status === "signed"}
      // Seul un radiologue rédige et signe. La clinique consulte — la
      // barrière réelle restant les politiques RLS côté base.
      canEdit={session?.active.role === "radiologist"}
      signerName={session?.user.fullName ?? ""}
    />
  );
}
