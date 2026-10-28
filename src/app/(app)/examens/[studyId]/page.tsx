import { redirect } from "next/navigation";

import { StudySheetScreen } from "@/components/clinic-screens/study-sheet-screen";
import { requireSession } from "@/lib/session/server";

/**
 * Fiche d'un examen, pour le responsable de la clinique.
 *
 * Le radiologue ne la voit plus : il ne consulte que ce qu'on lui confie,
 * dans son poste de travail (`/lecture/[id]`), où il est renvoyé ; ici on
 * suit, là on rédige.
 */
export default async function StudySheetPage({
  params,
}: PageProps<"/examens/[studyId]">) {
  const session = await requireSession([
    "clinic_staff",
    "radiologist",
    "platform_admin",
  ]);
  const { studyId } = await params;
  // L'équipe IMAFRIK contrôle l'examen dans l'écran de lecture, qui montre
  // tout : images, renseignement, compte-rendu même en cours, attribution
  // et annulation. La fiche de la clinique, elle la voit dans la vue des
  // cliniques. Le radiologue aussi : il ne consulte que ce qu'on lui
  // confie, et le lit dans son poste de travail.
  if (session.active.role !== "clinic_staff") {
    redirect(`/lecture/${encodeURIComponent(studyId)}`);
  }
  return <StudySheetScreen consultation={null} studyId={studyId} />;
}
