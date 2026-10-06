import type { ReportSections } from "@/components/editor/report-editor";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/report-editor";
import { DEMO_RADIOLOGISTS, DEMO_STUDIES } from "@/lib/demo/studies";

/**
 * Un compte-rendu signé, tel que la clinique et le radiologue le voient.
 *
 * Le champ `verifyToken` correspond au jeton imprimé sur le PDF : il
 * ouvre `/verifier/[jeton]`, page publique qui atteste l'authenticité du
 * document sans exposer la moindre donnée patient.
 */
export interface DemoReport {
  id: string;
  studyId: string;
  authorId: string;
  signedAt: Date;
  signedBy: string;
  signerTitle: string;
  signerLicense: string;
  verifyToken: string;
  sections: ReportSections;
}

/** Signataires, avec l'identité figée telle qu'elle s'imprime sur le PDF. */
const SIGNERS = {
  me: {
    authorId: DEMO_RADIOLOGISTS.me.id,
    signedBy: DEMO_RADIOLOGISTS.me.name,
    signerTitle: "Dr",
    signerLicense: "TG-0937",
  },
  bakari: {
    authorId: DEMO_RADIOLOGISTS.bakari.id,
    signedBy: DEMO_RADIOLOGISTS.bakari.name,
    signerTitle: "Dr",
    signerLicense: "TG-1284",
  },
} as const;

/**
 * Fabrique un compte-rendu signé à partir de son examen.
 *
 * Date de signature et identifiant viennent de l'examen : un compte-rendu
 * de démonstration ne peut donc pas être signé avant d'avoir été reçu,
 * ni porter un autre identifiant que celui que la liste affiche.
 */
function signed(
  studyId: string,
  signer: keyof typeof SIGNERS,
  verifyToken: string,
  sections: Partial<ReportSections>,
): DemoReport {
  const study = DEMO_STUDIES.find((candidate) => candidate.id === studyId)!;
  return {
    id: study.reportId!,
    studyId,
    signedAt: study.reportedAt!,
    verifyToken,
    ...SIGNERS[signer],
    sections: { ...EMPTY_REPORT_SECTIONS, ...sections },
  };
}

export const DEMO_REPORTS: DemoReport[] = [
  signed("4", "bakari", "K7M2-P4QX-9RTV", {
    indication:
      "<p>Douleurs de la fosse iliaque droite depuis quarante-huit heures, fébricule à 38,2 °C.</p>",
    technique:
      "<p>Acquisition hélicoïdale abdomino-pelvienne après injection de produit de contraste iodé. Reconstructions multiplanaires.</p>",
    comparatif: "<p>Absence d’examen antérieur disponible.</p>",
    resultats:
      "<p>Le foie est de taille et de densité normales, sans lésion focale. Les voies biliaires ne sont pas dilatées. La vésicule est alithiasique, à paroi fine.</p><p>Appendice augmenté de calibre, mesuré à 11 mm, à paroi épaissie et rehaussée, entouré d’une infiltration de la graisse péri-appendiculaire. Absence de collection organisée et de pneumopéritoine.</p>",
    conclusion:
      "<p>Aspect tomodensitométrique d’appendicite aiguë non compliquée. Avis chirurgical recommandé.</p>",
  }),
  signed("6", "bakari", "B3ND-8WZK-2LHF", {
    indication:
      "<p>Lombalgies chroniques avec irradiation dans le membre inférieur droit.</p>",
    technique:
      "<p>Acquisition hélicoïdale du rachis lombaire, reconstructions sagittales et coronales, fenêtres osseuse et parenchymateuse.</p>",
    comparatif: "<p>Radiographies du rachis lombaire du 2 mai 2026.</p>",
    resultats:
      "<p>Rectitude du rachis lombaire. Discopathie dégénérative étagée prédominant en L4-L5 et L5-S1, avec pincement discal et ostéophytose marginale.</p><p>Débord discal postérieur global en L4-L5, à composante foraminale droite, au contact de la racine L4 droite. Canal lombaire de calibre conservé.</p>",
    conclusion:
      "<p>Discopathie dégénérative étagée. Conflit disco-radiculaire L4-L5 droit, compatible avec la symptomatologie décrite.</p>",
  }),
  signed("10", "me", "H8QF-3MKP-7XTW", {
    indication:
      "<p>Bilan d’un nodule pulmonaire découvert sur une radiographie.</p>",
    technique:
      "<p>Acquisition hélicoïdale thoracique en coupes millimétriques, sans puis avec injection. Fenêtres médiastinale et parenchymateuse.</p>",
    comparatif: "<p>Radiographie thoracique du 18 septembre 2026.</p>",
    resultats:
      "<p>Nodule tissulaire du lobe supérieur droit, à contours spiculés, mesuré à 14 × 12 mm. Pas d’adénomégalie médiastinale ni hilaire. Absence d’épanchement pleural.</p><p>Pas de lésion osseuse suspecte sur les structures explorées.</p>",
    conclusion:
      "<p>Nodule spiculé du lobe supérieur droit de 14 mm, suspect. Une confrontation en réunion de concertation et un complément par TEP-TDM sont proposés.</p>",
  }),
  signed("11", "me", "R2VC-6JDN-4PLS", {
    indication: "<p>Douleurs de l’hypochondre droit, post-prandiales.</p>",
    technique:
      "<p>Échographie abdominale par voie sous-costale et intercostale.</p>",
    comparatif: "<p>Absence d’examen antérieur disponible.</p>",
    resultats:
      "<p>Vésicule biliaire distendue contenant plusieurs calculs mobiles, le plus volumineux de 12 mm, avec cône d’ombre postérieur. Paroi vésiculaire fine, non épaissie. Signe de Murphy échographique négatif.</p><p>Voie biliaire principale de calibre normal. Foie, pancréas et reins sans particularité.</p>",
    conclusion:
      "<p>Lithiase vésiculaire non compliquée. Pas d’argument échographique pour une cholécystite aiguë.</p>",
  }),
  signed("12", "me", "M5TZ-9BWQ-1KEH", {
    indication:
      "<p>Chute de sa hauteur, impotence fonctionnelle de la hanche gauche.</p>",
    technique:
      "<p>Radiographies du bassin de face et de la hanche gauche de profil.</p>",
    comparatif: "<p>Absence d’examen antérieur disponible.</p>",
    resultats:
      "<p>Trait de fracture cervical vrai du fémur gauche, déplacé, avec ascension et rotation externe du fût fémoral. Pas d’autre lésion osseuse décelable du cadre pelvien.</p>",
    conclusion:
      "<p>Fracture cervicale vraie déplacée du col fémoral gauche (Garden III). Avis orthopédique en urgence.</p>",
  }),
  signed("13", "bakari", "P9LD-2HSX-8NCA", {
    indication:
      "<p>Cervicalgies avec paresthésies du membre supérieur droit depuis deux mois.</p>",
    technique:
      "<p>Séquences sagittales T1, T2 et STIR, axiales T2 du rachis cervical.</p>",
    comparatif: "<p>Absence d’examen antérieur disponible.</p>",
    resultats:
      "<p>Discopathie C5-C6 avec protrusion discale postéro-latérale droite rétrécissant le foramen droit. Pas d’anomalie de signal médullaire.</p>",
    conclusion:
      "<p>Hernie discale C5-C6 postéro-latérale droite à l’origine d’un rétrécissement foraminal, concordante avec la clinique.</p>",
  }),
  signed("15", "me", "W4GA-7RNE-5YTU", {
    indication:
      "<p>Sinusite chronique, bilan avant chirurgie endoscopique.</p>",
    technique:
      "<p>Acquisition hélicoïdale du massif facial sans injection, reconstructions coronales et sagittales.</p>",
    comparatif: "<p>Absence d’examen antérieur disponible.</p>",
    resultats:
      "<p>Comblement muqueux des sinus maxillaires et de l’ethmoïde antérieur, prédominant à droite. Complexe ostio-méatal droit obstrué. Pas de lyse osseuse. Lame criblée symétrique, type II de Keros.</p>",
    conclusion:
      "<p>Pansinusite antérieure prédominant à droite, avec obstruction du complexe ostio-méatal droit. Pas de variante anatomique à risque chirurgical.</p>",
  }),
];

/**
 * Retrouve un compte-rendu de démonstration.
 *
 * @param id Identifiant issu de l'URL.
 * @returns Le compte-rendu, ou `undefined`.
 */
export function findDemoReport(id: string): DemoReport | undefined {
  return DEMO_REPORTS.find((report) => report.id === id);
}

/** Le compte-rendu signé d'un examen, s'il existe. */
export function reportForStudy(studyId: string): DemoReport | undefined {
  return DEMO_REPORTS.find((report) => report.studyId === studyId);
}

/**
 * Un compte-rendu accompagné du contexte de son examen.
 *
 * Les deux listes vivent séparément en base — un compte-rendu référence
 * un examen — mais aucun écran n'affiche jamais l'un sans l'autre : un
 * compte-rendu sans nom de patient ne veut rien dire.
 */
export function reportsWithStudy() {
  return DEMO_REPORTS.map((report) => ({
    report,
    study: DEMO_STUDIES.find((study) => study.id === report.studyId)!,
  })).filter((row) => row.study !== undefined);
}
