// Rend les icônes PNG de l'application à partir des dessins de la marque.
//
// - src/app/apple-icon.png (180 px) : écran d'accueil iOS. Pleine tuile,
//   sans coins arrondis : iOS applique son propre masque.
// - public/brand/icon-192.png, icon-512.png : manifeste web (Android).
//   Le dessin tient dans la zone sûre de 80 % : ces icônes sont déclarées
//   « maskable », et Android peut les rogner en cercle.
//
// Usage, depuis la racine du frontend, après build.py (voir README.md) :
//   npm install --no-save playwright-core@1
//   CHROME_PATH=/chemin/vers/chrome node tools/brand/render-icons.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Les tracés viennent de geometry.ts, produit par build.py : une seule source.
const geometry = fs.readFileSync(path.join(ROOT, "src/components/brand/geometry.ts"), "utf8");
const mark = (variant) => {
  const block = geometry.slice(geometry.indexOf(`${variant}: {`));
  const pick = (key) => block.match(new RegExp(`${key}: "([^"]+)"`))[1];
  return { slices: pick("slices"), read: pick("read") };
};

const TARGETS = [
  { file: "src/app/apple-icon.png", size: 180, variant: "compact", scale: 0.62 },
  { file: "public/brand/icon-192.png", size: 192, variant: "compact", scale: 0.56 },
  { file: "public/brand/icon-512.png", size: 512, variant: "full", scale: 0.56 },
];

const browser = await chromium.launch({ executablePath: CHROME });
for (const target of TARGETS) {
  const { slices, read } = mark(target.variant);
  const drawing = target.size * target.scale;
  const page = await browser.newPage({
    viewport: { width: target.size, height: target.size },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html><body style="margin:0">
    <div style="width:${target.size}px;height:${target.size}px;display:grid;place-items:center;
      background:radial-gradient(70% 60% at 50% 38%, #16224a, #04060d)">
      <svg viewBox="-6 -6 112 128" width="${drawing}" height="${(drawing * 128) / 112}">
        <path fill="#E9EEF8" d="${slices}"/><path fill="#3FF2D0" d="${read}"/>
      </svg></div></body></html>`);
  await page.screenshot({ path: path.join(ROOT, target.file) });
  await page.close();
  console.log(`Écrit : ${target.file}`);
}
await browser.close();
