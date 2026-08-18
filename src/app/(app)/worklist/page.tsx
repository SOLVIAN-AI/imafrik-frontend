import type { Metadata } from "next";

import { WorklistView } from "@/components/domain/worklist-view";
import { listStudies } from "@/lib/data/studies";

export const metadata: Metadata = { title: "À lire" };

/**
 * File de travail commune.
 *
 * **Lue côté serveur.** L'appel part avec le jeton de l'utilisateur, et
 * ce sont les politiques RLS qui décident des lignes renvoyées : une
 * clinique ne voit que ses examens, un radiologue ceux des
 * établissements que son cabinet sert. Filtrer côté client donnerait
 * l'illusion que c'est l'interface qui protège.
 *
 * La vue reste un composant client : elle porte la navigation au clavier
 * et les durées qui se rafraîchissent.
 */
export default async function WorklistPage() {
  const studies = await listStudies();
  return <WorklistView studies={studies} />;
}
