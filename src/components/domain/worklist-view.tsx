"use client";

import { Filter, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import {
  METRIC_ICONS,
  MetricGrid,
  type Metric,
} from "@/components/domain/metrics";
import { Button } from "@/components/ui/button";
import { formatAge } from "@/components/domain/study-age";
import { WorklistTable } from "@/components/domain/worklist-table";
import { useNow } from "@/hooks/use-now";
import type { Study } from "@/lib/data/studies";

/**
 * Mesures d'en-tête, dérivées de la liste affichée.
 *
 * Calculées ici plutôt que reçues du serveur : tant que la liste tient
 * en une page, un aller-retour supplémentaire n'apporterait rien. Elles
 * viendront de l'API le jour où la pagination arrivera.
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

export function WorklistView({ studies }: { studies: Study[] }) {
  const router = useRouter();
  const now = useNow();

  return (
    <>
      <PageHeader
        title="À lire"
        description="File de travail du groupe · Clinique Saint-Joseph, Polyclinique de Kara"
        actions={
          <>
            <Button variant="ghost" size="icon" aria-label="Rechercher">
              <Search />
            </Button>
            <Button variant="ghost" size="sm">
              <Filter />
              Filtrer
            </Button>
            <Button variant="secondary" size="sm">
              <RefreshCw />
              Actualiser
            </Button>
          </>
        }
      />
      <MetricGrid metrics={buildMetrics(studies, now)} className="px-6 pb-4" />
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <WorklistTable
            studies={studies}
            onOpen={(study) => router.push(`/lecture/${study.id}`)}
          />
        </Panel>
      </div>
    </>
  );
}
