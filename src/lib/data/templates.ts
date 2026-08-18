import type { ReportSections } from "@/components/editor/report-editor";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/report-editor";
import { apiFetch, isApiConfigured } from "@/lib/api/client";
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
  modality: string;
  bodyPart: string | null;
  sections: ReportSections;
  /** Modèle fourni par IMAFRIK, par opposition à un modèle personnel. */
  shared: boolean;
}

const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  modality: z.string(),
  body_part: z.string().nullable().default(null),
  sections: z.record(z.string(), z.string()),
  is_shared: z.boolean().default(false),
});

/** Modèles de démonstration, un par modalité courante. */
const DEMO_TEMPLATES: ReportTemplate[] = [
  {
    id: "t-ct-thorax",
    name: "TDM thoracique — normal",
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
    name: "IRM encéphalique — normale",
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
    name: "Radiographie thoracique — normale",
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
 * Les modèles partagés viennent d'IMAFRIK ; les modèles personnels
 * appartiennent au radiologue et ne sont visibles que de lui — les
 * politiques RLS s'en chargent.
 */
export async function listTemplates(): Promise<ReportTemplate[]> {
  if (!isApiConfigured()) return DEMO_TEMPLATES;

  const raw = await apiFetch<unknown>("/templates");
  return z
    .array(templateSchema)
    .parse(raw)
    .map((row) => ({
      id: row.id,
      name: row.name,
      modality: row.modality,
      bodyPart: row.body_part,
      shared: row.is_shared,
      sections: { ...EMPTY_REPORT_SECTIONS, ...row.sections },
    }));
}
