import { Download, Printer, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { ReportDocument } from "@/components/editor/report-document";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getReport } from "@/lib/data/reports";
import { getStudy } from "@/lib/data/studies";
import { DateTime } from "@/components/domain/date-time";
import { formatPatientName } from "@/lib/format";

/**
 * Un compte-rendu signé.
 *
 * Le document est présenté tel qu'il a été rédigé — même feuille, mêmes
 * marges, même mesure de ligne — et **sans aucune commande d'édition**.
 * Un compte-rendu signé est verrouillé en base par un déclencheur ; le
 * montrer dans un cadre qui suggère qu'on pourrait le modifier serait un
 * mensonge d'interface.
 *
 * Le bandeau de signature est au-dessus du texte, pas en dessous : sur un
 * document long, la question « qui a signé, et quand » se pose avant la
 * lecture, pas après.
 */
export default async function ReportPage({
  params,
}: PageProps<"/comptes-rendus/[reportId]">) {
  const { reportId } = await params;
  const report = await getReport(reportId);
  const study = report ? await getStudy(report.studyId) : null;

  if (!report || !study) notFound();

  return (
    <>
      <PageHeader
        title={formatPatientName(study.patientName)}
        description={`${study.patientId} · ${study.modality} ${study.bodyPart ?? ""} · ${study.clinic}`}
        actions={
          <>
            <Button variant="ghost" size="sm">
              <Printer />
              Imprimer
            </Button>
            <Button size="sm">
              <Download />
              Télécharger le PDF
            </Button>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        <div className="mx-auto max-w-3xl">
          <Panel className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <div>
              <p className="label-eyebrow">Signé par</p>
              <p className="text-sm font-medium">{report.signedBy ?? "—"}</p>
              <p className="text-2xs text-tertiary">{report.signerTitle}</p>
            </div>
            <div>
              <p className="label-eyebrow">Date de signature</p>
              {report.signedAt && (
                <DateTime date={report.signedAt} className="text-sm" />
              )}
            </div>
            <div className="ml-auto text-right">
              <p className="label-eyebrow flex items-center justify-end gap-1.5">
                <ShieldCheck className="size-3 text-done" aria-hidden />
                Code de vérification
              </p>
              <p className="font-mono text-sm">{report.verifyToken ?? "—"}</p>
              {report.verifyToken && (
                <p className="text-2xs text-tertiary">
                  imafrik.com/verifier/{report.verifyToken}
                </p>
              )}
            </div>
          </Panel>

          <ReportDocument sections={report.sections} />
        </div>
      </div>
    </>
  );
}
