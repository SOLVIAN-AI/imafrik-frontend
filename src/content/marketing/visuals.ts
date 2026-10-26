/**
 * Visuels de la vitrine : fichiers pré-générés et leurs sources.
 *
 * Deux familles, toutes deux réelles :
 *
 * - **les coupes d'imagerie** d'Imaging Data Commons (`public/visuels/idc`),
 *   produites par `tools/visuels-idc/generer.py` à partir de vraies séries
 *   DICOM publiées sous licence CC BY 4.0. Leurs sources, identifiants et
 *   traitements sont détaillés dans `public/visuels/idc/SOURCES.md` ;
 * - **les captures de l'application** en mode démonstration
 *   (`public/visuels/produit`), produites par
 *   `tools/captures-produit/capturer.mjs`.
 *
 * Chaque fichier existe déjà à chacune des largeurs listées : la page les
 * sert telles quelles (`srcset`), sans passer par l'optimiseur d'images de
 * Next, qui ne ferait que ré-encoder un fichier déjà à la bonne taille, et
 * ferait attendre le premier visiteur après chaque déploiement.
 */

import type { Locale } from "@/lib/i18n/locale";

/** Un visuel disponible en plusieurs largeurs, au même rapport. */
export interface Visual {
  /** Chemin d'un fichier, `{w}` à la place de la largeur. */
  pattern: string;
  /** Largeurs disponibles, en pixels, croissantes. */
  widths: readonly number[];
  /** Rapport hauteur sur largeur. */
  ratio: number;
}

/** Collections d'origine des coupes, dans l'ordre de la page « Crédits ». */
export const IMAGE_SOURCES = ["remind", "eay131", "lidc"] as const;

/** Identifiant d'une collection d'origine. */
export type ImageSourceId = (typeof IMAGE_SOURCES)[number];

/** Chaîne de traitement appliquée aux coupes d'une collection. */
export type Processing = "duotone" | "cine" | "lidc";

/**
 * Référence bibliographique d'une collection, telle que l'exige sa
 * licence. Elle n'est pas traduite : c'est une citation.
 */
export interface ImageSource {
  /** Nom court de la collection. */
  name: string;
  /** Citation complète, auteurs, titre, éditeur. */
  citation: string;
  doi: string;
  license: { name: string; url: string };
  /** Traitements appliqués, dans l'ordre d'affichage. */
  processing: readonly Processing[];
}

const CC_BY_4 = {
  name: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
} as const;

/** Sources des coupes, d'après `public/visuels/idc/SOURCES.md`. */
export const SOURCES: Record<ImageSourceId, ImageSource> = {
  remind: {
    name: "ReMIND",
    citation:
      "Juvekar, P., Dorent, R., Kögl, F., Torio, E., Barr, C., Rigolo, L., Galvin, C., Jowkar, N., Kazi, A., Haouchine, N., Cheema, H., Navab, N., Pieper, S., Wells, W. M., Bi, W. L., Golby, A., Frisken, S., & Kapur, T. (2023). The Brain Resection Multimodal Imaging Database (ReMIND) (Version 1) [Data set]. The Cancer Imaging Archive.",
    doi: "10.7937/3RAG-D070",
    license: CC_BY_4,
    processing: ["cine", "duotone"],
  },
  eay131: {
    name: "EAY131",
    citation:
      "The ECOG-ACRIN Cancer Research Group. (2026). The MATCH Screening Trial: Targeted Therapy Directed by Genetic Testing in Treating Patients With Advanced Refractory Solid Tumors, Lymphomas, or Multiple Myeloma (EAY131) (Version 1) [Dataset]. The Cancer Imaging Archive.",
    doi: "10.7937/C5KE-YX42",
    license: CC_BY_4,
    processing: ["duotone"],
  },
  lidc: {
    name: "LIDC-IDRI",
    citation:
      "Armato III, S. G., McLennan, G., Bidaut, L., et al. (2015). Data From LIDC-IDRI [Data set]. The Cancer Imaging Archive.",
    doi: "10.7937/K9/TCIA.2015.LO9QL9SX",
    license: {
      name: "CC BY 3.0",
      url: "https://creativecommons.org/licenses/by/3.0/",
    },
    processing: ["lidc"],
  },
};

/** Référence de la diffusion par Imaging Data Commons. */
export const IDC_CITATION = {
  citation:
    "Fedorov, A. et al. (2023). National Cancer Institute Imaging Data Commons: Toward Transparency, Reproducibility, and Scalability in Imaging Artificial Intelligence. RadioGraphics, 43(12).",
  doi: "10.1148/rg.230180",
} as const;

/** Coupe d'IDC stylisée dans la palette, carrée sauf mention. */
function idc(name: string, widths: readonly number[], ratio = 1): Visual {
  return { pattern: `/visuels/idc/${name}-{w}.webp`, widths, ratio };
}

/** Visuels de l'accueil. */
export const VISUALS = {
  /** Affiche du ciné : la première coupe, en niveaux de gris. */
  cinePoster: idc("idc-irm-cerveau-sagittal-cine", [480, 960]),
  ctBrainAxial: idc("idc-scanner-cerveau-axial", [480, 960, 1440]),
  mrBrainAxial: idc("idc-irm-cerveau-axial", [480, 960]),
  mrBrainCoronal: idc("idc-irm-cerveau-coronal", [480, 960]),
  mrBrainSagittal: idc("idc-irm-cerveau-sagittal", [480, 960]),
} as const satisfies Record<string, Visual>;

/**
 * Ciné de l'accroche : vidéo en aller-retour de 25 coupes sagittales,
 * une tous les 2 mm (`CINE_*` de `generer.py`).
 */
export const CINE = {
  /** Vidéos, de la plus petite à la plus grande. */
  videos: [
    { src: "/visuels/idc/idc-irm-cerveau-sagittal-cine-480.mp4", width: 480 },
    { src: "/visuels/idc/idc-irm-cerveau-sagittal-cine-720.mp4", width: 720 },
  ],
  /** Images par seconde de la vidéo. */
  fps: 8,
  /** Nombre de coupes distinctes ; la vidéo en compte `2 × (n − 1)` images. */
  slices: 25,
  /** Rang de la première coupe dans le volume (1-indexé), et pas entre deux. */
  firstImage: 125,
  step: 2,
  /** Nombre d'images du volume dans ce plan. */
  total: 256,
} as const;

/** Écrans de l'application capturés, dans l'ordre des onglets. */
export const PRODUCT_SCREENS = [
  "file-de-lecture",
  "compte-rendu-signe",
  "tableau-de-bord",
] as const;

/** Capture d'un écran de l'application, dans une langue. */
export function productScreen(
  screen: (typeof PRODUCT_SCREENS)[number],
  locale: Locale,
): Visual {
  return {
    pattern: `/visuels/produit/${screen}-${locale}-{w}.webp`,
    widths: [640, 1280, 1920, 2560],
    ratio: 800 / 1280,
  };
}

/**
 * Attributs `src` et `srcset` d'un visuel.
 *
 * @param visual Visuel pré-généré.
 * @returns La plus grande largeur en `src` (navigateurs sans `srcset`), et
 *          chaque largeur en `srcset`.
 */
export function sourceSet(visual: Visual): { src: string; srcSet: string } {
  const at = (width: number) => visual.pattern.replace("{w}", String(width));
  return {
    src: at(visual.widths[visual.widths.length - 1]),
    srcSet: visual.widths.map((width) => `${at(width)} ${width}w`).join(", "),
  };
}

/**
 * Rang de la coupe affichée par le ciné, d'après l'image de la vidéo.
 *
 * La vidéo fait l'aller (coupes 0 à n − 1) puis le retour (n − 2 à 1) : à
 * l'image `frame`, la coupe affichée est donc son reflet au-delà de n − 1.
 *
 * @param frame Rang de l'image dans la vidéo, depuis 0 ; ramené à la boucle.
 * @returns Numéro d'image dans le volume, tel que l'afficherait un
 *          visualiseur (1-indexé).
 */
export function cineImageNumber(frame: number): number {
  const period = 2 * (CINE.slices - 1);
  const position = ((Math.round(frame) % period) + period) % period;
  const slice = position < CINE.slices ? position : period - position;
  return CINE.firstImage + slice * CINE.step;
}
