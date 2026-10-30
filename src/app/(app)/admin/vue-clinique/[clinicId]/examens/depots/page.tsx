import type { Metadata } from "next";

import { DepositsScreen } from "@/components/deposits/deposits-screen";
import { requireConsultation } from "@/lib/data/clinic-view";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.deposits.metaTitle };
}

/**
 * Dépôts d'une clinique, dans la vue de l'équipe IMAFRIK : ses archives
 * ZIP, et le dépôt d'une archive en son nom, par les routes de l'équipe
 * (jeton émis pour cette clinique, tracé au journal d'audit avec la
 * mention de l'équipe). La clinique est celle de l'adresse : ni choix, ni
 * autre clinique dans la liste.
 */
export default async function ClinicViewDepositsPage({
  params,
  searchParams,
}: PageProps<"/admin/vue-clinique/[clinicId]/examens/depots">) {
  const consultation = await requireConsultation((await params).clinicId);
  return (
    <DepositsScreen
      team
      consultation={consultation}
      params={await searchParams}
    />
  );
}
