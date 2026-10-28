import { Building2, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { clinicViewPath } from "@/lib/clinic-view";
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
 * par l'aide, ou par une adresse sans clinique.
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
            <ul className="divide-y divide-border-subtle overflow-auto">
              {clinics.map((clinic) => (
                <li key={clinic.id}>
                  <Link
                    href={clinicViewPath(clinic.id)}
                    prefetch={false}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  >
                    <Building2
                      className="size-4 shrink-0 text-tertiary"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {clinic.name}
                      </span>
                      {clinic.city && (
                        <span className="block truncate text-2xs text-tertiary">
                          {clinic.city}
                        </span>
                      )}
                    </span>
                    <Eye className="size-4 shrink-0 text-accent" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
