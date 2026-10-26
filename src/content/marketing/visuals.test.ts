import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CINE,
  cineImageNumber,
  IMAGE_SOURCES,
  PRODUCT_SCREENS,
  productScreen,
  SOURCES,
  sourceSet,
  VISUALS,
  type Visual,
} from "@/content/marketing/visuals";
import { LOCALES } from "@/lib/i18n/locale";

const ROOT = path.resolve(__dirname, "../../..");
const PUBLIC = path.join(ROOT, "public");

/** Chemins disque de chaque largeur d'un visuel. */
function files(visual: Visual): string[] {
  return visual.widths.map((width) =>
    path.join(PUBLIC, visual.pattern.replace("{w}", String(width))),
  );
}

describe("visuels de la vitrine", () => {
  it.each(Object.entries(VISUALS))(
    "%s existe à chaque largeur annoncée",
    (_, visual) => {
      for (const file of files(visual))
        expect(fs.existsSync(file), file).toBe(true);
    },
  );

  it.each(LOCALES)(
    "%s : chaque écran de l’application est capturé à chaque largeur",
    (locale) => {
      for (const screen of PRODUCT_SCREENS)
        for (const file of files(productScreen(screen, locale)))
          expect(fs.existsSync(file), file).toBe(true);
    },
  );

  it("les vidéos du ciné existent, de la plus étroite à la plus large", () => {
    const widths = CINE.videos.map((video) => video.width);
    expect(widths).toEqual([...widths].sort((a, b) => a - b));
    for (const video of CINE.videos)
      expect(fs.existsSync(path.join(PUBLIC, video.src)), video.src).toBe(true);
  });

  it("décrit chaque largeur dans le srcset, la plus grande en src", () => {
    expect(sourceSet(VISUALS.cinePoster)).toEqual({
      src: "/visuels/idc/idc-irm-cerveau-sagittal-cine-960.webp",
      srcSet:
        "/visuels/idc/idc-irm-cerveau-sagittal-cine-480.webp 480w, /visuels/idc/idc-irm-cerveau-sagittal-cine-960.webp 960w",
    });
  });

  it("le ciné décrit la vidéo que produit generer.py", () => {
    // Une seule source de vérité pour les coupes : le générateur. Si l'on
    // y change le pas, la cadence ou les coupes, la page doit suivre.
    const script = fs.readFileSync(
      path.join(ROOT, "tools/visuels-idc/generer.py"),
      "utf8",
    );
    const [, start, stop, step] =
      /CINE_COLUMNS = range\((\d+), (\d+), (\d+)\)/.exec(script) ?? [];
    const slices = Math.ceil((Number(stop) - Number(start)) / Number(step));
    expect(CINE.slices).toBe(slices);
    expect(CINE.step).toBe(Number(step));
    // Colonne 0-indexée du volume, image 1-indexée du visualiseur.
    expect(CINE.firstImage).toBe(Number(start) + 1);
    expect(script).toContain(`CINE_FPS = ${CINE.fps}\n`);
    for (const video of CINE.videos)
      expect(script).toMatch(
        new RegExp(`CINE_VIDEO_WIDTHS = \\(.*\\b${video.width}\\b.*\\)`),
      );
  });
});

describe("numéro de coupe affiché par le ciné", () => {
  const last = CINE.firstImage + (CINE.slices - 1) * CINE.step;

  it("part de la ligne médiane et atteint la dernière coupe à mi-boucle", () => {
    expect(cineImageNumber(0)).toBe(CINE.firstImage);
    expect(cineImageNumber(CINE.slices - 1)).toBe(last);
  });

  it("revient sur ses pas sans répéter les extrémités", () => {
    expect(cineImageNumber(CINE.slices)).toBe(last - CINE.step);
    const period = 2 * (CINE.slices - 1);
    expect(cineImageNumber(period - 1)).toBe(CINE.firstImage + CINE.step);
    expect(cineImageNumber(period)).toBe(CINE.firstImage);
  });

  it("arrondit l’image en cours et ramène tout rang à la boucle", () => {
    expect(cineImageNumber(0.4)).toBe(CINE.firstImage);
    expect(cineImageNumber(1.6)).toBe(CINE.firstImage + 2 * CINE.step);
    expect(cineImageNumber(-1)).toBe(CINE.firstImage + CINE.step);
  });

  it("ne sort jamais du volume", () => {
    for (let frame = 0; frame < 200; frame++) {
      const image = cineImageNumber(frame);
      expect(image).toBeGreaterThanOrEqual(CINE.firstImage);
      expect(image).toBeLessThanOrEqual(Math.min(last, CINE.total));
    }
  });
});

describe("sources des images", () => {
  it.each(IMAGE_SOURCES)(
    "%s : citation, DOI et licence Creative Commons",
    (id) => {
      const source = SOURCES[id];
      expect(source.citation).toMatch(/The Cancer Imaging Archive\.$/);
      expect(source.doi).toMatch(/^10\.\d{4,}\//);
      expect(source.license.url).toMatch(
        /^https:\/\/creativecommons\.org\/licenses\/by\/\d\.0\/$/,
      );
      expect(source.processing.length).toBeGreaterThan(0);
    },
  );

  it("chaque coupe de l'accueil est citée dans SOURCES.md", () => {
    const sources = fs.readFileSync(
      path.join(PUBLIC, "visuels/idc/SOURCES.md"),
      "utf8",
    );
    for (const visual of Object.values(VISUALS)) {
      const name = path.basename(visual.pattern).replace("-{w}.webp", "");
      expect(sources, name).toContain(`\`${name}\``);
    }
  });
});
