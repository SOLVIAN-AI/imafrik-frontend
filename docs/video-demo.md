# Vidéo de démonstration

Une vidéo de deux minutes quarante-cinq environ, en français, pour
présenter IMAFRIK à des cliniques et à des radiologues togolais. Elle est
**tournée par Playwright** sur le jeu de démonstration
(`src/lib/demo/`, `isDemoMode()`) : chaque prise refilme l'application
telle qu'elle est, et la vidéo suit donc l'interface sans retouche.

| Fichier                                                             | Rôle                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`e2e/demo/video.spec.ts`](../e2e/demo/video.spec.ts)               | Le scénario : scènes, sous-titres, captures clés.                            |
| [`e2e/demo/mise-en-scene.ts`](../e2e/demo/mise-en-scene.ts)         | Les outils de mise en scène : sous-titres, cartons, pointeur, cadre, rythme. |
| [`playwright.demo.config.ts`](../playwright.demo.config.ts)         | La configuration de tournage : 1440 × 900, vidéo, serveur neuf.              |
| [`tools/demo-video/assembler.sh`](../tools/demo-video/assembler.sh) | Le montage : MP4 H.264 coupé aux repères, fondus, captures.                  |

Ce n'est pas un test : `playwright.config.ts` écarte `e2e/demo/`
(`testIgnore`), et ni `npm run test:e2e` ni la CI ne le lancent.

## Tourner et monter

```bash
npx playwright install chromium ffmpeg   # une fois par poste
npm run video:demo                       # compile, tourne, monte
```

`npm run video:demo` compile l'application en mode démonstration, la
sert sur le port 3210 (`DEMO_PORT` pour en changer), tourne la prise
(environ trois minutes) puis la monte. Les livrables arrivent dans
`test-results/demo-video-livrables/` :

| Livrable                | Contenu                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `imafrik-demo.mp4`      | H.264 (profil High), 1440 × 900, 25 images/s, CRF 18, piste son silencieuse, lecture progressive. À diffuser. |
| `imafrik-demo.webm`     | La prise brute de Playwright (VP9), non coupée.                                                               |
| `01-*.png` à `06-*.png` | Les captures clés, une par moment fort, sans sous-titre.                                                      |

Variables utiles :

- `E2E_SKIP_BUILD=1` réutilise la compilation présente (faite en mode
  démonstration) ;
- `DEMO_VIDEO_OUT` change le répertoire de la prise ;
- `FFMPEG` désigne le ffmpeg du montage. Il en faut un qui encode en
  H.264 : celui du système d'abord ; ceux de Playwright n'encodent que
  le VP8 et le VP9. À défaut, `npm install ffmpeg-static` **hors du
  dépôt**, puis `FFMPEG=<dossier>/node_modules/ffmpeg-static/ffmpeg`.

Le montage seul, sur une prise existante :
`tools/demo-video/assembler.sh [prise] [destination]`.

## Le scénario

| Partie                        | Écrans                                                      | Ce que la vidéo montre                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ouverture                     | carton                                                      | « Vos examens lus à distance, par des radiologues vérifiés » ; données fictives.                                                                                            |
| 1. La clinique envoie et suit | tableau de bord, Envoyer un examen, Examens, fiche d'examen | La passerelle envoie seule ; le dépôt depuis le navigateur est **désigné** ; l'avancement d'un scanner urgent.                                                              |
| 2. Le radiologue lit et signe | À lire, écran de lecture                                    | La file triée par échéance, le filtre des urgences, le défilement des coupes, un modèle qui complète la conclusion ; la prise en charge et la signature sont **désignées**. |
| 3. La clinique vérifie        | tableau de bord, compte-rendu signé, `/verifier/…`          | Le compte-rendu signé, son signataire et son numéro d'ordre ; le téléchargement est **désigné** ; la page publique de vérification, ouverte par le lien du QR code.         |
| 4. L'équipe IMAFRIK           | Tour de contrôle, Activité, Flux d'images                   | Les alertes du moment, les délais promis, l'activité, le flux d'images.                                                                                                     |
| Fin                           | carton                                                      | Contact : contact@imafrik.tech.                                                                                                                                             |

### Rien n'est inventé

La vidéo ne montre que des écrans et des gestes de l'application. Un
geste que la démonstration n'exécute pas est **désigné** (pointeur posé,
cadre pointillé orange), jamais simulé, et le sous-titre le dit :

| Geste                    | Pourquoi il n'est pas fait                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Déposer des fichiers     | Le mode démonstration n'envoie rien.                                                            |
| Prendre en charge        | Non enregistré en démonstration.                                                                |
| Signer et transmettre    | Désactivé en démonstration.                                                                     |
| Télécharger le PDF signé | Aucun PDF n'existe en démonstration : le QR code imprimé n'est pas montré, seul son lien l'est. |

Les images sont des coupes simulées, et le sous-titre le précise.

## Mise en scène

Tout ce qui s'ajoute à l'interface est **injecté dans la page**, hors de
l'arbre de React, sans capter aucun clic :

- **Sous-titres** : bas de l'écran, lignes équilibrées, fondu d'entrée
  et de sortie. Un sous-titre s'efface à la fin de son temps de lecture
  (50 ms par caractère, 2,3 s au moins, environ 17 caractères par
  seconde, la norme des sous-titres de télévision) : jamais le texte
  d'un écran ne survit sur le suivant. Sur l'écran de lecture, il se
  centre sous les images pour laisser le compte-rendu lisible.
- **Cartons** : entre les parties, plein écran aux couleurs d'IMAFRIK.
  Un carton qui accompagne un changement de portail est monté avant le
  premier rendu de la page suivante : le rechargement ne se voit pas.
- **Pointeur** : une flèche (un navigateur sans interface n'en dessine
  pas), qui glisse avec une courbe d'accélération ; la souris de
  Playwright ne la rejoint qu'à l'arrivée, si bien que les survols
  s'allument au bon moment. Chaque clic laisse une onde brève.
- **Typographie** : chaque texte passe par `checkTypography` (apostrophe
  typographique, aucun tiret long), comme les textes de l'interface.

Avant la caméra, le scénario demande une fois chaque écran filmé au
serveur, tout juste démarré : aucun squelette de chargement à l'image.
Il écrit enfin `montage.json`, les repères (en millisecondes depuis le
début de la prise) du carton d'ouverture et de la fin du carton final ;
l'assemblage coupe la page blanche du premier chargement et ajoute les
fondus d'entrée et de sortie.

## Modifier la vidéo

- **Un texte** : dans `video.spec.ts`. Court (une ligne, deux au plus),
  au présent, sans jargon technique. Un texte fautif fait échouer la
  prise.
- **Le rythme** : `DEFAULT_TEMPO` dans `mise-en-scene.ts`, ou `hold`
  sur un sous-titre précis.
- **Un écran qui change** : la prise échoue sur l'attente qui ne trouve
  plus son élément, comme un test ; on corrige le sélecteur, on retourne.
- **Une scène** : garder la durée totale entre deux et trois minutes
  (l'assemblage l'affiche), et une capture clé par partie au plus.

Une prise ratée se refait (`retries: 0`) : un second essai écraserait la
première sans le dire. Relire la vidéo avant toute diffusion.

## Diffusion

La vidéo ne se commite pas. Chaque version diffusée est jointe, avec ses
captures, à une release GitHub brouillon du dépôt frontend
(`demo-video-AAAA-MM-JJ`).
