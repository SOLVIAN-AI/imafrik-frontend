import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AssignDialog } from "@/components/domain/assign-dialog";
import { Segmented } from "@/components/admin/control-ui";
import { StudyAge } from "@/components/domain/study-age";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { ListPagination } from "@/components/domain/list-pagination";
import { ListToolbar } from "@/components/domain/list-toolbar";
import { ModalityTabs } from "@/components/domain/modality-tabs";
import {
  getModalityCounts,
  listStudyPage,
  listStudyPageAt,
  STUDY_LIST_PAGE_SIZE,
} from "@/lib/data/studies";
import {
  MODALITY_PARAM,
  MODALITY_SLUGS,
  readModalityGroup,
} from "@/lib/modalities";
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
  const { t, locale } = await getMessages();
  const text = t.admin.studies;
  const params = await searchParams;
  const search = await readListSearch("admin-examens", session);
  // `?urgent=1` : les urgences pas encore rendues, la destination de
  // l'alerte « urgences en retard » du cockpit. Filtrées par le service,
  // sur toute la base : filtrer ici une page des plus récents laissait de
  // côté les urgences en retard, justement les plus anciennes.
  const urgentOnly = params.urgent === "1";
  // `?modalite=scanner` : un groupe de modalités, compté par onglet.
  const modalityGroup = readModalityGroup(params[MODALITY_PARAM]);
  // Les filtres de la liste, groupe mis à part : ceux des comptes.
  const filters = {
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
  const [{ studies, total, nextCursor }, stuck, counts] = await Promise.all([
    listStudyPageAt(
      {
        ...filters,
        modalityGroup,
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
    getModalityCounts(filters),
  ]);
  // Le filtre des urgences garde le groupe de modalités, et inversement.
  const modality = modalityGroup
    ? { [MODALITY_PARAM]: MODALITY_SLUGS[modalityGroup] }
    : {};

  return (
    <>
      <PageHeader
        title={t.admin.shared.examinations}
        description={
          urgentOnly
            ? text.urgentDescription(total)
            : text.allDescription(total)
        }
        actions={
          <>
            <Segmented
              label={t.admin.shared.filter}
              options={[
                {
                  label: t.admin.shared.all,
                  href: pageHref("/admin/examens", modality, null),
                  active: !urgentOnly,
                },
                {
                  label: text.openUrgent,
                  href: pageHref(
                    "/admin/examens",
                    { ...modality, urgent: "1" },
                    null,
                  ),
                  active: urgentOnly,
                },
              ]}
            />
            <ListToolbar scope="admin-examens" search={search} />
          </>
        }
      />

      {stuck > 0 && (
        <div className="mx-4 mb-4 flex sm:mx-6 items-center gap-2.5 rounded-xl bg-urgent-muted px-4 py-3 text-xs text-urgent">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>{text.stuck(stuck)}</span>
        </div>
      )}

      <ModalityTabs
        counts={counts}
        active={modalityGroup}
        pathname="/admin/examens"
        params={params}
        labels={t.assignment}
        locale={locale}
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          {/* Téléphone : une carte par examen, comme dans les portails. */}
          <ul className="min-h-0 flex-1 divide-y divide-border-subtle overflow-auto lg:hidden">
            {studies.map((study) => (
              <li
                key={study.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3",
                  study.urgent && "rail-urgent",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/lecture/${study.id}`}
                      prefetch={false}
                      className="truncate text-sm font-medium hover:underline"
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
                  <p className="mt-0.5 truncate text-2xs text-tertiary">
                    {study.assignedToName ?? t.admin.shared.unassigned}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StudyAge
                    date={study.receivedAt}
                    muted={study.status === "delivered"}
                  />
                  <StudyStatusChip status={study.status} />
                  {isAssignable(study.status) && (
                    <AssignDialog
                      portal="team"
                      studyId={study.id}
                      patient={formatPatientName(study.patientName)}
                      assigned={study.assignedTo !== null}
                      compact
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden min-h-0 flex-1 overflow-auto lg:block">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
                  <th scope="col" className="w-[22%]">
                    <span className="label-eyebrow">
                      {text.columns.patient}
                    </span>
                  </th>
                  <th scope="col" className="w-[14%]">
                    <span className="label-eyebrow">{text.columns.study}</span>
                  </th>
                  <th scope="col" className="w-[20%]">
                    <span className="label-eyebrow">
                      {text.columns.facility}
                    </span>
                  </th>
                  <th scope="col" className="w-[14%]">
                    <span className="label-eyebrow">{text.columns.status}</span>
                  </th>
                  <th scope="col" className="w-[16%]">
                    <span className="label-eyebrow">
                      {text.columns.radiologist}
                    </span>
                  </th>
                  <th scope="col" className="w-[14%]">
                    <span className="label-eyebrow">{text.columns.uid}</span>
                  </th>
                  <th scope="col" className="w-[8%] text-right">
                    <span className="label-eyebrow">
                      {text.columns.waiting}
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-secondary">
                          {study.assignedToName ?? (
                            <span className="text-tertiary">—</span>
                          )}
                        </span>
                        {isAssignable(study.status) && (
                          <AssignDialog
                            portal="team"
                            studyId={study.id}
                            patient={formatPatientName(study.patientName)}
                            assigned={study.assignedTo !== null}
                            compact
                          />
                        )}
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
