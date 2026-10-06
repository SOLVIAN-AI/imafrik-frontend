import { Inbox, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

import { DateTime } from "@/components/domain/date-time";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listContactRequests } from "@/lib/data/admin";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Demandes reçues" };

/**
 * Demandes envoyées par le formulaire de contact du site.
 *
 * Elles étaient perdues : le formulaire affichait un remerciement sans
 * rien transmettre. Le service les enregistre désormais ; l'équipe
 * IMAFRIK les retrouve ici, les plus récentes en tête, avec de quoi
 * rappeler la personne.
 */
export default async function ContactRequestsPage() {
  await requireSession(["platform_admin"]);
  const requests = await listContactRequests();

  return (
    <>
      <PageHeader
        title="Demandes reçues"
        description={`${requests.length} demande${requests.length > 1 ? "s" : ""} — formulaire du site`}
      />
      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        {requests.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center gap-2 py-20">
            <Inbox className="size-5 text-tertiary" aria-hidden />
            <p className="text-sm font-medium">Aucune demande</p>
            <p className="text-xs text-tertiary">
              Les demandes du site apparaîtront ici.
            </p>
          </Panel>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((request) => (
              <Panel key={request.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-sm font-medium">{request.fullName}</p>
                  {request.organization && (
                    <p className="text-xs text-secondary">
                      {request.organization}
                    </p>
                  )}
                  <DateTime
                    date={request.createdAt}
                    className="ml-auto text-2xs text-tertiary"
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <a
                    href={`mailto:${request.email}`}
                    className="flex items-center gap-1.5 text-accent hover:underline"
                  >
                    <Mail className="size-3.5" aria-hidden />
                    {request.email}
                  </a>
                  {request.phone && (
                    <a
                      href={`tel:${request.phone}`}
                      className="flex items-center gap-1.5 text-accent hover:underline"
                    >
                      <Phone className="size-3.5" aria-hidden />
                      {request.phone}
                    </a>
                  )}
                </div>
                {request.message && (
                  <p className="mt-2 text-xs whitespace-pre-wrap text-secondary">
                    {request.message}
                  </p>
                )}
              </Panel>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
