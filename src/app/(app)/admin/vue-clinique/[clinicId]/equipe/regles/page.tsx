import type { Metadata } from "next";

import { TeamRulesScreen } from "@/components/clinic-screens/team-rules-screen";
import { requireConsultation } from "@/lib/data/clinic-view";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.assignment.plan.title };
}

/** Règles d'attribution d'une clinique, dans la vue de l'équipe IMAFRIK. */
export default async function ClinicViewRulesPage({
  params,
}: PageProps<"/admin/vue-clinique/[clinicId]/equipe/regles">) {
  const consultation = await requireConsultation((await params).clinicId);
  return <TeamRulesScreen consultation={consultation} />;
}
