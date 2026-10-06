// Échantillonne les lettres d'IMAFRIK, coupe par coupe.
//
// Chaque lettre est dessinée dans Geist sur un canevas, puis lue sur
// `ROWS` lignes horizontales régulièrement espacées sur la hauteur de
// capitale : chaque passage dans l'encre devient un segment [début, fin].
// Le résultat, exprimé en unités où la capitale mesure 100, est écrit
// dans glyph-spans.json, que lit build.py.
//
// À ne relancer que pour changer la graisse ou le nombre de coupes : le
// fichier produit est versionné, et la marque ne doit pas dériver au gré
// d'une mise à jour de la police.
//
// Usage (voir README.md) :
//   npm install --no-save playwright-core@1
//   CHROME_PATH=/chemin/vers/chrome node tools/brand/sample-glyphs.mjs [graisse] [coupes]
//
// Le navigateur est celui du poste : playwright-core ne télécharge rien.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const WEIGHT = process.argv[2] ?? "600";
const ROWS = Number(process.argv[3] ?? 11);
const LETTERS = ["I", "M", "F", "R", "K"];
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "glyph-spans.json",
);

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.setContent(
  `<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..800&display=swap" rel="stylesheet">
   <span style="font-family:Geist;font-weight:${WEIGHT}">x</span>`,
  { waitUntil: "networkidle" },
);

const glyphs = await page.evaluate(
  async ({ weight, rows, letters }) => {
    await document.fonts.load(`${weight} 400px Geist`);
    const CAP = 1000; // hauteur de capitale de travail, en pixels
    const LEFT = 100;
    const BASELINE = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = 3000;
    canvas.height = 1400;
    const context = canvas.getContext("2d");

    // Taille de police qui donne exactement CAP pixels de capitale.
    context.font = `${weight} 1000px Geist`;
    const capRatio = context.measureText("H").actualBoundingBoxAscent / 1000;
    context.font = `${weight} ${CAP / capRatio}px Geist`;

    const result = {};
    for (const letter of letters) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillText(letter, LEFT, BASELINE);
      const advance = context.measureText(letter).width;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const spans = [];
      for (let row = 0; row < rows; row += 1) {
        const y = Math.round(BASELINE - CAP + ((row + 0.5) * CAP) / rows);
        const runs = [];
        let start = -1;
        for (let x = 0; x < LEFT + advance + 200; x += 1) {
          const inked = pixels[(y * canvas.width + x) * 4 + 3] > 128;
          if (inked && start < 0) start = x;
          if (!inked && start >= 0) {
            runs.push([((start - LEFT) / CAP) * 100, ((x - LEFT) / CAP) * 100]);
            start = -1;
          }
        }
        spans.push(runs);
      }
      result[letter] = { advance: (advance / CAP) * 100, spans };
    }
    return result;
  },
  { weight: WEIGHT, rows: ROWS, letters: LETTERS },
);

fs.writeFileSync(OUTPUT, `${JSON.stringify({ weight: WEIGHT, rows: ROWS, glyphs }, null, 2)}\n`);
await browser.close();
console.log(`Écrit : ${path.relative(process.cwd(), OUTPUT)}`);
