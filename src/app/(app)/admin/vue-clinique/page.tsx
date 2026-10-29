import { Building2 } from "lucide-react";
import type { Metadata } from "next";

import { ClinicChooser } from "@/components/clinic-view/clinic-chooser";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { listViewableClinics } from "@/lib/data/clinic-view";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.clinicView.chooser.title };
}

/**
 * Entrée de la vue des cliniques, quand aucune n'est choisie.
 *
 * La même liste que le sélecteur de la navigation, en page : on y arrive
 * par l'aide, ou par une adresse sans clinique. Par ordre alphabétique,
 * avec une recherche dès huit cliniques.
 */
export default async function ClinicViewChooser() {
  await requireSession(["platform_admin"]);
  const [clinics, { t }] = await Promise.all([
    listViewableClinics(),
    getMessages(),
  ]);
  const text = t.clinicView.chooser;

  return (
    <>
      <PageHeader title={text.title} description={text.description} />
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 max-w-2xl flex-col overflow-hidden">
          {clinics.length === 0 ? (
            <EmptyState icon={Building2} title={text.empty} />
          ) : (
            <ClinicChooser clinics={clinics} />
          )}
        </Panel>
      </div>
    </>
  );
}
