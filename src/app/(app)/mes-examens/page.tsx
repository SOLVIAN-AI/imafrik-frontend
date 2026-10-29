import type { Metadata } from "next";

import type { StudyStatus } from "@/components/domain/study-status";
import { getMessages } from "@/i18n/server";
import { ListPagination } from "@/components/domain/list-pagination";
import { MyStudiesView } from "@/components/domain/my-studies-view";
import type { ModalityGroup } from "@/lib/api/contracts";
import {
  getClinicCounts,
  getModalityCounts,
  listStudyPageAt,
  STUDY_LIST_PAGE_SIZE,
} from "@/lib/data/studies";
import type { BarDimension } from "@/lib/filters/dimensions";
import { LIST_FILTERS } from "@/lib/filters/screens";
import {
  clinicDimension,
  modalityDimension,
  studyQuery,
} from "@/lib/filters/studies";
import { readFilters } from "@/lib/filters/url";
import { pageHref, readCursor } from "@/lib/pagination";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";

/** Titre de l'onglet, dans la langue de l'utilisateur. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.myStudies };
}

/** Pris en charge, pas encore rendu. */
const TAKEN: StudyStatus[] = ["assigned", "in_progress"];

/**
 * Les examens pris en charge par le radiologue.
 *
 * Distinct de la file « À lire » : ici il n’y a rien à choisir, seulement à
 * finir. Ce sont les examens sur lesquels le radiologue s'est engagé en
 * les prenant en charge, et qui restent réservés tant qu'ils ne sont ni
 * signés ni rendus. Un examen pris puis oublié dans un onglet
 * fermé serait invisible partout ailleurs : ils sont donc tous listés,
 * dans l'ordre des échéances, page par page. La prise en charge les fait
 * passer à « en cours » ; « attribué » est demandé aussi, par prudence,
 * bien qu'aucun chemin ne pose plus cet état.
 *
 * Le filtre « les miens » est appliqué par le service (`?mine=true`), sur
 * l'identifiant du radiologue. L'écran comparait auparavant des noms, et
 * affichait **tous** les examens du pool quand la comparaison échouait.
 *
 * Il se filtre comme toute liste d'examens, par la barre commune :
 * clinique, groupe de modalités, urgences, chaque option comptée par le
 * service parmi les examens pris ; la recherche, qui porte un nom de
 * patient, est relue d'un cookie lié au compte.
 */
export default async function MyStudiesPage({
  searchParams,
}: PageProps<"/mes-examens">) {
  const session = await requireSession(["radiologist"]);
  const params = await searchParams;
  const keys = LIST_FILTERS["mes-examens"];
  const search = await readListSearch("mes-examens", session);
  const draft = readFilters(params, keys);
  const base = {
    status: TAKEN,
    mine: true,
    search,
    ...(draft.urgency && { priority: "urgent" as const }),
  };
  const clinicCounts = await getClinicCounts({
    ...base,
    modalityGroup: draft.modality as ModalityGroup | undefined,
  });
  const filters = readFilters(params, keys, {
    clinic: clinicCounts.clinics.map((row) => row.id),
  });
  const [{ studies, total, nextCursor }, modalityCounts] = await Promise.all([
    listStudyPageAt(
      {
        ...base,
        ...studyQuery(filters),
        order: "deadline",
        limit: STUDY_LIST_PAGE_SIZE,
        cursor: readCursor(params),
      },
      pageHref("/mes-examens", params, null),
    ),
    getModalityCounts({ ...base, clinic: filters.clinic }),
  ]);
  const bar: BarDimension[] = [
    clinicDimension(clinicCounts),
    modalityDimension(modalityCounts),
    { key: "urgency" },
  ];
  return (
    <MyStudiesView
      studies={studies}
      bar={bar}
      filters={filters}
      search={search}
      total={total}
      footer={
        <ListPagination
          pathname="/mes-examens"
          params={params}
          shown={studies.length}
          total={total}
          nextCursor={nextCursor}
        />
      }
    />
  );
}
