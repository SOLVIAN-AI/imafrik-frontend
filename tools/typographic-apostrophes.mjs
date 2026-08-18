/**
 * Remplace l'apostrophe droite par l'apostrophe typographique dans les
 * textes destinés à l'écran.
 *
 * En français, l'apostrophe est « ’ », pas « ' » — la seconde est un
 * signe de code hérité de la machine à écrire. La différence se voit :
 * une page où les deux cohabitent paraît assemblée à la hâte.
 *
 * Le remplacement ne vise que les **chaînes entre guillemets doubles
 * contenant une espace** — donc de la prose. Une classe CSS, un
 * identifiant ou une URL ne contient pas d'apostrophe, et une chaîne
 * sans espace n'est pas une phrase : la règle est volontairement étroite
 * pour ne jamais toucher au code.
 *
 * Usage : node tools/typographic-apostrophes.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = globSync("src/**/*.{ts,tsx}");
let changed = 0;

for (const file of files) {
  const before = readFileSync(file, "utf8");

  const after = before.replace(/"([^"\\\n]*)"/g, (match, content) => {
    if (!content.includes("'") || !content.includes(" ")) return match;
    return `"${content.replaceAll("'", "’")}"`;
  });

  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
  }
}

console.log(`${changed} fichier(s) mis à jour.`);
