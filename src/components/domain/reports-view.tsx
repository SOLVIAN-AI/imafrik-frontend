"use client";

import { FileText, Search, SearchX } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/providers/session-provider";
import { DateTime } from "@/components/domain/date-time";
import { EmptyState } from "@/components/ui/empty-state";
import { useMessages } from "@/i18n/client";
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
  const t = useMessages().clinic.reports;
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
        title={t.title}
        description={isClinic ? t.descriptionClinic : t.descriptionRadiologist}
        actions={
          <div className="relative w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchLabel}
              className="pl-8"
            />
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState
              icon={query ? SearchX : FileText}
              title={query ? t.noResult : t.empty}
              detail={query ? t.noResultDetail : t.emptyDetail}
            />
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
                          ? t.toDownload
                          : t.downloaded}
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
