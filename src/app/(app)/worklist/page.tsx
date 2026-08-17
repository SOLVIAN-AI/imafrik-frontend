"use client";

import { Filter, RefreshCw, Search } from "lucide-react";
import * as React from "react";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import {
  METRIC_ICONS,
  WorklistSummary,
  type Metric,
} from "@/components/domain/worklist-summary";
import { Button } from "@/components/ui/button";
import {
  formatAge,
  WorklistTable,
  type WorklistStudy,
} from "@/components/domain/worklist-table";

/**
 * Jeu de démonstration.
 *
 * Aucune donnée réelle : les noms sont fabriqués, comme l'exige la règle
 * du dépôt — aucune donnée patient en dehors de la production. Il sera
 * remplacé par l'appel à `GET /studies` une fois le client d'API branché.
 */
const MINUTE = 60_000;
const now = Date.now();

const DEMO: WorklistStudy[] = [
  {
    id: "1", patientName: "KOFFI^Ama", patientId: "STJ-04821", modality: "CT",
    bodyPart: "Thorax", clinic: "Clinique Saint-Joseph", status: "received",
    urgent: true, instanceCount: 1284, receivedAt: new Date(now - 8 * MINUTE),
    assignedTo: null,
  },
  {
    id: "2", patientName: "MENSAH^Kodjo", patientId: "STJ-04820", modality: "MR",
    bodyPart: "Crâne", clinic: "Clinique Saint-Joseph", status: "in_progress",
    urgent: false, instanceCount: 642, receivedAt: new Date(now - 47 * MINUTE),
    assignedTo: "Dr Adjo",
  },
  {
    id: "3", patientName: "SOGLO^Yawa", patientId: "PKA-01193", modality: "CR",
    bodyPart: "Thorax", clinic: "Polyclinique de Kara", status: "received",
    urgent: false, instanceCount: 2, receivedAt: new Date(now - 320 * MINUTE),
    assignedTo: null,
  },
  {
    id: "4", patientName: "AGBEKO^Selom", patientId: "STJ-04815", modality: "CT",
    bodyPart: "Abdomen", clinic: "Clinique Saint-Joseph", status: "reported",
    urgent: false, instanceCount: 918, receivedAt: new Date(now - 190 * MINUTE),
    assignedTo: "Dr Bakari",
  },
  {
    id: "5", patientName: "DOSSEH^Afi", patientId: "PKA-01190", modality: "US",
    bodyPart: "Pelvis", clinic: "Polyclinique de Kara", status: "assigned",
    urgent: false, instanceCount: 46, receivedAt: new Date(now - 95 * MINUTE),
    assignedTo: "Dr Adjo",
  },
  {
    id: "6", patientName: "LAWSON^Enyonam", patientId: "STJ-04809", modality: "CT",
    bodyPart: "Rachis", clinic: "Clinique Saint-Joseph", status: "delivered",
    urgent: false, instanceCount: 1520, receivedAt: new Date(now - 1580 * MINUTE),
    assignedTo: "Dr Bakari",
  },
  {
    id: "7", patientName: "TETTEH^Kossi", patientId: "PKA-01188", modality: "MR",
    bodyPart: "Genou", clinic: "Polyclinique de Kara", status: "received",
    urgent: true, instanceCount: 384, receivedAt: new Date(now - 21 * MINUTE),
    assignedTo: null,
  },
];

/**
 * Mesures d'en-tête, dérivées de la liste affichée.
 *
 * Calculées ici plutôt que reçues du serveur : tant que la liste tient
 * en une page, un aller-retour supplémentaire n'apporterait rien. Elles
 * viendront de l'API le jour où la pagination arrivera.
 */
function buildMetrics(studies: WorklistStudy[]): Metric[] {
  const waiting = studies.filter((s) => s.status === "received");
  const urgent = studies.filter((s) => s.urgent && s.status !== "delivered");
  const writing = studies.filter((s) => s.status === "in_progress");
  const oldest = waiting.reduce<number>(
    (max, s) => Math.max(max, Date.now() - s.receivedAt.getTime()),
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
      value: oldest > 0 ? formatAge(new Date(Date.now() - oldest)) : "—",
      icon: METRIC_ICONS.wait,
      tone: oldest > 4 * 3_600_000 ? "progress" : "neutral",
    },
  ];
}

export default function WorklistPage() {
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
      <WorklistSummary metrics={buildMetrics(DEMO)} />
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <WorklistTable studies={DEMO} />
        </Panel>
      </div>
    </>
  );
}
