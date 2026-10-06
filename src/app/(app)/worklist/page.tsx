import type { Metadata } from "next";

import { WorklistView } from "@/components/domain/worklist-view";
import { listStudies } from "@/lib/data/studies";
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
 * dans « Comptes-rendus ». Recherche et filtre des urgences sont portés
 * par l'adresse : la recherche est transmise au service, le filtre des
 * urgences s'applique ici à sa réponse.
 */
export default async function WorklistPage({
  searchParams,
}: PageProps<"/worklist">) {
  await requireSession(["radiologist"]);
  const { q, urgent } = await searchParams;
  const search = typeof q === "string" ? q : undefined;
  const urgentOnly = urgent === "1";

  const studies = await listStudies({
    status: ["received", "assigned", "in_progress"],
    search,
  });

  return (
    <WorklistView
      studies={urgentOnly ? studies.filter((study) => study.urgent) : studies}
      filtered={Boolean(search) || urgentOnly}
    />
  );
}
