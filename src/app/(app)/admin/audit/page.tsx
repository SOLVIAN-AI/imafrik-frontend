import { ArrowRight, ScrollText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ControlBody, Section } from "@/components/admin/control-ui";
import { AuditFilter } from "@/components/admin/audit-filter";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { parseCursor } from "@/lib/admin-params";
import { AUDIT_ACTIONS, auditLabel } from "@/lib/audit-actions";
import { type AuditEntry, listAudit } from "@/lib/data/control";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Journal d’audit" };

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
  const params = await searchParams;
  const action =
    // `Object.hasOwn` et non `in` : `?action=toString` ne doit pas passer.
    typeof params.action === "string" &&
    Object.hasOwn(AUDIT_ACTIONS, params.action)
      ? params.action
      : undefined;
  const beforeId = parseCursor(params.avant);
  const entries = await listAudit({ action, beforeId, limit: PAGE_SIZE });
  const last = entries.at(-1);
  const next = new URLSearchParams();
  if (action) next.set("action", action);
  if (last) next.set("avant", String(last.id));

  return (
    <>
      <PageHeader
        title="Journal d’audit"
        description="Chaque geste sensible, horodaté et attribué, en lecture seule"
        actions={<AuditFilter current={action ?? ""} />}
      />
      <ControlBody>
        <Section
          title={action ? auditLabel(action) : "Toutes les actions"}
          description={
            beforeId ? "Entrées plus anciennes" : "Les plus récentes en tête"
          }
          action={
            beforeId
              ? {
                  label: "Revenir aux plus récentes",
                  href: action
                    ? `/admin/audit?action=${encodeURIComponent(action)}`
                    : "/admin/audit",
                }
              : undefined
          }
          flush
        >
          {entries.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Aucune entrée"
              detail={
                action
                  ? "Aucune entrée pour cette action."
                  : "Le journal se remplit à mesure que la plateforme est utilisée."
              }
            />
          ) : (
            <ol className="divide-y divide-border-subtle">
              {entries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
        </Section>

        {entries.length === PAGE_SIZE && (
          <div className="flex justify-center">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/admin/audit?${next}`} scroll>
                Entrées plus anciennes
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
function AuditRow({ entry }: { entry: AuditEntry }) {
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
        {auditLabel(entry.action)}
      </p>
      <p className="order-3 col-span-2 min-w-0 truncate text-2xs text-tertiary md:col-span-1 md:text-xs">
        <span className="text-secondary">{entry.actorName ?? "Système"}</span>
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
