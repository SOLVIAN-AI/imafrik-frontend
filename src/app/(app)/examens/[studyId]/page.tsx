import { FileText, ImageOff, PenTool } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type * as React from "react";

import { AddendaPanel } from "@/components/domain/addenda-panel";
import { DownloadPdfButton } from "@/components/domain/download-pdf-button";
import { ReportDocument } from "@/components/editor/report-document";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { StudyTimeline } from "@/components/domain/study-timeline";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getReportForStudy } from "@/lib/data/reports";
import { getStudy } from "@/lib/data/studies";
import { requireSession } from "@/lib/session/server";
import { DateTime } from "@/components/domain/date-time";
import { formatPatientName } from "@/lib/format";

/**
 * Fiche d'un examen.
 *
 * **Écran partagé, pas écran dupliqué.** La clinique et le radiologue y
 * cherchent la même chose — de quoi s'agit-il, où en est-on, que dit le
 * compte-rendu — et seules les actions diffèrent : l'un télécharge un
 * PDF, l'autre ouvre la lecture. Deux écrans séparés auraient divergé au
 * premier champ ajouté.
 *
 * À ne pas confondre avec `/lecture/[id]`, qui est le poste de travail du
 * radiologue : ici on consulte, là on rédige.
 */
export default async function StudySheetPage({
  params,
}: PageProps<"/examens/[studyId]">) {
  const session = await requireSession(["clinic_staff", "radiologist"]);
  const { studyId } = await params;

  // Les deux lectures sont indépendantes : les enchaîner ferait attendre
  // l'écran pour rien.
  const [study, report] = await Promise.all([
    getStudy(studyId),
    getReportForStudy(studyId),
  ]);
  if (!study) notFound();

  const isRadiologist = session.active.role === "radiologist";
  // Un brouillon n'est visible que de son auteur, dans l'écran de
  // lecture ; ici, seul un document signé s'affiche.
  const signed = report?.status === "signed" ? report : null;

  return (
    <>
      <PageHeader
        title={formatPatientName(study.patientName)}
        description={`${study.patientId || "—"} · ${study.modality} ${study.bodyPart ?? ""} · ${study.clinic}`}
        actions={
          <>
            {study.urgent && <UrgentMarker />}
            <StudyStatusChip status={study.status} />
            {isRadiologist && !signed ? (
              <Button size="sm" asChild>
                <Link href={`/lecture/${study.id}`}>
                  <PenTool />
                  Lire et rédiger
                </Link>
              </Button>
            ) : (
              <DownloadPdfButton reportId={signed?.id ?? null} />
            )}
          </>
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 overflow-auto px-6 pb-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <ImagesPanel
            clinicalInfo={study.clinicalInfo}
            seriesCount={study.seriesCount}
            instanceCount={study.instanceCount}
            studyId={study.id}
          />

          <Panel className="flex flex-col overflow-hidden">
            <PanelTitle>Compte-rendu</PanelTitle>
            {signed ? (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border-subtle px-4 py-2.5 text-2xs text-tertiary">
                  <span>
                    Signé par{" "}
                    <span className="text-secondary">
                      {[signed.signerTitle, signed.signedBy]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  </span>
                  {signed.signedAt && <DateTime date={signed.signedAt} />}
                  <Link
                    href={`/comptes-rendus/${signed.id}`}
                    className="ml-auto flex items-center gap-1.5 text-accent hover:underline"
                  >
                    <FileText className="size-3.5" aria-hidden />
                    Document complet
                  </Link>
                </div>
                <div className="p-4">
                  <ReportDocument sections={signed.sections} />
                </div>
              </>
            ) : (
              <p className="px-4 py-10 text-center text-xs text-tertiary">
                {study.status === "in_progress"
                  ? "Le compte-rendu est en cours de rédaction."
                  : "Le compte-rendu sera disponible dès qu’un radiologue aura signé."}
              </p>
            )}
          </Panel>

          {signed && (
            <AddendaPanel
              reportId={signed.id}
              addenda={signed.addenda}
              canAdd={isRadiologist}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panel className="flex flex-col overflow-hidden">
            <PanelTitle>Avancement</PanelTitle>
            <div className="p-4">
              <StudyTimeline
                status={study.status}
                dates={{
                  received: study.receivedAt,
                  ...(study.reportedAt ? { reported: study.reportedAt } : {}),
                }}
              />
            </div>
          </Panel>

          <Panel className="flex flex-col overflow-hidden">
            <PanelTitle>Informations</PanelTitle>
            <dl className="divide-y divide-border-subtle text-xs">
              <Field label="Établissement" value={study.clinic} />
              <Field label="Renseignement" value={study.clinicalInfo ?? "—"} />
              <Field
                label="Séries"
                value={`${study.seriesCount} · ${study.instanceCount.toLocaleString("fr-FR")} coupes`}
              />
              <Field label="Reçu le">
                <DateTime date={study.receivedAt} />
              </Field>
              <Field
                label="Radiologue"
                value={
                  study.reportedBy ?? study.assignedToName ?? "Non attribué"
                }
              />
              <Field label="UID d’étude" value={study.studyInstanceUid} mono />
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

/**
 * Volet d'images.
 *
 * Il porte un aperçu, pas un poste de lecture : la consultation par une
 * clinique n'a pas les mêmes exigences qu'un diagnostic, et le viewer
 * complet s'ouvre d'un clic. Le fond reste noir — même pour un aperçu,
 * une image en niveaux de gris ne se juge pas sur un fond clair.
 */
function ImagesPanel({
  clinicalInfo,
  seriesCount,
  instanceCount,
  studyId,
}: {
  clinicalInfo: string | null;
  seriesCount: number;
  instanceCount: number;
  studyId: string;
}) {
  return (
    <Panel className="flex flex-col overflow-hidden">
      <PanelTitle>
        Images
        <span className="ml-auto font-normal text-tertiary normal-case">
          {seriesCount} série{seriesCount > 1 ? "s" : ""} ·{" "}
          {instanceCount.toLocaleString("fr-FR")} coupes
        </span>
      </PanelTitle>
      <div className="flex h-64 flex-col items-center justify-center gap-2 bg-ink-950">
        <ImageOff className="size-5 text-ink-600" aria-hidden />
        <p className="text-xs text-ink-500">
          {clinicalInfo ?? "Aperçu indisponible"}
        </p>
        <Button variant="secondary" size="sm" className="mt-1" asChild>
          <Link href={`/lecture/${studyId}`}>Ouvrir les images</Link>
        </Button>
      </div>
    </Panel>
  );
}

/** Titre d'un panneau. */
function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="label-eyebrow flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle px-4">
      {children}
    </h2>
  );
}

/** Une ligne d'une liste de définitions. */
function Field({
  label,
  value,
  mono = false,
  children,
}: {
  label: string;
  /** Contenu simple. Utiliser `children` pour un nœud — une date, par exemple. */
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 px-4 py-2">
      <dt className="w-28 shrink-0 text-tertiary">{label}</dt>
      <dd
        className={
          mono ? "min-w-0 truncate font-mono text-2xs" : "min-w-0 truncate"
        }
      >
        {children ?? value}
      </dd>
    </div>
  );
}
