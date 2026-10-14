#!/usr/bin/env node
/**
 * Génère les images de partage du site (Open Graph et X/Twitter).
 *
 * Ce sont elles qu'affichent WhatsApp, LinkedIn, Slack ou iMessage quand
 * on colle un lien vers imafrik.tech. Sans elles, chaque messagerie
 * choisit seule ce qu'elle montre, et garde en cache ce qu'elle a trouvé
 * la première fois : c'est ainsi que l'ancien logo restait affiché après
 * le passage à « La Série ».
 *
 * Une image par langue, à adresse fixe dans `public/brand/` :
 *
 *   public/brand/partage-fr.png   site français, et application
 *   public/brand/partage-en.png   site anglais
 *
 * Elles sont déclarées dans les métadonnées (`lib/i18n/share-image.ts`),
 * et non par la convention de fichiers `opengraph-image` de Next : une
 * page qui définit son propre bloc Open Graph remplace celui de ses
 * parents, image comprise, si bien que l'image d'un dossier parent
 * disparaissait de toutes les pages publiques.
 *
 * Le rendu passe par Chromium (Playwright, déjà en dépendance) : le
 * logotype est le SVG officiel de `public/brand`, la police est Geist,
 * celle de l'interface. Relancer après tout changement de la marque :
 *
 *   node tools/brand/image-partage.mjs
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);

/** Taille recommandée par Open Graph : 1,91:1, nette sur tous les écrans. */
const LARGEUR = 1200;
const HAUTEUR = 630;

/** Une image par langue du site public. */
const VERSIONS = [
  { lang: "fr", accroche: "Téléradiologie pour l’Afrique" },
  { lang: "en", accroche: "Teleradiology for Africa" },
];

/**
 * Police Geist, embarquée en base64 pour un rendu hors ligne.
 *
 * Next.js livre la même police que `next/font/google` sert à l'interface ;
 * la prendre ici évite un téléchargement au moment du rendu.
 */
async function geist() {
  const fichier = join(
    dirname(require.resolve("next/package.json")),
    "dist/next-devtools/server/font/geist-latin.woff2",
  );
  return (await readFile(fichier)).toString("base64");
}

/**
 * Page HTML de l'image : fond de l'interface, halo d'accent, logotype,
 * accroche et adresse du site.
 *
 * Tout est centré : en petit format, WhatsApp et iMessage recadrent
 * l'image en carré, au milieu. Le « A » d'Afrique, au centre du
 * logotype, reste alors dans le cadre.
 *
 * @param {string} logotype SVG du logotype, version sur fond sombre.
 * @param {string} police   Geist en base64.
 * @param {{ lang: string, accroche: string }} version
 */
function page(logotype, police, { lang, accroche }) {
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><style>
  @font-face { font-family: Geist; src: url(data:font/woff2;base64,${police}) format("woff2"); font-weight: 100 900; }
  html, body { margin: 0; width: ${LARGEUR}px; height: ${HAUTEUR}px; }
  body {
    /* --color-ink-950 de l'interface, et le halo de l'en-tête de page. */
    background:
      radial-gradient(60% 75% at 50% 30%, rgba(63, 242, 208, 0.16), transparent 70%),
      #0b1124;
    font-family: Geist, system-ui, sans-serif;
    color: #e9eef8;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; box-sizing: border-box;
  }
  .logo svg { width: 760px; height: auto; display: block; }
  .accroche { margin-top: 52px; font-size: 46px; font-weight: 500; letter-spacing: -0.01em; }
  .site { margin-top: 18px; font-size: 26px; font-weight: 400; color: #8f9bb3; letter-spacing: 0.02em; }
</style></head>
<body>
  <div class="logo">${logotype}</div>
  <div class="accroche">${accroche}</div>
  <div class="site">imafrik.tech</div>
</body></html>`;
}

async function main() {
  const logotype = await readFile(
    join(RACINE, "public/brand/imafrik-logotype-sombre.svg"),
    "utf8",
  );
  const police = await geist();
  const navigateur = await chromium.launch();
  try {
    const onglet = await navigateur.newPage({
      viewport: { width: LARGEUR, height: HAUTEUR },
    });
    for (const version of VERSIONS) {
      await onglet.setContent(page(logotype, police, version));
      await onglet.evaluate(() => document.fonts.ready);
      const image = `public/brand/partage-${version.lang}.png`;
      await onglet.screenshot({ path: join(RACINE, image) });
      console.log(`✓ ${image}`);
    }
  } finally {
    await navigateur.close();
  }
}

await main();
