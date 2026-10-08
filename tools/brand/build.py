"""Construit la marque IMAFRIK, « La Série », à partir de ses données.

La marque
---------
Le nom IMAFRIK dessiné comme une série de onze coupes d'imagerie. Les
lettres viennent de Geist (``glyph-spans.json``, produit par
``sample-glyphs.mjs``) ; à la place du A, le continent africain, taillé
dans les mêmes coupes. La quatrième coupe du continent — 15° Nord,
l'Afrique de l'Ouest — est la « coupe lue » : en turquoise, elle sert de
barre au A.

Ce qui est produit
------------------
- ``src/components/brand/geometry.ts`` : les tracés SVG, consommés par
  les composants ``Wordmark`` et ``BrandMark`` ;
- ``public/brand/*.svg`` : fichiers autonomes, pour les usages hors
  application (documents, presse, signature de courriel) ;
- ``src/app/icon.svg`` : l'icône d'onglet.

Chaque élément est un rectangle à bouts ronds : une coupe, pas une
rayure. Les coupes d'une même couleur sont fusionnées en un seul tracé,
ce qui garde le SVG léger.

Usage : ``python3 tools/brand/build.py`` depuis la racine du frontend.
Aucune dépendance hors de la bibliothèque standard.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GLYPHS = json.loads((Path(__file__).parent / "glyph-spans.json").read_text())

#: Épaisseur d'une coupe, en fraction du pas entre deux coupes.
SLICE_RATIO = 0.66
#: Approche entre deux lettres, en unités de capitale (capitale = 100).
TRACKING = 7.0
#: Index de la coupe lue (de 0, au nord, à 10, au cap).
READ_SLICE = 3

#: Continent, une tranche par coupe : (y, x ouest, x est) sur une grille
#: de 100 × 116, de la Méditerranée au cap des Aiguilles. Relevé à la main
#: sur les côtes réelles — la corne de l'Afrique (y = 47) en particulier,
#: qu'un échantillonnage régulier manquait.
AFRICA = [
    (4, 16, 42), (15, 9, 73), (26, 3, 77), (37, 1, 81), (47, 6, 99),
    (57, 34, 92), (68, 40, 86), (79, 44, 83), (90, 43, 78), (101, 45, 74),
    (112, 50, 66),
]
MADAGASCAR = [(79, 89, 94), (90, 88, 92)]

#: Icône simplifiée pour les petites tailles : moins de coupes, plus épaisses.
ICON_SETS = {
    "full": (AFRICA, MADAGASCAR, 6.6, 3),
    "compact": (
        [(6, 12, 70), (22, 5, 76), (38, 1, 82), (51, 6, 99), (65, 38, 88),
         (79, 44, 83), (93, 44, 77), (107, 48, 69)],
        [(79, 89, 96), (93, 88, 94)], 10.0, 2,
    ),
    "micro": ([(8, 10, 72), (35, 1, 83), (60, 24, 97), (85, 43, 81), (110, 48, 68)], [], 15.0, 1),
}


@dataclass(frozen=True)
class Slice:
    """Une coupe : rectangle à bouts ronds."""

    x: float
    y: float
    width: float
    height: float
    read: bool = False

    def path(self) -> str:
        """Tracé SVG du rectangle à bouts ronds, sans dépendre de ``rx``."""
        r = self.height / 2
        w = max(self.width, self.height)
        straight = w - 2 * r
        return (
            f"M{self.x + r:.2f} {self.y:.2f}h{straight:.2f}"
            f"a{r:.2f} {r:.2f} 0 0 1 0 {self.height:.2f}"
            f"h{-straight:.2f}a{r:.2f} {r:.2f} 0 0 1 0 {-self.height:.2f}z"
        )


def africa_slices(x0: float, rows: int) -> tuple[list[Slice], float]:
    """Le continent sur la grille des lettres, à la place du A."""
    pitch = 100 / rows
    height = pitch * SLICE_RATIO
    scale = 100 / 116
    west = min(a for _, a, _ in AFRICA)
    slices = []
    for index, (_, a, b) in enumerate(AFRICA):
        y = (index + 0.5) * pitch - height / 2
        slices.append(Slice(x0 + (a - west) * scale, y, (b - a) * scale, height, index == READ_SLICE))
    for y_source, a, b in MADAGASCAR:
        index = min(range(len(AFRICA)), key=lambda i: abs(AFRICA[i][0] - y_source))
        y = (index + 0.5) * pitch - height / 2
        slices.append(Slice(x0 + (a - west) * scale, y, (b - a) * scale, height))
    east = max(b for _, _, b in AFRICA + MADAGASCAR)
    return slices, (east - west) * scale


def wordmark() -> tuple[list[Slice], float]:
    """Toutes les coupes du logotype, et sa largeur."""
    rows = GLYPHS["rows"]
    pitch = 100 / rows
    height = pitch * SLICE_RATIO
    slices: list[Slice] = []
    x = 0.0

    def letter(name: str) -> None:
        nonlocal x
        glyph = GLYPHS["glyphs"][name]
        for row, runs in enumerate(glyph["spans"]):
            y = (row + 0.5) * pitch - height / 2
            for a, b in runs:
                slices.append(Slice(x + a, y, b - a, height))
        x += glyph["advance"] + TRACKING

    letter("I")
    letter("M")
    continent, width = africa_slices(x + 2, rows)
    slices += continent
    x += width + TRACKING + 6
    for name in ("F", "R", "I", "K"):
        letter(name)
    return slices, x - TRACKING


def icon(variant: str) -> list[Slice]:
    """Le A seul — l'icône — dans sa version pour une plage de tailles."""
    rows, island, height, read = ICON_SETS[variant]
    slices = [Slice(a, y - height / 2, b - a, height, i == read) for i, (y, a, b) in enumerate(rows)]
    slices += [Slice(a, y - height / 2, b - a, height) for y, a, b in island]
    return slices


def paths(slices: list[Slice]) -> tuple[str, str]:
    """Tracés fusionnés : coupes ordinaires, puis coupe lue."""
    plain = "".join(s.path() for s in slices if not s.read)
    read = "".join(s.path() for s in slices if s.read)
    return plain, read


def svg(slices: list[Slice], view_box: str, ink: str, signal: str) -> str:
    """Un fichier SVG autonome, couleurs incluses."""
    plain, read = paths(slices)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}">'
        f'<path fill="{ink}" d="{plain}"/><path fill="{signal}" d="{read}"/></svg>\n'
    )


def main() -> None:
    word, width = wordmark()
    word_box = f"-2 -2 {width + 4:.2f} 104"
    icon_box = "-6 -6 112 128"
    variants = {name: paths(icon(name)) for name in ICON_SETS}
    word_plain, word_read = paths(word)

    ts = [
        "// Fichier produit par tools/brand/build.py — ne pas modifier à la main.\n",
        "\n",
        "/** Tracés du logotype « La Série ». */\n",
        "export const WORDMARK = {\n",
        f'  viewBox: "{word_box}",\n',
        f"  width: {width + 4:.2f},\n",
        "  height: 104,\n",
        f'  slices: "{word_plain}",\n',
        f'  read: "{word_read}",\n',
        "} as const;\n",
        "\n",
        "/** Tracés de l'icône — le A africain — par plage de taille. */\n",
        "export const MARK = {\n",
        f'  viewBox: "{icon_box}",\n',
    ]
    for name, (plain, read) in variants.items():
        ts.append(f'  {name}: {{ slices: "{plain}", read: "{read}" }},\n')
    ts.append("} as const;\n")
    (ROOT / "src/components/brand/geometry.ts").write_text("".join(ts))

    out = ROOT / "public/brand"
    out.mkdir(parents=True, exist_ok=True)
    themes = {"sombre": ("#E9EEF8", "#3FF2D0"), "clair": ("#0B1020", "#0FAE96")}
    for theme, (ink, signal) in themes.items():
        (out / f"imafrik-logotype-{theme}.svg").write_text(svg(word, word_box, ink, signal))
        for name in ICON_SETS:
            (out / f"imafrik-icone-{name}-{theme}.svg").write_text(svg(icon(name), icon_box, ink, signal))

    # Icône d'onglet : la version micro, sur une tuile sombre arrondie pour
    # rester lisible sur les onglets clairs comme sombres.
    plain, read = variants["micro"]
    (ROOT / "src/app/icon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -12 128 128">'
        '<rect x="-14" y="-12" width="128" height="128" rx="30" fill="#0B1124"/>'
        f'<path fill="#E9EEF8" d="{plain}"/><path fill="#3FF2D0" d="{read}"/></svg>\n'
    )
    print(f"Logotype : {len(word)} coupes, largeur {width:.1f} (capitale = 100).")


if __name__ == "__main__":
    main()
