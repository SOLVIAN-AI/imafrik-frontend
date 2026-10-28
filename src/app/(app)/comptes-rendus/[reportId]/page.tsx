import { ReportScreen } from "@/components/clinic-screens/report-screen";
import { requireSession } from "@/lib/session/server";

/** Un compte-rendu signé, pour la clinique, le radiologue et l'équipe IMAFRIK. */
export default async function ReportPage({
  params,
}: PageProps<"/comptes-rendus/[reportId]">) {
  await requireSession(["clinic_staff", "radiologist", "platform_admin"]);
  const { reportId } = await params;
  return <ReportScreen consultation={null} reportId={reportId} />;
}
