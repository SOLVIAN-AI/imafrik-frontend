/**
 * Remplace l'apostrophe droite par l'apostrophe typographique dans les
 * textes JSX signalés par ESLint.
 *
 * La règle `react/no-unescaped-entities` interdit `'` dans un nœud de
 * texte JSX. Plutôt que d'échapper en `&apos;` — illisible dans le
 * source — on pose le caractère correct : « l’examen » est de toute
 * façon la bonne typographie française, et le problème disparaît à la
 * racine.
 *
 * Usage : node tools/fix-apostrophes.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// ESLint sort en code 1 dès qu'il reste une erreur — c'est précisément
// le cas qu'on vient corriger. `execFileSync` lève alors, et le rapport
// se récupère sur l'exception.
let raw;
try {
  raw = execFileSync("npx", ["eslint", "--format", "json"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
} catch (error) {
  raw = error.stdout;
  if (!raw) throw error;
}

const byFile = new Map();
for (const file of JSON.parse(raw)) {
  const targets = file.messages.filter(
    (message) => message.ruleId === "react/no-unescaped-entities",
  );
  if (targets.length > 0) byFile.set(file.filePath, targets);
}

let fixed = 0;
for (const [filePath, messages] of byFile) {
  const lines = readFileSync(filePath, "utf8").split("\n");
  for (const message of messages) {
    const index = message.line - 1;
    if (lines[index]?.includes("'")) {
      lines[index] = lines[index].replaceAll("'", "’");
      fixed += 1;
    }
  }
  writeFileSync(filePath, lines.join("\n"));
}

console.log(`${fixed} ligne(s) corrigée(s) dans ${byFile.size} fichier(s).`);
