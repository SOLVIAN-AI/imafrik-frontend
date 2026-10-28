import { StudySheetScreen } from "@/components/clinic-screens/study-sheet-screen";
import { requireConsultation } from "@/lib/data/clinic-view";

/** Fiche d'un examen d'une clinique, consultée par l'équipe IMAFRIK. */
export default async function ClinicViewStudyPage({
  params,
}: PageProps<"/admin/vue-clinique/[clinicId]/examens/[studyId]">) {
  const { clinicId, studyId } = await params;
  const consultation = await requireConsultation(clinicId);
  return <StudySheetScreen consultation={consultation} studyId={studyId} />;
}
