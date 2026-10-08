/**
 * Export CSV, lisible par Excel et LibreOffice en français.
 *
 * Trois précautions, chacune pour une raison concrète :
 * - **séparateur `;`** : avec une locale française, Excel attend le
 *   point-virgule — la virgule y est le séparateur décimal ;
 * - **BOM UTF-8** en tête : sans lui, Excel lit « Clinique Saint-JosÃ©ph » ;
 * - **neutralisation des formules** : une cellule qui commence par `=`,
 *   `+`, `-`, `@`, une tabulation ou un retour chariot serait exécutée
 *   comme une formule à l'ouverture (injection CSV, CWE-1236). Un nom de
 *   clinique saisi par un tiers ne doit jamais devenir du code dans le
 *   tableur de la comptabilité.
 */

/** Séparateur de champs. */
export const CSV_SEPARATOR = ";";

/** Marque d'ordre des octets UTF-8. */
export const CSV_BOM = "﻿";

const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Prépare une cellule.
 *
 * Les nombres passent tels quels — `-3` doit rester un nombre, pas une
 * formule neutralisée. Les textes sont neutralisés si besoin, puis mis
 * entre guillemets dès qu'ils contiennent un séparateur, un guillemet ou
 * un saut de ligne.
 *
 * @param value Valeur de la cellule.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value).replace(".", ",") : "";
  }
  let text = value;
  if (FORMULA_START.test(text)) text = `'${text}`;
  if (/[";\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/**
 * Assemble un document CSV complet, BOM compris.
 *
 * @param headers Intitulés des colonnes.
 * @param rows    Lignes, dans l'ordre des intitulés.
 */
export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(csvCell).join(CSV_SEPARATOR),
  );
  // CRLF : la fin de ligne de la RFC 4180, que tous les tableurs acceptent.
  return CSV_BOM + lines.join("\r\n") + "\r\n";
}
