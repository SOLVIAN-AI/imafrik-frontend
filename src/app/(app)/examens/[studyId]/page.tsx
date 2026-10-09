import { FileText, ImageOff, Maximize2, PenTool } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type * as React from "react";

import { AddendaPanel } from "@/components/domain/addenda-panel";
import { DownloadPdfButton } from "@/components/domain/download-pdf-button";
import { ReportDocument } from "@/components/editor/report-document";
import { SimulatedScan } from "@/components/editor/simulated-scan";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { StudyTimeline } from "@/components/domain/study-timeline";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getReportForStudy } from "@/lib/data/reports";
import { getStudy, type Study } from "@/lib/data/studies";
import { requireSession } from "@/lib/session/server";
import { DateTime } from "@/components/domain/date-time";
import { formatCount, formatPatientName, formatPersonName } from "@/lib/format";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";
import type { Locale } from "@/lib/i18n/locale";

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
  const { t, locale } = await getMessages();
  const messages = t.clinic.study;

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
                <Link href={`/lecture/${study.id}`} prefetch={false}>
                  <PenTool />
                  {messages.readAndWrite}
                </Link>
              </Button>
            ) : signed ? (
              <DownloadPdfButton reportId={signed.id} />
            ) : null}
          </>
        }
      />

      {/* `min-w-0` sur chaque colonne : sans lui, une colonne de grille ne
          rétrécit pas sous la largeur de son contenu, et la page déborde
          sur un téléphone. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-auto px-4 pb-6 sm:px-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <ImagesPanel
            study={study}
            demo={session.isDemo}
            messages={messages}
            locale={locale}
          />

          <Panel className="flex flex-col overflow-hidden">
            <PanelTitle>{messages.report}</PanelTitle>
            {signed ? (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border-subtle px-4 py-2.5 text-2xs text-tertiary">
                  <span>
                    {messages.signedBy}{" "}
                    <span className="text-secondary">
                      {formatPersonName(
                        signed.signerTitle,
                        signed.signedBy ?? "",
                      )}
                    </span>
                  </span>
                  {signed.signedAt && <DateTime date={signed.signedAt} />}
                  <Link
                    href={`/comptes-rendus/${signed.id}`}
                    className="-my-1.5 ml-auto flex items-center gap-1.5 py-1.5 text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
                  >
                    <FileText className="size-3.5" aria-hidden />
                    {messages.fullDocument}
                  </Link>
                </div>
                <div className="p-4">
                  <ReportDocument
                    sections={signed.sections}
                    language={study.reportLanguage}
                  />
                </div>
              </>
            ) : (
              <p className="px-4 py-10 text-center text-xs text-tertiary">
                {study.status === "in_progress"
                  ? messages.reportInProgress
                  : messages.reportPending}
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

        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="flex flex-col overflow-hidden">
            <PanelTitle>{messages.progress}</PanelTitle>
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
            <PanelTitle>{messages.information}</PanelTitle>
            <dl className="divide-y divide-border-subtle text-xs">
              <Field label={messages.facility} value={study.clinic} />
              <Field
                label={messages.clinicalInfo}
                value={study.clinicalInfo ?? "—"}
              />
              <Field
                label={messages.series}
                value={`${study.seriesCount} · ${messages.slices(study.instanceCount, formatCount(study.instanceCount, locale))}`}
              />
              <Field label={messages.receivedAt}>
                <DateTime date={study.receivedAt} />
              </Field>
              <Field
                label={messages.radiologist}
                value={
                  study.reportedBy ??
                  study.assignedToName ??
                  messages.unassigned
                }
              />
              <Field
                label={messages.studyUid}
                value={study.studyInstanceUid}
                mono
              />
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
 *
 * En démonstration, l'aperçu est la coupe simulée de l'écran de lecture,
 * signalée comme telle.
 *
 * @param study    Examen affiché.
 * @param demo     Mode démonstration : l'aperçu est simulé.
 * @param messages Textes de la fiche, dans la langue de l'utilisateur.
 * @param locale   Langue de l'utilisateur, pour le format des nombres.
 */
function ImagesPanel({
  study,
  demo,
  messages,
  locale,
}: {
  study: Study;
  demo: boolean;
  messages: AppMessages["clinic"]["study"];
  locale: Locale;
}) {
  return (
    <Panel className="flex flex-col overflow-hidden">
      <PanelTitle>
        {messages.images}
        <span className="ml-auto hidden truncate font-normal text-tertiary normal-case sm:inline">
          {messages.seriesCount(study.seriesCount)} ·{" "}
          {messages.slices(
            study.instanceCount,
            formatCount(study.instanceCount, locale),
          )}
        </span>
        {/* Dans l'en-tête, pas sur l'image : posé sur l'aperçu, le bouton
            recouvrait les surimpressions des coins. */}
        <Button
          variant="secondary"
          size="sm"
          className="ml-auto shrink-0 tracking-normal normal-case sm:ml-0"
          asChild
        >
          <Link href={`/lecture/${study.id}`} prefetch={false}>
            <Maximize2 />
            {messages.openImages}
          </Link>
        </Button>
      </PanelTitle>
      <div className="relative h-64 bg-black sm:h-72">
        {demo ? (
          <SimulatedScan study={study} interactive={false} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <ImageOff className="size-5 text-ink-600" aria-hidden />
            <p className="text-xs text-ink-500">{messages.viewerNote}</p>
          </div>
        )}
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
