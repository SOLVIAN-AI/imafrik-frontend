import type { Metadata } from "next";

import { Segmented } from "@/components/admin/control-ui";
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
/** États proposés à l'équipe IMAFRIK, dans l'ordre du filtre. */
const ADMIN_STATES = ["all", "draft", "signed", "delivered"] as const;
type AdminState = (typeof ADMIN_STATES)[number];

/** Statuts d'examen de chaque filtre. Un brouillon est un examen en cours. */
const STATUSES: Record<
  AdminState | "signed-or-delivered",
  ("in_progress" | "reported" | "delivered")[]
> = {
  all: ["in_progress", "reported", "delivered"],
  draft: ["in_progress"],
  signed: ["reported"],
  delivered: ["delivered"],
  "signed-or-delivered": ["reported", "delivered"],
};

/** Filtre demandé par l'adresse ; tous les comptes-rendus à défaut. */
function readState(value: string | string[] | undefined): AdminState {
  return ADMIN_STATES.find((state) => state === value) ?? "all";
}

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
  const admin = session.active.role === "platform_admin";
  // L'équipe IMAFRIK voit aussi les comptes-rendus en cours de rédaction,
  // et filtre par état (`?etat=`) ; les autres, les seuls documents signés.
  const state = admin ? readState(params.etat) : "signed-or-delivered";
  const { studies, total, nextCursor } = await listStudyPageAt(
    {
      status: STATUSES[state],
      mine: session.active.role === "radiologist",
      search,
      limit: STUDY_LIST_PAGE_SIZE,
      cursor: readCursor(params),
    },
    pageHref("/comptes-rendus", params, null),
  );
  const { t } = await getMessages();
  const labels = t.clinic.reports;
  return (
    <ReportsView
      studies={studies}
      search={search}
      total={total}
      filter={
        admin ? (
          <Segmented
            label={labels.filter}
            options={ADMIN_STATES.map((option) => ({
              label: labels.filters[option],
              href:
                option === "all"
                  ? "/comptes-rendus"
                  : `/comptes-rendus?etat=${option}`,
              active: state === option,
            }))}
          />
        ) : undefined
      }
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
