import { ClinicDashboardView } from "@/components/domain/clinic-dashboard-view";
import type { ClinicConsultation } from "@/lib/clinic-view";
import { getClinicMetrics, getMetrics } from "@/lib/data/metrics";
import { listStudies } from "@/lib/data/studies";

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
 * Pour le responsable, aucun filtre d'établissement n'est passé : RLS ne
 * renvoie déjà que les examens de l'organisation active. Pour l'équipe
 * IMAFRIK qui consulte la clinique, les lectures la nomment et reprennent
 * le même calcul.
 *
 * @param consultation Clinique consultée par l'équipe IMAFRIK ; `null`
 *                     pour son responsable.
 */
export async function DashboardScreen({
  consultation,
}: {
  consultation: ClinicConsultation | null;
}) {
  const clinicId = consultation?.clinicId;
  const [studies, metrics, toDownload] = await Promise.all([
    // Les derniers envois, dans l'ordre d'arrivée : une urgence ancienne
    // ne doit pas masquer l'examen reçu à l'instant.
    listStudies({ order: "received", limit: 5 }, clinicId),
    clinicId ? getClinicMetrics(clinicId) : getMetrics(),
    listStudies({ status: ["reported"], limit: 10 }, clinicId),
  ]);
  return (
    <ClinicDashboardView
      recent={studies}
      ready={toDownload}
      metrics={metrics}
    />
  );
}
