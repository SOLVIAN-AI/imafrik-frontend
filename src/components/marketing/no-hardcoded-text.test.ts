import fs from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Aucun texte écrit en dur dans les composants de la vitrine.
 *
 * Le test général (`i18n/no-hardcoded-text.test.ts`) laisse le site public
 * hors de son champ : ses textes vivent dans `src/content/marketing`, et
 * une phrase anglaise écrite dans un composant lui échapperait de toute
 * façon. Celui-ci couvre la vitrine, dans les deux langues : tout texte
 * JSX qui contient une lettre, et tout attribut lu par un lecteur d'écran
 * (`alt`, `aria-label`, `title`, `placeholder`) écrit en toutes lettres,
 * est une erreur. Les textes viennent des dictionnaires (`fr.ts`, `en.ts`),
 * qui garantissent par leur type qu'aucune langue n'en oublie.
 *
 * Hors champ : les pages juridiques, rédigées plutôt que composées, qui
 * ont une version par langue dans `legal/` ; le gabarit qui les présente ;
 * les tests.
 */

const ROOT = path.resolve(__dirname);

/** Fichiers et dossiers hors champ, relatifs à ce dossier. */
const EXCLUDED = [/^legal\//, /^legal-page\.tsx$/, /\.test\.tsx?$/];

/**
 * Textes identiques dans toutes les langues : des données ou des notations,
 * pas des phrases à traduire.
 */
const ALLOWED = new Set([
  // Préfixe d'un identifiant d'objet numérique (page « Crédits »).
  "doi:",
  // Adresse et nom de l'éditeur (page « Contact »).
  "contact@imafrik.tech",
  "IMAFRIK",
  // Champ piège du formulaire de contact : hors de l'écran, masqué aux
  // lecteurs d'écran, il ne s'adresse qu'aux robots.
  "Site web",
  // Mesure et fenêtrage affichés sur l'image du parcours animé, en
  // notation de console de lecture.
  "27 mm",
  "W 1500 · L −600 ·",
]);

/** Attributs dont la valeur est lue ou affichée. */
const SPOKEN = /^(alt|aria-label|title|placeholder)$/;

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

/** Textes écrits en dur dans un composant, avec leur ligne. */
function hardcoded(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: string[] = [];
  const where = (node: ts.Node) =>
    source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const text = node.text.trim();
      if (/\p{L}/u.test(text) && !ALLOWED.has(text))
        found.push(`${where(node)} « ${text.slice(0, 60)} »`);
    }
    if (
      ts.isJsxAttribute(node) &&
      SPOKEN.test(node.name.getText()) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      /\p{L}/u.test(node.initializer.text)
    )
      found.push(
        `${where(node)} ${node.name.getText()}="${node.initializer.text}"`,
      );
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const FILES = sources(ROOT)
  .map((file) => path.relative(ROOT, file))
  .filter((file) => !EXCLUDED.some((pattern) => pattern.test(file)));

describe("textes de la vitrine", () => {
  it("couvre bien les composants de la vitrine", () => {
    expect(FILES).toEqual(
      expect.arrayContaining(["hero.tsx", "cine-viewer.tsx", "pricing.tsx"]),
    );
  });

  it.each(FILES)("%s n’écrit aucun texte en dur", (file) => {
    expect(hardcoded(path.join(ROOT, file))).toEqual([]);
  });
});
