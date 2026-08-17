# IMAFRIK — frontend

Interface de la plateforme de téléradiologie. Next.js 16, React 19,
TypeScript, Tailwind 4. Déployé sur Vercel.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

## Le système de design en trois principes

Ils découlent du métier, pas du goût. Ils sont documentés en tête de
[`src/app/globals.css`](src/app/globals.css), qui fait autorité.

**Le sombre est le défaut.** Un radiologue lit dans une pièce assombrie
pour exploiter la plage dynamique de son écran. Une interface claire à
côté d'une image en niveaux de gris dégrade réellement sa perception : la
pupille s'adapte au blanc du châssis et l'image perd son contraste
apparent. Le thème clair existe pour le personnel des cliniques, en
bureau éclairé — pas comme préférence esthétique.

**Rien de saturé près de l'image.** Par contraste simultané, une teinte
vive adjacente à un gris en décale la perception. Le châssis reste neutre
avec une légère dominante froide, celle d'un moniteur diagnostique
calibré. L'accent ne colore jamais une surface : il ne marque que
l'interactif.

**La couleur porte du sens.** Un statut, une teinte, sans recouvrement —
et le rouge ne dit qu'une chose : urgent. Un bouton de suppression ne
mérite pas le même signal qu'un examen vital.

| Rôle | Usage |
|---|---|
| `accent` | Action, focus, sélection. Jamais une surface. |
| `urgent` | Urgence médicale, et rien d'autre |
| `progress` | En cours, attente anormale |
| `done` | Rendu, signé |

Les couleurs sont en **OKLCH** : à clarté égale, deux teintes y
paraissent réellement aussi lumineuses, ce que ne garantit ni HSL ni RGB.
Les échelles de gris restent donc perceptuellement régulières.

## Conventions

**Les composants consomment des rôles, jamais des couleurs brutes.**
`bg-surface-raised`, `text-secondary`, `text-urgent` — jamais
`bg-ink-900`. Un composant qui code une teinte en dur ne fonctionne que
dans un thème.

**La densité prime sur le confort.** Une worklist se balaye. Lignes de
40 px, chiffres tabulaires, statuts identifiables sans lire le texte. Un
tableau confortable afficherait vingt lignes ; à cette densité on en voit
une trentaine, ce qui change la façon de travailler.

**Le clavier est de première classe.** Chaque ligne de la worklist est
focusable et activable. Un radiologue enchaîne les examens plus vite au
clavier qu'à la souris, et l'anneau de focus n'est jamais supprimé.

**Deux signaux, jamais un seul.** Les statuts combinent couleur, pastille
et texte. Une pastille qui ne reposerait que sur la couleur serait
illisible pour un daltonien — environ un homme sur douze.

## Structure

```
src/
├── app/               routes (App Router)
│   ├── (app)/           portail authentifié
│   └── globals.css      système de design — source de vérité
├── components/
│   ├── ui/              primitives génériques
│   ├── domain/          composants métier : statuts, worklist
│   ├── layout/          ossature de l'application
│   └── providers/       thème, requêtes
└── lib/                 utilitaires
```

## Contrat d'API

Le backend publie son schéma OpenAPI dans
`imafrik-backend/services/api/openapi.json`. Le client typé en est
généré : une rupture côté API casse alors la **compilation** du frontend
plutôt que la production.
