import type { Metadata } from "next";

import { ClinicDashboardView } from "@/components/domain/clinic-dashboard-view";
import { getMetrics } from "@/lib/data/metrics";
import { listStudies } from "@/lib/data/studies";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinic.dashboard.title };
}

/**
 * Tableau de bord de la clinique.
 *
 * Il est construit autour d'une seule question : **qu'est-ce qui
 * m'attend ?** D'abord les comptes-rendus prêts, qui appellent une
 * action ; ensuite les derniers envois, qui n'appellent que de la
 * patience.
 *
 * Les indicateurs viennent du service, calculés en base sur les examens
 * de la clinique ; le délai médian n'est plus une valeur écrite en dur.
 * Aucun filtre d'établissement n'est passé : RLS ne renvoie déjà que les
 * examens de l'organisation active.
 */
export default async function ClinicDashboardPage() {
  await requireSession(["clinic_staff"]);
  const [studies, metrics, toDownload] = await Promise.all([
    listStudies({ limit: 5 }),
    getMetrics(),
    listStudies({ status: ["reported"], limit: 10 }),
  ]);
  return (
    <ClinicDashboardView
      recent={studies}
      ready={toDownload}
      metrics={metrics}
    />
  );
}
