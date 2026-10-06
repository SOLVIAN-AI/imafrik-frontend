/**
 * Remplace l'apostrophe droite par l'apostrophe typographique dans les
 * textes destinés à l'écran.
 *
 * En français, l'apostrophe est « ’ », pas « ' » — la seconde est un
 * signe de code hérité de la machine à écrire. La différence se voit :
 * une page où les deux cohabitent paraît assemblée à la hâte.
 *
 * Le remplacement ne vise que les **chaînes entre guillemets doubles
 * contenant une espace** — donc de la prose — et, à l'intérieur, épargne
 * tout ce qui est entre crochets. Une liste de classes Tailwind contient
 * des espaces *et* des apostrophes de code dans ses valeurs arbitraires
 * (`after:content-['']`) : les convertir avait cassé un séparateur de
 * l'écran de lecture sans la moindre erreur à la compilation.
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
    // Les segments entre crochets — valeurs arbitraires Tailwind — sont
    // du code : on ne remplace qu'en dehors d'eux.
    const typographic = content
      .split(/(\[[^\]]*\])/)
      .map((part) => (part.startsWith("[") ? part : part.replaceAll("'", "’")))
      .join("");
    return `"${typographic}"`;
  });

  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
  }
}

console.log(`${changed} fichier(s) mis à jour.`);
