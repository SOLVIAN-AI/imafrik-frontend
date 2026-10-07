import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

import { Segmented } from "@/components/admin/control-ui";
import { StudyAge } from "@/components/domain/study-age";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { ListToolbar } from "@/components/domain/list-toolbar";
import { listStudies } from "@/lib/data/studies";
import { requireSession } from "@/lib/session/server";
import { formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tous les examens" };

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
 * `GET /studies` que tout le monde. Les images, elles, ne s'ouvrent pas
 * d'ici : regarder un examen reste un acte de lecture, tracé comme tel.
 */
export default async function AdminStudiesPage({
  searchParams,
}: PageProps<"/admin/examens">) {
  await requireSession(["platform_admin"]);
  const { q, urgent } = await searchParams;
  // `?urgent=1` : les urgences pas encore rendues — la destination de
  // l'alerte « urgences en retard » du cockpit.
  const urgentOnly = urgent === "1";
  const all = await listStudies({
    search: typeof q === "string" ? q : undefined,
  });
  const studies = urgentOnly
    ? all.filter(
        (study) =>
          study.urgent &&
          study.status !== "reported" &&
          study.status !== "delivered",
      )
    : all;
  const stuck = studies.filter(
    (study) => study.status === "received" && study.urgent,
  );

  return (
    <>
      <PageHeader
        title="Examens"
        description={
          urgentOnly
            ? `${studies.length} urgence${studies.length > 1 ? "s" : ""} pas encore rendue${studies.length > 1 ? "s" : ""}`
            : `${studies.length} examens, toutes organisations confondues`
        }
        actions={
          <>
            <Segmented
              label="Filtre"
              options={[
                { label: "Tous", href: "/admin/examens", active: !urgentOnly },
                {
                  label: "Urgences en cours",
                  href: "/admin/examens?urgent=1",
                  active: urgentOnly,
                },
              ]}
            />
            <ListToolbar />
          </>
        }
      />

      {stuck.length > 0 && (
        <div className="mx-4 mb-4 flex sm:mx-6 items-center gap-2.5 rounded-xl bg-urgent-muted px-4 py-3 text-xs text-urgent">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>
            {stuck.length} examen{stuck.length > 1 ? "s" : ""} urgent
            {stuck.length > 1 ? "s" : ""} en attente de prise en charge.
          </span>
        </div>
      )}

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
                    <span className="truncate text-sm font-medium">
                      {formatPatientName(study.patientName)}
                    </span>
                    {study.urgent && <UrgentMarker />}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-secondary">
                    <span className="font-medium text-primary">
                      {study.modality}
                    </span>
                    {study.bodyPart && ` · ${study.bodyPart}`} · {study.clinic}
                  </p>
                  <p className="mt-0.5 truncate text-2xs text-tertiary">
                    {study.assignedToName ?? "Non attribué"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StudyAge
                    date={study.receivedAt}
                    muted={study.status === "delivered"}
                  />
                  <StudyStatusChip status={study.status} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden min-h-0 flex-1 overflow-auto lg:block">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
                  <th scope="col" className="w-[24%]">
                    <span className="label-eyebrow">Patient</span>
                  </th>
                  <th scope="col" className="w-[14%]">
                    <span className="label-eyebrow">Examen</span>
                  </th>
                  <th scope="col" className="w-[20%]">
                    <span className="label-eyebrow">Établissement</span>
                  </th>
                  <th scope="col" className="w-[14%]">
                    <span className="label-eyebrow">Statut</span>
                  </th>
                  <th scope="col" className="w-[14%]">
                    <span className="label-eyebrow">Radiologue</span>
                  </th>
                  <th scope="col" className="w-[14%]">
                    <span className="label-eyebrow">UID</span>
                  </th>
                  <th scope="col" className="w-[8%] text-right">
                    <span className="label-eyebrow">Attente</span>
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
                        <span className="truncate font-medium">
                          {formatPatientName(study.patientName)}
                        </span>
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

                    <td className="truncate text-secondary">
                      {study.assignedToName ?? (
                        <span className="text-tertiary">—</span>
                      )}
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
        </Panel>
      </div>
    </>
  );
}
