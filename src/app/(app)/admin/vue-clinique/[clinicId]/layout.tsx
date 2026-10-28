import { notFound } from "next/navigation";

import { ClinicViewBanner } from "@/components/layout/clinic-view-banner";
import { ClinicViewProvider } from "@/components/providers/clinic-view-provider";
import { openClinicView } from "@/lib/data/clinic-view";
import { requireSession } from "@/lib/session/server";

/**
 * Vue d'une clinique : les écrans de son responsable, ouverts en
 * consultation par l'équipe IMAFRIK.
 *
 * **L'ouverture se trace ici**, une fois : une disposition ne se rend de
 * nouveau qu'à l'entrée dans la vue ou au changement de clinique, pas d'un
 * écran à l'autre de la même clinique. Le service ne retrace pas une
 * réouverture dans le quart d'heure (un rechargement, une action qui
 * rafraîchit la page).
 *
 * Le bandeau reste en tête de chaque écran ; le contexte dit aux
 * composants partagés où mènent leurs liens et au nom de quelle clinique
 * ils s'affichent.
 */
export default async function ClinicViewLayout({
  children,
  params,
}: LayoutProps<"/admin/vue-clinique/[clinicId]">) {
  await requireSession(["platform_admin"]);
  const { clinicId } = await params;
  const consultation = await openClinicView(clinicId);
  if (!consultation) notFound();

  return (
    <ClinicViewProvider consultation={consultation}>
      <ClinicViewBanner />
      {children}
    </ClinicViewProvider>
  );
}
