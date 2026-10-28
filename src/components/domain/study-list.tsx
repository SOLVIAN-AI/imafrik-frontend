"use client";

import { FileCheck, Inbox, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AssignDialog } from "@/components/domain/assign-dialog";
import { StudyAge } from "@/components/domain/study-age";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { EmptyState } from "@/components/ui/empty-state";
import { useMessages } from "@/i18n/client";
import type { Study } from "@/lib/data/studies";
import { formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Liste des examens envoyés, vue de la clinique.
 *
 * **Elle ne ressemble pas à la worklist du radiologue, et c'est
 * volontaire.** Le radiologue trie une file de travail : il lui faut de
 * la densité, l'ancienneté, l'urgence, qui a pris quoi. La clinique
 * suit des dossiers : elle veut savoir où en est chacun et si le
 * compte-rendu est arrivé. Une seule table paramétrée pour les deux
 * usages finirait par mal servir les deux.
 *
 * La dernière colonne est la plus regardée : c'est celle qui dit si le
 * document est disponible. Elle vient de l'examen lui-même
 * (`reportedAt`, la date de signature), que le service renvoie avec la
 * liste : aucun appel supplémentaire par ligne.
 *
 * **Qui le lit.** La colonne « Radiologue » dit à qui l'examen est
 * attribué, ou qu'il est « à attribuer » : aucun radiologue ne le voit
 * tant qu'on ne le lui a pas confié. Le responsable l'attribue d'un clic,
 * sur la ligne.
 *
 * @param studies    Examens à afficher.
 * @param filtered   Une recherche ou une vue est active : l'état vide dit
 *                   « aucun résultat » plutôt que « aucun examen ».
 * @param assignable Le responsable de la clinique attribue depuis la liste.
 */
export function StudyList({
  studies,
  filtered = false,
  assignable = false,
}: {
  studies: Study[];
  filtered?: boolean;
  assignable?: boolean;
}) {
  const router = useRouter();
  const messages = useMessages();
  const t = messages.clinic.studies;
  const reports = messages.clinic.reports;
  const views = messages.assignment.list;
  const open = (study: Study) =>
    study.status === "received" ||
    study.status === "assigned" ||
    study.status === "in_progress";
  /** Qui lit l'examen, ou qu'il attend une attribution. */
  const reader = (study: Study) =>
    study.reportedBy ??
    study.assignedToName ??
    (study.status === "received" ? null : "—");

  if (studies.length === 0) {
    return (
      <EmptyState
        icon={filtered ? SearchX : Inbox}
        title={filtered ? t.noResult : t.empty}
        detail={filtered ? t.noResultDetail : t.emptyDetail}
      />
    );
  }

  return (
    <>
      {/* Téléphone : une carte par examen, voir `ReadingTable`. */}
      <ul className="min-h-0 flex-1 divide-y divide-border-subtle overflow-auto lg:hidden">
        {studies.map((study) => (
          <li key={study.id}>
            <Link
              href={`/examens/${study.id}`}
              className={cn(
                "flex items-start gap-3 px-4 py-3 transition-colors active:bg-surface-active",
                study.urgent && "rail-urgent",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {formatPatientName(study.patientName)}
                  </span>
                  {study.urgent && <UrgentMarker />}
                </div>
                <p className="mt-0.5 truncate text-xs text-secondary">
                  <span className="font-medium text-primary">
                    {study.modality}
                  </span>
                  {study.bodyPart && ` · ${study.bodyPart}`}
                  <span className="font-mono text-2xs text-tertiary">
                    {" "}
                    · {study.patientId}
                  </span>
                </p>
                {study.reportedAt && (
                  <p
                    className={cn(
                      "mt-1 inline-flex items-center gap-1.5 text-2xs font-medium",
                      study.status === "delivered"
                        ? "text-tertiary"
                        : "text-accent",
                    )}
                  >
                    <FileCheck className="size-3.5" aria-hidden />
                    {study.status === "delivered"
                      ? reports.downloaded
                      : reports.toDownload}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StudyAge
                  date={study.receivedAt}
                  muted={study.status === "delivered"}
                />
                <StudyStatusChip status={study.status} />
                {reader(study) === null && (
                  <span className="text-2xs font-medium text-progress">
                    {views.unassigned}
                  </span>
                )}
              </div>
            </Link>
            {assignable && open(study) && (
              <div className="flex justify-end px-4 pb-3">
                <AssignDialog
                  portal="clinic"
                  studyId={study.id}
                  patient={formatPatientName(study.patientName)}
                  assigned={study.assignedTo !== null}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="hidden min-h-0 flex-1 overflow-auto lg:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
              <th scope="col" className="w-[26%]">
                <span className="label-eyebrow">{t.columns.patient}</span>
              </th>
              <th scope="col" className="w-[14%]">
                <span className="label-eyebrow">{t.columns.study}</span>
              </th>
              <th scope="col" className="w-[14%]">
                <span className="label-eyebrow">{t.columns.status}</span>
              </th>
              <th scope="col" className="w-[20%]">
                <span className="label-eyebrow">{views.radiologist}</span>
              </th>
              <th scope="col" className="w-[10%] text-right">
                <span className="label-eyebrow">{t.columns.sent}</span>
              </th>
              <th scope="col" className="w-[16%] text-right">
                <span className="label-eyebrow">{t.columns.report}</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {studies.map((study) => (
              <tr
                key={study.id}
                onClick={(event) => {
                  // La fenêtre d'attribution est rendue hors de la ligne
                  // (portail), mais ses clics remontent l'arbre React
                  // jusqu'ici : ils ne doivent pas ouvrir la fiche.
                  if (!event.currentTarget.contains(event.target as Node))
                    return;
                  // Le lien et le bouton gèrent eux-mêmes leur clic.
                  if ((event.target as HTMLElement).closest("a, button"))
                    return;
                  router.push(`/examens/${study.id}`);
                }}
                className={cn(
                  "cursor-pointer",
                  "[&>td]:h-11 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4",
                  "last:[&>td]:border-b-0",
                  "transition-colors duration-75",
                  "hover:bg-surface-hover focus-within:bg-surface-hover",
                  study.urgent && "rail-urgent",
                )}
              >
                <td>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/examens/${study.id}`}
                      className="-my-1 truncate rounded-sm py-1 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {formatPatientName(study.patientName)}
                    </Link>
                    {study.urgent && <UrgentMarker />}
                  </div>
                  <span className="font-mono text-2xs text-tertiary">
                    {study.patientId}
                  </span>
                </td>

                <td className="whitespace-nowrap">
                  <span className="font-medium">{study.modality}</span>
                  {study.bodyPart && (
                    <span className="text-secondary"> · {study.bodyPart}</span>
                  )}
                </td>

                <td>
                  <StudyStatusChip status={study.status} />
                </td>

                <td>
                  <div className="flex items-center justify-between gap-2">
                    {reader(study) === null ? (
                      <span className="text-xs font-medium text-progress">
                        {views.unassigned}
                      </span>
                    ) : (
                      <span className="truncate text-secondary">
                        {reader(study)}
                      </span>
                    )}
                    {assignable && open(study) && (
                      <AssignDialog
                        portal="clinic"
                        studyId={study.id}
                        patient={formatPatientName(study.patientName)}
                        assigned={study.assignedTo !== null}
                        compact
                      />
                    )}
                  </div>
                </td>

                <td className="text-right tabular-nums">
                  <StudyAge
                    date={study.receivedAt}
                    muted={study.status === "delivered"}
                  />
                </td>

                <td className="text-right">
                  {study.reportedAt ? (
                    // Téléchargé ou non : « Disponible », en vert dans les
                    // deux cas, ne disait pas ce qui restait à récupérer.
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-2xs font-medium",
                        study.status === "delivered"
                          ? "text-tertiary"
                          : "text-accent",
                      )}
                    >
                      <FileCheck className="size-3.5" aria-hidden />
                      {study.status === "delivered"
                        ? reports.downloaded
                        : reports.toDownload}
                    </span>
                  ) : (
                    <span className="text-2xs text-tertiary">{t.pending}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
