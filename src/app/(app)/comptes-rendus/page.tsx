import type { Metadata } from "next";

import { ReportsView, type ReportRow } from "@/components/domain/reports-view";
import { getReportForStudy } from "@/lib/data/reports";
import { listStudies } from "@/lib/data/studies";

export const metadata: Metadata = { title: "Comptes-rendus" };

/**
 * Comptes-rendus signés.
 *
 * La liste part des examens rendus ou livrés, puis résout leur
 * compte-rendu : c'est l'examen qui porte le contexte — patient,
 * modalité, établissement — et un compte-rendu sans ce contexte ne veut
 * rien dire.
 *
 * La recherche reste côté client tant que la liste tient en une page ;
 * elle passera au serveur avec la pagination.
 */
export default async function ReportsPage() {
  const studies = await listStudies({ status: ["reported", "delivered"] });

  const rows = (
    await Promise.all(
      studies.map(async (study) => {
        const report = await getReportForStudy(study.id);
        return report ? ({ report, study } satisfies ReportRow) : null;
      }),
    )
  ).filter((row): row is ReportRow => row !== null);

  return <ReportsView rows={rows} />;
}
