/**
 * Structure d'un compte-rendu : ses sections et les règles qui s'y
 * rattachent.
 *
 * Module pur, sans React : l'éditeur, la relecture, la signature et les
 * tests en dépendent tous, sans dépendre les uns des autres.
 *
 * **Deux mises en page, au choix du radiologue** (`ReportLayout`) :
 *
 * - la **découpe proposée** (`structured`) : cinq sections, dans l'ordre
 *   de la pratique radiologique ;
 * - la **feuille blanche** (`free`) : un texte libre (`corps`), mis en
 *   forme à sa façon, puis une conclusion distincte, toujours
 *   obligatoire : c'est elle que le médecin demandeur lit en premier.
 *
 * La conclusion porte la même clé dans les deux : passer de l'une à
 * l'autre ne la touche jamais. Tout le reste du document (en-tête,
 * logos, identité, signature, cachet, QR) est produit par le service,
 * à l'identique dans les deux mises en page.
 */

/** Mise en page du texte d'un compte-rendu, celle de `reports.layout`. */
export type ReportLayout = "structured" | "free";

/** Les deux mises en page, dans l'ordre où l'éditeur les propose. */
export const REPORT_LAYOUTS: readonly ReportLayout[] = ["structured", "free"];

/** Mise en page par défaut : celle de tout compte-rendu d'avant le choix. */
export const DEFAULT_LAYOUT: ReportLayout = "structured";

/** Vrai pour une mise en page connue. */
export function isReportLayout(value: unknown): value is ReportLayout {
  return value === "structured" || value === "free";
}

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

/**
 * Sections de la feuille blanche : le texte libre, puis la conclusion.
 * Les deux sont obligatoires.
 */
export const FREE_SECTIONS = [
  { key: "corps", required: true },
  { key: "conclusion", required: true },
] as const;

export type SectionKey =
  | (typeof REPORT_SECTIONS)[number]["key"]
  | (typeof FREE_SECTIONS)[number]["key"];
export type ReportSections = Record<SectionKey, string>;

/** Une section, telle qu'une mise en page la déclare. */
export interface SectionSpec {
  key: SectionKey;
  required: boolean;
}

/**
 * Sections d'une mise en page, dans l'ordre du document.
 *
 * @param layout Mise en page du compte-rendu.
 */
export function sectionsOf(layout: ReportLayout): readonly SectionSpec[] {
  return layout === "free" ? FREE_SECTIONS : REPORT_SECTIONS;
}

/** Toutes les clés qu'un compte-rendu peut porter, toutes mises en page. */
export const ALL_SECTION_KEYS: readonly SectionKey[] = [
  ...REPORT_SECTIONS.map((section) => section.key),
  "corps",
];

/**
 * Un compte-rendu vierge : toutes les sections présentes, toutes vides,
 * celles des deux mises en page.
 */
export const EMPTY_REPORT_SECTIONS: ReportSections = Object.fromEntries(
  ALL_SECTION_KEYS.map((key) => [key, ""]),
) as ReportSections;

/**
 * Le texte d'une mise en page, et lui seul : ce qui part au service.
 *
 * Le service refuse une clé étrangère à la mise en page, et retire de la
 * base celles de l'autre : rien de ce qui n'est pas à l'écran ne doit
 * survivre dans le brouillon.
 *
 * @param sections Contenu de l'éditeur.
 * @param layout   Mise en page du compte-rendu.
 */
export function sectionsForLayout(
  sections: ReportSections,
  layout: ReportLayout,
): Partial<ReportSections> {
  return Object.fromEntries(
    sectionsOf(layout).map((section) => [
      section.key,
      sections[section.key] ?? "",
    ]),
  );
}

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
  layout: ReportLayout = DEFAULT_LAYOUT,
): SectionKey[] {
  return sectionsOf(layout)
    .filter(
      (section) => section.required && isSectionEmpty(sections[section.key]),
    )
    .map((section) => section.key);
}

/** Vrai si aucune section de la mise en page ne porte de texte. */
export function isReportBlank(
  sections: ReportSections,
  layout: ReportLayout,
): boolean {
  return sectionsOf(layout).every((section) =>
    isSectionEmpty(sections[section.key]),
  );
}

/** Échappe un intitulé avant de l'insérer comme HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Passe de la découpe proposée à la feuille blanche, sans rien perdre.
 *
 * Les rubriques qui portent du texte sont fusionnées dans le texte libre,
 * chacune sous son intitulé, devenu un sous-titre que le radiologue garde,
 * renomme ou efface. La conclusion reste la conclusion. Une rubrique vide
 * ne laisse pas d'intitulé orphelin.
 *
 * @param sections Contenu en découpe proposée.
 * @param titles   Intitulés des sections, dans la langue du compte-rendu.
 * @returns Le contenu en feuille blanche ; les rubriques sont vidées.
 */
export function toFreeLayout(
  sections: ReportSections,
  titles: Record<SectionKey, string>,
): ReportSections {
  const corps = REPORT_SECTIONS.filter(
    (section) =>
      section.key !== "conclusion" && !isSectionEmpty(sections[section.key]),
  )
    .map(
      (section) =>
        `<h3>${escapeHtml(titles[section.key])}</h3>${sections[section.key]}`,
    )
    .join("");
  return {
    ...EMPTY_REPORT_SECTIONS,
    corps,
    conclusion: sections.conclusion ?? "",
  };
}

/**
 * Passe de la feuille blanche à la découpe proposée, sans rien perdre.
 *
 * Le texte libre ne se redécoupe pas tout seul : deviner où finit
 * l'indication et où commencent les résultats serait réécrire le texte du
 * radiologue. Il va donc, entier, dans « Résultats », où il le répartit
 * lui-même s'il le souhaite. L'écran le dit avant de le faire.
 *
 * @param sections Contenu en feuille blanche.
 * @returns Le contenu en découpe proposée ; le texte libre est vidé.
 */
export function toStructuredLayout(sections: ReportSections): ReportSections {
  return {
    ...EMPTY_REPORT_SECTIONS,
    resultats: sections.corps ?? "",
    conclusion: sections.conclusion ?? "",
  };
}

/** Nombre de mots d'un fragment HTML — pour le compteur du document. */
export function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}
