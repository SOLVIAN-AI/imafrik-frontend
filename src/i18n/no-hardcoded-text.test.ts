import fs from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Aucun texte français écrit en dur dans l'application.
 *
 * Tout texte affiché de l'application vit dans les dictionnaires
 * (`src/i18n/messages`) : un texte écrit directement dans un composant
 * resterait en français dans l'interface anglaise. Ce test parcourt les
 * sources de l'application et signale toute chaîne affichable qui a l'air
 * d'une phrase française.
 *
 * Hors champ, à dessein :
 * - le site public, qui a ses propres textes (`src/content`) ;
 * - les dictionnaires eux-mêmes, les faits juridiques bilingues ;
 * - les données de démonstration (noms, renseignements cliniques,
 *   comptes-rendus) : ce sont des données, pas l'interface ;
 * - les commentaires, les classes CSS, les messages de journal
 *   (`console.*`) et les erreurs destinées aux développeurs
 *   (`throw new Error`).
 */

const ROOT = path.resolve(__dirname, "..");

/** Dossiers et fichiers hors champ, relatifs à `src`. */
const EXCLUDED = [
  /^app\/\(marketing\)\//,
  /^components\/marketing\//,
  /^content\//,
  /^i18n\//,
  /^lib\/i18n\//,
  /^lib\/legal\.ts$/,
  /^lib\/api\/schema\.d\.ts$/,
  // Données de démonstration : patients, comptes-rendus, modèles.
  /^lib\/demo\/(studies|reports)\.ts$/,
  // Personnes et organisations de la session de démonstration.
  /^lib\/session\/demo\.ts$/,
  // Le manifeste d'application installable n'existe qu'en une langue : le
  // français, celle du marché principal.
  /^app\/manifest\.ts$/,
  /^lib\/data\/templates\.ts$/,
  // Écrans d'entrée, servis par `src/content/auth.ts`.
  /^app\/\(auth\)\/connexion\//,
  /^app\/\(auth\)\/mot-de-passe-oublie\//,
  /^components\/auth\/(sign-in-form|forgot-password-form)\.tsx$/,
  // Pages déjà bilingues par construction.
  /^app\/(error|not-found)\.tsx$/,
  /\.test\.tsx?$/,
];

/** Mots-outils et termes du métier qui trahissent une phrase française. */
const FRENCH_WORDS =
  /\b(le|la|les|des|du|une|vos|votre|nous|est|sont|pour|avec|sans|aucun|aucune|cette|ce|examen|examens|compte|comptes)\b/i;

/** Caractères propres au français. */
const FRENCH_CHARS = /[àâçéèêëîïôûùüÿœ’«»]/i;

/** Un chemin d'adresse ou une clé technique, pas un texte. */
const TECHNICAL = /^[/#]?[\w./[\]#?=&-]*$/;

/**
 * Une chaîne qui ressemble à du français destiné à l'utilisateur : une
 * phrase aux mots français, ou un mot aux caractères français. Les
 * chemins (`/examens`) et les clés (`admin-examens`) n'en sont pas.
 */
function looksFrench(text: string): boolean {
  const value = text.trim();
  if (TECHNICAL.test(value)) return false;
  return (
    FRENCH_CHARS.test(value) || (/\s/.test(value) && FRENCH_WORDS.test(value))
  );
}

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.(tsx?)$/.test(entry.name) ? [full] : [];
  });
}

/** Vrai si le nœud est l'argument d'un appel qu'on ne traduit pas. */
function technicalCall(node: ts.Node): boolean {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isCallExpression(parent)) {
      const callee = parent.expression.getText();
      if (/^console\./.test(callee)) return true;
      if (/^(cn|cva|clsx|twMerge)$/.test(callee)) return true;
    }
    if (ts.isNewExpression(parent) && parent.expression.getText() === "Error")
      return true;
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent))
      return true;
    if (
      ts.isJsxAttribute(parent) &&
      /^(className|href|src|d|viewBox|id|htmlFor|type|name|role|autoComplete|data-[\w-]+)$/.test(
        parent.name.getText(),
      )
    )
      return true;
    if (ts.isBlock(parent) || ts.isSourceFile(parent)) return false;
  }
  return false;
}

function hardcoded(file: string): string[] {
  const relative = path.relative(ROOT, file);
  if (EXCLUDED.some((pattern) => pattern.test(relative))) return [];
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const found: string[] = [];
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
    if (
      text &&
      text.trim().length > 1 &&
      text !== "use client" &&
      text !== "use server" &&
      text !== "server-only" &&
      looksFrench(text) &&
      !technicalCall(node)
    ) {
      const line =
        source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      found.push(
        `${relative}:${line} ${text.trim().replace(/\s+/g, " ").slice(0, 70)}`,
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("textes de l'application", () => {
  it("passent tous par les dictionnaires", () => {
    const offenders = sources(ROOT).flatMap(hardcoded);
    expect(offenders).toEqual([]);
  });
});
