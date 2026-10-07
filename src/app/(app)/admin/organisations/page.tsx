import { Building2, Hospital } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { OrganizationRowActions } from "@/components/admin/organization-row-actions";
import { RelativeTime } from "@/components/admin/relative-time";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { type AdminOrganization, listOrganizations } from "@/lib/data/admin";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.organisations };
}

/** Textes des organisations. */
type Text = AppMessages["admin"]["organisations"];

/**
 * Organisations de la plateforme.
 *
 * Écran de l'équipe IMAFRIK : volumes, état, et les deux gestes du
 * quotidien — inviter quelqu'un, suspendre ou réactiver.
 *
 * L'AE Title d'une clinique n'est pas affiché, seulement le fait qu'elle
 * soit raccordée : c'est son identifiant secret, et un écran n'a pas à le
 * montrer. **Le raccordement d'une clinique** — AE Title, certificat
 * DICOM TLS, paquet d'installation — se fait depuis le poste
 * d'exploitation (`make clinic`), qui détient les certificats : il n'a pas
 * sa place dans un navigateur.
 */
export default async function AdminOrganizationsPage() {
  await requireSession(["platform_admin"]);
  const { t } = await getMessages();
  const text = t.admin.organisations;
  const organizations = await listOrganizations();
  const clinics = organizations.filter((org) => org.kind === "clinic");
  const groups = organizations.length - clinics.length;

  // Accord en nombre : « 1 cabinets » trahit une interface qui ne relit
  // pas ce qu'elle écrit, et c'est le genre de détail qu'on remarque
  // avant le reste. Les pluriels vivent dans les textes de chaque langue.
  return (
    <>
      <PageHeader
        title={t.nav.items.organisations}
        description={`${text.clinicCount(clinics.length)} · ${text.groupCount(groups)}`}
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          {/* Téléphone : une carte par organisation, actions comprises —
              dans un tableau rogné, elles devenaient inaccessibles. */}
          <ul className="min-h-0 divide-y divide-border-subtle overflow-auto md:hidden">
            {organizations.map((org) => (
              <li key={org.id} className="flex flex-col gap-3 px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <OrgIcon kind={org.kind} />
                  <div className="min-w-0 flex-1">
                    <OrgName org={org} />
                    <p className="truncate text-2xs text-tertiary">
                      {text.kind[org.kind]} · {org.city} ·{" "}
                      {text.memberCount(org.memberCount)}
                      {org.kind === "clinic" && (
                        <>
                          {" · "}
                          {text.received30d(org.received30d)}
                        </>
                      )}
                    </p>
                    {org.kind === "clinic" && (
                      <p className="text-2xs text-tertiary">
                        {text.lastSent}{" "}
                        <LastReceived org={org} never={t.admin.shared.never} />
                      </p>
                    )}
                  </div>
                  <ActiveState active={org.active} text={text} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <PacsState
                    kind={org.kind}
                    connected={org.connected}
                    text={text}
                  />
                  <OrganizationRowActions organization={org} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden min-h-0 overflow-auto md:block">
            <table className="w-full min-w-[60rem] border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
                  <th scope="col" className="w-[26%]">
                    <span className="label-eyebrow">
                      {text.columns.organisation}
                    </span>
                  </th>
                  <th scope="col" className="w-[10%]">
                    <span className="label-eyebrow">{text.columns.kind}</span>
                  </th>
                  <th scope="col" className="w-[13%]">
                    <span className="label-eyebrow">{text.columns.pacs}</span>
                  </th>
                  <th scope="col" className="w-[8%] text-right">
                    <span className="label-eyebrow">
                      {text.columns.members}
                    </span>
                  </th>
                  <th scope="col" className="w-[9%] text-right">
                    <span className="label-eyebrow">{text.columns.days30}</span>
                  </th>
                  <th scope="col" className="w-[12%] text-right">
                    <span className="label-eyebrow">
                      {text.columns.lastSent}
                    </span>
                  </th>
                  <th scope="col" className="w-[10%] text-right">
                    <span className="label-eyebrow">{text.columns.state}</span>
                  </th>
                  <th scope="col" className="w-[12%] text-right">
                    <span className="sr-only">{text.columns.actions}</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {organizations.map((org) => (
                  <tr
                    key={org.id}
                    className={cn(
                      "[&>td]:h-12 [&>td]:border-b [&>td]:border-border-subtle [&>td]:px-4",
                      "last:[&>td]:border-b-0",
                    )}
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <OrgIcon kind={org.kind} />
                        <div className="min-w-0">
                          <OrgName org={org} />
                          <p className="truncate text-2xs text-tertiary">
                            {org.city}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="text-secondary">{text.kind[org.kind]}</td>

                    <td>
                      <PacsState
                        kind={org.kind}
                        connected={org.connected}
                        text={text}
                      />
                    </td>

                    <td className="text-right text-secondary tabular-nums">
                      {org.memberCount}
                    </td>
                    <td
                      className="text-right text-secondary tabular-nums"
                      title={text.totalStudies(org.studyCount)}
                    >
                      {org.kind === "clinic" ? org.received30d : "—"}
                    </td>
                    <td className="text-right text-2xs whitespace-nowrap text-tertiary">
                      <LastReceived org={org} never={t.admin.shared.never} />
                    </td>

                    <td className="text-right">
                      <ActiveState active={org.active} text={text} />
                    </td>

                    <td>
                      <OrganizationRowActions organization={org} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

/**
 * Nom de l'organisation ; celui d'une clinique mène à sa fiche de mise en
 * service.
 */
function OrgName({ org }: { org: AdminOrganization }) {
  if (org.kind !== "clinic")
    return <p className="truncate font-medium">{org.name}</p>;
  return (
    <Link
      href={`/admin/organisations/${org.id}`}
      className="block truncate py-0.5 font-medium hover:text-accent hover:underline"
    >
      {org.name}
    </Link>
  );
}

/**
 * Dernier examen reçu d'une clinique — en ambre au-delà de 24 heures,
 * le signe d'une passerelle à l'arrêt.
 */
function LastReceived({
  org,
  never,
}: {
  org: AdminOrganization;
  never: string;
}) {
  if (org.kind !== "clinic") return <>—</>;
  if (!org.lastReceivedAt) return <>{never}</>;
  return <RelativeTime date={org.lastReceivedAt} staleAfterHours={24} />;
}

/** Pastille de nature : clinique ou groupe de radiologie. */
function OrgIcon({ kind }: { kind: "clinic" | "radiology_group" }) {
  const Icon = kind === "clinic" ? Hospital : Building2;
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-active"
      aria-hidden
    >
      <Icon className="size-3.5 text-tertiary" />
    </span>
  );
}

/** Raccordement PACS d'une clinique ; sans objet pour un groupe. */
function PacsState({
  kind,
  connected,
  text,
}: {
  kind: "clinic" | "radiology_group";
  connected: boolean;
  text: Text;
}) {
  if (kind !== "clinic")
    return <span className="text-2xs text-tertiary">{text.noPacs}</span>;
  return connected ? (
    <span className="text-2xs text-done">{text.pacsConnected}</span>
  ) : (
    <span className="text-2xs text-progress">{text.pacsNotConnected}</span>
  );
}

/** État de l'organisation : active, ou suspendue. */
function ActiveState({ active, text }: { active: boolean; text: Text }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-medium",
        active ? "bg-done-muted text-done" : "bg-surface-active text-tertiary",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-done" : "bg-tertiary",
        )}
        aria-hidden
      />
      {active ? text.active : text.suspended}
    </span>
  );
}
