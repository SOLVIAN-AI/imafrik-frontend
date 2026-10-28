import type { Metadata } from "next";

import { TeamScreen } from "@/components/clinic-screens/team-screen";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.team.title };
}

/** L'équipe de la clinique, gérée par son responsable. */
export default async function TeamPage() {
  await requireSession(["clinic_staff"]);
  return <TeamScreen consultation={null} />;
}
