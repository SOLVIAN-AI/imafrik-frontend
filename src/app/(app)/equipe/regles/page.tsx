import type { Metadata } from "next";

import { TeamRulesScreen } from "@/components/clinic-screens/team-rules-screen";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.assignment.plan.title };
}

/** Règles d'attribution de la clinique, réglées par son responsable. */
export default async function AssignmentRulesPage() {
  await requireSession(["clinic_staff"]);
  return <TeamRulesScreen consultation={null} />;
}
