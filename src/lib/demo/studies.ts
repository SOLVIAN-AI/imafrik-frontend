import type { ReportSections } from "@/components/editor/report-editor";
import type { Study } from "@/lib/data/studies";

/**
 * Jeu de démonstration, servi quand l'un des services n'est pas configuré
 * (voir `lib/demo/mode.ts`) — aperçus et postes de développement.
 *
 * **Aucune donnée réelle.** Les noms, les identifiants et les UID sont
 * fabriqués : la règle du dépôt interdit toute donnée patient hors
 * production, et un jeu de test issu d'un vrai service la violerait même
 * anonymisé — un identifiant de clinique suffit souvent à réidentifier.
 *
 * Il porte exactement la forme de l'interface (`Study`) : la couche de
 * données le sert tel quel, sans traduction.
 */
export type DemoStudy = Study;

/** Identifiant de l'utilisateur de démonstration — voir `lib/session/demo.ts`. */
export const DEMO_USER_ID = "demo-user";

/** Organisations de démonstration, par nom. */
export const DEMO_CLINIC_IDS: Record<string, string> = {
  "Clinique Saint-Joseph": "org-stj",
  "Polyclinique de Kara": "org-pka",
};

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
    clinic: "Clinique Saint-Joseph",
    clinicId: DEMO_CLINIC_IDS["Clinique Saint-Joseph"],
    status: "received",
    urgent: true,
    seriesCount: 4,
    instanceCount: 1284,
    clinicalInfo: "TDM thoracique avec injection",
    receivedAt: new Date(now - 8 * MINUTE),
    assignedTo: null,
    assignedToName: null,
    reportId: null,
    reportedAt: null,
    reportedBy: null,
  },
  {
    id: "2",
    studyInstanceUid: uid("10002"),
    patientName: "MENSAH^Kodjo",
    patientId: "STJ-04820",
    modality: "MR",
    bodyPart: "Crâne",
    clinic: "Clinique Saint-Joseph",
    clinicId: DEMO_CLINIC_IDS["Clinique Saint-Joseph"],
    status: "in_progress",
    urgent: false,
    seriesCount: 7,
    instanceCount: 642,
    clinicalInfo: "IRM encéphalique sans injection",
    receivedAt: new Date(now - 47 * MINUTE),
    assignedTo: DEMO_USER_ID,
    assignedToName: "Dr Adjo",
    reportId: null,
    reportedAt: null,
    reportedBy: null,
  },
  {
    id: "3",
    studyInstanceUid: uid("10003"),
    patientName: "SOGLO^Yawa",
    patientId: "PKA-01193",
    modality: "CR",
    bodyPart: "Thorax",
    clinic: "Polyclinique de Kara",
    clinicId: DEMO_CLINIC_IDS["Polyclinique de Kara"],
    status: "received",
    urgent: false,
    seriesCount: 1,
    instanceCount: 2,
    clinicalInfo: "Radiographie thoracique de face",
    receivedAt: new Date(now - 320 * MINUTE),
    assignedTo: null,
    assignedToName: null,
    reportId: null,
    reportedAt: null,
    reportedBy: null,
  },
  {
    id: "4",
    studyInstanceUid: uid("10004"),
    patientName: "AGBEKO^Selom",
    patientId: "STJ-04815",
    modality: "CT",
    bodyPart: "Abdomen",
    clinic: "Clinique Saint-Joseph",
    clinicId: DEMO_CLINIC_IDS["Clinique Saint-Joseph"],
    status: "reported",
    urgent: false,
    seriesCount: 5,
    instanceCount: 918,
    clinicalInfo: "TDM abdomino-pelvienne",
    receivedAt: new Date(now - 190 * MINUTE),
    assignedTo: "demo-bakari",
    assignedToName: "Dr Bakari",
    reportId: "r-4815",
    reportedAt: new Date(now - (190 - 30) * MINUTE),
    reportedBy: "Dr Ibrahim Bakari",
  },
  {
    id: "5",
    studyInstanceUid: uid("10005"),
    patientName: "DOSSEH^Afi",
    patientId: "PKA-01190",
    modality: "US",
    bodyPart: "Pelvis",
    clinic: "Polyclinique de Kara",
    clinicId: DEMO_CLINIC_IDS["Polyclinique de Kara"],
    status: "assigned",
    urgent: false,
    seriesCount: 1,
    instanceCount: 46,
    clinicalInfo: "Échographie pelvienne",
    receivedAt: new Date(now - 95 * MINUTE),
    assignedTo: DEMO_USER_ID,
    assignedToName: "Dr Adjo",
    reportId: null,
    reportedAt: null,
    reportedBy: null,
  },
  {
    id: "6",
    studyInstanceUid: uid("10006"),
    patientName: "LAWSON^Enyonam",
    patientId: "STJ-04809",
    modality: "CT",
    bodyPart: "Rachis",
    clinic: "Clinique Saint-Joseph",
    clinicId: DEMO_CLINIC_IDS["Clinique Saint-Joseph"],
    status: "delivered",
    urgent: false,
    seriesCount: 3,
    instanceCount: 1520,
    clinicalInfo: "TDM du rachis lombaire",
    receivedAt: new Date(now - 1580 * MINUTE),
    assignedTo: "demo-bakari",
    assignedToName: "Dr Bakari",
    reportId: "r-4809",
    reportedAt: new Date(now - (1580 - 60) * MINUTE),
    reportedBy: "Dr Ibrahim Bakari",
  },
  {
    id: "7",
    studyInstanceUid: uid("10007"),
    patientName: "TETTEH^Kossi",
    patientId: "PKA-01188",
    modality: "MR",
    bodyPart: "Genou",
    clinic: "Polyclinique de Kara",
    clinicId: DEMO_CLINIC_IDS["Polyclinique de Kara"],
    status: "received",
    urgent: true,
    seriesCount: 6,
    instanceCount: 384,
    clinicalInfo: "IRM du genou droit",
    receivedAt: new Date(now - 21 * MINUTE),
    assignedTo: null,
    assignedToName: null,
    reportId: null,
    reportedAt: null,
    reportedBy: null,
  },
];

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
 * Brouillon de démonstration d'un examen.
 *
 * @param studyId Identifiant d'examen.
 * @returns Les sections déjà rédigées, vide si l'examen n'en a pas.
 */
export function demoDraftSections(studyId: string): Partial<ReportSections> {
  return DEMO_DRAFTS[studyId] ?? {};
}
