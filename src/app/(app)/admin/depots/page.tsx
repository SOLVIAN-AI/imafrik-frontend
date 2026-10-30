import type { Metadata } from "next";

import { DepositsScreen } from "@/components/deposits/deposits-screen";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.deposits.metaTitle };
}

/**
 * Dépôts d'images du réseau, pour l'équipe IMAFRIK : la liste de toutes
 * les cliniques, et le dépôt d'une archive au nom d'une clinique choisie
 * (`?clinique=`), tracé au journal d'audit avec la mention de l'équipe.
 * La vue des cliniques a la même page pour la clinique consultée
 * (`/admin/vue-clinique/{clinique}/examens/depots`).
 */
export default async function TeamDepositsPage({
  searchParams,
}: PageProps<"/admin/depots">) {
  await requireSession(["platform_admin"]);
  return <DepositsScreen team params={await searchParams} />;
}
