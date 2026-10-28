import type { Metadata } from "next";

import { ActivityScreen } from "@/components/clinic-screens/activity-screen";
import { requireConsultation } from "@/lib/data/clinic-view";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.activity.title };
}

/** Activité et facturation d'une clinique, consultées par l'équipe IMAFRIK. */
export default async function ClinicViewActivityPage({
  params,
  searchParams,
}: PageProps<"/admin/vue-clinique/[clinicId]/activite">) {
  const consultation = await requireConsultation((await params).clinicId);
  return (
    <ActivityScreen consultation={consultation} params={await searchParams} />
  );
}
