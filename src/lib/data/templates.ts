import "server-only";

import type { ReportSections } from "@/components/editor/sections";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/sections";
import { apiGet } from "@/lib/api/client";
import { templateSchema } from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { z } from "zod";

/**
 * Un modèle de compte-rendu.
 *
 * Il ne pré-remplit pas un document : il donne un **squelette** de
 * phrases normales, que le radiologue corrige là où l'examen s'écarte de
 * la normale. C'est ce qui fait gagner du temps sur les examens sans
 * anomalie — l'essentiel du volume — sans pousser à signer un texte
 * qu'on n'a pas relu.
 */
export interface ReportTemplate {
  id: string;
  name: string;
  /** Modalité visée ; `null` pour un modèle valable quelle que soit la modalité. */
  modality: string | null;
  bodyPart: string | null;
  sections: ReportSections;
  /**
   * Modèle fourni par IMAFRIK à toutes les organisations, par opposition
   * à un modèle propre à l'organisation active.
   */
  shared: boolean;
}

/** Modèles de démonstration, un par modalité courante. */
const DEMO_TEMPLATES: ReportTemplate[] = [
  {
    // Modèle à champs : Tab parcourt [taille], [segment]… dans l'ordre.
    id: "t-us-abdomen",
    name: "Échographie abdominale avec mesures",
    modality: "US",
    bodyPart: "Abdomen",
    shared: true,
    sections: {
      ...EMPTY_REPORT_SECTIONS,
      technique:
        "<p>Échographie abdominale par voie sous-costale et intercostale.</p>",
      comparatif: "<p>Comparaison avec l’examen du [date].</p>",
      resultats:
        "<p>Foie de [taille] cm sur la ligne médio-claviculaire, d’échostructure [homogène]. Vésicule biliaire [alithiasique], paroi fine. Voies biliaires non dilatées.</p><p>Rein droit de [taille] mm, rein gauche de [taille] mm, sans dilatation des cavités. Rate de [taille] mm.</p>",
      conclusion: "<p>[Conclusion].</p>",
    },
  },
  {
    id: "t-ct-thorax",
    name: "TDM thoracique normale",
    modality: "CT",
    bodyPart: "Thorax",
    shared: true,
    sections: {
      ...EMPTY_REPORT_SECTIONS,
      technique:
        "<p>Acquisition hélicoïdale thoracique, coupes millimétriques, reconstructions en fenêtres médiastinale et parenchymateuse.</p>",
      resultats:
        '<p style="text-align: justify">Absence d’épanchement pleural ou péricardique. Pas d’adénomégalie médiastinale ou hilaire. Parenchyme pulmonaire de transparence normale, sans foyer de condensation ni nodule suspect. Arbre trachéo-bronchique perméable.</p>',
      conclusion: "<p>Examen tomodensitométrique thoracique sans anomalie.</p>",
    },
  },
  {
    id: "t-mr-crane",
    name: "IRM encéphalique normale",
    modality: "MR",
    bodyPart: "Crâne",
    shared: true,
    sections: {
      ...EMPTY_REPORT_SECTIONS,
      technique:
        "<p>Séquences axiales T1, T2, FLAIR et diffusion. Coupes sagittales T1.</p>",
      resultats:
        '<p style="text-align: justify">Absence d’anomalie de signal du parenchyme cérébral. Structures de la ligne médiane en place. Système ventriculaire de morphologie et de taille normales. Pas de prise de contraste anormale.</p>',
      conclusion: "<p>IRM encéphalique sans anomalie décelable.</p>",
    },
  },
  {
    id: "t-cr-thorax",
    name: "Radiographie thoracique normale",
    modality: "CR",
    bodyPart: "Thorax",
    shared: true,
    sections: {
      ...EMPTY_REPORT_SECTIONS,
      technique: "<p>Cliché de face, en inspiration, debout.</p>",
      resultats:
        '<p style="text-align: justify">Transparence pulmonaire normale et symétrique. Culs-de-sac pleuraux libres. Silhouette cardio-médiastinale de taille normale. Coupoles diaphragmatiques régulières.</p>',
      conclusion: "<p>Radiographie thoracique sans anomalie.</p>",
    },
  },
];

/**
 * Modèles disponibles pour l'utilisateur courant.
 *
 * Les modèles partagés viennent d'IMAFRIK ; les autres appartiennent à
 * l'organisation active — les politiques RLS s'en chargent.
 *
 * @param modality Restreint aux modèles de cette modalité, plus ceux
 *                 valables pour toutes.
 */
export async function listTemplates(
  modality?: string,
): Promise<ReportTemplate[]> {
  if (isDemoMode()) {
    return DEMO_TEMPLATES.filter(
      (template) =>
        !modality ||
        template.modality === null ||
        template.modality === modality,
    );
  }

  const rows = await apiGet("/templates", z.array(templateSchema));
  return rows
    .filter(
      (row) => !modality || row.modality === null || row.modality === modality,
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      modality: row.modality,
      bodyPart: row.body_part,
      shared: row.organization_id === null,
      sections: { ...EMPTY_REPORT_SECTIONS, ...row.sections },
    }));
}
