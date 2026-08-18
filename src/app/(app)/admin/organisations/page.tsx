import { Building2, Hospital, Plus } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { listOrganizations } from "@/lib/data/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Organisations" };

/**
 * Organisations de la plateforme.
 *
 * Écran de l'équipe IMAFRIK. Il affiche l'AET DICOM déclaré parce que
 * c'est **la** valeur qui casse en premier : un technicien la modifie
 * côté PACS, les envois cessent d'arriver, et personne ne comprend
 * pourquoi tant qu'on ne compare pas les deux.
 */
export default async function AdminOrganizationsPage() {
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
        description={`${plural(clinics.length, "clinique", "cliniques")} · ${plural(groups, "cabinet de radiologie", "cabinets de radiologie")}`}
        actions={
          <Button size="sm">
            <Plus />
            Créer une organisation
          </Button>
        }
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
                <th scope="col" className="w-[22%]">
                  <span className="label-eyebrow">AET DICOM</span>
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
                    {org.kind === "clinic" ? "Clinique" : "Cabinet"}
                  </td>

                  <td>
                    {org.dicomAet ? (
                      <code className="font-mono text-2xs">{org.dicomAet}</code>
                    ) : (
                      <span className="text-2xs text-tertiary">—</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}
