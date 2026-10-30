import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DepositsScreen } from "@/components/deposits/deposits-screen";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.deposits.metaTitle };
}

/**
 * Dépôts d'images, pour le responsable de la clinique : déposer une
 * archive ZIP quand la connexion manque ou que la passerelle est en
 * panne, et suivre « Mes dépôts ». On y vient par « Déposer des images »,
 * entrée de la navigation et bouton d'« Examens », ou depuis « Envoyer un
 * examen ».
 *
 * L'équipe IMAFRIK a sa liste, toutes cliniques confondues, et y dépose
 * au nom d'une clinique ; un radiologue ne dépose pas.
 */
export default async function DepositsPage({
  searchParams,
}: PageProps<"/examens/depots">) {
  const session = await requireSession([
    "clinic_staff",
    "radiologist",
    "platform_admin",
  ]);
  if (session.active.role === "platform_admin") redirect("/admin/depots");
  if (session.active.role === "radiologist") redirect("/worklist");
  return <DepositsScreen team={false} params={await searchParams} />;
}
