/**
 * Structure d'un compte-rendu : ses sections et les règles qui s'y
 * rattachent.
 *
 * Module pur, sans React : l'éditeur, la relecture, la signature et les
 * tests en dépendent tous, sans dépendre les uns des autres.
 */

/**
 * Sections d'un compte-rendu, dans l'ordre où elles sont dictées.
 *
 * Cet ordre est celui de la pratique radiologique, pas un choix
 * d'interface : on rappelle la question posée, on dit comment on a
 * regardé, on compare à l'antérieur, on décrit, puis on conclut. Les
 * clés correspondent exactement au champ `sections` du schéma.
 *
 * Les intitulés et les textes de substitution vivent dans les textes de
 * l'application (`reading.sections`) : les intitulés s'affichent dans la
 * langue du compte-rendu, les textes de substitution dans celle de
 * l'utilisateur.
 */
export const REPORT_SECTIONS = [
  { key: "indication", required: true },
  { key: "technique", required: false },
  { key: "comparatif", required: false },
  { key: "resultats", required: true },
  { key: "conclusion", required: true },
] as const;

export type SectionKey = (typeof REPORT_SECTIONS)[number]["key"];
export type ReportSections = Record<SectionKey, string>;

/** Un compte-rendu vierge : toutes les sections présentes, toutes vides. */
export const EMPTY_REPORT_SECTIONS: ReportSections = Object.fromEntries(
  REPORT_SECTIONS.map((section) => [section.key, ""]),
) as ReportSections;

/**
 * Indique si une section est vide de tout texte.
 *
 * L'éditeur ne rend jamais une chaîne vide : une section dans laquelle on
 * a seulement cliqué vaut `<p></p>`. Comparer à `""` laisserait donc
 * signer un compte-rendu sans conclusion.
 *
 * @param html Contenu HTML de la section.
 * @returns `true` s'il ne reste aucun caractère une fois le balisage ôté.
 */
export function isSectionEmpty(html: string | undefined): boolean {
  if (!html) return true;
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length === 0
  );
}

/**
 * Liste les sections obligatoires encore vides.
 *
 * Signer engage la responsabilité du radiologue : le contrôle est fait
 * ici, à l'écran, pour qu'il soit expliqué avant l'envoi — et refait côté
 * serveur, parce qu'un contrôle d'interface n'est pas une garantie.
 *
 * @param sections Contenu courant du compte-rendu.
 * @returns Les clés des sections manquantes, dans l'ordre du document ;
 *          l'écran les nomme dans la langue du compte-rendu.
 */
export function missingRequiredSections(
  sections: ReportSections,
): SectionKey[] {
  return REPORT_SECTIONS.filter(
    (section) => section.required && isSectionEmpty(sections[section.key]),
  ).map((section) => section.key);
}

/** Nombre de mots d'un fragment HTML — pour le compteur du document. */
export function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}
