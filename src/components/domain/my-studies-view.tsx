"use client";

import { useRouter } from "next/navigation";

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
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Mes examens"
        description="Examens que vous avez pris en charge et qui restent à rendre"
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <WorklistTable
            studies={studies}
            onOpen={(study) => router.push(`/lecture/${study.id}`)}
          />
        </Panel>
      </div>
    </>
  );
}
