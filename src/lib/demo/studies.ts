import type { WorkspaceStudy } from "@/components/editor/report-workspace";
import type { ReportSections } from "@/components/editor/report-editor";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/report-editor";
import type { WorklistStudy } from "@/components/domain/worklist-table";

/**
 * Jeu de démonstration, en attendant le client d'API.
 *
 * **Aucune donnée réelle.** Les noms, les identifiants et les UID sont
 * fabriqués : la règle du dépôt interdit toute donnée patient hors
 * production, et un jeu de test issu d'un vrai service la violerait même
 * anonymisé — un identifiant de clinique suffit souvent à réidentifier.
 *
 * Ce module sera remplacé par les appels `GET /studies` et
 * `GET /studies/{id}` une fois le client généré depuis l'OpenAPI. Il est
 * isolé ici précisément pour que cette bascule ne touche qu'un fichier.
 */
export interface DemoStudy extends WorklistStudy, WorkspaceStudy {}

const MINUTE = 60_000;
const now = Date.now();

/** Fabrique un UID d'étude plausible sous une racine d'exemple. */
const uid = (suffix: string) => `1.2.826.0.1.3680043.8.498.${suffix}`;

export const DEMO_STUDIES: DemoStudy[] = [
  {
    id: "1",
    studyInstanceUid: uid("10001"),
    patientName: "KOFFI^Ama",
    patientId: "STJ-04821",
    modality: "CT",
    bodyPart: "Thorax",
    description: "TDM thoracique avec injection",
    clinic: "Clinique Saint-Joseph",
    status: "received",
    urgent: true,
    seriesCount: 4,
    instanceCount: 1284,
    receivedAt: new Date(now - 8 * MINUTE),
    assignedTo: null,
  },
  {
    id: "2",
    studyInstanceUid: uid("10002"),
    patientName: "MENSAH^Kodjo",
    patientId: "STJ-04820",
    modality: "MR",
    bodyPart: "Crâne",
    description: "IRM encéphalique sans injection",
    clinic: "Clinique Saint-Joseph",
    status: "in_progress",
    urgent: false,
    seriesCount: 7,
    instanceCount: 642,
    receivedAt: new Date(now - 47 * MINUTE),
    assignedTo: "Dr Adjo",
  },
  {
    id: "3",
    studyInstanceUid: uid("10003"),
    patientName: "SOGLO^Yawa",
    patientId: "PKA-01193",
    modality: "CR",
    bodyPart: "Thorax",
    description: "Radiographie thoracique de face",
    clinic: "Polyclinique de Kara",
    status: "received",
    urgent: false,
    seriesCount: 1,
    instanceCount: 2,
    receivedAt: new Date(now - 320 * MINUTE),
    assignedTo: null,
  },
  {
    id: "4",
    studyInstanceUid: uid("10004"),
    patientName: "AGBEKO^Selom",
    patientId: "STJ-04815",
    modality: "CT",
    bodyPart: "Abdomen",
    description: "TDM abdomino-pelvienne",
    clinic: "Clinique Saint-Joseph",
    status: "reported",
    urgent: false,
    seriesCount: 5,
    instanceCount: 918,
    receivedAt: new Date(now - 190 * MINUTE),
    assignedTo: "Dr Bakari",
  },
  {
    id: "5",
    studyInstanceUid: uid("10005"),
    patientName: "DOSSEH^Afi",
    patientId: "PKA-01190",
    modality: "US",
    bodyPart: "Pelvis",
    description: "Échographie pelvienne",
    clinic: "Polyclinique de Kara",
    status: "assigned",
    urgent: false,
    seriesCount: 1,
    instanceCount: 46,
    receivedAt: new Date(now - 95 * MINUTE),
    assignedTo: "Dr Adjo",
  },
  {
    id: "6",
    studyInstanceUid: uid("10006"),
    patientName: "LAWSON^Enyonam",
    patientId: "STJ-04809",
    modality: "CT",
    bodyPart: "Rachis",
    description: "TDM du rachis lombaire",
    clinic: "Clinique Saint-Joseph",
    status: "delivered",
    urgent: false,
    seriesCount: 3,
    instanceCount: 1520,
    receivedAt: new Date(now - 1580 * MINUTE),
    assignedTo: "Dr Bakari",
  },
  {
    id: "7",
    studyInstanceUid: uid("10007"),
    patientName: "TETTEH^Kossi",
    patientId: "PKA-01188",
    modality: "MR",
    bodyPart: "Genou",
    description: "IRM du genou droit",
    clinic: "Polyclinique de Kara",
    status: "received",
    urgent: true,
    seriesCount: 6,
    instanceCount: 384,
    receivedAt: new Date(now - 21 * MINUTE),
    assignedTo: null,
  },
];

/**
 * Retrouve un examen de démonstration.
 *
 * @param id Identifiant d'examen issu de l'URL.
 * @returns L'examen, ou `undefined` si l'identifiant est inconnu.
 */
export function findDemoStudy(id: string): DemoStudy | undefined {
  return DEMO_STUDIES.find((study) => study.id === id);
}

/**
 * Brouillons de démonstration.
 *
 * Seul l'examen en cours de rédaction en possède un : les autres
 * s'ouvrent sur un compte-rendu vierge, ce qui est le cas courant.
 */
const DEMO_DRAFTS: Record<string, Partial<ReportSections>> = {
  "2": {
    indication:
      "<p>Céphalées inhabituelles évoluant depuis trois semaines, résistantes aux antalgiques de palier I.</p>",
    technique:
      "<p>Séquences axiales T1, T2, FLAIR et diffusion. Coupes sagittales T1. Pas d’injection de produit de contraste.</p>",
    comparatif: "<p>Absence d’examen antérieur disponible.</p>",
    resultats:
      '<p style="text-align: justify">Absence d\'anomalie de signal du parenchyme cérébral. Les structures de la ligne médiane sont en place. Le système ventriculaire est de morphologie et de taille normales, sans dilatation.</p><p style="text-align: justify">Pas d\'argument pour un processus expansif intracrânien. Pas de prise de contraste anormale visible sur les séquences réalisées.</p>',
  },
};

/**
 * Contenu initial du compte-rendu d'un examen.
 *
 * @param studyId Identifiant d'examen.
 * @returns Les cinq sections, complétées par des chaînes vides.
 */
export function demoReport(studyId: string): ReportSections {
  return { ...EMPTY_REPORT_SECTIONS, ...DEMO_DRAFTS[studyId] };
}
