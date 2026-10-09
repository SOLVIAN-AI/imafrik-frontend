import type { Metadata } from "next";

import { ListPagination } from "@/components/domain/list-pagination";
import { ReportsView } from "@/components/domain/reports-view";
import { listStudyPageAt, STUDY_LIST_PAGE_SIZE } from "@/lib/data/studies";
import { pageHref, readCursor } from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.reports.title };
}

/**
 * Comptes-rendus signés.
 *
 * La liste part des examens rendus ou livrés : c'est l'examen qui porte
 * le contexte (patient, modalité, établissement), et le service le
 * renvoie avec le résumé de son compte-rendu, en un seul appel.
 *
 * Pour un radiologue, seulement ceux qu'il a signés (`mine`) : l'écran
 * l'annonce.
 *
 * Recherche et pagination sont faites par le service, sur tout le
 * périmètre : la liste s'arrêtait auparavant aux deux cents premiers
 * documents, et la recherche ne portait que sur eux.
 */
export default async function ReportsPage({
  searchParams,
}: PageProps<"/comptes-rendus">) {
  const session = await requireSession(["clinic_staff", "radiologist"]);
  const search = await readListSearch("comptes-rendus", session);
  const params = await searchParams;
  const { studies, total, nextCursor } = await listStudyPageAt(
    {
      status: ["reported", "delivered"],
      mine: session.active.role === "radiologist",
      search,
      limit: STUDY_LIST_PAGE_SIZE,
      cursor: readCursor(params),
    },
    pageHref("/comptes-rendus", params, null),
  );
  return (
    <ReportsView
      studies={studies}
      search={search}
      footer={
        <ListPagination
          pathname="/comptes-rendus"
          params={params}
          shown={studies.length}
          total={total}
          nextCursor={nextCursor}
        />
      }
    />
  );
}
