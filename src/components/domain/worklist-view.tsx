"use client";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { ListToolbar } from "@/components/domain/list-toolbar";
import {
  METRIC_ICONS,
  MetricGrid,
  type Metric,
} from "@/components/domain/metrics";
import { formatAge } from "@/components/domain/study-age";
import { WorklistTable } from "@/components/domain/worklist-table";
import { useNow } from "@/hooks/use-now";
import type { Study } from "@/lib/data/studies";

/**
 * Mesures d'en-tête, dérivées de la file affichée.
 *
 * La file est celle que le service a renvoyée pour ce radiologue — les
 * examens non rendus du pool qu'il sert — et tient en une page : les
 * dériver ici évite un second appel sans rien perdre en exactitude.
 */
function buildMetrics(studies: Study[], now: number): Metric[] {
  const waiting = studies.filter((s) => s.status === "received");
  const urgent = studies.filter((s) => s.urgent && s.status !== "delivered");
  const writing = studies.filter((s) => s.status === "in_progress");
  const oldest = waiting.reduce<number>(
    (max, s) => Math.max(max, now - s.receivedAt.getTime()),
    0,
  );

  return [
    {
      label: "En attente de lecture",
      value: String(waiting.length),
      icon: METRIC_ICONS.inbox,
      tone: "accent",
    },
    {
      label: "Urgences",
      value: String(urgent.length),
      hint: urgent.length > 0 ? "à traiter en priorité" : undefined,
      icon: METRIC_ICONS.urgent,
      tone: urgent.length > 0 ? "urgent" : "neutral",
    },
    {
      label: "En cours de rédaction",
      value: String(writing.length),
      icon: METRIC_ICONS.writing,
      tone: "progress",
    },
    {
      label: "Attente la plus longue",
      // `now` vaut 0 au rendu serveur : la durée n'y est pas calculable
      // sans provoquer une divergence d'hydratation. Voir `useNow`.
      value:
        oldest > 0 ? formatAge(new Date(now - oldest), new Date(now)) : "—",
      icon: METRIC_ICONS.wait,
      tone: oldest > 4 * 3_600_000 ? "progress" : "neutral",
    },
  ];
}

/**
 * Décrit le périmètre de la file : les établissements dont elle contient
 * des examens. Écrit en dur, il nommait deux cliniques à tout le monde.
 */
function describeScope(studies: Study[]): string {
  const clinics = [...new Set(studies.map((study) => study.clinic))].sort();
  if (clinics.length === 0) return "File de travail du groupe";
  if (clinics.length <= 3)
    return `File de travail du groupe · ${clinics.join(", ")}`;
  return `File de travail du groupe · ${clinics.length} établissements`;
}

/**
 * File de lecture du radiologue.
 *
 * @param studies Examens non rendus du pool, déjà filtrés par le service.
 * @param filtered Vrai si une recherche ou un filtre est actif — l'état
 *                 vide ne dit alors pas « rien à lire » mais « aucun
 *                 résultat ».
 */
export function WorklistView({
  studies,
  filtered,
}: {
  studies: Study[];
  filtered: boolean;
}) {
  const now = useNow();

  return (
    <>
      <PageHeader
        title="À lire"
        description={describeScope(studies)}
        actions={<ListToolbar urgentFilter />}
      />
      <MetricGrid
        metrics={buildMetrics(studies, now)}
        className="px-4 pb-4 sm:px-6"
      />
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <WorklistTable
            studies={studies}
            hrefFor={(study) => `/lecture/${study.id}`}
            empty={
              filtered
                ? {
                    title: "Aucun résultat",
                    detail: "Modifiez la recherche ou retirez le filtre.",
                  }
                : undefined
            }
          />
        </Panel>
      </div>
    </>
  );
}
