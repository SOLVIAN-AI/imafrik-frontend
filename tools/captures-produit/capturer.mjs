#!/usr/bin/env node
/**
 * Captures de l'application pour la page d'accueil, prises en mode
 * démonstration.
 *
 * La section « Le produit » de l'accueil montre l'application telle
 * qu'elle est, pas une maquette : la file de lecture du radiologue, un
 * compte-rendu signé et le tableau de bord d'un établissement. Les
 * patients, médecins, établissements et chiffres sont ceux du jeu de
 * démonstration, fictifs ; la page le dit sous les captures.
 *
 * Chaque écran est capturé dans les deux langues, dans le thème où il se
 * vit : sombre pour le radiologue (lecture en pièce assombrie), clair pour
 * le personnel de l'établissement (bureau éclairé). Les visites guidées
 * sont marquées faites, pour qu'aucune bulle ne couvre l'écran.
 *
 * Rendu en 1280 × 800 à densité 2, puis réduit par Chromium lui-même en
 * WebP à plusieurs largeurs (aucune dépendance de plus) :
 *
 *   public/visuels/produit/<écran>-<langue>-<largeur>.webp
 *
 * Usage, contre une compilation de démonstration servie localement (voir
 * `playwright.config.ts` pour l'environnement) :
 *
 *   node tools/captures-produit/capturer.mjs http://localhost:3200
 *
 * Relancer après tout changement visible de ces trois écrans : une capture
 * qui ne ressemble plus au produit est pire que pas de capture.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SORTIE = join(RACINE, "public", "visuels", "produit");

/** Adresse du serveur de démonstration. */
const BASE = process.argv[2] ?? "http://localhost:3200";

/** Exécutable de Chromium, si celui de Playwright n'est pas installé. */
const CHROMIUM = process.env.CHROMIUM_PATH;

/** Fenêtre de capture, et densité de pixels. */
const FENETRE = { width: 1280, height: 800 };
const DENSITE = 2;

/** Largeurs servies (`srcset`), en pixels. */
const LARGEURS = [640, 1280, 1920, 2560];

/** Écrans capturés : portail de démonstration, thème et adresse. */
const ECRANS = [
  { nom: "file-de-lecture", portail: "m-radio", theme: "dark", chemin: "/worklist" },
  {
    nom: "compte-rendu-signe",
    portail: "m-radio",
    theme: "dark",
    chemin: "/comptes-rendus/r-10",
  },
  {
    nom: "tableau-de-bord",
    portail: "m-clinic",
    theme: "light",
    chemin: "/tableau-de-bord",
  },
];

/** Visites guidées, toutes marquées faites (`components/tour/storage.ts`). */
const VISITES = {
  cle: "imafrik-visites:demo-user",
  faites: ["radiologue-file", "lecture", "clinique-accueil", "equipe-cockpit"],
};

/**
 * Réduit une capture PNG en WebP aux largeurs voulues, dans Chromium.
 *
 * @param {import("playwright").Page} page Page vierge servant d'atelier.
 * @param {Buffer} png Capture à pleine résolution.
 * @returns {Promise<Record<number, Buffer>>} WebP par largeur.
 */
async function reduire(page, png) {
  const resultats = await page.evaluate(
    async ({ source, largeurs }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${source}`;
      await image.decode();
      const sorties = {};
      for (const largeur of largeurs) {
        const hauteur = Math.round((image.height * largeur) / image.width);
        const toile = document.createElement("canvas");
        toile.width = largeur;
        toile.height = hauteur;
        const contexte = toile.getContext("2d");
        contexte.imageSmoothingQuality = "high";
        contexte.drawImage(image, 0, 0, largeur, hauteur);
        sorties[largeur] = toile.toDataURL("image/webp", 0.86).split(",")[1];
      }
      return sorties;
    },
    { source: png.toString("base64"), largeurs: LARGEURS },
  );
  return Object.fromEntries(
    Object.entries(resultats).map(([l, b64]) => [l, Buffer.from(b64, "base64")]),
  );
}

const navigateur = await chromium.launch(
  CHROMIUM ? { executablePath: CHROMIUM } : {},
);
await mkdir(SORTIE, { recursive: true });
const atelier = await (await navigateur.newContext()).newPage();

for (const langue of ["fr", "en"]) {
  for (const ecran of ECRANS) {
    const contexte = await navigateur.newContext({
      viewport: FENETRE,
      deviceScaleFactor: DENSITE,
      locale: langue === "fr" ? "fr-FR" : "en-GB",
      timezoneId: "Africa/Lome",
      reducedMotion: "reduce",
    });
    await contexte.addCookies([
      { name: "imafrik-demo-membership", value: ecran.portail, url: BASE },
      { name: "imafrik-langue", value: langue, url: BASE },
    ]);
    await contexte.addInitScript(
      ({ theme, visites }) => {
        localStorage.setItem("theme", theme);
        localStorage.setItem(visites.cle, JSON.stringify(visites.faites));
      },
      { theme: ecran.theme, visites: VISITES },
    );
    const page = await contexte.newPage();
    await page.goto(`${BASE}${ecran.chemin}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector("[data-pending-layout]", { state: "detached" });
    const png = await page.screenshot();
    for (const [largeur, webp] of Object.entries(await reduire(atelier, png))) {
      const fichier = join(SORTIE, `${ecran.nom}-${langue}-${largeur}.webp`);
      await writeFile(fichier, webp);
    }
    console.log(`${ecran.nom} (${langue})`);
    await contexte.close();
  }
}
await navigateur.close();
