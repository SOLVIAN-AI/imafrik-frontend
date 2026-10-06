"use client";

import { FileText, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/providers/session-provider";
import { DateTime } from "@/components/domain/date-time";
import type { Study } from "@/lib/data/studies";
import { formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Comptes-rendus signés.
 *
 * **Écran partagé, colonne variable.** La clinique cherche un document
 * par patient et veut savoir qui l'a signé ; le radiologue cherche dans
 * sa propre production et veut savoir pour quel établissement. Une seule
 * colonne change — inutile d'écrire deux écrans pour cela.
 *
 * La recherche est immédiate et locale : sur des dizaines de documents,
 * un aller-retour serveur à chaque frappe serait plus lent que le filtre
 * lui-même.
 *
 * Chaque examen arrive avec son compte-rendu résumé — identifiant,
 * signataire, date — : la liste ne coûte qu'un appel, quel que soit le
 * nombre de documents.
 *
 * @param studies Examens rendus, chacun avec son compte-rendu signé.
 */
export function ReportsView({ studies }: { studies: Study[] }) {
  const { active } = useSession();
  const [query, setQuery] = React.useState("");

  const isClinic = active.role === "clinic_staff";

  const rows = studies.filter((study) => {
    if (!study.reportId) return false;
    const haystack =
      `${study.patientName} ${study.patientId} ${study.modality} ${study.bodyPart ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <>
      <PageHeader
        title="Comptes-rendus"
        description={
          isClinic
            ? "Documents signés et transmis à votre établissement"
            : "Les comptes-rendus que vous avez signés"
        }
        actions={
          <div className="relative w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Patient, identifiant, modalité…"
              aria-label="Rechercher un compte-rendu"
              className="pl-8"
            />
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
              <FileText className="size-5 text-tertiary" aria-hidden />
              <p className="text-sm font-medium">
                {query ? "Aucun résultat" : "Aucun compte-rendu"}
              </p>
              <p className="text-xs text-tertiary">
                {query
                  ? "Essayez un autre nom ou un autre identifiant."
                  : "Les comptes-rendus signés apparaissent ici."}
              </p>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-border-subtle overflow-auto">
              {rows.map((study) => (
                <li key={study.reportId}>
                  <Link
                    href={`/comptes-rendus/${study.reportId}`}
                    className={cn(
                      "flex w-full items-center gap-4 px-4 py-3 text-left",
                      "transition-colors hover:bg-surface-hover",
                      "focus-visible:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-done-muted">
                      <FileText className="size-4 text-done" aria-hidden />
                    </span>

                    <span className="min-w-0 flex-[2]">
                      <span className="block truncate text-sm font-medium">
                        {formatPatientName(study.patientName)}
                      </span>
                      <span className="block truncate font-mono text-2xs text-tertiary">
                        {study.patientId}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1 truncate text-xs text-secondary">
                      {study.modality}
                      {study.bodyPart && ` · ${study.bodyPart}`}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-xs text-secondary">
                      {isClinic ? (study.reportedBy ?? "—") : study.clinic}
                    </span>

                    {study.reportedAt && (
                      <DateTime
                        date={study.reportedAt}
                        className="shrink-0 text-2xs text-tertiary tabular-nums"
                      />
                    )}

                    {isClinic && (
                      <span
                        className={cn(
                          "w-24 shrink-0 text-right text-2xs font-medium",
                          study.status === "reported"
                            ? "text-accent"
                            : "text-tertiary",
                        )}
                      >
                        {study.status === "reported"
                          ? "À télécharger"
                          : "Téléchargé"}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
