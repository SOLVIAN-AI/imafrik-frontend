import Link from "next/link";

import {
  GatewayActions,
  type ApprovalFacts,
} from "@/components/admin/gateways/gateway-actions";
import { GatewayStatusBadge } from "@/components/admin/gateways/gateway-status";
import {
  CertificateExpiry,
  HeartbeatAge,
} from "@/components/admin/gateways/gateway-time";
import { DateTime } from "@/components/domain/date-time";
import { ColumnLabel, type InfoTipContent } from "@/components/ui/info-tip";
import type { Gateway } from "@/lib/data/gateways";
import { SILENCE_MINUTES, shortFingerprint } from "@/lib/gateways";
import { cn } from "@/lib/utils";
import type { AppMessages } from "@/i18n";

/** Faits que la boîte d'approbation montre, tirés d'une passerelle. */
export function approvalFacts(gateway: Gateway): ApprovalFacts {
  return {
    hostname: gateway.hostname,
    machineGuid: gateway.machineGuid,
    enrolledFromIp: gateway.enrolledFromIp,
    tailscaleHostname: gateway.tailscaleHostname,
    online: gateway.node ? gateway.node.online : null,
    fingerprint: gateway.certificateFingerprint,
  };
}

/**
 * Liste de passerelles : poste, clinique, statut, adresse, certificat,
 * signe de vie, gestes.
 *
 * Tableau sur grand écran, une carte par passerelle sur téléphone : les
 * gestes restent à portée dans les deux cas. Le nom du poste mène à sa
 * fiche (certificats, mesures, historique).
 *
 * @param gateways   Passerelles.
 * @param t          Textes.
 * @param showClinic Colonne de la clinique, sur la vue d'ensemble.
 */
export function GatewayList({
  gateways,
  t,
  showClinic,
}: {
  gateways: Gateway[];
  t: AppMessages;
  showClinic: boolean;
}) {
  const text = t.gateways;
  // Ce que disent les colonnes qui ne se lisent pas d'elles-mêmes : la
  // bulle de leur intitulé, sur le tableau comme sur les cartes.
  const info = {
    status: { text: text.columnInfo.status, term: "passerelle" },
    address: { text: text.columnInfo.address, term: "reseauPrive" },
    certificate: { text: text.columnInfo.certificate, term: "certificat" },
    heartbeat: { text: text.columnInfo.heartbeat(SILENCE_MINUTES) },
  } satisfies Record<string, InfoTipContent>;
  return (
    <>
      <ul className="divide-y divide-border-subtle lg:hidden">
        {gateways.map((gateway) => (
          <li key={gateway.id} className="flex flex-col gap-3 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <GatewayName gateway={gateway} t={t} />
                {showClinic && (
                  <p className="truncate text-2xs text-tertiary">
                    {gateway.clinicName}
                  </p>
                )}
              </div>
              <GatewayStatusBadge
                status={gateway.status}
                label={text.status[gateway.status]}
              />
            </div>
            {/* Un peu d'air sous chaque intitulé : le bouton ⓘ déborde de
                sa ligne sans toucher la valeur. */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-2xs [&_dd]:mt-0.5">
              <div className="min-w-0">
                <dt className="flex min-w-0 items-center text-tertiary">
                  <ColumnLabel
                    label={text.columns.address}
                    info={info.address}
                    textClass="truncate"
                  />
                </dt>
                <dd>
                  <Address gateway={gateway} t={t} />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex min-w-0 items-center text-tertiary">
                  <ColumnLabel
                    label={text.columns.certificate}
                    info={info.certificate}
                    textClass="truncate"
                  />
                </dt>
                <dd>
                  <Certificate gateway={gateway} t={t} />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex min-w-0 items-center text-tertiary">
                  <ColumnLabel
                    label={text.columns.heartbeat}
                    info={info.heartbeat}
                    textClass="truncate"
                  />
                </dt>
                <dd>
                  <HeartbeatAge
                    lastHeartbeat={gateway.lastHeartbeatAt}
                    legacy={gateway.origin === "adopted"}
                  />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-tertiary">{text.columns.enrolled}</dt>
                <dd>
                  <DateTime date={gateway.enrolledAt} withTime={false} />
                </dd>
              </div>
            </dl>
            <GatewayActions
              gatewayId={gateway.id}
              status={gateway.status}
              facts={approvalFacts(gateway)}
            />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
              <th scope="col">
                <span className="label-eyebrow">{text.columns.gateway}</span>
              </th>
              {showClinic && (
                <th scope="col">
                  <span className="label-eyebrow">{text.columns.clinic}</span>
                </th>
              )}
              <th scope="col">
                <ColumnLabel label={text.columns.status} info={info.status} />
              </th>
              <th scope="col">
                <ColumnLabel label={text.columns.address} info={info.address} />
              </th>
              <th scope="col">
                <ColumnLabel
                  label={text.columns.certificate}
                  info={info.certificate}
                />
              </th>
              <th scope="col">
                <ColumnLabel
                  label={text.columns.heartbeat}
                  info={info.heartbeat}
                />
              </th>
              <th scope="col">
                <span className="label-eyebrow">{text.columns.enrolled}</span>
              </th>
              <th scope="col" className="text-right">
                <span className="sr-only">{text.columns.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {gateways.map((gateway) => (
              <tr
                key={gateway.id}
                className={cn(
                  "align-middle [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4 [&>td]:py-2.5",
                  "last:[&>td]:border-b-0",
                )}
              >
                <td className="max-w-[16rem]">
                  <GatewayName gateway={gateway} t={t} />
                </td>
                {showClinic && (
                  <td className="max-w-[14rem]">
                    <Link
                      href={`/admin/organisations/${gateway.clinicId}`}
                      className="block truncate text-secondary hover:text-accent hover:underline"
                    >
                      {gateway.clinicName}
                    </Link>
                  </td>
                )}
                <td>
                  <GatewayStatusBadge
                    status={gateway.status}
                    label={text.status[gateway.status]}
                  />
                </td>
                <td className="text-2xs">
                  <Address gateway={gateway} t={t} />
                </td>
                <td className="text-2xs">
                  <Certificate gateway={gateway} t={t} />
                </td>
                <td className="text-2xs whitespace-nowrap">
                  <HeartbeatAge
                    lastHeartbeat={gateway.lastHeartbeatAt}
                    legacy={gateway.origin === "adopted"}
                  />
                </td>
                <td className="text-2xs whitespace-nowrap text-tertiary">
                  <DateTime date={gateway.enrolledAt} withTime={false} />
                </td>
                <td>
                  <GatewayActions
                    gatewayId={gateway.id}
                    status={gateway.status}
                    facts={approvalFacts(gateway)}
                    className="justify-end"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Nom du poste, lien vers sa fiche, et son origine si elle est une reprise. */
function GatewayName({ gateway, t }: { gateway: Gateway; t: AppMessages }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/admin/passerelles/${gateway.id}`}
        aria-label={t.gateways.openGateway(gateway.hostname)}
        className="block truncate py-0.5 font-medium hover:text-accent hover:underline"
      >
        {gateway.hostname}
      </Link>
      {gateway.origin === "adopted" && (
        <p className="truncate text-2xs text-tertiary">
          {t.gateways.origin.adopted}
        </p>
      )}
    </div>
  );
}

/** Adresse acceptée par le PACS, et l'état du nœud sur le réseau privé. */
function Address({ gateway, t }: { gateway: Gateway; t: AppMessages }) {
  const text = t.gateways;
  const node = gateway.node;
  return (
    <div className="min-w-0">
      <p className="truncate font-mono">{gateway.address ?? text.noAddress}</p>
      {gateway.addressSource === "tailscale" && (
        <p className="inline-flex items-center gap-1.5 text-tertiary">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              node === null
                ? "bg-tertiary"
                : node.online
                  ? "bg-done"
                  : "bg-progress",
            )}
            aria-hidden
          />
          {node === null
            ? gateway.tailscaleHostname
              ? text.nodeStateUnknown
              : text.nodeUnknown
            : node.online
              ? text.online
              : text.offline}
        </p>
      )}
    </div>
  );
}

/** Empreinte abrégée du certificat en vigueur et son échéance. */
function Certificate({ gateway, t }: { gateway: Gateway; t: AppMessages }) {
  if (!gateway.certificateFingerprint) {
    return <span className="text-tertiary">—</span>;
  }
  return (
    <div className="min-w-0">
      <p className="truncate font-mono" title={gateway.certificateFingerprint}>
        {shortFingerprint(gateway.certificateFingerprint)}
      </p>
      {gateway.certificateNotAfter && (
        <p className="text-tertiary">
          {t.gateways.expiresOn}{" "}
          <CertificateExpiry notAfter={gateway.certificateNotAfter} />
        </p>
      )}
    </div>
  );
}
