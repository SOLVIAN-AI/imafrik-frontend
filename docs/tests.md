# Tests

Deux niveaux, qui ne vérifient pas la même chose.

| Niveau | Outil | Dossier | Ce qu'il vérifie |
| --- | --- | --- | --- |
| Unitaire | Vitest | `src/**/*.test.ts` | La logique pure : redirections, accès par rôle, CSP, contrat d'API, textes. |
| Bout en bout | Playwright | `e2e/*.spec.ts` | L'application compilée, dans un vrai navigateur. |

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
