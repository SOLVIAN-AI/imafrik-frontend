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
 */
export const REPORT_SECTIONS = [
  {
    key: "indication",
    title: "Indication clinique",
    placeholder: "Motif de l’examen, renseignement clinique transmis…",
    required: true,
  },
  {
    key: "technique",
    title: "Technique",
    placeholder: "Protocole d’acquisition, injection, reconstructions…",
    required: false,
  },
  {
    key: "comparatif",
    title: "Comparatif",
    placeholder: "Examens antérieurs disponibles, ou absence de comparatif…",
    required: false,
  },
  {
    key: "resultats",
    title: "Résultats",
    placeholder: "Description par organe…",
    required: true,
  },
  {
    key: "conclusion",
    title: "Conclusion",
    placeholder: "Synthèse diagnostique.",
    required: true,
  },
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
 * @returns Les intitulés manquants, dans l'ordre du document.
 */
export function missingRequiredSections(sections: ReportSections): string[] {
  return REPORT_SECTIONS.filter(
    (section) => section.required && isSectionEmpty(sections[section.key]),
  ).map((section) => section.title);
}

/** Nombre de mots d'un fragment HTML — pour le compteur du document. */
export function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}
