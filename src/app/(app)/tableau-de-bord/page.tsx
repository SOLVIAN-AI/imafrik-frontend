import type { Metadata } from "next";

import { DashboardScreen } from "@/components/clinic-screens/dashboard-screen";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.dashboard.title };
}

/** Tableau de bord de la clinique, pour son responsable. */
export default async function ClinicDashboardPage() {
  await requireSession(["clinic_staff"]);
  return <DashboardScreen consultation={null} />;
}
