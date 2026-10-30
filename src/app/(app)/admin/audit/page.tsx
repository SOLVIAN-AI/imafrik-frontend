import { ArrowRight, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ControlBody, Section } from "@/components/admin/control-ui";
import { DateTime } from "@/components/domain/date-time";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { parseCursor } from "@/lib/admin-params";
import { auditLabel } from "@/lib/audit-actions";
import { listOrganizations } from "@/lib/data/admin";
import { type AuditEntry, listAudit, listUsers } from "@/lib/data/control";
import {
  AUDIT_FAMILIES,
  type AuditFamily,
  type BarDimension,
} from "@/lib/filters/dimensions";
import { LIST_FILTERS } from "@/lib/filters/screens";
import {
  filterHref,
  hasFilters,
  paramHref,
  readFilters,
} from "@/lib/filters/url";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.audit };
}

/** Entrées par page. */
const PAGE_SIZE = 50;

/**
 * Journal d'audit de la plateforme.
 *
 * Qui a fait quoi, quand, dans quelle organisation : prise en charge et
 * consultation d'un examen, signature, remise, changements de réglages,
 * rattachements. C'est la pièce qu'on produit quand une clinique, un
 * patient ou une autorité demande « qui a vu ce dossier ? ».
 *
 * Lecture seule : le journal s'écrit par le service, jamais d'ici. La
 * pagination suit un curseur (`?avant=<id>`) — un décalage reprendrait
 * des lignes déjà vues à mesure que le journal se remplit.
 */
export default async function AuditPage({
  searchParams,
}: PageProps<"/admin/audit">) {
  await requireSession(["platform_admin"]);
  const { t } = await getMessages();
  const text = t.admin.audit;
  const params = await searchParams;
  const keys = LIST_FILTERS.journal;
  const [organizations, accounts] = await Promise.all([
    listOrganizations(),
    listUsers(),
  ]);
  const actions = Object.keys(text.actions);
  const filters = readFilters(params, keys, {
    organization: organizations.map((org) => org.id),
    author: accounts.map((account) => account.id),
    action: actions,
  });
  const family = filters.family as AuditFamily | undefined;
  // Une action hors de la famille choisie ne veut rien dire : elle tombe.
  const action =
    filters.action && (!family || filters.action.startsWith(`${family}.`))
      ? filters.action
      : undefined;
  const beforeId = parseCursor(params.avant);
  const days = filters.period ? Number(filters.period) : undefined;
  const entries = await listAudit({
    action,
    family,
    actorId: filters.author,
    organizationId: filters.organization,
    since: days ? sinceDays(days) : undefined,
    beforeId,
    limit: PAGE_SIZE,
  });
  const last = entries.at(-1);
  const pathname = "/admin/audit";
  const bar: BarDimension[] = [
    {
      key: "organization",
      options: organizations.map((org) => ({ value: org.id, label: org.name })),
    },
    {
      key: "author",
      options: accounts.map((account) => ({
        value: account.id,
        label: account.fullName,
      })),
    },
    { key: "family", options: AUDIT_FAMILIES.map((value) => ({ value })) },
    {
      key: "action",
      options: actions
        .filter((code) => !family || code.startsWith(`${family}.`))
        .map((code) => ({ value: code, label: auditLabel(code, t) })),
    },
    {
      key: "period",
      options: ["1", "7", "30", "90", "365"].map((value) => ({ value })),
    },
  ];
  const active = { ...filters, action };
  const filtered = hasFilters(active);
  const title = action
    ? auditLabel(action, t)
    : family
      ? text.families[family]
      : t.admin.filters.allActions;

  return (
    <>
      <PageHeader title={t.nav.items.audit} description={text.description} />
      <FilterBar
        dimensions={bar}
        active={active}
        result={{ count: entries.length, noun: "entries" }}
        className="shrink-0 px-4 pb-3 sm:px-6"
      />
      {/* Les entrées n'ont ni lien ni bouton : le corps doit pouvoir
          défiler au clavier. */}
      <ControlBody label={t.nav.items.audit}>
        <Section
          title={title}
          description={
            beforeId ? text.olderEntries : t.admin.shared.mostRecentFirst
          }
          action={
            beforeId
              ? {
                  label: text.backToLatest,
                  // Les mêmes filtres, depuis les plus récentes.
                  href: filterHref(pathname, params, {}),
                }
              : undefined
          }
          flush
        >
          {entries.length === 0 && filtered ? (
            <FilteredEmpty dimensions={bar} active={active} noun="entries" />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title={text.emptyTitle}
              detail={text.emptyDetail}
            />
          ) : (
            <ol className="divide-y divide-border-subtle">
              {entries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} t={t} />
              ))}
            </ol>
          )}
        </Section>

        {entries.length === PAGE_SIZE && (
          <div className="flex justify-center">
            <Button asChild variant="secondary" size="sm">
              <Link
                href={paramHref(pathname, params, "avant", String(last?.id))}
                scroll
              >
                {text.olderEntries}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        )}
      </ControlBody>
    </>
  );
}

/** Une entrée du journal. */
function AuditRow({ entry, t }: { entry: AuditEntry; t: AppMessages }) {
  const details = Object.entries(entry.metadata)
    .filter(([, value]) => value !== null && typeof value !== "object")
    .slice(0, 4);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-4 py-2.5 md:grid-cols-[10rem_minmax(0,14rem)_minmax(0,1fr)]">
      <DateTime
        date={entry.at}
        className="order-2 text-2xs whitespace-nowrap text-tertiary tabular-nums md:order-none md:text-xs"
      />
      <p className="order-1 truncate text-sm font-medium md:order-none">
        {auditLabel(entry.action, t)}
      </p>
      <p className="order-3 col-span-2 min-w-0 truncate text-2xs text-tertiary md:col-span-1 md:text-xs">
        <span className="text-secondary">
          {entry.actorName ??
            (entry.action === "study.auto_assigned"
              ? t.admin.audit.rule
              : t.admin.audit.system)}
        </span>
        {entry.organizationName && ` · ${entry.organizationName}`}
        {entry.resourceType && (
          <>
            {" · "}
            <span className="font-mono" title={entry.resourceId ?? undefined}>
              {entry.resourceType}
              {entry.resourceId && ` …${entry.resourceId.slice(-8)}`}
            </span>
          </>
        )}
        {details.map(([key, value]) => (
          <span key={key}>
            {" · "}
            {key} = {String(value)}
          </span>
        ))}
      </p>
    </li>
  );
}

/**
 * L'instant d'il y a quelques jours : le début d'une période du journal.
 *
 * @param days Jours en arrière.
 */
function sinceDays(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
