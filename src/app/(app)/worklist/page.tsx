import type { Metadata } from "next";

import { WorklistView } from "@/components/domain/worklist-view";
import { listStudies } from "@/lib/data/studies";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "À lire" };

/**
 * File de travail commune.
 *
 * **Lue côté serveur.** L'appel part avec le jeton de l'utilisateur, et
 * ce sont les politiques RLS qui décident des lignes renvoyées : un
 * radiologue voit les examens des établissements que son groupe sert, ou
 * de la clinique qui l'emploie. Filtrer côté client donnerait l'illusion
 * que c'est l'interface qui protège.
 *
 * La file ne contient que ce qui reste à lire ; les examens rendus vivent
 * dans « Comptes-rendus ». La recherche, qui porte un nom de patient, est
 * relue d'un cookie lié au compte — jamais de l'adresse — et transmise au
 * service ; le filtre des urgences, porté par l'adresse, s'applique ici à
 * sa réponse.
 */
export default async function WorklistPage({
  searchParams,
}: PageProps<"/worklist">) {
  const session = await requireSession(["radiologist"]);
  const { urgent } = await searchParams;
  const search = await readListSearch("worklist", session);
  const urgentOnly = urgent === "1";

  const studies = await listStudies({
    status: ["received", "assigned", "in_progress"],
    search,
  });

  return (
    <WorklistView
      studies={urgentOnly ? studies.filter((study) => study.urgent) : studies}
      search={search}
      filtered={Boolean(search) || urgentOnly}
    />
  );
}
