import { Inbox, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

import { ContactTracker } from "@/components/admin/contact-tracker";
import { ControlBody, Segmented } from "@/components/admin/control-ui";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
  type ContactStatus,
} from "@/lib/contact-status";
import { listContactRequests } from "@/lib/data/admin";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Demandes reçues" };

/** Teinte de chaque étape : seule une demande nouvelle appelle une action. */
const STATUS_STYLES: Record<ContactStatus, string> = {
  new: "bg-accent-muted text-accent",
  contacted: "bg-progress-muted text-progress",
  converted: "bg-done-muted text-done",
  dismissed: "bg-surface-active text-tertiary",
};

/**
 * Demandes envoyées par le formulaire de contact du site.
 *
 * Une demande est un futur client : elle se suit comme telle, de
 * « nouvelle » à « convertie » ou « écartée », avec les notes de qui l'a
 * traitée. Les nouvelles s'affichent par défaut — c'est ce qui attend une
 * réponse.
 */
export default async function ContactRequestsPage({
  searchParams,
}: PageProps<"/admin/demandes">) {
  await requireSession(["platform_admin"]);
  const params = await searchParams;
  const requests = await listContactRequests();
  const counts = Object.fromEntries(
    CONTACT_STATUSES.map((status) => [
      status,
      requests.filter((request) => request.status === status).length,
    ]),
  ) as Record<ContactStatus, number>;

  const requested = typeof params.etat === "string" ? params.etat : undefined;
  const filter: ContactStatus | "all" =
    requested === "all"
      ? "all"
      : (CONTACT_STATUSES as readonly string[]).includes(requested ?? "")
        ? (requested as ContactStatus)
        : counts.new > 0
          ? "new"
          : "all";
  const shown =
    filter === "all"
      ? requests
      : requests.filter((request) => request.status === filter);

  return (
    <>
      <PageHeader
        title="Demandes reçues"
        description={`${requests.length} demande${requests.length > 1 ? "s" : ""} · ${counts.new} à traiter`}
        actions={
          <Segmented
            label="Étape du suivi"
            options={[
              {
                label: `Toutes · ${requests.length}`,
                href: "/admin/demandes?etat=all",
                active: filter === "all",
              },
              ...CONTACT_STATUSES.map((status) => ({
                label: `${CONTACT_STATUS_LABELS[status]}s · ${counts[status]}`,
                href: `/admin/demandes?etat=${status}`,
                active: filter === status,
              })),
            ]}
          />
        }
      />
      <ControlBody>
        {shown.length === 0 ? (
          <Panel>
            <EmptyState
              icon={Inbox}
              title={
                requests.length === 0
                  ? "Aucune demande"
                  : "Rien dans cette étape"
              }
              detail="Les demandes envoyées depuis le formulaire de contact du site apparaissent ici."
            />
          </Panel>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((request) => (
              <li key={request.id}>
                <Panel className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-medium">{request.fullName}</p>
                    {request.organization && (
                      <p className="text-xs text-secondary">
                        {request.organization}
                      </p>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-2xs font-medium",
                        STATUS_STYLES[request.status],
                      )}
                    >
                      {CONTACT_STATUS_LABELS[request.status]}
                    </span>
                    <DateTime
                      date={request.createdAt}
                      className="ml-auto text-2xs text-tertiary"
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <a
                      href={`mailto:${request.email}`}
                      className="flex min-h-6 min-w-0 items-center gap-1.5 text-accent hover:underline"
                    >
                      <Mail className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{request.email}</span>
                    </a>
                    {request.phone && (
                      <a
                        href={`tel:${request.phone.replace(/[^\d+]/g, "")}`}
                        className="flex min-h-6 items-center gap-1.5 text-accent hover:underline"
                      >
                        <Phone className="size-3.5 shrink-0" aria-hidden />
                        {request.phone}
                      </a>
                    )}
                  </div>
                  {request.message && (
                    <p className="mt-2 text-xs break-words whitespace-pre-wrap text-secondary">
                      {request.message}
                    </p>
                  )}
                  <div className="mt-3 border-t border-border-subtle pt-3">
                    <ContactTracker
                      requestId={request.id}
                      status={request.status}
                      notes={request.notes}
                    />
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </ControlBody>
    </>
  );
}
