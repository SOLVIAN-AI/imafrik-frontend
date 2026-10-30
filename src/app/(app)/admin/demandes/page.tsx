import {
  Building2,
  IdCard,
  Inbox,
  Mail,
  Phone,
  Stethoscope,
} from "lucide-react";
import type { Metadata } from "next";

import { ContactTracker } from "@/components/admin/contact-tracker";
import { InviteRequesterButton } from "@/components/admin/invite-requester-button";
import { ControlBody } from "@/components/admin/control-ui";
import { SearchBox } from "@/components/admin/search-box";
import { DateTime } from "@/components/domain/date-time";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CONTACT_STATUSES,
  type ContactStatus,
  REQUESTER_KINDS,
} from "@/lib/contact-status";
import { type ContactRequest, listContactRequests } from "@/lib/data/admin";
import { matchChoices } from "@/lib/filters/choice";
import { type BarDimension, PERIODS } from "@/lib/filters/dimensions";
import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";
import { periodsOf } from "@/lib/filters/periods";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { hasFilters, readFilters } from "@/lib/filters/url";
import { readListSearch } from "@/lib/search/server";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.requests };
}

/** Teinte de chaque étape : seule une demande nouvelle appelle une action. */
const STATUS_STYLES: Record<ContactStatus, string> = {
  new: "bg-accent-muted text-accent",
  contacted: "bg-progress-muted text-progress",
  converted: "bg-done-muted text-done",
  dismissed: "bg-surface-active text-secondary",
};

/**
 * Demandes envoyées par le formulaire de contact du site.
 *
 * Une demande est un futur client : elle se suit comme telle, de
 * « nouvelle » à « convertie » ou « écartée », avec les notes de qui l'a
 * traitée. La barre de filtres commune les trie par demandeur, étape et
 * période, chaque option comptée ; la recherche (nom, adresse,
 * établissement) vit dans un cookie, jamais dans l'adresse. Toutes les
 * demandes par défaut ; l'alerte du cockpit ouvre les nouvelles
 * (`?etat=new`, encore lu).
 *
 * Deux demandeurs, deux chemins : un établissement de santé signe un
 * contrat, puis crée lui-même les comptes de son personnel ; un
 * radiologue déclare son numéro d'ordre, que l'équipe IMAFRIK vérifie
 * auprès de l'Ordre avant de lui ouvrir le moindre accès. Le filtre
 * « Demandeur » sépare les deux files.
 */
export default async function ContactRequestsPage({
  searchParams,
}: PageProps<"/admin/demandes">) {
  const session = await requireSession(["platform_admin"]);
  const { t } = await getMessages();
  // Les radiologues acceptés rejoignent l'équipe de la plateforme : celle
  // de l'administrateur, quand c'est un groupe de radiologie.
  const team =
    session.active.organizationKind === "radiology_group"
      ? {
          id: session.active.organizationId,
          name: session.active.organizationName,
        }
      : null;
  const text = t.admin.requests;
  const params = await searchParams;
  const search = await readListSearch("admin-demandes", session);
  const keys = LIST_FILTERS.demandes;
  const filters = readFilters(params, keys);
  const all = await listContactRequests();
  // La recherche d'abord : le nom, l'adresse, l'établissement.
  const found = search
    ? matchChoices(
        all.map((request) => ({
          ...request,
          name: [request.fullName, request.email, request.organization]
            .filter(Boolean)
            .join(" "),
        })),
        search,
      ).map((match) => all.find((request) => request.id === match.id)!)
    : all;
  const values: RowValues<ContactRequest> = {
    requester: (request) =>
      request.requesterKind ? [request.requesterKind] : [],
    requestState: (request) => [request.status],
    period: (request) => periodsOf(request.createdAt),
  };
  const shown = filterRows(found, values, filters);
  const newCount = all.filter((request) => request.status === "new").length;
  const bar: BarDimension[] = [
    {
      key: "requester",
      ...countOptions(
        found,
        values,
        filters,
        "requester",
        REQUESTER_KINDS.map((value) => ({ value })),
      ),
    },
    {
      key: "requestState",
      ...countOptions(
        found,
        values,
        filters,
        "requestState",
        CONTACT_STATUSES.map((value) => ({ value })),
      ),
    },
    {
      key: "period",
      ...countOptions(
        found,
        values,
        filters,
        "period",
        PERIODS.map((value) => ({ value })),
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.nav.items.requests}
        description={text.description(all.length, newCount)}
        actions={
          <SearchBox
            scope="admin-demandes"
            search={search}
            label={t.filters.requestSearch}
            placeholder={t.filters.requestSearchPlaceholder}
          />
        }
      />
      <FilterBar
        dimensions={bar}
        active={filters}
        result={{ count: shown.length, noun: "requests" }}
        className="shrink-0 px-4 pb-3 sm:px-6"
      />
      <ControlBody>
        {shown.length === 0 && (search || hasFilters(filters)) ? (
          <Panel>
            <FilteredEmpty dimensions={bar} active={filters} noun="requests" />
          </Panel>
        ) : shown.length === 0 ? (
          <Panel>
            <EmptyState
              icon={Inbox}
              title={text.noRequest}
              detail={text.emptyDetail}
            />
          </Panel>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((request) => (
              <li key={request.id}>
                <Panel className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-medium">{request.fullName}</p>
                    {request.requesterKind && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-2xs text-secondary"
                        data-requester-kind={request.requesterKind}
                      >
                        {request.requesterKind === "radiologist" ? (
                          <Stethoscope className="size-3" aria-hidden />
                        ) : (
                          <Building2 className="size-3" aria-hidden />
                        )}
                        {text.requesterKind[request.requesterKind]}
                      </span>
                    )}
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
                      {text.status[request.status]}
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
                  {request.requesterKind === "radiologist" && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-secondary">
                      <IdCard
                        className="size-3.5 shrink-0 text-tertiary"
                        aria-hidden
                      />
                      {request.licenseNumber ? (
                        <span>
                          {text.license}{" "}
                          <span className="font-mono text-primary">
                            {request.licenseNumber}
                          </span>
                        </span>
                      ) : (
                        text.licenseMissing
                      )}
                    </p>
                  )}
                  {request.message && (
                    <p className="mt-2 text-xs break-words whitespace-pre-wrap text-secondary">
                      {request.message}
                    </p>
                  )}
                  {team &&
                    request.requesterKind === "radiologist" &&
                    (request.status === "new" ||
                      request.status === "contacted") && (
                      <div className="mt-3">
                        <InviteRequesterButton
                          requestId={request.id}
                          notes={request.notes}
                          fullName={request.fullName}
                          email={request.email}
                          organizationId={team.id}
                          organizationName={team.name}
                        />
                      </div>
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
