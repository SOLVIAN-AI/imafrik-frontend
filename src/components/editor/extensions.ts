import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Extension, textInputRule } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { SectionNavigation } from "@/components/editor/navigation";
import { SearchHighlight } from "@/components/editor/search";
import { SlashCommands } from "@/components/editor/slash-commands";

/**
 * Remplacements typographiques à la frappe.
 *
 * Les comptes-rendus sont pleins de mesures et de comparaisons ; taper
 * « ± » ou « ≤ » au clavier français demande une gymnastique que
 * personne ne fait — on écrit alors « +/- », et c'est ce qui finit
 * imprimé. Ici, la séquence usuelle devient le bon signe au moment où on
 * la tape ; un Ctrl+Z immédiat rend la séquence d'origine.
 */
const MedicalTypography = Extension.create({
  name: "medicalTypography",
  addInputRules() {
    return [
      textInputRule({ find: /->$/, replace: "→" }),
      textInputRule({ find: /<-$/, replace: "←" }),
      textInputRule({ find: /\+\/-$/, replace: "±" }),
      textInputRule({ find: /<=$/, replace: "≤" }),
      textInputRule({ find: />=$/, replace: "≥" }),
      textInputRule({ find: /\.\.\.$/, replace: "…" }),
    ];
  },
});

/**
 * Extensions d'une section du compte-rendu.
 *
 * **La palette d'un traitement de texte, bornée par le document signé.**
 * Chaque format offert ici a son rendu dans le PDF et passe le filtre du
 * service (`report_html.py`) : un format que l'éditeur accepterait mais
 * que la signature effacerait serait pire que pas de format du tout — le
 * radiologue signerait autre chose que ce qu'il a vu.
 *
 * - texte : gras, italique, souligné, barré, surligné, exposant
 *   (cm², mm³), indice ;
 * - structure : sous-titres (un seul niveau — « Foie », « Reins »),
 *   listes à puces et numérotées, tableaux de mesures ;
 * - alignement des paragraphes et sous-titres ;
 * - annuler / rétablir, compteur, remplacements typographiques,
 *   surlignage de la recherche (voir `search.ts`).
 *
 * Restent exclus, à dessein : polices, tailles et couleurs libres, liens,
 * images, code, citations. Ils produiraient des documents hétérogènes là
 * où l'uniformité fait la lisibilité, et rien de tout cela n'a sa place
 * dans un compte-rendu médical.
 *
 * Le soulignement n'est **pas** ajouté séparément : StarterKit le fournit
 * déjà, et le déclarer deux fois déstabilise l'éditeur.
 *
 * @param options.placeholder Texte de substitution de la section.
 * @param options.commands    Menu « / » et navigation au clavier entre
 *                            sections (`navigation.ts`) — seulement pour
 *                            un éditeur modifiable.
 */
export function sectionExtensions({
  placeholder = "",
  commands = false,
}: {
  placeholder?: string;
  commands?: boolean;
} = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [3] },
      codeBlock: false,
      code: false,
      horizontalRule: false,
      blockquote: false,
      link: false,
    }),
    TextAlign.configure({
      types: ["paragraph", "heading"],
      defaultAlignment: "left",
    }),
    Highlight,
    Subscript,
    Superscript,
    TableKit.configure({ table: { resizable: false } }),
    MedicalTypography,
    Placeholder.configure({ placeholder }),
    CharacterCount,
    // Surlignage de la recherche : de simples décorations, invisibles du
    // document enregistré — sans effet tant qu'on ne cherche rien.
    SearchHighlight,
    ...(commands ? [SlashCommands] : []),
    ...(commands ? [SectionNavigation] : []),
  ];
}

/**
 * Classes de rendu du texte, partagées par l'éditeur et le document signé.
 *
 * Un seul endroit : un compte-rendu doit avoir exactement la même allure
 * pendant la rédaction, dans la fiche de la clinique et — au plus près
 * que le permet un écran — dans le PDF.
 */
export const DOCUMENT_TEXT_CLASSES = [
  // Mesure de ligne limitée : au-delà d'environ 70 caractères, l'œil
  // perd la ligne suivante en revenant à la marge.
  "max-w-[68ch]",
  "text-[0.9375rem] leading-[1.75]",
  "[&_p]:min-h-[1.75em]",
  // Un interligne entre paragraphes, jamais d'alinéa : la convention du
  // document administratif et médical français.
  "[&_p+p]:mt-3",
  "[&_strong]:font-semibold",
  "[&_s]:text-tertiary",
  "[&_mark]:rounded-[3px] [&_mark]:bg-progress-muted [&_mark]:px-0.5 [&_mark]:text-primary",
  "[&_sub]:text-[0.75em] [&_sup]:text-[0.75em]",
  "[&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-[0.9375rem] [&_h3]:font-semibold [&_h3]:first:mt-0",
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li_p]:min-h-0",
  // Tableaux de mesures : traits fins, en-tête discret, chiffres alignés.
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_td]:border [&_td]:border-border-default [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:align-top",
  "[&_th]:border [&_th]:border-border-default [&_th]:bg-surface-sunken [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium",
  "[&_td_p]:min-h-0 [&_th_p]:min-h-0 [&_td]:tabular-nums",
  "[&_.selectedCell]:bg-accent-muted",
].join(" ");
