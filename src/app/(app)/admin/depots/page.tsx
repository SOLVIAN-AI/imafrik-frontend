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
 * (`?clinique=`, que la vue des cliniques pose d'elle-même), tracé au
 * journal d'audit avec la mention de l'équipe.
 */
export default async function TeamDepositsPage({
  searchParams,
}: PageProps<"/admin/depots">) {
  await requireSession(["platform_admin"]);
  return <DepositsScreen team params={await searchParams} />;
}
