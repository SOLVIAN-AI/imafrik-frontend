import type { Metadata } from "next";

import { DashboardScreen } from "@/components/clinic-screens/dashboard-screen";
import { requireConsultation } from "@/lib/data/clinic-view";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.dashboard.title };
}

/** Tableau de bord d'une clinique, consulté par l'équipe IMAFRIK. */
export default async function ClinicViewDashboardPage({
  params,
}: PageProps<"/admin/vue-clinique/[clinicId]/tableau-de-bord">) {
  const consultation = await requireConsultation((await params).clinicId);
  return <DashboardScreen consultation={consultation} />;
}
