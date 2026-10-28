import { redirect } from "next/navigation";

import { clinicViewPath } from "@/lib/clinic-view";

/** La vue d'une clinique s'ouvre sur son tableau de bord. */
export default async function ClinicViewHome({
  params,
}: PageProps<"/admin/vue-clinique/[clinicId]">) {
  const { clinicId } = await params;
  redirect(clinicViewPath(clinicId));
}
