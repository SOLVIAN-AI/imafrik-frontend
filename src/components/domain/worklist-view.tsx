"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { ListToolbar } from "@/components/domain/list-toolbar";
import {
  METRIC_ICONS,
  MetricGrid,
  type Metric,
} from "@/components/domain/metrics";
import { ReadingTable } from "@/components/domain/reading-table";
import { WorklistFilterBar } from "@/components/domain/worklist-filters";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useNow } from "@/hooks/use-now";
import type { Study } from "@/lib/data/studies";
import { formatPatientName } from "@/lib/format";
import {
  deadlineOf,
  formatDuration,
  newUrgentArrivals,
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
 * est libre, ce qui est urgent, ce qui est en retard, et l'échéance la
 * plus proche. Les examens d'un confrère n'y comptent pas.
 */
function buildMetrics(sections: WorklistSections, now: number): Metric[] {
  const actionable = [...sections.mine, ...sections.open];
  const urgent = sections.open.filter((study) => study.urgent);
  // `now` vaut 0 au rendu serveur : aucune échéance n'y est calculable
  // sans diverger de l'hydratation. Voir `useNow`.
  const deadlines =
    now > 0 ? actionable.map((study) => deadlineOf(study, now)) : [];
  const overdue = deadlines.filter((d) => d.tone === "overdue").length;
  const next = deadlines
    .filter((d) => d.tone !== "overdue")
    .sort((a, b) => a.remainingMs - b.remainingMs)[0];

  return [
    {
      label: "À prendre",
      value: String(sections.open.length),
      hint:
        sections.mine.length > 0
          ? `et ${sections.mine.length} chez vous`
          : undefined,
      icon: METRIC_ICONS.inbox,
      tone: "accent",
    },
    {
      label: "Urgences libres",
      value: String(urgent.length),
      hint: urgent.length > 0 ? "à prendre d’abord" : undefined,
      icon: METRIC_ICONS.urgent,
      tone: urgent.length > 0 ? "urgent" : "neutral",
    },
    {
      label: "En retard",
      value: now > 0 ? String(overdue) : "—",
      hint: overdue > 0 ? "délai dépassé" : undefined,
      icon: METRIC_ICONS.wait,
      tone: overdue > 0 ? "urgent" : "neutral",
    },
    {
      label: "Prochaine échéance",
      value: next ? formatDuration(next.remainingMs) : "—",
      icon: METRIC_ICONS.deadline,
      tone: next?.tone === "soon" ? "progress" : "neutral",
    },
  ];
}

/**
 * Décrit le périmètre de la file : les établissements dont elle contient
 * des examens.
 */
function describeScope(studies: Study[]): string {
  const clinics = [...new Set(studies.map((study) => study.clinic))].sort(
    (a, b) => a.localeCompare(b, "fr"),
  );
  if (clinics.length === 0) return "File de travail du groupe";
  if (clinics.length <= 3)
    return `File de travail du groupe : ${new Intl.ListFormat("fr", { type: "conjunction" }).format(clinics)}`;
  return `File de travail du groupe : ${clinics.length} établissements`;
}

/**
 * Alerte à l'arrivée d'une urgence libre, et compte des urgences libres
 * dans le titre de l'onglet, visible depuis un autre onglet ou le viewer.
 *
 * Le premier relevé n'alerte de rien : ce qui est déjà là à l'ouverture de
 * l'écran n'est pas une arrivée. Les identifiants vus survivent aux
 * relectures, pas au rechargement de la page.
 */
function useUrgentArrivals(open: Study[]) {
  const router = useRouter();
  const seen = React.useRef<ReadonlySet<string> | null>(null);

  React.useEffect(() => {
    const { arrivals, seen: next } = newUrgentArrivals(seen.current, open);
    seen.current = next;
    if (arrivals.length > MAX_ARRIVAL_TOASTS) {
      toast.warning(`${arrivals.length} nouvelles urgences dans la file`, {
        duration: 15_000,
      });
      return;
    }
    for (const study of arrivals) {
      toast.warning(
        `Nouvelle urgence : ${study.modality}${study.bodyPart ? ` ${study.bodyPart}` : ""}, ${study.clinic}`,
        {
          description: formatPatientName(study.patientName),
          duration: 15_000,
          action: {
            label: "Ouvrir",
            onClick: () => router.push(`/lecture/${study.id}`),
          },
        },
      );
    }
  }, [open, router]);

  const urgentCount = open.filter((study) => study.urgent).length;
  React.useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = urgentCount > 0 ? `(${urgentCount}) ${base}` : base;
    return () => {
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
    };
  }, [urgentCount]);
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
 */
export function WorklistView({
  sections,
  all,
  filters,
  options,
  search,
  truncated,
}: {
  sections: WorklistSections;
  all: Study[];
  filters: WorklistFilters;
  options: { modalities: FilterOption[]; clinics: FilterOption[] };
  search?: string;
  truncated: boolean;
}) {
  const now = useNow();
  useAutoRefresh(REFRESH_MS);
  useUrgentArrivals(sections.open);

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
        title="À lire"
        description={describeScope(all)}
        actions={<ListToolbar scope="worklist" search={search} urgentFilter />}
      />
      <MetricGrid
        metrics={buildMetrics(sections, now)}
        className="px-4 pb-4 sm:px-6"
      />
      <WorklistFilterBar filters={filters} options={options} />
      {truncated && (
        <p className="px-4 pb-3 text-xs text-progress sm:px-6">
          La file compte plus d’examens que l’écran n’en affiche : seuls les
          plus proches de leur échéance sont listés. Affinez avec la recherche
          ou les filtres.
        </p>
      )}
      {/* Compressible à partir de 1024 px seulement : sur téléphone, la
          page défile et le tableau garde sa hauteur naturelle. */}
      <div className="flex flex-col px-4 pb-6 sm:px-6 lg:min-h-0 lg:flex-1">
        <Panel className="flex flex-col overflow-hidden lg:min-h-0">
          <ReadingTable
            groups={[
              {
                key: "mine",
                title: "Pris en charge par vous",
                hint: "à terminer",
                studies: sections.mine,
                follow: "status",
              },
              {
                key: "open",
                title: "À prendre",
                hint: "par ordre d’échéance",
                studies: sections.open,
                follow: "none",
              },
              {
                key: "colleagues",
                title: "Chez un confrère",
                hint: "consultation seulement",
                studies: sections.colleagues,
                collapsible: true,
                muted: true,
                follow: "reader",
              },
            ]}
            hrefFor={(study) => `/lecture/${study.id}`}
            refreshNote={`La file se met à jour toute seule toutes les ${REFRESH_MS / 1000} secondes.`}
            empty={
              filtered
                ? {
                    title: "Aucun résultat",
                    detail: "Modifiez la recherche ou retirez les filtres.",
                  }
                : undefined
            }
          />
        </Panel>
      </div>
    </div>
  );
}
