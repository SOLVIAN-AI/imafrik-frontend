"use client";

import { useRouter } from "next/navigation";

import { WorklistTable } from "@/components/domain/worklist-table";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { DEMO_STUDIES } from "@/lib/demo/studies";

/**
 * Les examens pris en charge par le radiologue.
 *
 * Distinct de la file commune : ici il n'y a rien à choisir, seulement à
 * finir. Ce sont les examens sur lesquels le radiologue s'est engagé en
 * les réclamant — `claim_study()` en base — et qui bloquent le reste du
 * pool tant qu'ils ne sont ni rendus ni relâchés.
 *
 * C'est pourquoi cet écran existe séparément : un examen réclamé puis
 * oublié dans un onglet fermé serait invisible partout ailleurs.
 */
export default function MyStudiesPage() {
  const router = useRouter();

  // Le jeu de démonstration attribue « Dr Adjo » à l'utilisateur courant.
  const mine = DEMO_STUDIES.filter(
    (study) =>
      study.assignedTo === "Dr Adjo" &&
      study.status !== "delivered" &&
      study.status !== "reported",
  );

  return (
    <>
      <PageHeader
        title="Mes examens"
        description="Examens que vous avez pris en charge et qui restent à rendre"
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <WorklistTable
            studies={mine}
            onOpen={(study) => router.push(`/lecture/${study.id}`)}
          />
        </Panel>
      </div>
    </>
  );
}
