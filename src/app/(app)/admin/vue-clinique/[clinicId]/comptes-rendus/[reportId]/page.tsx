import { ReportScreen } from "@/components/clinic-screens/report-screen";
import { requireConsultation } from "@/lib/data/clinic-view";

/** Un compte-rendu signé d'une clinique, consulté par l'équipe IMAFRIK. */
export default async function ClinicViewReportPage({
  params,
}: PageProps<"/admin/vue-clinique/[clinicId]/comptes-rendus/[reportId]">) {
  const { clinicId, reportId } = await params;
  const consultation = await requireConsultation(clinicId);
  return <ReportScreen consultation={consultation} reportId={reportId} />;
}
