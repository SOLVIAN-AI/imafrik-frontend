"""Visuels de la vitrine, tirés de vraies coupes d'Imaging Data Commons (CC BY 4.0).

Phase 1 de l'imagerie du site : des coupes réelles, stylisées, jamais une
image générée ni une anatomie retouchée. Chaque pixel vient d'une coupe
DICOM publique (native, ou reformatée dans un volume 3D de 1 mm), puis :

1. pixels rendus carrés selon l'espacement réel (interpolation cubique) ;
2. hors du patient (bruit de fond, têtière) ramené au fond, par un masque
   seuillé (plus grande composante, trous comblés), bord adouci d'un
   pixel ; ou, pour le rachis, un cadrage plein champ à l'intérieur du
   champ de vue, sans masque ;
3. fenêtrage linéaire ; pour le scanner, l'os est comprimé au-delà de
   72 UH (fonction monotone : l'ordre des densités est conservé) et un
   lissage gaussien léger (sigma 0,9 pixel) atténue le grain du bruit ;
4. table de couleurs monotone dans la palette IMAFRIK (fond nuit #070e1c,
   marine #1a2d51, sarcelle #007460, sarcelle claire #0bd1ad), fondu vers
   le fond au bord du champ de vue et vignettage léger des coins ;
5. agrandissement Lanczos, jamais au-delà de 4,6 fois la résolution
   native ; WebP (qualité 90) et PNG.

Sources, identifiants et attributions : ``public/visuels/idc/SOURCES.md``.

Le ciné de l'accroche (7) suit sa propre chaîne, décrite plus bas : niveaux
de gris, vidéo H.264.

Usage, depuis la racine du frontend, dans un environnement Python à part
(hors du dépôt) avec numpy, scipy, Pillow, pydicom et imageio-ffmpeg :

    python3 -m venv /tmp/venv-visuels
    /tmp/venv-visuels/bin/pip install numpy scipy pillow pydicom imageio-ffmpeg
    /tmp/venv-visuels/bin/python -I tools/visuels-idc/generer.py /tmp/coupes-idc public/visuels/idc

Les séries sont téléchargées du seau public ``idc-open-data`` (sans
compte) dans le premier dossier, si elles n'y sont pas déjà.
"""

import itertools
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from xml.etree import ElementTree

import imageio_ffmpeg
import numpy as np
import pydicom
from PIL import Image
from scipy import ndimage

BUCKET = "https://idc-open-data.s3.amazonaws.com"
S3 = "{http://s3.amazonaws.com/doc/2006-03-01/}"


def fetch_series(cache: Path, uuid: str) -> Path:
    """Télécharge une série du seau public d'IDC ; reprend un téléchargement interrompu."""
    folder = cache / uuid
    folder.mkdir(parents=True, exist_ok=True)
    query = urllib.parse.urlencode({"list-type": "2", "prefix": f"{uuid}/"})
    with urllib.request.urlopen(f"{BUCKET}/?{query}") as response:
        listing = ElementTree.parse(response)
    for item in listing.iter(f"{S3}Contents"):
        key, size = item.findtext(f"{S3}Key"), int(item.findtext(f"{S3}Size") or 0)
        if not key or not key.endswith(".dcm"):
            continue
        target = folder / key.split("/")[1]
        for attempt in range(4):
            if target.exists() and target.stat().st_size == size:
                break
            try:
                urllib.request.urlretrieve(f"{BUCKET}/{key}", target)
            except urllib.error.ContentTooShortError:
                if attempt == 3:
                    raise
        if target.stat().st_size != size:
            raise RuntimeError(f"{key} : téléchargement incomplet")
    return folder


def load_series(folder: Path):
    """Volume en valeurs physiques, coupes triées le long de leur normale."""
    slices = [pydicom.dcmread(p) for p in sorted(folder.glob("*.dcm"))]
    slices = [s for s in slices if "PixelData" in s]
    iop = np.array(slices[0].ImageOrientationPatient, float)
    normal = np.cross(iop[:3], iop[3:])

    def position(s):
        return float(np.dot(normal, np.array(s.ImagePositionPatient, float)))

    slices.sort(key=position)
    gap = float(np.median(np.diff([position(s) for s in slices])))
    volume = np.stack(
        [
            s.pixel_array.astype(np.float32) * float(getattr(s, "RescaleSlope", 1) or 1)
            + float(getattr(s, "RescaleIntercept", 0) or 0)
            for s in slices
        ]
    )
    row, col = (float(v) for v in slices[0].PixelSpacing)
    return volume, (abs(gap), row, col)


#: Palette IMAFRIK : fond nuit, marine, sarcelle, sarcelle claire.
STOPS = [(0.0, "#070e1c"), (0.36, "#1a2d51"), (0.72, "#007460"), (1.0, "#0bd1ad")]
WIDTHS = (480, 960, 1440)


def _rgb(hex_color):
    return np.array([int(hex_color[i : i + 2], 16) for i in (1, 3, 5)], np.float32)


def duotone(t):
    """Table de couleurs monotone, en luminance croissante : du fond nuit à la sarcelle claire."""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    for (a, ca), (b, cb) in itertools.pairwise(STOPS):
        sel = (t >= a) & (t <= b)
        k = ((t[sel] - a) / (b - a))[:, None]
        out[sel] = _rgb(ca) * (1 - k) + _rgb(cb) * k
    return out


def largest(mask):
    labels, n = ndimage.label(mask)
    if n == 0:
        return mask
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    return labels == (1 + int(np.argmax(sizes)))


def body_mask(a, kind):
    """Le patient, sans le fond : seuil, plus grande composante, trous comblés."""
    if kind == "ct":
        m = a > -300
    else:
        m = ndimage.gaussian_filter(a, 1.5) > np.percentile(a, 99) * 0.06
    m = ndimage.binary_opening(m, iterations=2)
    labels, _ = ndimage.label(m)
    centre = labels[m.shape[0] // 2, m.shape[1] // 2]
    m = labels == centre if centre else largest(m)
    m = ndimage.binary_closing(m, iterations=4)
    m = ndimage.binary_fill_holes(m)
    return m


def tone(a, lo, hi, knee=None):
    """Fenêtrage linéaire ; avec knee (valeur, niveau), les valeurs au-delà sont comprimées.

    Monotone : l'ordre des densités est conservé, l'os garde sa texture au lieu de saturer.
    """
    t = (a - lo) / (hi - lo)
    if knee is not None:
        value, level = knee
        tk = (value - lo) / (hi - lo)
        over = t > tk
        t = np.where(over, level + (t - tk) * (1 - level) / ((a.max() - lo) / (hi - lo) - tk), t * level / tk)
    return np.clip(t, 0, 1)


def render(
    name,
    a,
    kind,
    window,
    aspect=1.0,
    spacing=(1.0, 1.0),
    box=None,
    knee=None,
    high=99.6,
    fade=0.0,
    smooth=0.0,
    ceiling=1.0,
):
    """Rend une coupe en visuel, en WebP et PNG, à plusieurs largeurs.

    Args:
        name: Nom des fichiers, sans la largeur.
        a: Coupe, en valeurs physiques (UH pour le scanner).
        kind: ``ct`` ou ``mr``, pour le masque du patient.
        window: Fenêtre (bas, haut), ou ``None`` pour les centiles 0,5 et ``high``.
        aspect: Largeur sur hauteur du cadre.
        spacing: Espacement des lignes et des colonnes, en mm.
        box: Cadrage plein champ (haut, bas, gauche, droite, en fractions), sans masque.
        knee: Compression monotone au-delà d'une valeur (valeur, niveau atteint).
        high: Centile haut de la fenêtre automatique.
        fade: Hauteur du fondu au bord inférieur du champ de vue, en fraction du cadre.
        smooth: Écart type du lissage gaussien, en pixels.
        ceiling: Niveau maximal de la table de couleurs.
    """
    # Pixels carrés : rééchantillonnage selon l'espacement réel.
    if abs(spacing[0] - spacing[1]) > 1e-3:
        a = ndimage.zoom(a, (spacing[0] / spacing[1], 1.0), order=3)
    if box is None:
        mask = body_mask(a, kind)
    else:
        # Cadrage plein champ, à l'intérieur du champ de vue : aucun contour de masque visible.
        mask = np.zeros(a.shape, bool)
        by0, by1, bx0, bx1 = (
            int(f * n) for f, n in zip(box, (a.shape[0], a.shape[0], a.shape[1], a.shape[1]))
        )
        mask[by0:by1, bx0:bx1] = True
    inside = a[mask]
    lo, hi = window if window else (np.percentile(inside, 0.5), np.percentile(inside, high))
    # Lissage gaussien léger contre le grain du bruit quantique : ni contour ni structure ajoutés.
    t = tone(ndimage.gaussian_filter(a, smooth) if smooth else a, lo, hi, knee) * ceiling
    if box is None:
        t[~mask] = 0
        # Bord du masque adouci sur 1 px : pas d'escalier sur le contour.
        t = t * ndimage.gaussian_filter(mask.astype(np.float32), 0.8)
    # Recadrage : boîte du patient (marge de 7 %), ou cadre donné, au format demandé.
    ys, xs = np.nonzero(mask)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    h, w = y1 - y0, x1 - x0
    side_h = max(h, w / aspect) * (1.14 if box is None else 1.0)
    if box is not None:
        side_h = min(h, w / aspect)
    side_w = side_h * aspect
    cy, cx = (y0 + y1) / 2, (x0 + x1) / 2
    py, px = int(np.ceil(side_h)), int(np.ceil(side_w))
    canvas = np.zeros((py, px), np.float32)
    sy, sx = int(round(cy - py / 2)), int(round(cx - px / 2))
    ys0, xs0 = max(sy, 0), max(sx, 0)
    ys1, xs1 = min(sy + py, t.shape[0]), min(sx + px, t.shape[1])
    canvas[ys0 - sy : ys1 - sy, xs0 - sx : xs1 - sx] = t[ys0:ys1, xs0:xs1]
    if fade:
        # Fondu vers le fond sur le bas du cadre : le bord du champ de vue (cou, visage retiré
        # par l'éditeur) ne s'arrête pas sur une ligne droite.
        bottom = (y1 - sy) / py
        ramp = np.clip((np.arange(py) / py - (bottom - fade)) / fade, 0, 1)
        canvas = canvas * (1 - ramp[:, None] ** 1.2)
    rgb = duotone(canvas)
    # Vignettage léger vers le fond nuit, sur les bords seulement.
    yy, xx = np.mgrid[0:py, 0:px]
    r = np.hypot((yy - py / 2) / (py / 2), (xx - px / 2) / (px / 2))
    k = np.clip((r - 0.85) / 0.6, 0, 1)[..., None] * 0.45
    rgb = rgb * (1 - k) + _rgb(STOPS[0][1]) * k
    base = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    native = max(base.size)
    files = []
    # Pas d'agrandissement au-delà de 4,6 fois la résolution native : il serait flou.
    for width in [w for w in WIDTHS if w <= max(480, native * 4.6)]:
        height = round(width / aspect)
        im = base.resize((width, height), Image.LANCZOS)
        stem = f"{name}-{width}"
        im.save(OUT / f"{stem}.webp", "WEBP", quality=90, method=6)
        im.save(OUT / f"{stem}.png", "PNG", optimize=True)
        files.append(stem)
    print(f"{name} : {native} px natifs, {', '.join(files)}")


CACHE, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

# 1. Scanner cérébral axial (EAY131-1473515), noyaux gris et cornes frontales.
v, sp = load_series(fetch_series(CACHE, "00005dad-3674-4e10-b1fd-01ca82315ed2"))
render(
    "idc-scanner-cerveau-axial", v[16], "ct", (8, 72), 1.0, sp[1:], knee=(72, 0.62), smooth=0.9, ceiling=0.9
)

# 2-3. IRM cérébrale (ReMIND-066), T2 3D SPACE, 1 mm : sagittale médiane reformatée, axiale native.
v, sp = load_series(fetch_series(CACHE, "536667b6-e601-4b07-a755-7ed607fee378"))
render("idc-irm-cerveau-sagittal", v[:, :, 124], "mr", None, 1.0, (sp[0], sp[1]), fade=0.38)
render("idc-irm-cerveau-axial", v[100], "mr", None, 1.0, sp[1:])

# 4. IRM cérébrale (ReMIND-066), T1 3D après injection, 1 mm : coronale reformatée (fosse postérieure).
v, sp = load_series(fetch_series(CACHE, "47188763-64f0-4936-a3b9-23d1ca723116"))
render("idc-irm-cerveau-coronal", v[:, 175, :], "mr", None, 1.0, (sp[0], sp[2]), fade=0.25)

# 5. IRM lombaire (MSB-02628), T2 sagittale médiane.
v, sp = load_series(fetch_series(CACHE, "51bc7378-dc8c-42f3-a3b4-3fb36d44b57b"))
render("idc-irm-rachis-sagittal", v[9], "mr", None, 0.75, sp[1:], box=(0.04, 0.98, 0.30, 0.88))

# 6. IRM lombaire (MSB-02628), T2 axiale.
v, sp = load_series(fetch_series(CACHE, "79255152-3726-4101-96a6-a882a94c2bdd"))
render("idc-irm-rachis-axial", v[15], "mr", None, 1.0, sp[1:], box=(0.22, 0.86, 0.18, 0.82), high=97.5)


# ─── Ciné de l'accroche ──────────────────────────────────────────────────────
#
# Le visualiseur de l'accroche fait défiler de vraies coupes, comme la molette
# d'un radiologue : 25 coupes sagittales de ReMIND-066, une tous les 2 mm, de la
# ligne médiane (la coupe de ``idc-irm-cerveau-sagittal``) vers l'hémisphère
# droit, où aucune lésion n'est documentée (le glioblastome est frontal gauche).
#
# En niveaux de gris, pas en duotone : c'est un visualiseur, et une image de
# diagnostic ne se lit qu'en niveaux de gris sur fond noir (principe 3 du
# système de design, `globals.css`). Fenêtre, cadrage et fondu sont fixés sur
# la première coupe et appliqués à toutes : d'une image à l'autre, seule
# l'anatomie change, jamais l'exposition ni le cadre.
#
# Sorties : une affiche (première coupe) en WebP et PNG, en 480 et 960, et une
# vidéo H.264 en aller-retour (la boucle n'a pas de saut), en 480 et 720 : de
# 220 à 360 ko, contre trois fois plus en 960 pour un gain invisible, l'IRM
# native ne mesurant que 232 pixels. L'encodage x264
# en un seul fil d'exécution est déterministe pour une version donnée de
# ffmpeg (``imageio-ffmpeg``, à installer avec les autres dépendances).

#: Coupes du ciné : colonnes du volume (1 mm), de la ligne médiane vers la droite du patient.
CINE_COLUMNS = range(124, 173, 2)
#: Cadence, en images par seconde : un défilement posé, celui d'une relecture.
CINE_FPS = 8
#: Largeurs de l'affiche, et de la vidéo.
CINE_POSTER_WIDTHS = (480, 960)
CINE_VIDEO_WIDTHS = (480, 720)


def render_cine(name, frames, spacing, fade):
    """Rend une suite de coupes en affiche et en vidéo, en niveaux de gris.

    Args:
        name: Nom des fichiers, sans la largeur.
        frames: Coupes, en valeurs physiques ; la première fixe fenêtre et cadrage.
        spacing: Espacement des lignes et des colonnes, en mm.
        fade: Hauteur du fondu au bord inférieur du champ de vue, en fraction du cadre.
    """
    frames = [ndimage.zoom(a, (spacing[0] / spacing[1], 1.0), order=3) for a in frames]
    masks = [body_mask(a, "mr") for a in frames]
    reference = frames[0][masks[0]]
    lo, hi = np.percentile(reference, 0.5), np.percentile(reference, 99.6)
    # Cadre carré autour de l'union des masques (marge de 7 %) : la tête entière
    # reste dans le champ d'un bout à l'autre du défilement.
    ys, xs = np.nonzero(np.logical_or.reduce(masks))
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    side = int(np.ceil(max(y1 - y0, x1 - x0) * 1.14))
    sy = int(round((y0 + y1) / 2 - side / 2))
    sx = int(round((x0 + x1) / 2 - side / 2))
    bottom = (y1 - sy) / side
    ramp = np.clip((np.arange(side) / side - (bottom - fade)) / fade, 0, 1)
    images = []
    for a, mask in zip(frames, masks):
        t = tone(a, lo, hi) * ndimage.gaussian_filter(mask.astype(np.float32), 0.8)
        canvas = np.zeros((side, side), np.float32)
        ys0, xs0 = max(sy, 0), max(sx, 0)
        ys1, xs1 = min(sy + side, t.shape[0]), min(sx + side, t.shape[1])
        canvas[ys0 - sy : ys1 - sy, xs0 - sx : xs1 - sx] = t[ys0:ys1, xs0:xs1]
        canvas = canvas * (1 - ramp[:, None] ** 1.2)
        # Gris neutre, blanc plafonné à 94 % : le blanc pur éblouit sur fond noir.
        images.append(Image.fromarray(np.clip(canvas * 0.94 * 255, 0, 255).astype(np.uint8)))
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    # Aller-retour : la dernière coupe et la première ne sont pas répétées.
    sequence = images + images[-2:0:-1]
    for width in CINE_POSTER_WIDTHS:
        poster = images[0].resize((width, width), Image.LANCZOS)
        poster.save(OUT / f"{name}-{width}.webp", "WEBP", quality=90, method=6)
        poster.save(OUT / f"{name}-{width}.png", "PNG", optimize=True)
    for width in CINE_VIDEO_WIDTHS:
        stem = f"{name}-{width}"
        with tempfile.TemporaryDirectory() as tmp:
            for index, image in enumerate(sequence):
                image.resize((width, width), Image.LANCZOS).save(Path(tmp) / f"{index:03d}.png")
            subprocess.run(
                [
                    ffmpeg, "-y", "-loglevel", "error", "-framerate", str(CINE_FPS),
                    "-i", str(Path(tmp) / "%03d.png"),
                    "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "veryslow",
                    "-crf", "28", "-threads", "1",
                    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                    "-movflags", "+faststart", "-map_metadata", "-1", "-fflags", "+bitexact",
                    "-flags:v", "+bitexact", "-an", str(OUT / f"{stem}.mp4"),
                ],
                check=True,
            )
    print(f"{name} : {len(images)} coupes, {len(sequence)} images, {side} px natifs")


# 7. Ciné : IRM cérébrale (ReMIND-066), T2 3D, sagittales de la ligne médiane vers la droite.
v, sp = load_series(fetch_series(CACHE, "536667b6-e601-4b07-a755-7ed607fee378"))
render_cine("idc-irm-cerveau-sagittal-cine", [v[:, :, x] for x in CINE_COLUMNS], (sp[0], sp[1]), 0.38)
