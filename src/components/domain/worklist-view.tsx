"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { AssignDialog } from "@/components/domain/assign-dialog";
import { EligibilityNote } from "@/components/domain/eligibility-note";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { CredentialsBanner } from "@/components/domain/credentials-banner";
import { ListToolbar } from "@/components/domain/list-toolbar";
import {
  METRIC_ICONS,
  MetricGrid,
  type Metric,
} from "@/components/domain/metrics";
import { ReadingTable } from "@/components/domain/reading-table";
import { WorklistFilterBar } from "@/components/domain/worklist-filters";
import { useSession } from "@/components/providers/session-provider";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useLocale, useMessages } from "@/i18n/client";
import type { AppMessages } from "@/i18n";
import { useNow } from "@/hooks/use-now";
import type { AssignmentState } from "@/lib/actions/assignment";
import type { Eligibility } from "@/lib/assignment-blocker";
import type { Study } from "@/lib/data/studies";
import { formatPatientName } from "@/lib/format";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/locale";
import {
  type AssignmentChange,
  deadlineOf,
  formatDuration,
  newUrgentArrivals,
  withAssignments,
  type FilterOption,
  type WorklistFilters,
  type WorklistSections,
} from "@/lib/worklist";

/** Intervalle de relecture automatique de la file. */
const REFRESH_MS = 30_000;

/** Au-delà, les arrivées simultanées sont résumées en une alerte. */
const MAX_ARRIVAL_TOASTS = 2;

/**
 * Mesures d'en-tête, tirées de ce que le radiologue a à faire : ce qui
 * lui est attribué, les urgences à prendre de sa liste, ce qui est en
 * retard, et l'échéance la plus proche. En consultation, l'équipe IMAFRIK
 * voit ce qui attend une attribution.
 */
function buildMetrics(
  sections: WorklistSections,
  now: number,
  t: AppMessages,
  locale: Locale,
  supervising: boolean,
): Metric[] {
  const labels = t.worklist.metrics;
  // En consultation, rien n'est « à vous » : la précision compte ce que
  // les radiologues détiennent.
  const reading = sections.mine.length + sections.colleagues.length;
  const started = sections.mine.filter(
    (study) => study.status === "in_progress",
  ).length;
  const hint = supervising
    ? reading > 0
      ? t.worklist.supervision.readingHint(reading)
      : undefined
    : started > 0
      ? labels.mineHint(started)
      : undefined;
  const actionable = [...sections.mine, ...sections.open];
  const urgent = sections.open.filter((study) => study.urgent);
  // `now` vaut 0 au rendu serveur : aucune échéance n'y est calculable
  // sans diverger de l'hydratation. Voir `useNow`.
  const deadlines =
    now > 0 ? actionable.map((study) => deadlineOf(study, now, locale)) : [];
  const overdue = deadlines.filter((d) => d.tone === "overdue").length;
  const next = deadlines
    .filter((d) => d.tone !== "overdue")
    .sort((a, b) => a.remainingMs - b.remainingMs)[0];

  return [
    {
      label: supervising ? t.worklist.supervision.toAssign : labels.toTake,
      value: String(supervising ? sections.open.length : sections.mine.length),
      hint,
      icon: METRIC_ICONS.inbox,
      tone: "accent",
    },
    {
      label: labels.urgentOpen,
      value: String(urgent.length),
      hint: urgent.length > 0 ? labels.urgentHint : undefined,
      info: {
        text: supervising
          ? labels.urgentOpenInfoSupervision
          : labels.urgentOpenInfo,
        term: "listeUrgence",
      },
      icon: METRIC_ICONS.urgent,
      tone: urgent.length > 0 ? "urgent" : "neutral",
    },
    {
      label: labels.overdue,
      value: now > 0 ? String(overdue) : "—",
      hint: overdue > 0 ? labels.overdueHint : undefined,
      icon: METRIC_ICONS.wait,
      tone: overdue > 0 ? "urgent" : "neutral",
    },
    {
      label: labels.nextDeadline,
      value: next ? formatDuration(next.remainingMs, locale) : "—",
      icon: METRIC_ICONS.deadline,
      tone: next?.tone === "soon" ? "progress" : "neutral",
    },
  ];
}

/**
 * Décrit le périmètre de la file : les établissements dont elle contient
 * des examens.
 */
function describeScope(
  studies: Study[],
  t: AppMessages,
  locale: Locale,
  supervising: boolean,
): string {
  const scope = supervising ? t.worklist.supervision.scope : t.worklist.scope;
  const intl = INTL_LOCALE[locale];
  const clinics = [...new Set(studies.map((study) => study.clinic))].sort(
    (a, b) => a.localeCompare(b, intl),
  );
  if (clinics.length === 0) return scope.empty;
  if (clinics.length <= 3)
    return scope.clinics(
      new Intl.ListFormat(intl, { type: "conjunction" }).format(clinics),
    );
  return scope.count(clinics.length);
}

/**
 * Alerte à l'arrivée d'une urgence à prendre (liste d'urgence).
 *
 * Le compte des urgences à prendre dans le titre de l'onglet est calculé par
 * la page, dans ses métadonnées (`app/(app)/worklist/page.tsx`) : écrit ici
 * dans `document.title`, il était effacé par Next aussitôt après
 * l'hydratation.
 *
 * Le premier relevé n'alerte de rien : ce qui est déjà là à l'ouverture de
 * l'écran n'est pas une arrivée. Les identifiants vus survivent aux
 * relectures, pas au rechargement de la page.
 */
function useUrgentArrivals(open: Study[]) {
  const router = useRouter();
  const t = useMessages();
  const seen = React.useRef<ReadonlySet<string> | null>(null);

  React.useEffect(() => {
    const { arrivals, seen: next } = newUrgentArrivals(seen.current, open);
    seen.current = next;
    if (arrivals.length > MAX_ARRIVAL_TOASTS) {
      toast.warning(t.worklist.arrivals.many(arrivals.length), {
        duration: 15_000,
      });
      return;
    }
    for (const study of arrivals) {
      toast.warning(
        t.worklist.arrivals.one(
          `${study.modality}${study.bodyPart ? ` ${study.bodyPart}` : ""}, ${study.clinic}`,
        ),
        {
          description: formatPatientName(study.patientName),
          duration: 15_000,
          action: {
            label: t.common.actions.open,
            onClick: () => router.push(`/lecture/${study.id}`),
          },
        },
      );
    }
  }, [open, router, t]);
}

/**
 * File de lecture du radiologue.
 *
 * @param sections   La file filtrée, découpée en sections.
 * @param all        La file avant filtres, pour le périmètre affiché.
 * @param filters    Filtres actifs.
 * @param options    Valeurs de filtre proposées.
 * @param search     Recherche en cours.
 * @param truncated  Vrai si le service avait plus d'examens qu'il n'en a
 *                   renvoyé : l'écran le dit au lieu de laisser croire la
 *                   file complète.
 * @param eligibility Équipe IMAFRIK : qui peut recevoir chaque examen à
 *                   attribuer, lu par la page pour toute la file affichée.
 */
export function WorklistView({
  sections: served,
  all,
  filters,
  options,
  search,
  truncated,
  eligibility = {},
}: {
  sections: WorklistSections;
  all: Study[];
  filters: WorklistFilters;
  options: { modalities: FilterOption[]; clinics: FilterOption[] };
  search?: string;
  truncated: boolean;
  eligibility?: Record<string, Eligibility>;
}) {
  const now = useNow();
  const t = useMessages();
  const locale = useLocale();
  const labels = t.worklist;
  const { active, user } = useSession();
  // L'équipe IMAFRIK voit la file de toute la plateforme : elle n'y prend
  // rien en charge, rien n'y est « à elle », et elle y répartit.
  const supervising = active.role === "platform_admin";
  // Les attributions faites à l'instant depuis la file, appliquées à la
  // file que le service a lue : la ligne change de section aussitôt. Une
  // nouvelle lecture du service les remplace, et fait foi.
  const [changes, setChanges] = React.useState<{
    base: WorklistSections;
    byStudy: ReadonlyMap<string, AssignmentChange>;
  }>({ base: served, byStudy: new Map() });
  const sections =
    changes.base === served
      ? withAssignments(served, changes.byStudy, user.id)
      : served;
  const record = (studyId: string, state: AssignmentState) =>
    setChanges((current) => {
      const byStudy = new Map(
        current.base === served ? current.byStudy : undefined,
      );
      byStudy.set(studyId, {
        status: state.status,
        assignedTo: state.assignedTo,
        assignedToName: state.assignedToName,
      });
      return { base: served, byStudy };
    });
  useAutoRefresh(REFRESH_MS);
  useUrgentArrivals(sections.open);
  const assign = labels.supervision.assign;

  const filtered =
    Boolean(search) ||
    filters.urgentOnly ||
    filters.clinicId !== null ||
    filters.modalities.length > 0;

  return (
    // Téléphone : la page entière défile. Une liste qui défilerait seule
    // sous quatre indicateurs n'aurait que quelques lignes de hauteur.
    // À partir de 1024 px, seul le tableau défile, en-tête et filtres
    // restent en place.
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
      <PageHeader
        title={t.nav.items.worklist}
        description={describeScope(all, t, locale, supervising)}
        actions={<ListToolbar scope="worklist" search={search} urgentFilter />}
      />
      {/* Numéro d'ordre non validé : la file est vide, le bandeau dit pourquoi. */}
      <CredentialsBanner className="mx-4 mb-4 sm:mx-6" />
      <MetricGrid
        metrics={buildMetrics(sections, now, t, locale, supervising)}
        className="px-4 pb-4 sm:px-6"
        tour="worklist-metrics"
      />
      <WorklistFilterBar
        filters={filters}
        options={options}
        tour="worklist-filters"
      />
      {truncated && (
        <p className="px-4 pb-3 text-xs text-progress sm:px-6">
          {labels.truncated}
        </p>
      )}
      {/* Compressible à partir de 1024 px seulement : sur téléphone, la
          page défile et le tableau garde sa hauteur naturelle. */}
      <div className="flex flex-col px-4 pb-6 sm:px-6 lg:min-h-0 lg:flex-1">
        <Panel
          className="flex flex-col overflow-hidden lg:min-h-0"
          tour="worklist-table"
        >
          <ReadingTable
            groups={
              supervising
                ? [
                    {
                      key: "reading",
                      ...labels.supervision.reading,
                      studies: [...sections.mine, ...sections.colleagues],
                      follow: "reader",
                    },
                    {
                      key: "open",
                      ...labels.supervision.open,
                      studies: sections.open,
                      follow: "none",
                      note: (study) => (
                        <EligibilityNote
                          found={eligibility[study.id]}
                          modality={study.modality}
                          compact
                        />
                      ),
                    },
                  ]
                : [
                    {
                      key: "mine",
                      ...labels.groups.mine,
                      studies: sections.mine,
                      follow: "status",
                    },
                    {
                      key: "open",
                      ...labels.groups.open,
                      studies: sections.open,
                      follow: "none",
                    },
                  ]
            }
            hrefFor={(study) => `/lecture/${study.id}`}
            refreshNote={labels.refreshNote(REFRESH_MS / 1000)}
            empty={filtered ? labels.noResults : undefined}
            action={
              supervising
                ? {
                    label: assign.column,
                    // Toujours le bouton, jamais une mention à sa place :
                    // quand personne ne peut recevoir l'examen, la ligne le
                    // dit dans son suivi et la fenêtre explique quoi faire.
                    render: (study) => (
                      <AssignDialog
                        portal="team"
                        studyId={study.id}
                        patient={formatPatientName(study.patientName)}
                        assigned={study.assignedTo !== null}
                        clinic={{ id: study.clinicId, name: study.clinic }}
                        onChanged={(state) => record(study.id, state)}
                      />
                    ),
                  }
                : undefined
            }
          />
        </Panel>
      </div>
    </div>
  );
}
