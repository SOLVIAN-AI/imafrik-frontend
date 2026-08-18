import type { Metadata } from "next";

import { StudyList } from "@/components/domain/study-list";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { ClinicStudiesActions } from "@/components/domain/clinic-studies-actions";
import { getReportForStudy } from "@/lib/data/reports";
import { listStudies } from "@/lib/data/studies";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Examens" };

/**
 * Tous les examens envoyés par la clinique.
 *
 * Écran de suivi : on y vient pour retrouver un dossier précis, pas pour
 * découvrir ce qui est arrivé — c'est le rôle du tableau de bord. D'où
 * la recherche et les filtres en tête, et l'absence de bandeau de
 * mesures.
 *
 * L'état du compte-rendu est résolu en parallèle pour toutes les
 * lignes : en série, une liste de quarante examens ferait quarante
 * allers-retours l'un après l'autre.
 */
export default async function ClinicStudiesPage() {
  const [studies, session] = await Promise.all([listStudies(), getSession()]);

  const withReports = await Promise.all(
    studies.map(async (study) => ({
      ...study,
      reportId: (await getReportForStudy(study.id))?.id,
    })),
  );

  return (
    <>
      <PageHeader
        title="Examens"
        description={`${withReports.length} examens envoyés · ${session?.active.organizationName ?? ""}`}
        actions={<ClinicStudiesActions />}
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <StudyList studies={withReports} />
        </Panel>
      </div>
    </>
  );
}
