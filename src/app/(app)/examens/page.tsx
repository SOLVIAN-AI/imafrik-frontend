import type { Metadata } from "next";

import { ClinicStudiesActions } from "@/components/domain/clinic-studies-actions";
import { ListPagination } from "@/components/domain/list-pagination";
import { ListToolbar } from "@/components/domain/list-toolbar";
import { StudyList } from "@/components/domain/study-list";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listStudyPageAt, STUDY_LIST_PAGE_SIZE } from "@/lib/data/studies";
import { pageHref, readCursor } from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.studies.title };
}

/**
 * Tous les examens du périmètre de l'utilisateur.
 *
 * Pour une clinique, ses envois ; pour un radiologue, tout le pool qu'il
 * sert, rendus compris — la file « À lire », elle, ne montre que ce qui
 * reste à faire.
 *
 * Écran de suivi : on y vient pour retrouver un dossier précis, d'où la
 * recherche en tête, faite par le service sur tout le périmètre. L'état du
 * compte-rendu arrive avec chaque examen : l'écran faisait auparavant un
 * appel par ligne, qui, pour un radiologue, créait même un brouillon sur
 * chaque examen listé.
 *
 * Paginé par le service : l'en-tête donne le total exact, le pied de
 * liste mène à la page suivante. La liste s'arrêtait auparavant aux deux
 * cents premiers examens, et l'en-tête annonçait « 200 examens ».
 */
export default async function StudiesPage({
  searchParams,
}: PageProps<"/examens">) {
  const session = await requireSession(["clinic_staff", "radiologist"]);
  const search = await readListSearch("examens", session);
  const params = await searchParams;
  const { studies, total, nextCursor } = await listStudyPageAt(
    { search, limit: STUDY_LIST_PAGE_SIZE, cursor: readCursor(params) },
    pageHref("/examens", params, null),
  );
  const isClinic = session.active.role === "clinic_staff";
  const { t } = await getMessages();

  return (
    <>
      <PageHeader
        title={t.clinic.studies.title}
        description={`${t.clinic.studies.count(total)} · ${session.active.organizationName}`}
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
          <ListPagination
            pathname="/examens"
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
