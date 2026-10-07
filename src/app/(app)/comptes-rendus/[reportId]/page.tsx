import { ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { AddendaPanel } from "@/components/domain/addenda-panel";
import { DateTime } from "@/components/domain/date-time";
import { DownloadPdfButton } from "@/components/domain/download-pdf-button";
import { ReportDocument } from "@/components/editor/report-document";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { getReport } from "@/lib/data/reports";
import { getStudy } from "@/lib/data/studies";
import { formatPatientName, formatPersonName } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

/** Adresse publique du site, pour afficher le lien de vérification. */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://imafrik.tech"
).replace(/\/$/, "");

/**
 * Un compte-rendu signé.
 *
 * Le document est présenté tel qu'il a été signé, **sans aucune commande
 * d'édition** : il est verrouillé en base. Ses corrections éventuelles —
 * les addenda — s'affichent dessous, datées et signées.
 *
 * Le bandeau de signature est au-dessus du texte : sur un document long,
 * la question « qui a signé, et quand » se pose avant la lecture.
 */
export default async function ReportPage({
  params,
}: PageProps<"/comptes-rendus/[reportId]">) {
  const session = await requireSession(["clinic_staff", "radiologist"]);
  const { reportId } = await params;
  const report = await getReport(reportId);
  const study = report ? await getStudy(report.studyId) : null;

  // Un brouillon ne s'affiche pas ici : il se rédige dans l'écran de lecture.
  if (!report || !study || report.status !== "signed") notFound();

  const messages = (await getMessages()).t.clinic.reports;
  const signer = formatPersonName(report.signerTitle, report.signedBy ?? "");

  return (
    <>
      <PageHeader
        title={formatPatientName(study.patientName)}
        description={`${study.patientId || "—"} · ${study.modality} ${study.bodyPart ?? ""} · ${study.clinic}`}
        actions={<DownloadPdfButton reportId={report.id} />}
      />

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Panel className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <div>
              <p className="label-eyebrow">{messages.signedBy}</p>
              <p className="text-sm font-medium">{signer || "—"}</p>
              {report.signerLicense && (
                <p className="text-2xs text-tertiary">
                  {messages.license(report.signerLicense)}
                </p>
              )}
            </div>
            <div>
              <p className="label-eyebrow">{messages.signatureDate}</p>
              {report.signedAt && (
                <DateTime date={report.signedAt} className="text-sm" />
              )}
            </div>
            {report.verifyToken && (
              <div className="ml-auto min-w-0 text-right">
                <p className="label-eyebrow flex items-center justify-end gap-1.5">
                  <ShieldCheck className="size-3 text-done" aria-hidden />
                  {messages.publicVerification}
                </p>
                <a
                  href={`/verifier/${report.verifyToken}`}
                  className="-mb-1 block truncate py-1 text-2xs text-accent hover:underline"
                >
                  {SITE_URL.replace(/^https?:\/\//, "")}/verifier/
                  {report.verifyToken.slice(0, 8)}…
                </a>
              </div>
            )}
          </Panel>

          <ReportDocument
            sections={report.sections}
            language={study?.reportLanguage}
          />

          <AddendaPanel
            reportId={report.id}
            addenda={report.addenda}
            canAdd={session.active.role === "radiologist"}
          />
        </div>
      </div>
    </>
  );
}
