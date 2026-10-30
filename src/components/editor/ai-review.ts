import {
  DEFAULT_LAYOUT,
  type ReportLayout,
  type ReportSections,
  type SectionKey,
  sectionsOf,
} from "@/components/editor/sections";
import { plainText } from "@/components/editor/review";

/**
 * Relecture avancée d'un brouillon, par IA : ce que l'écran en fait.
 *
 * Le service relit le brouillon **enregistré** et rend des signalements :
 * un passage cité mot pour mot, son type, une phrase d'explication. Il a
 * déjà vérifié que chaque citation existe dans le texte ; ce module, lui,
 * suit ce que ces signalements deviennent pendant que le radiologue
 * corrige :
 *
 * - un signalement dont le passage a disparu du texte est tenu pour
 *   **corrigé** ({@link stillPresent}) ;
 * - une relecture faite sur un texte qui a changé depuis est **périmée**
 *   ({@link reviewSignature}) : ses signalements restent affichés, avec
 *   l'invitation à relire de nouveau.
 *
 * L'IA signale, elle ne décide de rien : aucun de ces états ne bloque la
 * signature. Fonctions pures, testées à part.
 *
 * **Feuille blanche.** Le service présente le texte libre au modèle comme
 * des résultats (`sections.review_sections`) : une citation des
 * « résultats » se cherche, et se retrouve, dans le texte libre.
 */

/** Types de signalement, tels que le service les définit. */
export type AiFindingKind =
  | "contradiction"
  | "omission"
  | "laterality"
  | "context_mismatch"
  | "measurement"
  | "question_unanswered"
  | "critical_finding";

/**
 * Où se trouve un passage cité : une section de la découpe proposée, ou la
 * demande de la clinique. Le service ne connaît pas le texte libre.
 */
export type AiSource = Exclude<SectionKey, "corps"> | "clinical_info";

/** Un signalement de la relecture par IA. */
export interface AiFinding {
  /** Rang dans la réponse du service : c'est lui qu'on renvoie avec la décision. */
  index: number;
  kind: AiFindingKind;
  section: AiSource;
  /** Passage cité, présent mot pour mot dans la section au moment de la relecture. */
  quote: string;
  relatedSection: AiSource | null;
  relatedQuote: string | null;
  /** Une phrase d'explication, dans la langue de l'interface. */
  note: string;
}

/** Ce qu'une relecture a rendu. */
export interface AiReviewResult {
  /** Exécution à rappeler avec chaque décision ; `null` si rien n'a été appelé. */
  runId: string | null;
  /**
   * Faux si le modèle n'a pas répondu utilement : la liste vide ne vaut
   * alors pas « rien à signaler ».
   */
  available: boolean;
  findings: AiFinding[];
}

/** Resserre les espaces : un retour à la ligne n'est pas un écart de texte. */
function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Empreinte du texte relu.
 *
 * Deux brouillons de même empreinte se lisent pareil : la mise en forme
 * (gras, listes) n'y entre pas, seul le texte compte. Sert à savoir si
 * une relecture porte encore sur ce que le radiologue a sous les yeux.
 *
 * @param sections Sections du brouillon, en HTML.
 * @param layout   Mise en page du brouillon : changer de mise en page
 *                 change ce que le service relit.
 */
export function reviewSignature(
  sections: ReportSections,
  layout: ReportLayout = DEFAULT_LAYOUT,
): string {
  return [
    layout,
    ...sectionsOf(layout).map((section) =>
      flat(plainText(sections[section.key] ?? "")),
    ),
  ].join("␞");
}

/**
 * Section de l'éditeur où mener le radiologue pour un signalement.
 *
 * Le renseignement clinique n'est pas une section : la question qu'il
 * pose se traite dans l'indication.
 *
 * En feuille blanche, tout ce qui n'est pas la conclusion se trouve dans
 * le texte libre.
 *
 * @param source Source du passage cité.
 * @param layout Mise en page du brouillon.
 */
export function editorSection(
  source: AiSource,
  layout: ReportLayout = DEFAULT_LAYOUT,
): SectionKey {
  if (layout === "free")
    return source === "conclusion" ? "conclusion" : "corps";
  return source === "clinical_info" ? "indication" : source;
}

/**
 * Dit si le passage signalé est encore dans le texte.
 *
 * Un passage qui a disparu a été corrigé, ou réécrit : dans les deux
 * cas le signalement n'a plus d'objet. Une citation du renseignement
 * clinique, que le radiologue ne modifie pas, reste toujours présente.
 *
 * @param finding  Signalement.
 * @param sections Sections du brouillon, en HTML.
 * @param layout   Mise en page du brouillon.
 */
export function stillPresent(
  finding: Pick<AiFinding, "section" | "quote">,
  sections: ReportSections,
  layout: ReportLayout = DEFAULT_LAYOUT,
): boolean {
  if (finding.section === "clinical_info") return true;
  const text = flat(
    plainText(sections[editorSection(finding.section, layout)] ?? ""),
  );
  return text.includes(flat(finding.quote));
}
