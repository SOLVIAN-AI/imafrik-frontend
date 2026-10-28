import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StudiesScreen } from "@/components/clinic-screens/studies-screen";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.studies.title };
}

/**
 * Les examens de la clinique, pour son responsable.
 *
 * L'adresse est aussi celle des liens reçus par courriel : l'équipe
 * IMAFRIK et le radiologue y sont renvoyés vers leurs propres écrans.
 */
export default async function StudiesPage({
  searchParams,
}: PageProps<"/examens">) {
  const session = await requireSession([
    "clinic_staff",
    "radiologist",
    "platform_admin",
  ]);
  // L'équipe IMAFRIK a sa liste, toutes cliniques confondues ; elle voit
  // celle d'une clinique dans la vue des cliniques.
  if (session.active.role === "platform_admin") redirect("/admin/examens");
  // Un radiologue ne voit que ce qu'on lui confie : sa file en tient lieu.
  if (session.active.role === "radiologist") redirect("/worklist");
  return <StudiesScreen consultation={null} params={await searchParams} />;
}
