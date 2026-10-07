import type { Metadata } from "next";

import { getMessages } from "@/i18n/server";
import { WorklistView } from "@/components/domain/worklist-view";
import { listStudyPage, STUDY_PAGE_LIMIT } from "@/lib/data/studies";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import {
  applyFilters,
  filterOptions,
  parseFilters,
  splitWorklist,
} from "@/lib/worklist";

/** Titre de l'onglet, dans la langue de l'utilisateur. */
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.worklist };
}

/**
 * File de lecture du radiologue.
 *
 * **Lue côté serveur.** L'appel part avec le jeton de l'utilisateur, et
 * ce sont les politiques RLS qui décident des lignes renvoyées : un
 * radiologue voit les examens des établissements que son groupe sert, ou
 * de la clinique qui l'emploie.
 *
 * La file ne contient que ce qui reste à rendre, dans l'ordre des
 * échéances promises (`order=deadline`). La recherche, qui porte un nom de
 * patient, est relue d'un cookie lié au compte, jamais de l'adresse, et
 * transmise au service. Les filtres de modalité, de clinique et
 * d'urgence, portés par l'adresse, s'appliquent ici à sa réponse : les
 * options proposées se comptent ainsi sur la file entière.
 */
export default async function WorklistPage({
  searchParams,
}: PageProps<"/worklist">) {
  const session = await requireSession(["radiologist"]);
  const filters = parseFilters(await searchParams);
  const search = await readListSearch("worklist", session);

  const { studies, total } = await listStudyPage({
    status: ["received", "assigned", "in_progress"],
    search,
    order: "deadline",
    limit: STUDY_PAGE_LIMIT,
  });

  return (
    <WorklistView
      sections={splitWorklist(applyFilters(studies, filters), session.user.id)}
      all={studies}
      filters={filters}
      options={filterOptions(studies)}
      search={search}
      truncated={total > studies.length}
    />
  );
}
