import type { Metadata } from "next";

import { ReportsView } from "@/components/domain/reports-view";
import { listStudies } from "@/lib/data/studies";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.reports.title };
}

/**
 * Comptes-rendus signés.
 *
 * La liste part des examens rendus ou livrés : c'est l'examen qui porte
 * le contexte — patient, modalité, établissement — et le service le
 * renvoie avec le résumé de son compte-rendu, en un seul appel.
 *
 * Pour un radiologue, seulement ceux qu'il a signés (`mine`) : l'écran
 * l'annonce, et la liste montrait jusqu'ici tout le pool.
 */
export default async function ReportsPage() {
  const session = await requireSession(["clinic_staff", "radiologist"]);
  const studies = await listStudies({
    status: ["reported", "delivered"],
    mine: session.active.role === "radiologist",
  });
  return <ReportsView studies={studies} />;
}
