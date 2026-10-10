# Tests

Deux niveaux, qui ne vérifient pas la même chose.

| Niveau | Outil | Dossier | Ce qu'il vérifie |
| --- | --- | --- | --- |
| Unitaire | Vitest | `src/**/*.test.ts` | La logique pure : redirections, accès par rôle, CSP, contrat d'API, textes. |
| Bout en bout | Playwright | `e2e/*.spec.ts` | L'application compilée, dans un vrai navigateur, en mode démonstration. |
| Parcours réels | Playwright | `e2e/reel/*.spec.ts` | L'application compilée contre le vrai Supabase et la vraie API (voir « Parcours réels »). |

Vitest ne lit que `src/**/*.test.ts` : les parcours Playwright, en
`.spec.ts` sous `e2e/`, ne sont jamais pris pour des tests unitaires.

## Lancer les parcours de bout en bout

```bash
npx playwright install chromium   # une fois par poste
npm run test:e2e                  # compile, démarre, teste
npm run test:e2e:ui               # même chose, en mode interactif
npx playwright show-report        # rapport HTML de la dernière exécution
```

`npm run test:e2e` compile l'application **en mode démonstration**, la
sert avec `next start` sur le port 3200 (`E2E_PORT` pour en changer),
puis lance les tests. Le port 3000 reste libre pour `next dev`.

Le mode démonstration est forcé par des variables vides
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_API_URL`…), qui l'emportent sur `.env.local` : un poste
configuré pour le staging lance exactement les mêmes tests que la CI,
sans toucher au staging. La compilation remplace celle de `.next/`.

Deux variables pour aller plus vite :

- `E2E_SKIP_BUILD=1` : réutilise la compilation présente, qui doit
  avoir été faite en mode démonstration ;
- un serveur déjà lancé sur le port 3200 est réutilisé hors CI.

## Comment les tests se placent

Rien ne passe par l'interface pour préparer un test : les cookies et le
stockage local sont posés avant le premier chargement
(`e2e/support/fixtures.ts`).

| Réglage | Mécanisme | Valeurs |
| --- | --- | --- |
| Portail | cookie `imafrik-demo-membership` | `m-radio`, `m-clinic`, `m-admin` |
| Langue | cookie `imafrik-langue` | `fr`, `en` |
| Thème | `localStorage.theme` (next-themes) | `dark`, `light` |

Chaque test échoue s'il a produit une erreur JavaScript ou un
`console.error`. Un test qui en attend une (le 404 d'une adresse
inexistante) la déclare dans `ignoredErrors`, avec sa raison.

Aucune attente fixe : les assertions de Playwright attendent d'elles-mêmes
que la page atteigne l'état voulu. La relecture automatique de la file
(trente secondes) est vérifiée sur une horloge simulée (`page.clock`),
sans attendre réellement.

## Ce que couvrent les parcours

| Fichier | Ce qu'il vérifie |
| --- | --- |
| `site-public.spec.ts` | Chaque page publique en français et en anglais : statut 200, `<html lang>`, `hreflang`, sélecteur de langue vers la page équivalente, aucun mot français sur le site anglais ; 404 dans la bonne langue. |
| `connexion.spec.ts` | La connexion mène à l'accueil de chaque portail ; un mot de passe vide est refusé ; la langue du site suit à la connexion ; la déconnexion ramène à l'écran de connexion. |
| `portails.spec.ts` | Pour chaque portail et chaque langue, chaque entrée de la navigation ouvre son écran, sans erreur. |
| `worklist.spec.ts` | Sections de la file, navigation au clavier `j` / `k` / `Entrée`, filtres portés par l'adresse et conservés au rechargement, relecture au plus une fois toutes les trente secondes. |
| `lecture.spec.ts` | L'écran de lecture s'ouvre depuis la file ; la pastille de langue du compte-rendu apparaît quand l'interface est dans une autre langue, et seulement alors. |
| `anglais.spec.ts` | Chaque écran des trois portails, en anglais : `<html lang="en">` et aucun libellé d'interface français. Les données de démonstration restent en français, et ne sont pas recherchées. |
| `mise-en-page.spec.ts` | Chevauchements de texte, défilement horizontal, texte rogné et cibles tactiles trop petites, sur un échantillon de pages à 1440 × 900 et 390 × 844, en clair et en sombre ; plus une contre-épreuve qui prouve que l'audit détecte bien ces anomalies. |
| `accessibilite.spec.ts` | Audit axe-core (WCAG 2.1 A et AA) des écrans principaux, en français et en anglais, en clair et en sombre ; contrôles au clavier. Voir « Accessibilité » ci-dessous. |

Un test marqué `test.fixme` documente une anomalie connue de
l'application : il est à réactiver une fois celle-ci corrigée.

## Accessibilité

`e2e/accessibilite.spec.ts` passe [axe-core](https://github.com/dequelabs/axe-core)
sur la page telle qu'elle est affichée, avec les règles des WCAG 2.1
de niveaux A et AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) : noms
accessibles des champs et des boutons, contrastes, usage d'ARIA,
structure des listes et des repères, langue de la page.

- **Pages auditées**, dans les deux langues et les deux thèmes : accueil,
  sécurité, contact (vide, puis en erreur après un envoi à vide),
  connexion ; file de lecture, écran de lecture `/lecture/1` et
  paramètres du radiologue ; tableau de bord, liste et fiche d'examen
  de la clinique ; cockpit, comptes, organisations et demandes reçues
  de l'administration.
- **Clavier** : le premier `Tab` atteint le lien « Aller au contenu »,
  visible, qui mène au repère `main` ; les repères de page sont
  présents ; les premiers éléments atteints montrent un focus visible ;
  le dialogue de confirmation du numéro d'ordre garde le focus et le
  rend au bouton qui l'a ouvert.

Seules les violations **graves** et **critiques** font échouer un test,
avec, pour chacune, la règle, l'impact, les éléments en cause et le
lien vers l'aide d'axe. Les violations modérées ou mineures sont jointes
au rapport HTML du test, en annotation.

La fixture `checkA11y` (`e2e/support/fixtures.ts`, détail dans
`e2e/support/accessibilite.ts`) audite la page courante ; un nouveau
parcours l'appelle une fois la page dans l'état voulu :

```ts
test("mon écran", async ({ page, checkA11y }) => {
  await page.goto("/mon-ecran");
  await checkA11y();
});
```

Aucune règle n'est désactivée. Une exclusion n'est admise que pour un
élément précis et un faux positif avéré (une image de viewer dessinée
dans un `<canvas>`, par exemple), inscrite avec sa justification dans
`EXCLUSIONS` (`e2e/support/accessibilite.ts`) ; la liste est vide
aujourd'hui. Un défaut réel se corrige dans l'application : un contraste
dans les jetons de `src/app/globals.css`, un nom ou un rôle dans le
composant.

```bash
E2E_PORT=3500 npx playwright test accessibilite   # ce seul fichier
```

## En intégration continue

Le job « Parcours de bout en bout » de
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) tourne à chaque
push sur `main` et sur chaque pull request : installation, Chromium et
ses dépendances système, compilation en mode démonstration, parcours.
En CI, un test en échec est rejoué une fois, avec une trace Playwright ;
un test qui ne passe qu'au second essai est signalé comme instable. En
cas d'échec, le rapport HTML et les traces sont publiés comme artefact
`rapport-playwright` (quatorze jours) : `npx playwright show-trace` sur
le fichier `trace.zip` rejoue le test pas à pas.

## Parcours réels

Le mode démonstration ne traverse ni GoTrue, ni PostgREST, ni le hook des
jetons, ni l'API : un défaut entre deux de ces pièces y reste invisible.
Les parcours de `e2e/reel/`, avec leur configuration
[`playwright.reel.config.ts`](../playwright.reel.config.ts), tournent au
contraire contre une pile complète, démarrée sur la machine de CI par
l'action composite
[`.github/actions/parcours-reels`](../.github/actions/parcours-reels/action.yml)
et le script [`tools/parcours-reels/pile.sh`](../tools/parcours-reels/pile.sh) :

| Pièce | Ce qui tourne |
| --- | --- |
| Supabase | Le Supabase local du backend (CLI 2.114.0) : base avec ses migrations et son jeu de départ, GoTrue, PostgREST, Kong, Mailpit. Clés de démonstration générées par la CLI. |
| API | L'image de production du backend (WeasyPrint, Pango, Cairo), en réseau hôte sur le port 8000. |
| Annexes | Redis ; S3Mock à la place de R2 (dépôt, relecture et URL pré-signées des PDF ; il ne vérifie pas les signatures) ; un viewer factice, page statique sur le port 3100. Orthanc n'y est pas : le viewer se vérifie sur la préproduction. |
| Application | Compilée avec les adresses de la pile, servie sur `http://127.0.0.1:3000`, l'adresse du site que le Supabase local écrit dans ses courriels. |

| Fichier | Ce qu'il vérifie |
| --- | --- |
| `connexion.spec.ts` | Un compte créé par l'API d'administration de GoTrue se connecte ; un mauvais mot de passe est refusé ; un radiologue enrôle un vrai second facteur TOTP, puis le présente à la connexion suivante. |
| `invitation.spec.ts` | Une invitation part de l'API, son courriel est lu dans Mailpit, son lien est suivi ; l'invité choisit son mot de passe, arrive sur son tableau de bord, et se reconnecte avec ce mot de passe. |
| `examen.spec.ts` | Un examen arrive par le webhook d'ingestion ; le radiologue le trouve dans sa file, le prend en charge, le rédige et le signe ; la clinique télécharge le PDF, dont l'empreinte est celle de la base ; la page publique reconnaît le code du QR code et le fichier. |
| `panne.spec.ts` | L'API arrêtée, le premier écran qui la demande annonce une interruption de service, sans référence d'erreur. Lancé en dernier : il arrête l'API pour de bon. |
| `totp.spec.ts` | Le calcul des codes TOTP du parcours, contre les vecteurs de la RFC 6238. |

Chaque parcours crée ses propres comptes (adresses en
`@parcours.imafrik.tech`, jamais distribuées : tout courrier reste dans
Mailpit) et ses propres examens, et ne suppose rien des autres. Les
organisations sont celles du jeu de départ du backend (`db/seed.sql`).

Le job `reel` de la CI du frontend les lance à chaque pull request et à
chaque push sur `main`, en extrayant le backend avec le jeton
`BACKEND_READ_TOKEN` (la branche homonyme si elle existe, `main` sinon).
Le backend appelle la même action dans son job `parcours`, avec la
branche homonyme du frontend : une évolution de l'API se vérifie contre
les écrans qui la consomment. Comptez une quinzaine de minutes. En cas
d'échec, l'artefact `rapport-parcours-reels` réunit le rapport, les
traces, les journaux des conteneurs et celui du démarrage de Supabase.

Ils ne se lancent pas sur un poste partagé : la pile occupe les ports
standard du Supabase local. Sur un poste dédié, Docker démarré :

```bash
export BACKEND_DIR=../backend PILE_DIR=/tmp/pile
docker build -t imafrik-api:parcours ../backend/services/api
tools/parcours-reels/pile.sh supabase
tools/parcours-reels/pile.sh services && tools/parcours-reels/pile.sh api
set -a && source /tmp/pile/pile.env && set +a
npm run build && npx playwright test --config playwright.reel.config.ts
```

