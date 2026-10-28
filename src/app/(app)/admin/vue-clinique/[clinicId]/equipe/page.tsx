import type { Metadata } from "next";

import { TeamScreen } from "@/components/clinic-screens/team-screen";
import { requireConsultation } from "@/lib/data/clinic-view";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.team.title };
}

/** L'équipe d'une clinique, consultée par l'équipe IMAFRIK. */
export default async function ClinicViewTeamPage({
  params,
}: PageProps<"/admin/vue-clinique/[clinicId]/equipe">) {
  const consultation = await requireConsultation((await params).clinicId);
  return <TeamScreen consultation={consultation} />;
}
