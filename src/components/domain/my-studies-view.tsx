"use client";

import type * as React from "react";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { CredentialsBanner } from "@/components/domain/credentials-banner";
import { ReadingTable } from "@/components/domain/reading-table";
import { useMessages } from "@/i18n/client";
import type { Study } from "@/lib/data/studies";

/**
 * Vue des examens pris en charge.
 *
 * Même tableau que la file de lecture : ce sont les mêmes colonnes qu'on
 * y cherche, échéance en tête, et un second tableau au dessin différent
 * obligerait à réapprendre où regarder.
 *
 * @param studies Examens pris en charge, page courante.
 * @param footer  Pied de liste : pagination, rendue par la page serveur.
 */
export function MyStudiesView({
  studies,
  footer,
}: {
  studies: Study[];
  footer?: React.ReactNode;
}) {
  const t = useMessages();
  return (
    // Même défilement que la file : la page sur téléphone, le tableau au-delà.
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
      <PageHeader
        title={t.nav.items.myStudies}
        description={t.worklist.myStudies.description}
      />
      <CredentialsBanner className="mx-4 mb-4 sm:mx-6" />

      {/* Compressible à partir de 1024 px seulement : sur téléphone, la
          page défile et le tableau garde sa hauteur naturelle. */}
      <div className="flex flex-col px-4 pb-6 sm:px-6 lg:min-h-0 lg:flex-1">
        <Panel className="flex flex-col overflow-hidden lg:min-h-0">
          <ReadingTable
            groups={[{ key: "mine", studies, follow: "status" }]}
            hrefFor={(study) => `/lecture/${study.id}`}
            empty={t.worklist.myStudies.empty}
          />
          {footer}
        </Panel>
      </div>
    </div>
  );
}
