"use client";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { WorklistTable } from "@/components/domain/worklist-table";
import type { Study } from "@/lib/data/studies";

/**
 * Vue des examens pris en charge.
 *
 * Même table que la file commune : ce sont les mêmes colonnes qu'on y
 * cherche, et un second tableau au dessin différent obligerait à
 * réapprendre où regarder.
 */
export function MyStudiesView({ studies }: { studies: Study[] }) {
  return (
    <>
      <PageHeader
        title="Mes examens"
        description="Examens que vous avez pris en charge et qui restent à rendre"
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <WorklistTable
            studies={studies}
            hrefFor={(study) => `/lecture/${study.id}`}
            empty={{
              title: "Aucun examen en cours",
              detail: "Prenez un examen en charge depuis la file « À lire ».",
            }}
          />
        </Panel>
      </div>
    </>
  );
}
