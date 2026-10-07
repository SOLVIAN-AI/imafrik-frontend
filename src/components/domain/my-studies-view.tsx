"use client";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { ReadingTable } from "@/components/domain/reading-table";
import type { Study } from "@/lib/data/studies";

/**
 * Vue des examens pris en charge.
 *
 * Même tableau que la file de lecture : ce sont les mêmes colonnes qu'on
 * y cherche, échéance en tête, et un second tableau au dessin différent
 * obligerait à réapprendre où regarder.
 */
export function MyStudiesView({ studies }: { studies: Study[] }) {
  return (
    // Même défilement que la file : la page sur téléphone, le tableau au-delà.
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
      <PageHeader
        title="Mes examens"
        description="Examens que vous avez pris en charge et qui restent à rendre"
      />

      {/* Compressible à partir de 1024 px seulement : sur téléphone, la
          page défile et le tableau garde sa hauteur naturelle. */}
      <div className="flex flex-col px-4 pb-6 sm:px-6 lg:min-h-0 lg:flex-1">
        <Panel className="flex flex-col overflow-hidden lg:min-h-0">
          <ReadingTable
            groups={[{ key: "mine", studies, follow: "status" }]}
            hrefFor={(study) => `/lecture/${study.id}`}
            empty={{
              title: "Aucun examen en cours",
              detail: "Prenez un examen en charge depuis la file « À lire ».",
            }}
          />
        </Panel>
      </div>
    </div>
  );
}
