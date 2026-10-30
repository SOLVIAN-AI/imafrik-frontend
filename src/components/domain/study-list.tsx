"use client";

import { FileCheck, Inbox, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AssignDialog } from "@/components/domain/assign-dialog";
import { EligibilityNote } from "@/components/domain/eligibility-note";
import { PlanTrace } from "@/components/domain/plan-trace";
import { StudyAge } from "@/components/domain/study-age";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import {
  useClinicHref,
  useClinicView,
} from "@/components/providers/clinic-view-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { useMessages } from "@/i18n/client";
import type { Eligibility } from "@/lib/assignment-blocker";
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
 * tant qu'on ne le lui a pas confié. Le responsable l'attribue d'un clic :
 * chaque examen non signé porte « Attribuer » (ou « Réattribuer »),
 * libellé, dans sa propre colonne.
 *
 * Dans la vue des cliniques, l'équipe IMAFRIK y voit la même liste ; ses
 * liens restent sous la vue, et « Attribuer » passe par le portail de
 * l'équipe (`/admin/studies`), qui est son propre geste. Elle y voit aussi
 * quand personne ne peut recevoir un examen.
 *
 * @param studies     Examens à afficher.
 * @param filtered    Une recherche ou une vue est active : l'état vide dit
 *                    « aucun résultat » plutôt que « aucun examen ».
 * @param assignable  Le responsable de la clinique attribue depuis la liste.
 * @param eligibility Équipe IMAFRIK : qui peut recevoir chaque examen à
 *                    attribuer, lu par l'écran pour la page.
 */
export function StudyList({
  studies,
  filtered = false,
  assignable = false,
  eligibility = {},
}: {
  studies: Study[];
  filtered?: boolean;
  assignable?: boolean;
  eligibility?: Record<string, Eligibility>;
}) {
  const router = useRouter();
  const href = useClinicHref();
  const portal = useClinicView() ? "team" : "clinic";
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
              href={href(`/examens/${study.id}`)}
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
                {reader(study) === null ? (
                  <Waiting study={study} found={eligibility[study.id]} />
                ) : (
                  study.assignedTo !== null && (
                    <PlanTrace
                      rule={study.assignedByRule}
                      line={study.assignedByLine}
                    />
                  )
                )}
              </div>
            </Link>
            {assignable && open(study) && (
              <div className="flex justify-end px-4 pb-3">
                <AssignDialog
                  portal={portal}
                  studyId={study.id}
                  patient={formatPatientName(study.patientName)}
                  assigned={study.assignedTo !== null}
                  clinic={{ id: study.clinicId, name: study.clinic }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="hidden min-h-0 flex-1 overflow-auto lg:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
              <th scope="col" className="w-[24%]">
                <span className="label-eyebrow">{t.columns.patient}</span>
              </th>
              <th scope="col" className="w-[13%]">
                <span className="label-eyebrow">{t.columns.study}</span>
              </th>
              <th scope="col" className="w-[13%]">
                <span className="label-eyebrow">{t.columns.status}</span>
              </th>
              <th scope="col" className="w-[19%]">
                <span className="label-eyebrow">{views.radiologist}</span>
              </th>
              <th scope="col" className="w-[9%] text-right">
                <span className="label-eyebrow">{t.columns.sent}</span>
              </th>
              <th scope="col" className="w-[13%] text-right">
                <span className="label-eyebrow">{t.columns.report}</span>
              </th>
              {assignable && (
                // Collée à droite : l'action reste visible si le tableau
                // défile en largeur.
                <th scope="col" className="sticky right-0 w-36 !text-right">
                  <span className="label-eyebrow">{views.action}</span>
                </th>
              )}
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
                  router.push(href(`/examens/${study.id}`));
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
                      href={href(`/examens/${study.id}`)}
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
                  <div className="flex min-w-0 max-w-56 flex-col">
                    {reader(study) === null ? (
                      <Waiting study={study} found={eligibility[study.id]} />
                    ) : (
                      <>
                        <span className="truncate text-secondary">
                          {reader(study)}
                        </span>
                        {study.assignedTo !== null && (
                          <PlanTrace
                            rule={study.assignedByRule}
                            line={study.assignedByLine}
                          />
                        )}
                      </>
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

                {assignable && (
                  <td className="sticky right-0 bg-surface-raised text-right">
                    {open(study) && (
                      <AssignDialog
                        portal={portal}
                        studyId={study.id}
                        patient={formatPatientName(study.patientName)}
                        assigned={study.assignedTo !== null}
                        clinic={{ id: study.clinicId, name: study.clinic }}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * Ce qu'un examen à attribuer dit sur sa ligne : que personne ne peut le
 * recevoir d'abord, sinon pourquoi le planning ne l'a pas attribué,
 * sinon « À attribuer ».
 */
function Waiting({
  study,
  found,
}: {
  study: Study;
  found: Eligibility | undefined;
}) {
  const views = useMessages().assignment.list;
  if (study.planOutcome && !(found && found.candidates === 0))
    return (
      <PlanTrace outcome={study.planOutcome} names={study.planConflictNames} />
    );
  return (
    <EligibilityNote
      found={found}
      modality={study.modality}
      fallback={views.unassigned}
    />
  );
}
