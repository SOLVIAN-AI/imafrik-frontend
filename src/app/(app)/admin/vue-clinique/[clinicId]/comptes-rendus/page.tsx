import type { Metadata } from "next";

import { ListPagination } from "@/components/domain/list-pagination";
import { ReportsView } from "@/components/domain/reports-view";
import { clinicViewPath } from "@/lib/clinic-view";
import { requireConsultation } from "@/lib/data/clinic-view";
import { loadReportList } from "@/lib/data/report-list";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.reports.title };
}

/**
 * Les comptes-rendus signés d'une clinique, consultés par l'équipe
 * IMAFRIK : la liste de son responsable (signés ou remis), lue par la vue
 * de la clinique, avec sa recherche, ses filtres et sa pagination.
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
  const { t } = await getMessages();
  const { studies, total, nextCursor, filters, bar } = await loadReportList({
    reader: "clinic",
    params: query,
    search,
    pathname,
    t,
    clinicId: consultation.clinicId,
  });
  return (
    <ReportsView
      studies={studies}
      search={search}
      total={total}
      bar={bar}
      filters={filters}
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
