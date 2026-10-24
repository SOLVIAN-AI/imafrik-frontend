/**
 * Lecture d'un sous-ensemble de Markdown, pour les textes contractuels.
 *
 * Les engagements (`lib/agreements.ts`) sont rédigés en Markdown et servis
 * tels quels par le service. On ne les injecte **jamais** comme du HTML :
 * ce module les découpe en blocs typés, que le composant de lecture rend
 * en éléments React. Aucune balise, aucun lien, aucune image ne peut donc
 * sortir d'un texte, même altéré en transit : au pire, il s'affiche en
 * clair.
 *
 * Sous-ensemble reconnu, celui des contrats et rien d'autre :
 *
 * - titres `#`, `##`, `###` ;
 * - paragraphes (lignes consécutives, réunies par une espace) ;
 * - listes à puces (`- ` ou `* `) et numérotées (`1. `) ;
 * - tableaux à barres verticales, avec leur ligne de séparation ;
 * - gras `**…**` et italique `*…*` ou `_…_`.
 *
 * Un éventuel en-tête de métadonnées (`---` … `---`) est ignoré : le
 * service le retire déjà, mais un texte qui le contiendrait ne doit pas
 * l'afficher.
 */

/** Un fragment de texte, avec sa mise en valeur. */
export interface Inline {
  text: string;
  strong?: boolean;
  em?: boolean;
}

/** Un bloc du document. */
export type Block =
  | { type: "heading"; level: 1 | 2 | 3; inlines: Inline[] }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "table"; header: Inline[][]; rows: Inline[][][] };

const HEADING = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const ORDERED = /^\s*\d{1,3}[.)]\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_SEPARATOR = /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/;

/**
 * Découpe une ligne de tableau en cellules.
 *
 * @param line Ligne `| a | b |`.
 */
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/**
 * Lit la mise en valeur d'une ligne de texte.
 *
 * Les marques non fermées restent du texte : un astérisque isolé, dans
 * « 12 500 FCFA* », ne doit pas faire basculer la suite en italique.
 *
 * @param source Texte d'une ligne ou d'un paragraphe.
 */
export function parseInlines(source: string): Inline[] {
  const inlines: Inline[] = [];
  const pattern =
    /\*\*(.+?)\*\*|\*(?!\s)(.+?)(?<!\s)\*|(?<![\p{L}\p{N}])_(?!\s)(.+?)(?<!\s)_(?![\p{L}\p{N}])/gu;
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) inlines.push({ text: source.slice(last, index) });
    if (match[1] !== undefined) inlines.push({ text: match[1], strong: true });
    else inlines.push({ text: match[2] ?? match[3] ?? "", em: true });
    last = index + match[0].length;
  }
  if (last < source.length) inlines.push({ text: source.slice(last) });
  return inlines.filter((inline) => inline.text.length > 0);
}

/**
 * Retire un en-tête de métadonnées `---` … `---` placé en tête du texte.
 *
 * @param lines Lignes du document.
 */
function withoutFrontMatter(lines: string[]): string[] {
  if (lines[0]?.trim() !== "---") return lines;
  const end = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );
  return end === -1 ? lines : lines.slice(end + 1);
}

/**
 * Découpe un texte contractuel en blocs.
 *
 * @param markdown Texte reçu du service.
 * @returns Les blocs, dans l'ordre du texte.
 */
export function parseAgreementMarkdown(markdown: string): Block[] {
  const lines = withoutFrontMatter(
    markdown.replace(/\r\n?/g, "\n").split("\n"),
  );
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({
      type: "paragraph",
      inlines: parseInlines(paragraph.join(" ")),
    });
    paragraph = [];
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      index += 1;
      continue;
    }

    const heading = HEADING.exec(trimmed);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        inlines: parseInlines(heading[2]),
      });
      index += 1;
      continue;
    }

    // Un tableau : une ligne d'en-tête suivie de sa ligne de séparation.
    if (
      TABLE_ROW.test(line) &&
      index + 1 < lines.length &&
      TABLE_SEPARATOR.test(lines[index + 1])
    ) {
      flushParagraph();
      const header = cells(line).map(parseInlines);
      const rows: Inline[][][] = [];
      index += 2;
      while (index < lines.length && TABLE_ROW.test(lines[index])) {
        rows.push(cells(lines[index]).map(parseInlines));
        index += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    const bullet = BULLET.exec(line);
    const ordered = bullet ? null : ORDERED.exec(line);
    if (bullet || ordered) {
      flushParagraph();
      const isOrdered = ordered !== null;
      const marker = isOrdered ? ORDERED : BULLET;
      const items: Inline[][] = [];
      let current: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index];
        const item = marker.exec(candidate);
        if (item) {
          if (current.length > 0) items.push(parseInlines(current.join(" ")));
          current = [item[1]];
        } else if (candidate.trim() !== "" && /^\s{2,}/.test(candidate)) {
          // Ligne indentée : suite de l'élément précédent.
          current.push(candidate.trim());
        } else {
          break;
        }
        index += 1;
      }
      if (current.length > 0) items.push(parseInlines(current.join(" ")));
      blocks.push({ type: "list", ordered: isOrdered, items });
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }
  flushParagraph();
  return blocks;
}
