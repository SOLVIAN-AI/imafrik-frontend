import type { Metadata } from "next";

import { ListPagination } from "@/components/domain/list-pagination";
import { ReportsView } from "@/components/domain/reports-view";
import { clinicViewPath } from "@/lib/clinic-view";
import { requireConsultation } from "@/lib/data/clinic-view";
import { listStudyPageAt, STUDY_LIST_PAGE_SIZE } from "@/lib/data/studies";
import { pageHref, readCursor } from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.reports.title };
}

/**
 * Les comptes-rendus signés d'une clinique, consultés par l'équipe
 * IMAFRIK : la liste de son responsable (signés ou remis), lue par la vue
 * de la clinique, avec sa recherche et sa pagination.
 */
export default async function ClinicViewReportsPage({
  params,
  searchParams,
}: PageProps<"/admin/vue-clinique/[clinicId]/comptes-rendus">) {
  const consultation = await requireConsultation((await params).clinicId);
  const session = await requireSession();
  const search = await readListSearch("vue-clinique-comptes-rendus", session);
  const query = await searchParams;
  const pathname = clinicViewPath(consultation.clinicId, "/comptes-rendus");
  const { studies, total, nextCursor } = await listStudyPageAt(
    {
      status: ["reported", "delivered"],
      search,
      limit: STUDY_LIST_PAGE_SIZE,
      cursor: readCursor(query),
    },
    pageHref(pathname, query, null),
    consultation.clinicId,
  );
  return (
    <ReportsView
      studies={studies}
      search={search}
      total={total}
      footer={
        <ListPagination
          pathname={pathname}
          params={query}
          shown={studies.length}
          total={total}
          nextCursor={nextCursor}
        />
      }
    />
  );
}
