import type { TrainingAttempt, TrainingCase } from "@/lib/data/training";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/sections";

/**
 * Espace de formation de démonstration : les trois cas du catalogue, à
 * trois étapes différentes, pour montrer chaque état de l'écran.
 *
 * Les textes rédigés et le relecteur sont fictifs, comme tout le jeu de
 * démonstration ; les sources sont les vraies (docs/formation.md du
 * backend). Les images, elles, ne sont pas servies : le viewer est simulé.
 */

const DAY = 86_400_000;
const now = Date.now();

const LIDC = {
  name: "LIDC-IDRI, The Cancer Imaging Archive (Armato et al.)",
  license: "CC BY 3.0",
  url: "https://doi.org/10.7937/K9/TCIA.2015.LO9QL9SX",
  doi: "10.7937/K9/TCIA.2015.LO9QL9SX",
};

export const DEMO_TRAINING_CASES: TrainingCase[] = [
  {
    id: "demo-formation-radio",
    slug: "radio-thorax",
    position: 1,
    modality: "CR",
    bodyPart: "Thorax",
    seriesCount: 1,
    instanceCount: 1,
    title: "Radiographie du thorax",
    indication:
      "Radiographie thoracique de face, dans le bilan d’un patient adressé pour suspicion de lésion pulmonaire.",
    source: LIDC,
    state: "submitted",
    attemptId: "demo-exercice-radio",
    submittedAt: new Date(now - 2 * DAY),
    hasReference: true,
    reviewedBy: "Dr Afi Lawson",
    published: true,
  },
  {
    id: "demo-formation-scanner",
    slug: "scanner-thorax",
    position: 2,
    modality: "CT",
    bodyPart: "Thorax",
    seriesCount: 1,
    instanceCount: 133,
    title: "Scanner thoracique",
    indication:
      "Scanner thoracique sans injection, à la recherche de nodules pulmonaires chez un patient à risque.",
    source: LIDC,
    state: "draft",
    attemptId: "demo-exercice-scanner",
    submittedAt: null,
    hasReference: false,
    reviewedBy: "Dr Afi Lawson",
    published: true,
  },
  {
    id: "demo-formation-irm",
    slug: "irm-rachis-lombaire",
    position: 3,
    modality: "MR",
    bodyPart: "Rachis lombaire",
    seriesCount: 3,
    instanceCount: 45,
    title: "IRM du rachis lombaire",
    indication: "Lombalgies chroniques : recherche d’une pathologie discale.",
    source: {
      name: "Lumbar Spine MRI Dataset, Mendeley Data (Sudirman et al.)",
      license: "CC BY 4.0",
      url: "https://doi.org/10.17632/k57fr854j2.2",
      doi: "10.17632/k57fr854j2.2",
    },
    state: "todo",
    attemptId: null,
    submittedAt: null,
    hasReference: false,
    reviewedBy: "Dr Afi Lawson",
    published: true,
  },
];

export const DEMO_TRAINING_ATTEMPTS: Record<string, TrainingAttempt> = {
  "demo-exercice-radio": {
    id: "demo-exercice-radio",
    caseId: "demo-formation-radio",
    sections: {
      ...EMPTY_REPORT_SECTIONS,
      indication: "<p>Bilan d’une suspicion de lésion pulmonaire.</p>",
      technique: "<p>Radiographie thoracique de face, en inspiration.</p>",
      resultats:
        "<p>Opacité nodulaire arrondie du tiers moyen du champ pulmonaire droit, à contours nets. Pas d’épanchement pleural. Silhouette cardiaque de taille normale.</p>",
      conclusion:
        "<p>Opacité nodulaire du champ pulmonaire droit : un scanner thoracique est recommandé.</p>",
    },
    version: 4,
    submittedAt: new Date(now - 2 * DAY),
    addenda: [
      {
        body: "Comparaison souhaitée avec un cliché antérieur, s’il existe.",
        createdAt: new Date(now - 2 * DAY + 3_600_000),
      },
    ],
    reference: {
      sections: {
        ...EMPTY_REPORT_SECTIONS,
        resultats:
          "<p>Nodule du champ pulmonaire droit, d’environ 15 mm, à contours réguliers. Pas d’autre anomalie parenchymateuse. Culs-de-sac libres.</p>",
        conclusion:
          "<p>Nodule pulmonaire droit isolé : caractérisation par scanner thoracique.</p>",
      },
      author: "Dr Afi Lawson",
      validatedAt: new Date(now - 10 * DAY),
    },
  },
  "demo-exercice-scanner": {
    id: "demo-exercice-scanner",
    caseId: "demo-formation-scanner",
    sections: {
      ...EMPTY_REPORT_SECTIONS,
      indication:
        "<p>Recherche de nodules pulmonaires chez un patient à risque.</p>",
      technique: "<p>Acquisition hélicoïdale thoracique sans injection.</p>",
    },
    version: 2,
    submittedAt: null,
    addenda: [],
    reference: null,
  },
};
