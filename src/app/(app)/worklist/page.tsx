import type { Metadata } from "next";
import { cache } from "react";

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

/**
 * File de lecture ouverte : ce qui reste à rendre, par échéance.
 *
 * Mise en cache le temps d'une requête (`cache` de React) : la page et ses
 * métadonnées la lisent toutes deux, l'API n'est appelée qu'une fois.
 *
 * @param search Recherche en cours, relue du cookie lié au compte.
 */
const loadQueue = cache((search: string | undefined) =>
  listStudyPage({
    status: ["received", "assigned", "in_progress"],
    search,
    order: "deadline",
    limit: STUDY_PAGE_LIMIT,
  }),
);

/**
 * Titre de l'onglet : « (2) À lire » quand des urgences attendent qu'on
 * les prenne, pour qu'un radiologue les voie arriver depuis un autre
 * onglet ou depuis le viewer.
 *
 * Calculé ici plutôt que dans le navigateur : Next écrit lui-même le titre
 * d'après les métadonnées, après l'hydratation et à chaque actualisation de
 * la file ; un compte posé à la main dans `document.title` disparaissait
 * aussitôt. Même filtre que l'écran : les urgences libres visibles.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<"/worklist">): Promise<Metadata> {
  const { t } = await getMessages();
  const session = await requireSession(["radiologist"]);
  const filters = parseFilters(await searchParams);
  const search = await readListSearch("worklist", session);
  const { studies } = await loadQueue(search);
  const urgent = splitWorklist(
    applyFilters(studies, filters),
    session.user.id,
  ).open.filter((study) => study.urgent).length;
  const title = t.nav.items.worklist;
  return { title: urgent > 0 ? `(${urgent}) ${title}` : title };
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

  const { studies, total } = await loadQueue(search);

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
