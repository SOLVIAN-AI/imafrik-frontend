import type { ReportSections } from "@/components/editor/report-editor";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/report-editor";
import { DEMO_STUDIES } from "@/lib/demo/studies";

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
  signedAt: Date;
  signedBy: string;
  signerTitle: string;
  verifyToken: string;
  sections: ReportSections;
}

const HOUR = 3_600_000;
const now = Date.now();

export const DEMO_REPORTS: DemoReport[] = [
  {
    id: "r-4815",
    studyId: "4",
    signedAt: new Date(now - 2 * HOUR),
    signedBy: "Dr Ibrahim Bakari",
    signerTitle: "Radiologue · Ordre n° TG-1284",
    verifyToken: "K7M2-P4QX-9RTV",
    sections: {
      ...EMPTY_REPORT_SECTIONS,
      indication:
        "<p>Douleurs abdominales diffuses depuis quarante-huit heures, fébricule à 38,2 °C.</p>",
      technique:
        "<p>Acquisition hélicoïdale abdomino-pelvienne avant et après injection de produit de contraste iodé. Reconstructions multiplanaires.</p>",
      comparatif: "<p>Absence d'examen antérieur disponible.</p>",
      resultats:
        '<p style="text-align: justify">Le foie est de taille et de densité normales, sans lésion focale. Les voies biliaires ne sont pas dilatées. La vésicule est alithiasique, à paroi fine.</p><p style="text-align: justify">Appendice augmenté de calibre, mesuré à 11 mm, à paroi épaissie et rehaussée, entouré d\'une infiltration de la graisse péri-appendiculaire. Absence de collection organisée et de pneumopéritoine.</p>',
      conclusion:
        "<p>Aspect tomodensitométrique d'appendicite aiguë non compliquée. Avis chirurgical recommandé.</p>",
    },
  },
  {
    id: "r-4809",
    studyId: "6",
    signedAt: new Date(now - 26 * HOUR),
    signedBy: "Dr Ibrahim Bakari",
    signerTitle: "Radiologue · Ordre n° TG-1284",
    verifyToken: "B3ND-8WZK-2LHF",
    sections: {
      ...EMPTY_REPORT_SECTIONS,
      indication:
        "<p>Lombalgies chroniques avec irradiation dans le membre inférieur droit.</p>",
      technique:
        "<p>Acquisition hélicoïdale du rachis lombaire, reconstructions sagittales et coronales, fenêtres osseuse et parenchymateuse.</p>",
      comparatif: "<p>Radiographies du rachis lombaire du 2 mai 2026.</p>",
      resultats:
        '<p style="text-align: justify">Rectitude du rachis lombaire. Discopathie dégénérative étagée prédominant en L4-L5 et L5-S1, avec pincement discal et ostéophytose marginale.</p><p style="text-align: justify">Débord discal postérieur global en L4-L5, à composante foraminale droite, au contact de la racine L4 droite. Canal lombaire de calibre conservé.</p>',
      conclusion:
        "<p>Discopathie dégénérative étagée. Conflit disco-radiculaire L4-L5 droit, compatible avec la symptomatologie décrite.</p>",
    },
  },
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
