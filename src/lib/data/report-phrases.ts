/**
 * Phrases types du menu « / » des comptes-rendus.
 *
 * Ce sont des **données** : du texte de compte-rendu, inséré tel quel
 * dans le document. Elles suivent donc la **langue du compte-rendu**
 * (celle du contrat de la clinique), pas celle de l'écran : un radiologue
 * francophone qui rédige pour une clinique anglophone insère des phrases
 * anglaises. Seuls les intitulés du menu suivent l'écran
 * (`reading.slash`).
 *
 * Les deux listes ont les mêmes identifiants, dans le même ordre.
 *
 * Chaque entrée : identifiant, texte inséré, mots-clés supplémentaires
 * reconnus par le filtre. Les champs entre crochets (« [taille] ») sont
 * sélectionnés à l'insertion, puis parcourus avec Tab.
 */

import type { Locale } from "@/lib/i18n/locale";

/** Une phrase type : identifiant, texte, mots-clés. */
export type ReportPhrase = [id: string, text: string, keywords?: string];

/** Phrases types françaises, dans l'ordre du menu. */
const PHRASES_FR: ReportPhrase[] = [
  ["normal", "Examen sans anomalie significative.", "normal rien"],
  ["no-anomaly", "Absence d’anomalie décelable.", "normal"],
  [
    "no-comparison",
    "Absence d’examen antérieur disponible pour comparaison.",
    "comparatif anterieur",
  ],
  [
    "pleura",
    "Absence d’épanchement pleural ou péricardique.",
    "thorax plevre poumon",
  ],
  [
    "mediastinum",
    "Pas d’adénomégalie médiastinale ni hilaire.",
    "thorax ganglion adenopathie",
  ],
  [
    "liver",
    "Foie de taille et de morphologie normales, sans lésion focale.",
    "abdomen hepatique",
  ],
  [
    "biliary",
    "Absence de dilatation des voies biliaires intra- et extra-hépatiques.",
    "abdomen vesicule bile",
  ],
  [
    "kidneys",
    "Reins de taille et de morphologie normales, sans dilatation des cavités pyélocalicielles.",
    "abdomen rein urinaire",
  ],
  [
    "peritoneum",
    "Absence d’épanchement intra-péritonéal.",
    "abdomen ascite liquide",
  ],
  ["bones", "Structures osseuses sans lésion suspecte.", "os squelette"],
  [
    "comparison-dated",
    "Comparaison avec l’examen du [date] : [évolution].",
    "comparatif anterieur evolution date",
  ],
  [
    "lesion-measure",
    "Lésion [nature] de [taille] x [taille] mm, [localisation].",
    "mesure lesion taille masse",
  ],
  [
    "nodule",
    "Nodule [solide] du [lobe], mesurant [taille] mm.",
    "poumon nodule thorax mesure",
  ],
  [
    "fracture",
    "Fracture [type] de [segment osseux] [côté], [déplacement].",
    "os fracture trauma",
  ],
  [
    "correlation",
    "Confrontation clinico-biologique recommandée.",
    "conclusion clinique",
  ],
  ["follow-up", "Contrôle à distance conseillé.", "conclusion suivi"],
  ["specialist", "Avis spécialisé recommandé.", "conclusion chirurgie avis"],
];

/** Phrases types anglaises, mêmes identifiants et même ordre. */
const PHRASES_EN: ReportPhrase[] = [
  ["normal", "No significant abnormality.", "normal unremarkable"],
  ["no-anomaly", "No detectable abnormality.", "normal"],
  [
    "no-comparison",
    "No prior examination available for comparison.",
    "comparison prior previous",
  ],
  ["pleura", "No pleural or pericardial effusion.", "chest thorax pleura lung"],
  [
    "mediastinum",
    "No mediastinal or hilar lymphadenopathy.",
    "chest thorax node lymph",
  ],
  [
    "liver",
    "Liver normal in size and morphology, with no focal lesion.",
    "abdomen hepatic",
  ],
  [
    "biliary",
    "No intrahepatic or extrahepatic biliary dilatation.",
    "abdomen gallbladder bile duct",
  ],
  [
    "kidneys",
    "Kidneys normal in size and morphology, with no pelvicalyceal dilatation.",
    "abdomen kidney renal urinary hydronephrosis",
  ],
  ["peritoneum", "No intraperitoneal free fluid.", "abdomen ascites fluid"],
  ["bones", "No suspicious bone lesion.", "bone skeleton osseous"],
  [
    "comparison-dated",
    "Compared with the examination of [date]: [change].",
    "comparison prior previous change date",
  ],
  [
    "lesion-measure",
    "[Nature] lesion measuring [size] x [size] mm, [location].",
    "measure lesion size mass",
  ],
  [
    "nodule",
    "[Solid] nodule in the [lobe], measuring [size] mm.",
    "lung nodule chest thorax measure",
  ],
  [
    "fracture",
    "[Type] fracture of the [side] [bone segment], [displacement].",
    "bone fracture trauma",
  ],
  [
    "correlation",
    "Correlation with clinical and laboratory findings is recommended.",
    "conclusion clinical",
  ],
  ["follow-up", "Follow-up imaging is advised.", "conclusion follow-up"],
  [
    "specialist",
    "Specialist referral is recommended.",
    "conclusion surgery surgical opinion",
  ],
];

/**
 * Phrases types proposées, par langue du compte-rendu, dans l'ordre du
 * menu.
 */
export const REPORT_PHRASES: Record<Locale, ReportPhrase[]> = {
  fr: PHRASES_FR,
  en: PHRASES_EN,
};
