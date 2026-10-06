# Marque IMAFRIK — « La Série »

Le nom IMAFRIK dessiné comme une série de onze coupes d'imagerie ; à la
place du A, le continent africain, taillé dans les mêmes coupes. La coupe
de l'Afrique de l'Ouest (15° N), en turquoise, sert de barre au A. Le
logotype se suffit : il ne s'accompagne pas du nom écrit à côté.

## Fichiers

| Fichier | Rôle |
|---|---|
| `glyph-spans.json` | Lettres de Geist (graisse 600) échantillonnées sur 11 coupes. Versionné : la marque ne dérive pas avec la police. |
| `sample-glyphs.mjs` | Produit `glyph-spans.json`. À relancer seulement pour changer graisse ou nombre de coupes. |
| `build.py` | Construit les tracés : `src/components/brand/geometry.ts`, `public/brand/*.svg`, `src/app/icon.svg`. |
| `render-icons.mjs` | Rend les PNG : `src/app/apple-icon.png`, `public/brand/icon-192.png`, `icon-512.png`. |

## Régénérer

```bash
python3 tools/brand/build.py

# Les rendus passent par le Chrome du poste, piloté par playwright-core,
# installé le temps de l'opération sans toucher à package.json.
npm install --no-save playwright-core@1
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
node tools/brand/render-icons.mjs
node tools/brand/sample-glyphs.mjs 600 11   # seulement pour rééchantillonner les lettres
```

Après toute évolution, recopier `public/brand/imafrik-logotype-clair.svg`
dans le dépôt backend (`services/api/app/assets/`) : il signe le pied des
comptes-rendus PDF.

## Usage dans l'application

- `<Wordmark className="h-5" />` — le logotype ; la taille se donne par la hauteur.
- `<BrandMark variant="compact" />` — le A seul, pour les petits espaces ;
  `full` au-delà de 48 px, `micro` sous 20 px.

Les coupes prennent la couleur du texte ; la coupe lue prend
`--brand-signal` (`#3FF2D0` en sombre, `#0FAE96` en clair).
