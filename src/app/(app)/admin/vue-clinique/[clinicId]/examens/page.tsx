import type { Metadata } from "next";

import { StudiesScreen } from "@/components/clinic-screens/studies-screen";
import { requireConsultation } from "@/lib/data/clinic-view";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.studies.title };
}

/** Les examens d'une clinique, consultés par l'équipe IMAFRIK. */
export default async function ClinicViewStudiesPage({
  params,
  searchParams,
}: PageProps<"/admin/vue-clinique/[clinicId]/examens">) {
  const consultation = await requireConsultation((await params).clinicId);
  return (
    <StudiesScreen consultation={consultation} params={await searchParams} />
  );
}
