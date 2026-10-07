import type { Metadata } from "next";

import { ClinicStudiesActions } from "@/components/domain/clinic-studies-actions";
import { ListToolbar } from "@/components/domain/list-toolbar";
import { StudyList } from "@/components/domain/study-list";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listStudies } from "@/lib/data/studies";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Examens" };

/**
 * Tous les examens du périmètre de l'utilisateur.
 *
 * Pour une clinique, ses envois ; pour un radiologue, tout le pool qu'il
 * sert, rendus compris — la file « À lire », elle, ne montre que ce qui
 * reste à faire.
 *
 * Écran de suivi : on y vient pour retrouver un dossier précis, d'où la
 * recherche en tête. L'état du compte-rendu arrive avec chaque examen :
 * l'écran faisait auparavant un appel par ligne — qui, pour un
 * radiologue, créait même un brouillon sur chaque examen listé.
 */
export default async function StudiesPage() {
  const session = await requireSession(["clinic_staff", "radiologist"]);
  const search = await readListSearch("examens", session);
  const studies = await listStudies({ search });
  const isClinic = session.active.role === "clinic_staff";

  return (
    <>
      <PageHeader
        title="Examens"
        description={`${studies.length} examen${studies.length > 1 ? "s" : ""} · ${session.active.organizationName}`}
        actions={
          isClinic ? (
            <ClinicStudiesActions search={search} />
          ) : (
            <ListToolbar scope="examens" search={search} />
          )
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <StudyList studies={studies} filtered={Boolean(search)} />
        </Panel>
      </div>
    </>
  );
}
