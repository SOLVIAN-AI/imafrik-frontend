import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ControlBody, Section } from "@/components/admin/control-ui";
import { CopyButton } from "@/components/admin/gateways/copy-button";
import { GatewayActions } from "@/components/admin/gateways/gateway-actions";
import { approvalFacts } from "@/components/admin/gateways/gateway-list";
import { GatewayStatusBadge } from "@/components/admin/gateways/gateway-status";
import {
  CertificateExpiry,
  HeartbeatAge,
} from "@/components/admin/gateways/gateway-time";
import { RelativeTime } from "@/components/admin/relative-time";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { auditLabel } from "@/lib/audit-actions";
import {
  type GatewayCertificate,
  type GatewayDetail,
  getGateway,
} from "@/lib/data/gateways";
import {
  formatBytes,
  formatCount,
  formatDate,
  formatDuration,
} from "@/lib/format";
import { certificateState, groupFingerprint } from "@/lib/gateways";
import type { Locale } from "@/lib/i18n/locale";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/admin/passerelles/[id]">): Promise<Metadata> {
  const { t } = await getMessages();
  const gateway = await getGateway((await params).id);
  return {
    title: gateway
      ? `${gateway.hostname} · ${t.gateways.metaTitle}`
      : t.gateways.metaTitle,
  };
}

/**
 * Fiche d'une passerelle : ce qu'elle est, où elle est, où elle en est.
 *
 * En tête, son statut expliqué et les gestes qu'il permet. Puis quatre
 * blocs : le poste (nom, MachineGuid, protection de la clé, adresse
 * d'enrôlement), le réseau privé (nœud, adresse acceptée par le PACS),
 * son cycle de vie (dates, auteurs, motifs) et son signal de vie (mesures
 * envoyées toutes les cinq minutes). Enfin ses certificats épinglés,
 * empreinte entière et copiable, et son historique au journal d'audit.
 */
export default async function GatewayPage({
  params,
}: PageProps<"/admin/passerelles/[id]">) {
  await requireSession(["platform_admin"]);
  const { t, locale } = await getMessages();
  const text = t.gateways;
  const { id } = await params;
  const gateway = await getGateway(id);
  if (!gateway) notFound();

  return (
    <>
      <PageHeader
        title={gateway.hostname}
        description={`${gateway.clinicName} · ${text.status[gateway.status]}`}
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/passerelles">
                <ArrowLeft aria-hidden />
                {text.backToOverview}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/admin/organisations/${gateway.clinicId}`}>
                {gateway.clinicName}
              </Link>
            </Button>
          </>
        }
      />
      <ControlBody>
        <section
          aria-label={text.columns.status}
          className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <GatewayStatusBadge
              status={gateway.status}
              label={text.status[gateway.status]}
            />
            <p className="mt-2 text-xs leading-relaxed text-secondary">
              {text.statusHelp[gateway.status]}
            </p>
          </div>
          <GatewayActions
            gatewayId={gateway.id}
            status={gateway.status}
            facts={approvalFacts(gateway)}
            size="md"
            className="shrink-0"
          />
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title={text.detail.identity}>
            <Facts
              rows={[
                [text.detail.hostname, gateway.hostname],
                [
                  text.detail.machineGuid,
                  gateway.machineGuid ? (
                    <Mono>{gateway.machineGuid}</Mono>
                  ) : null,
                ],
                [
                  text.detail.keyProtection,
                  gateway.keyProtection
                    ? text.keyProtection[gateway.keyProtection]
                    : null,
                ],
                [
                  text.detail.enrolledFrom,
                  gateway.enrolledFromIp ? (
                    <Mono>{gateway.enrolledFromIp}</Mono>
                  ) : null,
                ],
                [text.detail.origin, text.origin[gateway.origin]],
              ]}
            />
          </Section>

          <Section title={text.detail.network}>
            <Facts
              rows={[
                [
                  text.detail.tailscaleHostname,
                  gateway.tailscaleHostname ? (
                    <Mono>{gateway.tailscaleHostname}</Mono>
                  ) : null,
                ],
                [
                  text.detail.address,
                  gateway.address ? <Mono>{gateway.address}</Mono> : null,
                ],
                [
                  text.detail.addressSource,
                  text.addressSource[gateway.addressSource],
                ],
                [
                  text.detail.lastSeen,
                  gateway.addressSource === "tailscale" ? (
                    <NodeState gateway={gateway} t={t} />
                  ) : null,
                ],
              ]}
            />
          </Section>

          <Section title={text.detail.lifecycle}>
            <Lifecycle gateway={gateway} t={t} />
          </Section>

          <Section title={text.detail.heartbeat}>
            <Heartbeat gateway={gateway} t={t} locale={locale} />
          </Section>
        </div>

        <Section
          title={text.detail.certificates}
          description={text.detail.certificatesDescription}
          flush
        >
          <Certificates
            certificates={gateway.certificates}
            t={t}
            locale={locale}
          />
        </Section>

        <Section
          title={text.detail.history}
          description={text.detail.historyDescription}
        >
          <History gateway={gateway} t={t} />
        </Section>
      </ControlBody>
    </>
  );
}

/** Texte à chasse fixe, sélectionnable d'un geste : identifiants, adresses. */
function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-2xs break-all select-all">{children}</span>
  );
}

/** Liste de faits : intitulé, valeur ; une valeur absente s'écrit « — ». */
function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-[minmax(0,12rem)_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-tertiary">{label}</dt>
          <dd className="min-w-0">
            {value ?? <span className="text-tertiary">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** État du nœud sur le réseau privé, tel que l'API Tailscale le donne. */
function NodeState({ gateway, t }: { gateway: GatewayDetail; t: AppMessages }) {
  const text = t.gateways;
  const node = gateway.node;
  if (!node) {
    return (
      <span className="text-tertiary">
        {gateway.tailscaleHostname ? text.nodeStateUnknown : text.nodeUnknown}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      <span className={node.online ? "text-done" : "text-progress"}>
        {node.online ? text.online : text.offline}
      </span>
      {node.lastSeen && (
        <RelativeTime date={node.lastSeen} className="text-tertiary" />
      )}
    </span>
  );
}

/** Dates du cycle de vie, leurs auteurs et leurs motifs. */
function Lifecycle({ gateway, t }: { gateway: GatewayDetail; t: AppMessages }) {
  const text = t.gateways.detail;
  const steps: {
    label: string;
    at: Date;
    by?: string | null;
    reason?: string | null;
  }[] = [
    { label: text.enrolled, at: gateway.enrolledAt },
    ...(gateway.approvedAt
      ? [
          {
            label: text.approved,
            at: gateway.approvedAt,
            by: gateway.approvedBy,
          },
        ]
      : []),
    ...(gateway.activatedAt
      ? [{ label: text.activated, at: gateway.activatedAt }]
      : []),
    ...(gateway.suspendedAt
      ? [
          {
            label: text.suspendedOn,
            at: gateway.suspendedAt,
            reason: gateway.suspensionReason,
          },
        ]
      : []),
    ...(gateway.rejectedAt
      ? [
          {
            label: text.rejectedOn,
            at: gateway.rejectedAt,
            reason: gateway.rejectionReason,
          },
        ]
      : []),
    ...(gateway.revokedAt
      ? [
          {
            label: text.revokedOn,
            at: gateway.revokedAt,
            reason: gateway.revocationReason,
          },
        ]
      : []),
    ...(gateway.renewalRequestedAt
      ? [{ label: text.renewalRequested, at: gateway.renewalRequestedAt }]
      : []),
  ];
  return (
    <ol className="flex flex-col gap-2.5 text-xs">
      {steps.map((step) => (
        <li key={step.label} className="flex flex-col gap-0.5">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{step.label}</span>
            <DateTime date={step.at} className="text-secondary" />
            {step.by && (
              <span className="text-tertiary">{text.approvedBy(step.by)}</span>
            )}
          </p>
          {step.reason && (
            <p className="text-2xs text-secondary">
              {text.reasonIs(step.reason)}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Dernier signal de vie et ses mesures. */
function Heartbeat({
  gateway,
  t,
  locale,
}: {
  gateway: GatewayDetail;
  t: AppMessages;
  locale: Locale;
}) {
  const text = t.gateways.detail;
  if (!gateway.lastHeartbeatAt) {
    return (
      <p className="text-xs leading-relaxed text-tertiary">
        {text.noHeartbeat}
      </p>
    );
  }
  return (
    <Facts
      rows={[
        [
          text.lastHeartbeat,
          <HeartbeatAge
            key="heartbeat"
            lastHeartbeat={gateway.lastHeartbeatAt}
            legacy={gateway.origin === "adopted"}
          />,
        ],
        [
          text.pendingSeries,
          gateway.pendingSeries === null
            ? null
            : formatCount(gateway.pendingSeries, locale),
        ],
        [
          text.oldestPending,
          gateway.oldestPendingSeconds
            ? formatDuration(gateway.oldestPendingSeconds / 60, locale)
            : null,
        ],
        [
          text.diskFree,
          gateway.diskFreeBytes === null
            ? null
            : formatBytes(gateway.diskFreeBytes, locale),
        ],
        [text.kitVersion, gateway.kitVersion],
        [text.orthancVersion, gateway.orthancVersion],
      ]}
    />
  );
}

/** Certificats épinglés, du plus récent au plus ancien. */
function Certificates({
  certificates,
  t,
  locale,
}: {
  certificates: GatewayCertificate[];
  t: AppMessages;
  locale: Locale;
}) {
  const text = t.gateways.detail;
  if (certificates.length === 0) {
    return <p className="px-4 py-6 text-center text-xs text-tertiary">—</p>;
  }
  return (
    <ul className="divide-y divide-border-subtle">
      {certificates.map((certificate) => {
        const state = certificateState(certificate);
        return (
          <li
            key={certificate.fingerprint}
            className="flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6"
          >
            <div className="min-w-0 flex-1">
              <p className="text-2xs text-tertiary">
                {text.certificateColumns.fingerprint} ·{" "}
                {text.certificateOrigin[certificate.origin]}
              </p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-2xs leading-relaxed break-all select-all",
                  state === "retired" && "text-tertiary",
                )}
              >
                {groupFingerprint(certificate.fingerprint)}
              </p>
            </div>
            <div className="shrink-0 text-2xs">
              <p className="text-tertiary">
                {text.certificateColumns.validity}
              </p>
              <p className="whitespace-nowrap">
                <DateTime date={certificate.notBefore} withTime={false} />
                {" → "}
                {state === "retired" ? (
                  <DateTime date={certificate.notAfter} withTime={false} />
                ) : (
                  <CertificateExpiry notAfter={certificate.notAfter} />
                )}
              </p>
            </div>
            <div className="shrink-0 text-2xs lg:w-48">
              <p className="text-tertiary">{text.certificateColumns.state}</p>
              <p
                className={cn(
                  state === "inForce" && "text-done",
                  state === "waiting" && "text-progress",
                  state === "overlap" && "text-progress",
                  state === "retired" && "text-tertiary",
                )}
              >
                {state === "overlap" && certificate.retireAfter
                  ? text.certificateState.overlap(
                      formatDate(certificate.retireAfter, locale),
                    )
                  : text.certificateState[
                      state === "overlap" ? "inForce" : state
                    ]}
                {state === "retired" && certificate.retireReason && (
                  <>
                    {" "}
                    (
                    {text.retireReason[certificate.retireReason] ??
                      certificate.retireReason}
                    )
                  </>
                )}
              </p>
            </div>
            <div className="shrink-0">
              <CopyButton
                value={certificate.fingerprint}
                label={text.copyFingerprint}
                copied={text.fingerprintCopied}
                failed={t.gateways.code.copyFailed}
                variant="ghost"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Historique : chaque geste, son auteur, et son motif s'il en a un. */
function History({ gateway, t }: { gateway: GatewayDetail; t: AppMessages }) {
  const text = t.gateways.detail;
  if (gateway.history.length === 0) {
    return <p className="text-xs text-tertiary">{text.noHistory}</p>;
  }
  return (
    <ol className="flex flex-col gap-2.5 text-xs">
      {gateway.history.map((event, index) => {
        const reason =
          typeof event.metadata?.reason === "string"
            ? event.metadata.reason
            : null;
        return (
          <li
            // Deux gestes peuvent partager le même instant : la position
            // complète la clé.
            key={`${event.at.toISOString()}-${event.action}-${index}`}
            className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <DateTime
              date={event.at}
              className="shrink-0 text-2xs whitespace-nowrap text-tertiary tabular-nums sm:w-36"
            />
            <div className="min-w-0">
              <p>
                <span className="font-medium">
                  {auditLabel(event.action, t)}
                </span>
                <span className="text-tertiary">
                  {" · "}
                  {event.actor ?? text.system}
                </span>
              </p>
              {reason && (
                <p className="text-2xs text-secondary">
                  {text.reasonIs(reason)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
