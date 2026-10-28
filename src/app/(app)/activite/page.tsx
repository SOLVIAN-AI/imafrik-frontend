import type { Metadata } from "next";

import { ActivityScreen } from "@/components/clinic-screens/activity-screen";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.activity.title };
}

/**
 * Activité et facturation de la clinique, pour son responsable : un
 * radiologue de la clinique n'a pas accès à cet écran.
 */
export default async function ActivityPage({
  searchParams,
}: PageProps<"/activite">) {
  await requireSession(["clinic_staff"]);
  return <ActivityScreen consultation={null} params={await searchParams} />;
}
