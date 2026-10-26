import type { TrainingAttempt, TrainingCase } from "@/lib/data/training";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/sections";

/**
 * Espace de formation de démonstration : les sept cas du catalogue. Les
 * trois premiers sont à trois étapes différentes, pour montrer chaque état
 * de l'écran ; les autres sont à faire.
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

const EAY131 = {
  name: "EAY131 (NCI-MATCH), The Cancer Imaging Archive (ECOG-ACRIN Cancer Research Group)",
  license: "CC BY 4.0",
  url: "https://doi.org/10.7937/C5KE-YX42",
  doi: "10.7937/C5KE-YX42",
};

const REMIND = {
  name: "ReMIND, The Cancer Imaging Archive (Juvekar et al.)",
  license: "CC BY 4.0",
  url: "https://doi.org/10.7937/3RAG-D070",
  doi: "10.7937/3RAG-D070",
};

const CMB_MML = {
  name: "CMB-MML, The Cancer Imaging Archive (Cancer Moonshot Biobank)",
  license: "CC BY 4.0",
  url: "https://doi.org/10.7937/SZKB-SW39",
  doi: "10.7937/SZKB-SW39",
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
    instructions:
      "Analysez le cliché de face : qualité technique, cadre osseux, médiastin et silhouette cardiaque, plèvre, puis chaque champ pulmonaire. Décrivez toute opacité (siège, taille, contours) et concluez en proposant, si besoin, l’examen suivant.",
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
    instructions:
      "Faites défiler la série en fenêtre pulmonaire puis médiastinale. Recherchez les nodules, mesurez le plus gros (grand et petit axes), décrivez sa densité et ses contours, puis concluez avec la conduite à tenir que vous recommanderiez.",
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
    slug: "irm-foie",
    position: 3,
    modality: "MR",
    bodyPart: "Foie",
    seriesCount: 9,
    instanceCount: 503,
    title: "IRM du foie",
    indication:
      "IRM hépatique sans puis avec injection, dans le bilan d’une lésion du foie.",
    instructions:
      "Parcourez les neuf séries, avant puis après injection, et comparez les temps entre eux. Caractérisez la lésion hépatique (siège segmentaire, taille, signal, cinétique de rehaussement), examinez le foie de fond et concluez.",
    source: {
      name: "TCGA-LIHC, The Cancer Imaging Archive (Erickson et al.)",
      license: "CC BY 3.0",
      url: "https://doi.org/10.7937/K9/TCIA.2016.IMMQW8UQ",
      doi: "10.7937/K9/TCIA.2016.IMMQW8UQ",
    },
    state: "todo",
    attemptId: null,
    submittedAt: null,
    hasReference: false,
    reviewedBy: "Dr Afi Lawson",
    published: true,
  },
  {
    id: "demo-formation-scanner-cerebral",
    slug: "scanner-cerebral",
    position: 4,
    modality: "CT",
    bodyPart: "Crâne",
    seriesCount: 1,
    instanceCount: 39,
    title: "Scanner cérébral",
    indication:
      "Scanner cérébral, dans le bilan initial d’un cancer avancé en échec des traitements standard, avant l’entrée dans un essai de thérapie ciblée.",
    instructions:
      "Lisez la série axiale en fenêtre cérébrale, puis en fenêtres osseuse et tissus mous. Analysez le parenchyme, les ventricules et la ligne médiane, puis la voûte, la base du crâne, les orbites et les parties molles. Décrivez toute lésion (siège, taille dans deux plans, densité, rapports) et rédigez la conclusion qu’attendrait l’oncologue.",
    source: EAY131,
    state: "todo",
    attemptId: null,
    submittedAt: null,
    hasReference: false,
    reviewedBy: "Dr Afi Lawson",
    published: true,
  },
  {
    id: "demo-formation-irm-cerebrale",
    slug: "irm-cerebrale",
    position: 5,
    modality: "MR",
    bodyPart: "Encéphale",
    seriesCount: 5,
    instanceCount: 663,
    title: "IRM cérébrale",
    indication:
      "IRM cérébrale avec injection, en bilan préopératoire d’une lésion intracérébrale, chez une patiente de 59 ans.",
    instructions:
      "Lisez les cinq séries : T2 et FLAIR axiaux, T2 3D, T1 3D, puis T1 3D après injection, en vous aidant des reconstructions multiplanaires. Vérifiez les repères droite-gauche affichés par le viewer. Localisez la lésion, décrivez son signal, son rehaussement, sa taille et ses rapports, puis concluez comme pour un bilan préopératoire.",
    source: REMIND,
    state: "todo",
    attemptId: null,
    submittedAt: null,
    hasReference: false,
    reviewedBy: "Dr Afi Lawson",
    published: true,
  },
  {
    id: "demo-formation-irm-lombaire",
    slug: "irm-rachis-lombaire",
    position: 6,
    modality: "MR",
    bodyPart: "Rachis lombaire",
    seriesCount: 7,
    instanceCount: 169,
    title: "IRM du rachis lombaire",
    indication:
      "IRM du rachis lombaire sans puis avec injection, dans le bilan d’un myélome multiple.",
    instructions:
      "Lisez les sept séries : sagittales T1, T2 et STIR, axiales T1 et T2, puis T1 avec saturation de la graisse après injection, en sagittal et en axial. Analysez le signal de la moelle osseuse vertèbre par vertèbre, la hauteur des corps vertébraux, le canal rachidien et les parties molles, puis rédigez le compte-rendu attendu dans le bilan d’un myélome.",
    source: CMB_MML,
    state: "todo",
    attemptId: null,
    submittedAt: null,
    hasReference: false,
    reviewedBy: "Dr Afi Lawson",
    published: true,
  },
  {
    id: "demo-formation-bassin",
    slug: "radio-bassin",
    position: 7,
    modality: "CR",
    bodyPart: "Bassin",
    seriesCount: 1,
    instanceCount: 1,
    title: "Radiographie du bassin",
    indication:
      "Radiographie du bassin de face, dans un bilan osseux radiographique chez un patient suivi pour un myélome multiple.",
    instructions:
      "Analysez le cliché de face : qualité technique, puis os iliaques, sacrum, cadres obturateurs, articulations sacro-iliaques et coxo-fémorales, et extrémités fémorales supérieures. Décrivez toute lésion osseuse (siège, aspect, taille) et concluez.",
    source: CMB_MML,
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
          "<p>Nodule du champ pulmonaire droit, d’environ 24 mm, à contours réguliers. Pas d’autre anomalie parenchymateuse. Culs-de-sac libres.</p>",
        conclusion:
          "<p>Nodule pulmonaire droit isolé : caractérisation par scanner thoracique.</p>",
      },
      points: [
        "Repérer l’opacité nodulaire du champ pulmonaire droit.",
        "La mesurer et décrire ses contours.",
        "Vérifier plèvre, médiastin et silhouette cardiaque.",
        "Proposer un scanner thoracique pour la caractériser.",
      ],
      basis:
        "Nodule de 23,9 mm au scanner du même patient, retenu par les quatre lecteurs de LIDC-IDRI.",
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
