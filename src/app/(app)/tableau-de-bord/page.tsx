import type { Metadata } from "next";

import { ClinicDashboardView } from "@/components/domain/clinic-dashboard-view";
import type { ReportRow } from "@/components/domain/reports-view";
import { getReportForStudy } from "@/lib/data/reports";
import { listStudies } from "@/lib/data/studies";

export const metadata: Metadata = { title: "Tableau de bord" };

/**
 * Tableau de bord de la clinique.
 *
 * Il est construit autour d'une seule question : **qu'est-ce qui
 * m'attend ?** D'où l'ordre — d'abord les comptes-rendus prêts, qui
 * appellent une action ; ensuite les examens en cours, qui n'appellent
 * que de la patience.
 *
 * Aucun filtre d'établissement n'est passé : les politiques RLS ne
 * renvoient déjà que les examens de l'organisation active. Filtrer ici
 * en plus laisserait croire que c'est l'interface qui protège.
 */
export default async function ClinicDashboardPage() {
  const studies = await listStudies();

  const ready = (
    await Promise.all(
      studies
        .filter(
          (study) =>
            study.status === "reported" || study.status === "delivered",
        )
        .map(async (study) => {
          const report = await getReportForStudy(study.id);
          return report ? ({ report, study } satisfies ReportRow) : null;
        }),
    )
  ).filter((row): row is ReportRow => row !== null);

  return <ClinicDashboardView studies={studies} ready={ready} />;
}
