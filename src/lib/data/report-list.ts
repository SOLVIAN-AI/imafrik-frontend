import "server-only";

import type { AppMessages } from "@/i18n";
import { loadStudyFilters } from "@/lib/data/study-filters";
import {
  listStudyPageAt,
  STUDY_LIST_PAGE_SIZE,
  type StudyPage,
} from "@/lib/data/studies";
import type {
  ActiveFilters,
  BarDimension,
  StudyState,
} from "@/lib/filters/dimensions";
import {
  REPORT_LISTS,
  type ReportList,
  type ReportReader,
} from "@/lib/filters/reports";
import { facetDimensions, stateStatuses } from "@/lib/filters/studies";
import {
  pageHref,
  readCursor,
  type SearchParamsRecord,
} from "@/lib/pagination";

/** Une page de comptes-rendus, ses filtres et sa barre. */
export interface ReportListPage extends StudyPage {
  filters: ActiveFilters;
  bar: BarDimension[];
}

/**
 * Une page de la liste des comptes-rendus d'un rôle, filtrée et comptée
 * par le service, triée par date de signature (les derniers d'abord).
 *
 * @param reader   Qui lit : responsable, radiologue ou équipe IMAFRIK.
 * @param params   Paramètres de l'adresse.
 * @param search   Recherche, relue du cookie lié au compte.
 * @param pathname Adresse de la liste.
 * @param t        Textes de l'écran, pour nommer les états.
 * @param clinicId Clinique consultée par l'équipe IMAFRIK.
 */
export async function loadReportList({
  reader,
  params,
  search,
  pathname,
  t,
  clinicId,
}: {
  reader: ReportReader;
  params: SearchParamsRecord;
  search?: string;
  pathname: string;
  t: AppMessages;
  clinicId?: string;
}): Promise<ReportListPage> {
  const list: ReportList = REPORT_LISTS[reader];
  const { filters, counts, query } = await loadStudyFilters({
    params,
    keys: list.keys,
    base: {
      search,
      status: [...list.statuses],
      ...(reader === "radiologist" && { mine: true }),
    },
    // Un état ne montre que ce que la liste peut montrer : « en cours de
    // rédaction », pour l'équipe, ce sont les examens commencés.
    adjust: (next, chosen) => ({
      ...next,
      status: stateStatuses(chosen.state, list.statuses),
    }),
    clinicId,
  });
  const page = await listStudyPageAt(
    {
      ...query,
      order: "signed",
      limit: STUDY_LIST_PAGE_SIZE,
      cursor: readCursor(params),
    },
    pageHref(pathname, params, null),
    clinicId,
  );
  const names = t.clinic.reports.filters;
  const labels: Partial<Record<StudyState, string>> =
    reader === "clinic"
      ? { ready: names.toDownload, delivered: names.downloaded }
      : {
          reading: names.draft,
          ready: names.signed,
          delivered: names.delivered,
        };
  const bar = facetDimensions(list.keys, counts, {
    ...(list.states && {
      states: { values: list.states, statuses: list.statuses, labels },
    }),
  });
  return { ...page, filters, bar };
}
