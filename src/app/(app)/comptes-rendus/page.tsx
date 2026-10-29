import type { Metadata } from "next";

import { ListPagination } from "@/components/domain/list-pagination";
import { ReportsView } from "@/components/domain/reports-view";
import { loadReportList } from "@/lib/data/report-list";
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
 * Chaque rôle a sa liste (`lib/filters/reports.ts`) et ses filtres, sur la
 * barre commune, comptés par le service :
 *
 * - **le responsable** : signataire, modalité, « À télécharger » ou
 *   « Téléchargés », urgence, période ;
 * - **le radiologue** : seulement ceux qu'il a signés (`mine`), par
 *   clinique, modalité, urgence, période ;
 * - **l'équipe IMAFRIK** : tous, en cours de rédaction compris, par
 *   clinique, radiologue, modalité, état, urgence, période. L'ancienne
 *   adresse `?etat=draft|signed|delivered` reste lue.
 *
 * Triée par date de signature, les derniers d'abord : la liste affiche
 * cette date, elle était triée par réception. Recherche et pagination
 * sont faites par le service, sur tout le périmètre.
 */
export default async function ReportsPage({
  searchParams,
}: PageProps<"/comptes-rendus">) {
  const session = await requireSession([
    "clinic_staff",
    "radiologist",
    "platform_admin",
  ]);
  const search = await readListSearch("comptes-rendus", session);
  const params = await searchParams;
  const { t } = await getMessages();
  const reader =
    session.active.role === "platform_admin"
      ? "team"
      : session.active.role === "clinic_staff"
        ? "clinic"
        : "radiologist";
  const { studies, total, nextCursor, filters, bar } = await loadReportList({
    reader,
    params,
    search,
    pathname: "/comptes-rendus",
    t,
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
