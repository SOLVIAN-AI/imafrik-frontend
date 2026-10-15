"use client";

import { FileText, SearchX } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { useSession } from "@/components/providers/session-provider";
import { DateTime } from "@/components/domain/date-time";
import { DownloadPdfButton } from "@/components/domain/download-pdf-button";
import { ListToolbar } from "@/components/domain/list-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { useMessages } from "@/i18n/client";
import type { Study } from "@/lib/data/studies";
import { formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Comptes-rendus signés.
 *
 * **Écran partagé, colonne variable.** La clinique cherche un document
 * par patient et veut savoir qui l'a signé ; le radiologue cherche dans
 * sa propre production et veut savoir pour quel établissement. Une seule
 * colonne change — inutile d'écrire deux écrans pour cela.
 *
 * La recherche est faite par le service, sur tous les comptes-rendus du
 * périmètre, et la liste est paginée par lui : chercher dans la page
 * affichée ne trouvait pas le deux-cent-unième document. Comme sur les
 * autres listes d'examens, la recherche porte un nom de patient et vit
 * dans un cookie lié au compte, jamais dans l'adresse.
 *
 * Chaque examen arrive avec son compte-rendu résumé (identifiant,
 * signataire, date) : la liste ne coûte qu'un appel, quel que soit le
 * nombre de documents.
 *
 * @param studies Examens rendus de la page, chacun avec son compte-rendu.
 * @param search  Recherche en cours, relue par la page serveur.
 * @param footer  Pied de liste : pagination, rendue par la page serveur.
 */
export function ReportsView({
  studies,
  search,
  footer,
}: {
  studies: Study[];
  search?: string;
  footer?: React.ReactNode;
}) {
  const { active } = useSession();
  const t = useMessages().clinic.reports;

  const isClinic = active.role === "clinic_staff";
  const rows = studies.filter((study) => study.reportId);

  return (
    <>
      <PageHeader
        title={t.title}
        description={isClinic ? t.descriptionClinic : t.descriptionRadiologist}
        actions={<ListToolbar scope="comptes-rendus" search={search} />}
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState
              icon={search ? SearchX : FileText}
              title={search ? t.noResult : t.empty}
              detail={search ? t.noResultDetail : t.emptyDetail}
            />
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-border-subtle overflow-auto">
              {rows.map((study) => {
                const exam = [study.modality, study.bodyPart]
                  .filter(Boolean)
                  .join(" · ");
                const party = isClinic
                  ? (study.reportedBy ?? "—")
                  : study.clinic;
                const toDownload = isClinic && study.status === "reported";
                return (
                  <li
                    key={study.reportId}
                    className="flex items-center gap-2 pr-3 transition-colors hover:bg-surface-hover"
                  >
                    <Link
                      href={`/comptes-rendus/${study.reportId}`}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left sm:gap-4",
                        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-done-muted">
                        <FileText className="size-4 text-done" aria-hidden />
                      </span>

                      {/* Le nom ne cède jamais sa place : sur un téléphone,
                          l'examen et le signataire passent sur une seconde
                          ligne au lieu de se partager la largeur (ils y
                          tombaient à une lettre). */}
                      <span className="min-w-0 flex-[2]">
                        <span className="block truncate text-sm font-medium">
                          {formatPatientName(study.patientName)}
                        </span>
                        <span className="block truncate text-2xs text-tertiary">
                          <span className="font-mono">{study.patientId}</span>
                          <span className="sm:hidden">
                            {exam && ` · ${exam}`} · {party}
                          </span>
                        </span>
                      </span>

                      <span className="hidden min-w-0 flex-1 truncate text-xs text-secondary sm:block">
                        {exam}
                      </span>

                      <span className="hidden min-w-0 flex-1 truncate text-xs text-secondary sm:block">
                        {party}
                      </span>

                      <span className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                        {study.reportedAt && (
                          <DateTime
                            date={study.reportedAt}
                            withTime={false}
                            className="text-2xs text-tertiary tabular-nums"
                          />
                        )}
                        {isClinic && (
                          <span
                            className={cn(
                              "text-2xs font-medium sm:w-24 sm:text-right",
                              toDownload ? "text-accent" : "text-tertiary",
                            )}
                          >
                            {toDownload ? t.toDownload : t.downloaded}
                          </span>
                        )}
                      </span>
                    </Link>
                    {/* Téléchargement direct depuis la liste : ouvrir le
                        document pour cliquer ensuite sur « Télécharger »
                        coûtait un écran de plus, à chaque compte-rendu. */}
                    {toDownload && (
                      <DownloadPdfButton reportId={study.reportId} compact />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {footer}
        </Panel>
      </div>
    </>
  );
}
