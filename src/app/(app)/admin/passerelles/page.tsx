import { AlertTriangle, Router } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AlertList, ControlBody, Section } from "@/components/admin/control-ui";
import { GatewayList } from "@/components/admin/gateways/gateway-list";
import { KitPanel } from "@/components/admin/gateways/kit-panel";
import { PkiAgentPanel } from "@/components/admin/gateways/pki-agent-panel";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { type Gateway, getGatewayOverview } from "@/lib/data/gateways";
import { isDemoMode } from "@/lib/demo/mode";
import type { BarDimension } from "@/lib/filters/dimensions";
import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { hasFilters, readFilters } from "@/lib/filters/url";
import { GATEWAY_STATUSES, type GatewayStatus, isMute } from "@/lib/gateways";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.gateways.metaTitle };
}

/**
 * Passerelles de toutes les cliniques.
 *
 * L'écran qu'on ouvre quand une alerte parle d'une passerelle : en tête,
 * ce qui empêche d'enrôler (connexion Tailscale absente, PACS inconnu) et
 * les alertes du service (approbation qui attend, passerelle muette,
 * séries en souffrance, certificat proche de l'échéance, tâche d'hôte
 * muette ou en échec) ; puis la liste, filtrée par statut dans l'adresse
 * (`?statut=`) ; enfin la tâche d'hôte qui applique la confiance au PACS,
 * et le kit d'installation.
 */
export default async function GatewaysPage({
  searchParams,
}: PageProps<"/admin/passerelles">) {
  await requireSession(["platform_admin"]);
  const { t, locale } = await getMessages();
  const text = t.gateways;
  const params = await searchParams;
  const keys = LIST_FILTERS.passerelles;
  const draft = readFilters(params, keys);
  // Le statut : filtré et compté par le service. La clinique et le
  // silence : sur la page, la liste tient en quelques dizaines de postes.
  const status = (draft.gatewayStatus as GatewayStatus | undefined) ?? null;
  const overview = await getGatewayOverview(status);
  const total = Object.values(overview.counts).reduce(
    (sum, count) => sum + (count ?? 0),
    0,
  );
  const clinics = [
    ...new Map(
      overview.gateways.map((gateway) => [
        gateway.clinicId,
        gateway.clinicName,
      ]),
    ),
  ];
  const filters = readFilters(params, keys, {
    clinic: clinics.map(([id]) => id),
  });
  const values: RowValues<Gateway> = {
    clinic: (gateway) => [gateway.clinicId],
    mute: (gateway) => (isMute(gateway) ? ["mute"] : []),
  };
  const gateways = filterRows(overview.gateways, values, filters);
  const bar: BarDimension[] = [
    {
      key: "clinic",
      ...countOptions(
        overview.gateways,
        values,
        filters,
        "clinic",
        clinics.map(([value, label]) => ({ value, label })),
      ),
    },
    {
      key: "gatewayStatus",
      options: GATEWAY_STATUSES.map((value) => ({
        value,
        count: overview.counts[value] ?? 0,
      })),
      total,
    },
    {
      key: "mute",
      options: countOptions(overview.gateways, values, filters, "mute", [
        { value: "mute" },
      ]).options,
    },
  ];

  return (
    <>
      <PageHeader
        title={text.metaTitle}
        description={`${text.count(total)} · ${text.description}`}
      />
      <ControlBody>
        {!overview.ready && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-urgent/40 bg-urgent-muted px-4 py-3"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-urgent"
              aria-hidden
            />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{text.readiness.notReady}</p>
              <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-xs text-secondary">
                {overview.missing.map((piece) => (
                  <li key={piece}>{text.readiness.missing[piece]}</li>
                ))}
              </ul>
              {overview.missing.includes("tailscale_credentials") && (
                <Link
                  href="/admin/reglages#tailscale"
                  className="mt-2 inline-block text-xs font-medium text-urgent underline"
                >
                  {text.readiness.settingsLink}
                </Link>
              )}
            </div>
          </div>
        )}

        <AlertList alerts={overview.alerts} locale={locale} />

        <Section
          title={text.section}
          description={
            status ? text.statusHelp[status] : text.sectionDescription
          }
          flush
        >
          <FilterBar
            dimensions={bar}
            active={filters}
            result={{ count: gateways.length, noun: "gateways" }}
            className="px-4 py-3 sm:px-5"
          />
          {gateways.length === 0 &&
          hasFilters({ ...filters, gatewayStatus: undefined }) ? (
            <FilteredEmpty dimensions={bar} active={filters} noun="gateways" />
          ) : gateways.length === 0 ? (
            <EmptyState
              icon={Router}
              title={status ? text.emptyForFilter : text.empty}
            />
          ) : (
            <GatewayList gateways={gateways} t={t} showClinic />
          )}
        </Section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Ancre des alertes de la tâche d'hôte (muette ou en échec) :
              leur lien mène au détail, pas seulement en haut de la page. */}
          <div id="confiance-pacs" className="scroll-mt-4">
            <Section
              title={text.agent.title}
              description={text.agent.description}
              className="h-full"
            >
              <PkiAgentPanel agent={overview.agent} t={t} />
            </Section>
          </div>
          <Section title={text.kit.title} description={text.kit.description}>
            <KitPanel
              demo={isDemoMode()}
              kit={
                overview.kit
                  ? {
                      fileName: overview.kit.fileName,
                      sizeBytes: overview.kit.sizeBytes,
                      sha256: overview.kit.sha256,
                      version: overview.kit.version,
                      builtAt: overview.kit.builtAt.toISOString(),
                      manifestMatches: overview.kit.manifestMatches,
                      signatureStatus: overview.kit.signatureStatus,
                      publisher: overview.kit.publisher,
                      signatureExpiresAt:
                        overview.kit.signatureExpiresAt?.toISOString() ?? null,
                      timestamped: overview.kit.timestamped,
                    }
                  : null
              }
            />
          </Section>
        </div>
      </ControlBody>
    </>
  );
}
