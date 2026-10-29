import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AssignDialog } from "@/components/domain/assign-dialog";
import { EligibilityNote } from "@/components/domain/eligibility-note";
import { type BarDimension, FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { StudyAge } from "@/components/domain/study-age";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { ListPagination } from "@/components/domain/list-pagination";
import { ListToolbar } from "@/components/domain/list-toolbar";
import { getEligibility } from "@/lib/data/eligibility";
import type { Eligibility } from "@/lib/assignment-blocker";
import {
  getClinicCounts,
  getModalityCounts,
  listStudyPage,
  listStudyPageAt,
  STUDY_LIST_PAGE_SIZE,
  type Study,
} from "@/lib/data/studies";
import type { ModalityGroup } from "@/lib/api/contracts";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { hasFilters, readFilters } from "@/lib/filters/url";
import { MODALITY_GROUPS } from "@/lib/modalities";
import { pageHref, readCursor } from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";

/** Un examen s'attribue tant que son compte-rendu n'est pas signé. */
function isAssignable(status: string): boolean {
  return (
    status === "received" || status === "assigned" || status === "in_progress"
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.admin.studies.metaTitle };
}

/**
 * Tous les examens de la plateforme.
 *
 * **La seule vue qui ignore le cloisonnement par organisation**, et elle
 * existe pour une raison précise : quand une clinique appelle parce
 * qu'un examen « n'est pas arrivé », il faut pouvoir répondre sans
 * ouvrir un client SQL.
 *
 * Elle se filtre par la barre commune (`components/filters`) : clinique
 * (`?clinique=`, liste déroulante), groupe de modalités (`?modalite=`,
 * puces) et urgences en cours (`?urgent=1`), chaque choix avec son nombre
 * d'examens compté par le service ; tout se combine, recherche comprise.
 * C'est l'écran de référence de la barre (`docs/vues-filtrees.md`).
 *
 * **Chaque examen non signé porte « Attribuer »** (ou « Réattribuer »),
 * libellé, dans sa colonne : la même fenêtre que « À lire ». Quand
 * personne ne peut recevoir un examen, la ligne le dit (lu pour toute la
 * page en un appel, `POST /admin/studies/eligibility`) et le bouton reste :
 * la fenêtre explique pourquoi, et mène à l'écran qui le règle.
 *
 * Elle est réservée au rôle `platform_admin` : c'est la policy RLS
 * `study_select_admin` qui ouvre ce périmètre, sur la même route
 * `GET /studies` que tout le monde. Le nom du patient ouvre l'écran de
 * lecture, en consultation seule : images et compte-rendu, sans
 * rédaction ni signature. Chaque ouverture des images est tracée au nom
 * de l'administrateur, comme pour un radiologue.
 */
export default async function AdminStudiesPage({
  searchParams,
}: PageProps<"/admin/examens">) {
  const session = await requireSession(["platform_admin"]);
  const { t } = await getMessages();
  const text = t.admin.studies;
  const params = await searchParams;
  const search = await readListSearch("admin-examens", session);
  const keys = LIST_FILTERS["admin-examens"];
  // Modalité et urgences d'abord : la clinique se valide ensuite, parmi
  // celles que compte le service.
  const draft = readFilters(params, keys);
  // `?urgent=1` : les urgences pas encore rendues, la destination de
  // l'alerte « urgences en retard » du cockpit. Filtrées par le service,
  // sur toute la base : filtrer ici une page des plus récents laissait de
  // côté les urgences en retard, justement les plus anciennes.
  const urgentOnly = draft.urgency !== undefined;
  // `?modalite=scanner` : un groupe de modalités, compté par puce.
  const modalityGroup = draft.modality as ModalityGroup | undefined;
  // Les filtres de la liste, groupe et clinique mis à part : ceux des
  // comptes de chaque choix.
  const base = {
    search,
    ...(urgentOnly && {
      priority: "urgent" as const,
      status: [
        "received" as const,
        "assigned" as const,
        "in_progress" as const,
      ],
    }),
  };
  // `?clinique=` : une clinique de la plateforme, comptée par le service.
  // Les comptes d'abord : un identifiant inconnu ou mal formé, tapé à la
  // main, revient à toutes les cliniques au lieu d'une erreur du service.
  const clinicCounts = await getClinicCounts({ ...base, modalityGroup });
  const filters = readFilters(params, keys, {
    clinic: clinicCounts.clinics.map((row) => row.id),
  });
  const clinic = filters.clinic ?? null;
  const clinicName = clinicCounts.clinics.find(
    (row) => row.id === clinic,
  )?.name;
  const [{ studies, total, nextCursor }, stuck, counts] = await Promise.all([
    listStudyPageAt(
      {
        ...base,
        modalityGroup,
        clinic: clinic ?? undefined,
        limit: STUDY_LIST_PAGE_SIZE,
        cursor: readCursor(params),
        // Les plus anciennes, donc les plus en retard, d'abord.
        ...(urgentOnly && { order: "deadline" as const }),
      },
      pageHref("/admin/examens", params, null),
    ),
    // Urgences que personne n'a prises : un compte exact, indépendant de
    // la page et de la recherche affichées.
    listStudyPage({ status: ["received"], priority: "urgent", limit: 1 }).then(
      (page) => page.total,
    ),
    getModalityCounts({ ...base, clinic: clinic ?? undefined }),
  ]);
  // Qui peut recevoir chaque examen à attribuer de la page, en un appel.
  const eligibility = await getEligibility(
    studies
      .filter((study) => isAssignable(study.status) && !study.assignedTo)
      .map((study) => study.id),
  );
  // La barre : chaque choix avec son nombre d'examens, compté par le
  // service avec tous les autres filtres.
  const bar: BarDimension[] = [
    {
      key: "clinic",
      options: clinicCounts.clinics.map((row) => ({
        value: row.id,
        label: row.name,
        count: row.count,
      })),
      total: clinicCounts.total,
    },
    {
      key: "modality",
      options: MODALITY_GROUPS.map((group) => ({
        value: group,
        count: counts.byGroup[group],
      })),
      total: counts.total,
    },
    { key: "urgency", label: text.openUrgent },
  ];
  const filteredEmpty = studies.length === 0 && hasFilters(filters);

  return (
    <>
      <PageHeader
        title={t.admin.shared.examinations}
        description={
          (urgentOnly
            ? text.urgentDescription(total)
            : clinicName
              ? text.clinicDescription(total)
              : text.allDescription(total)) +
          (clinicName ? ` · ${clinicName}` : "")
        }
        actions={<ListToolbar scope="admin-examens" search={search} />}
      />

      {stuck > 0 && (
        <div className="mx-4 mb-4 flex sm:mx-6 items-center gap-2.5 rounded-xl bg-urgent-muted px-4 py-3 text-xs text-urgent">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>{text.stuck(stuck)}</span>
        </div>
      )}

      <FilterBar
        dimensions={bar}
        active={filters}
        result={{ count: total, noun: "studies" }}
        className="shrink-0 px-4 pb-3 sm:px-6"
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          {filteredEmpty && <FilteredEmpty dimensions={bar} active={filters} />}
          {/* Téléphone : une carte par examen, comme dans les portails. */}
          <ul
            className={cn(
              "min-h-0 flex-1 divide-y divide-border-subtle overflow-auto lg:hidden",
              filteredEmpty && "hidden",
            )}
          >
            {studies.map((study) => (
              <li
                key={study.id}
                className={cn(
                  "flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3",
                  study.urgent && "rail-urgent",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/lecture/${study.id}`}
                      prefetch={false}
                      // 24 px de haut au moins : une cible au doigt (WCAG 2.5.8).
                      className="truncate py-0.5 text-sm font-medium hover:underline"
                      aria-label={text.openImages(
                        formatPatientName(study.patientName),
                      )}
                    >
                      {formatPatientName(study.patientName)}
                    </Link>
                    {study.urgent && <UrgentMarker />}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-secondary">
                    <span className="font-medium text-primary">
                      {study.modality}
                    </span>
                    {study.bodyPart && ` · ${study.bodyPart}`} · {study.clinic}
                  </p>
                  <p className="mt-0.5 flex min-w-0 text-2xs text-tertiary">
                    <Reader
                      study={study}
                      eligibility={eligibility}
                      unassigned={t.assignment.list.unassigned}
                    />
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StudyAge
                    date={study.receivedAt}
                    muted={study.status === "delivered"}
                  />
                  <StudyStatusChip status={study.status} />
                </div>
                {isAssignable(study.status) && (
                  // Sous la carte, à pleine vue : l'action de la ligne.
                  <div className="flex basis-full justify-end">
                    <AssignDialog
                      portal="team"
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

          <div
            className={cn(
              "hidden min-h-0 flex-1 overflow-auto",
              !filteredEmpty && "lg:block",
            )}
          >
            {/* Une largeur minimale : à 1024 px, le tableau défile dans son
                conteneur plutôt que d'écraser ses colonnes, et la colonne
                d'attribution, collée à droite, reste visible. Mise en page
                automatique : un intitulé ne déborde jamais de sa cellule. */}
            <table className="w-full min-w-[62rem] border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-20">
                <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
                  <th scope="col" className="w-[20%]">
                    <span className="label-eyebrow">
                      {text.columns.patient}
                    </span>
                  </th>
                  <th scope="col" className="w-[12%]">
                    <span className="label-eyebrow">{text.columns.study}</span>
                  </th>
                  <th scope="col" className="w-[16%]">
                    <span className="label-eyebrow">
                      {text.columns.facility}
                    </span>
                  </th>
                  <th scope="col" className="w-[12%]">
                    <span className="label-eyebrow">{text.columns.status}</span>
                  </th>
                  <th scope="col" className="w-[16%]">
                    <span className="label-eyebrow">
                      {text.columns.radiologist}
                    </span>
                  </th>
                  <th scope="col" className="w-[10%]">
                    <span className="label-eyebrow">{text.columns.uid}</span>
                  </th>
                  <th scope="col" className="w-[6%] text-right">
                    <span className="label-eyebrow">
                      {text.columns.waiting}
                    </span>
                  </th>
                  <th scope="col" className="sticky right-0 w-36 !text-right">
                    <span className="label-eyebrow">
                      {t.assignment.list.action}
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {studies.map((study) => (
                  <tr
                    key={study.id}
                    className={cn(
                      "[&>td]:h-11 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4",
                      "last:[&>td]:border-b-0",
                      study.urgent && "rail-urgent",
                    )}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/lecture/${study.id}`}
                          prefetch={false}
                          className="truncate font-medium hover:underline"
                          aria-label={text.openImages(
                            formatPatientName(study.patientName),
                          )}
                        >
                          {formatPatientName(study.patientName)}
                        </Link>
                        {study.urgent && <UrgentMarker />}
                      </div>
                      <span className="font-mono text-2xs text-tertiary">
                        {study.patientId || "—"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap">
                      <span className="font-medium">{study.modality}</span>
                      {study.bodyPart && (
                        <span className="text-secondary">
                          {" "}
                          · {study.bodyPart}
                        </span>
                      )}
                    </td>

                    <td className="truncate text-secondary">{study.clinic}</td>

                    <td>
                      <StudyStatusChip status={study.status} />
                    </td>

                    <td>
                      <div className="flex min-w-0">
                        <Reader
                          study={study}
                          eligibility={eligibility}
                          unassigned={t.assignment.list.unassigned}
                        />
                      </div>
                    </td>

                    <td>
                      <code
                        className="block truncate font-mono text-2xs text-tertiary"
                        title={study.studyInstanceUid}
                      >
                        …{study.studyInstanceUid.slice(-12)}
                      </code>
                    </td>

                    <td className="text-right tabular-nums">
                      <StudyAge
                        date={study.receivedAt}
                        muted={study.status === "delivered"}
                      />
                    </td>

                    <td className="sticky right-0 bg-surface-raised text-right">
                      {isAssignable(study.status) && (
                        <AssignDialog
                          portal="team"
                          studyId={study.id}
                          patient={formatPatientName(study.patientName)}
                          assigned={study.assignedTo !== null}
                          clinic={{ id: study.clinicId, name: study.clinic }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ListPagination
            pathname="/admin/examens"
            params={params}
            shown={studies.length}
            total={total}
            nextCursor={nextCursor}
          />
        </Panel>
      </div>
    </>
  );
}

/**
 * Qui lit l'examen ; sans titulaire, qu'il est à attribuer, ou que
 * personne ne peut le recevoir.
 */
function Reader({
  study,
  eligibility,
  unassigned,
}: {
  study: Study;
  eligibility: Record<string, Eligibility>;
  unassigned: string;
}) {
  if (study.assignedToName)
    return (
      <span className="truncate text-secondary">{study.assignedToName}</span>
    );
  if (!isAssignable(study.status))
    return <span className="text-tertiary">—</span>;
  return (
    <EligibilityNote
      found={eligibility[study.id]}
      modality={study.modality}
      fallback={unassigned}
    />
  );
}
