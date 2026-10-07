import fs from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Typographie des textes affichés.
 *
 * Tout texte que l'interface montre (texte JSX, chaîne, gabarit) suit les
 * règles d'écriture du produit :
 *
 * - **pas de tiret long ni de tiret demi-cadratin** dans une phrase : une
 *   phrase se construit avec deux-points, virgules, parenthèses ou un
 *   point. Seul un tiret employé seul, comme valeur absente d'une
 *   cellule, est admis ;
 * - **l'apostrophe typographique** (’), jamais l'apostrophe droite.
 *
 * Le point médian n'est admis qu'entre des données indépendantes
 * (« CT · Thorax ») ; ce jugement ne se mécanise pas et relève de la
 * relecture.
 *
 * Les commentaires, les classes CSS et les imports ne sont pas des textes
 * affichés et ne sont pas examinés.
 */

const ROOT = path.resolve(__dirname, "..");

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.(tsx?|mts)$/.test(entry.name) &&
      !/\.test\.|schema\.d\.ts$/.test(entry.name)
      ? [full]
      : [];
  });
}

/** Textes affichables d'un fichier, avec leur ligne. */
function displayedTexts(file: string): { line: number; text: string }[] {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const found: { line: number; text: string }[] = [];
  const visit = (node: ts.Node) => {
    let text: string | null = null;
    if (ts.isJsxText(node)) text = node.text;
    else if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node)
    )
      text = node.text;
    else if (ts.isTemplateExpression(node))
      text = [
        node.head.text,
        ...node.templateSpans.map((s) => s.literal.text),
      ].join(" ");
    const parent = node.parent;
    const technical =
      parent &&
      (ts.isImportDeclaration(parent) ||
        ts.isExportDeclaration(parent) ||
        (ts.isJsxAttribute(parent) &&
          /^(className|href|src|d|viewBox)$/.test(parent.name.getText())));
    if (text && !technical) {
      found.push({
        line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        text,
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const TEXTS = sources(ROOT).flatMap((file) =>
  displayedTexts(file).map((entry) => ({
    ...entry,
    where: `${path.relative(ROOT, file)}:${entry.line}`,
  })),
);

describe("typographie des textes affichés", () => {
  it("n'emploie pas de tiret long dans une phrase", () => {
    const offenders = TEXTS.filter(
      ({ text }) => /[—–]/.test(text) && !/^\s*[—–]\s*$/.test(text),
    ).map(({ where, text }) => `${where} ${text.trim().slice(0, 80)}`);
    expect(offenders).toEqual([]);
  });

  it("emploie l'apostrophe typographique", () => {
    const offenders = TEXTS.filter(({ text }) => /\p{L}'\p{L}/u.test(text)).map(
      ({ where, text }) => `${where} ${text.trim().slice(0, 80)}`,
    );
    expect(offenders).toEqual([]);
  });
});
