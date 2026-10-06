import { Building2, Hospital } from "lucide-react";
import type { Metadata } from "next";

import { OrganizationRowActions } from "@/components/admin/organization-row-actions";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listOrganizations } from "@/lib/data/admin";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Organisations" };

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
  const organizations = await listOrganizations();
  const clinics = organizations.filter((org) => org.kind === "clinic");
  const groups = organizations.length - clinics.length;

  // Accord en nombre : « 1 cabinets » trahit une interface qui ne relit
  // pas ce qu'elle écrit, et c'est le genre de détail qu'on remarque
  // avant le reste.
  const plural = (count: number, singular: string, plural_: string) =>
    `${count} ${count > 1 ? plural_ : singular}`;

  return (
    <>
      <PageHeader
        title="Organisations"
        description={`${plural(clinics.length, "clinique", "cliniques")} · ${plural(groups, "groupe de radiologie", "groupes de radiologie")} · raccordement d’une clinique : make clinic`}
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="[&>th]:h-9 [&>th]:border-b [&>th]:border-border-subtle [&>th]:bg-surface-raised [&>th]:px-4 [&>th]:text-left [&>th]:font-medium">
                <th scope="col" className="w-[32%]">
                  <span className="label-eyebrow">Organisation</span>
                </th>
                <th scope="col" className="w-[16%]">
                  <span className="label-eyebrow">Nature</span>
                </th>
                <th scope="col" className="w-[14%]">
                  <span className="label-eyebrow">PACS</span>
                </th>
                <th scope="col" className="w-[10%] text-right">
                  <span className="label-eyebrow">Membres</span>
                </th>
                <th scope="col" className="w-[10%] text-right">
                  <span className="label-eyebrow">Examens</span>
                </th>
                <th scope="col" className="w-[10%] text-right">
                  <span className="label-eyebrow">État</span>
                </th>
                <th scope="col" className="w-[14%] text-right">
                  <span className="sr-only">Actions</span>
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
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-active"
                        aria-hidden
                      >
                        {org.kind === "clinic" ? (
                          <Hospital className="size-3.5 text-tertiary" />
                        ) : (
                          <Building2 className="size-3.5 text-tertiary" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{org.name}</p>
                        <p className="truncate text-2xs text-tertiary">
                          {org.city}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="text-secondary">
                    {org.kind === "clinic" ? "Clinique" : "Groupe"}
                  </td>

                  <td className="text-2xs">
                    {org.kind !== "clinic" ? (
                      <span className="text-tertiary">—</span>
                    ) : org.connected ? (
                      <span className="text-done">Raccordée</span>
                    ) : (
                      <span className="text-progress">Non raccordée</span>
                    )}
                  </td>

                  <td className="text-right text-secondary tabular-nums">
                    {org.memberCount}
                  </td>
                  <td className="text-right text-secondary tabular-nums">
                    {org.studyCount}
                  </td>

                  <td className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-medium",
                        org.active
                          ? "bg-done-muted text-done"
                          : "bg-surface-active text-tertiary",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          org.active ? "bg-done" : "bg-tertiary",
                        )}
                        aria-hidden
                      />
                      {org.active ? "Active" : "Suspendue"}
                    </span>
                  </td>

                  <td>
                    <OrganizationRowActions organization={org} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
