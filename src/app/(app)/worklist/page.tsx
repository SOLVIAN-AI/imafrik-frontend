"use client";

import { Filter, RefreshCw, Search } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
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

export default function WorklistPage() {
  return (
    <>
      <PageHeader
        title="À lire"
        description={`${DEMO.length} examens`}
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
      <WorklistTable studies={DEMO} />
    </>
  );
}
