# Configuration du frontend

## Le principe : deux modes, un seul code

L'application fonctionne dans deux modes, et la bascule ne tient qu'à la
présence de deux variables d'environnement.

| Mode | Condition | Ce qui change |
| --- | --- | --- |
| **Démonstration** | `NEXT_PUBLIC_SUPABASE_*` ou `NEXT_PUBLIC_API_URL` absentes | Session, examens et comptes-rendus viennent du jeu de démonstration. Aucune authentification. |
| **Réel** | Les deux variables présentes | Session Supabase, cookies `httpOnly`, routes protégées, appartenances lues en base sous les politiques RLS. |

Ce repli est **délibéré et explicite**. Il permet de travailler
l'interface, de la montrer et de la déployer en aperçu sans dépendre d'un
projet Supabase. Ce qu'il ne fait pas : masquer une erreur de
configuration en production — le démarrage échoue si les variables
manquent hors développement (`assertConfiguredInProduction`).

---

## Mise en place

### 1. Créer le fichier local

```bash
cp .env.local.example .env.local
```

`.env.local` est ignoré par git ; le gabarit, lui, est versionné.

### 2. Récupérer les deux valeurs

Tableau de bord Supabase → **Project Settings → API** :

| Champ Supabase | Variable |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Les deux valeurs sont **publiques** : elles partent dans le navigateur à
chaque chargement, et c'est prévu. La clé anonyme n'ouvre aucun accès par
elle-même — tout ce qu'elle permet est encadré par les politiques RLS.

> ⚠️ Ne jamais placer ici la clé `service_role` : elle contourne RLS.
> Elle n'a rien à faire dans un dépôt frontend, ni dans un navigateur.

### 3. Redémarrer

```bash
npm run dev
```

Les variables `NEXT_PUBLIC_*` sont figées à la compilation : un
redémarrage est nécessaire.

---

## Ce que fait le mode réel

### Cookies plutôt que stockage local

Les jetons vivent dans des cookies `httpOnly`. Un jeton lisible par du
script est un jeton qu'une seule faille d'injection suffit à voler — et
il ouvrirait ici l'accès à des images médicales.

Conséquence pratique : le client Supabase serveur est recréé à chaque
requête pour lire les cookies de *cette* requête, et ne peut pas être mis
en cache dans un module.

### Aucun nom de patient dans l'adresse

Une recherche dans une liste d'examens (« À lire », « Examens », « Examens »
de l'administration) porte presque toujours un nom de patient. Dans
l'adresse (`?q=KOFFI`), elle finirait dans l'historique du navigateur —
lisible du suivant sur un poste partagé —, dans les journaux d'accès de
l'hébergeur et dans tout lien copié. Elle passe donc par l'action
`setListSearch`, qui la range dans un cookie `httpOnly` :

- valable trente minutes, un par liste ;
- lié au compte **et** à l'organisation active : un autre compte sur le
  même navigateur, ou une bascule d'organisation, repart d'une liste
  vierge ;
- relu par la page serveur (`lib/search/server.ts`), jamais par le
  navigateur.

Le champ désactive aussi l'historique de saisie du navigateur. Côté API,
seuls méthode, chemin et statut sont journalisés, jamais la chaîne de
requête. Les filtres qui ne disent rien de personne — urgences, statut,
période — restent dans l'adresse, partageables par lien. La recherche des
comptes porte sur des soignants, pas sur des patients : elle y reste aussi.

### Le proxy, avant tout rendu

`src/proxy.ts` (le successeur de `middleware.ts` depuis Next 16)
s'exécute avant chaque rendu, pour quatre raisons qui ne peuvent être
traitées ailleurs :

1. **Refuser une production incomplète** — voir `lib/deployment.ts` et
   la liste des variables ci-dessus.
2. **Poser la politique de sécurité du contenu**, avec un nonce propre à
   chaque requête (`lib/security/csp.ts`).
3. **Renouveler le jeton.** Un jeton d'accès expire au bout d'une heure ;
   un composant serveur rendu n'a plus le droit d'écrire un cookie de
   réponse. Sans le proxy, un radiologue verrait sa session tomber en
   pleine rédaction.
4. **Trier les accès** aux écrans protégés avant que la moindre donnée
   ne soit lue : un anonyme vers la connexion, un compte sans
   organisation vers `/en-attente`, chacun vers son portail.

Ce tri, fait sur les claims du jeton, est une première barrière.
Chaque disposition le refait sur la session relue en base
(`requireSession`), et les données restent protégées par l'API et RLS.

La liste des adresses publiques est une **liste blanche** : ajouter un
écran ne peut pas l'exposer par oubli.

### `getUser()`, jamais `getSession()`

`getSession()` se contente de lire le cookie, que le navigateur peut
avoir falsifié. `getUser()` fait valider le jeton par le serveur
d'authentification. Quand la réponse décide d'un accès à des images
médicales, c'est la seule vérification qui vaille.

### Changer d'organisation

Ce n'est pas un filtre d'affichage. L'appartenance active alimente les
claims `org_id` et `user_role` du jeton, donc **toutes** les politiques
RLS : après la bascule, la base elle-même ne renvoie plus les mêmes
lignes.

L'opération passe donc par la fonction `set_active_organization()` côté
base, puis par un rafraîchissement de session — sans lequel le jeton
porterait encore l'ancienne organisation.

---

---

## L'API IMAFRIK

### Contrat typé

Les types TypeScript sont **générés** depuis le contrat du service, pas
écrits à la main :

```bash
npm run api:types    # régénère src/lib/api/schema.d.ts
npm run api:check    # échoue si le contrat a changé sans régénération
```

`api:check` tourne dans l'intégration continue (le dépôt backend y est
extrait avec le secret `BACKEND_READ_TOKEN`) : c'est ce qui transforme
un changement d'API silencieux en échec de build, plutôt qu'en écran
cassé découvert par un utilisateur. Chaque schéma zod de
`lib/api/contracts.ts` est en outre comparé, **à la compilation**, au
type généré correspondant : un champ ajouté d'un côté seulement ne
compile pas.

### Validation au passage de la frontière

Les charges reçues sont validées par des schémas zod
(`src/lib/api/contracts.ts`) avant d'entrer dans l'application.

> ⚠️ **À corriger côté backend.** Les routes `GET /studies` et
> `GET /studies/{id}` déclarent aujourd'hui un objet libre
> (`additionalProperties: true`) : la génération produit donc un
> `Record<string, unknown>`, sans garantie de forme. Déclarer les modèles
> de réponse Pydantic côté service, puis régénérer.

Même une fois ces modèles publiés, la validation garde sa valeur : un
type TypeScript est effacé à l'exécution, et une réponse qui change de
forme après un déploiement ne produirait qu'un `undefined` silencieux au
milieu d'un écran. Ici, l'erreur est nette et à l'endroit du problème.

### Où passent les appels

**Tous côté serveur, aucun depuis le navigateur.** Le jeton qui autorise
l'appel vit dans un cookie `httpOnly` ; appeler l'API depuis le client
obligerait à le lui exposer, ce qui annulerait l'intérêt du cookie.

Les écritures — brouillon, signature, prise en charge — sont des actions
serveur (`src/lib/data/actions.ts`).

### Traduction des formes

`src/lib/data/` traduit la forme de l'API vers celle de l'interface
(`patient_name` → `patientName`, chaînes ISO → `Date`). La conversion a
lieu **une fois**, à cet endroit : sans cette frontière, chaque écran
devrait connaître le nommage du service, et un renommage côté API se
propagerait dans toute l'interface.

---

## Prérequis côté Supabase

Ces éléments sont posés par les migrations du dépôt backend et doivent
être en place pour que le mode réel fonctionne :

- les tables `profiles`, `memberships`, `organizations` et leurs
  politiques RLS ;
- la fonction `set_active_organization(p_membership_id)` ;
- le *Custom Access Token Hook* `custom_access_token_hook`, qui injecte
  `org_id`, `org_kind` et `user_role` dans le jeton. **En `SECURITY
  DEFINER`** : GoTrue l'exécute sous un rôle qui, sans cela, se heurte
  aux politiques RLS et produit des jetons sans claims — sans qu'aucun
  message d'erreur ne le signale.

## Adresses de redirection

À déclarer dans Supabase → **Authentication → URL Configuration** :

| Environnement | Redirect URL |
| --- | --- |
| Développement | `http://localhost:3000/auth/callback` |
| Aperçu Vercel | `https://<déploiement>.vercel.app/auth/callback` |
| Production | `https://<domaine>/auth/callback` |

Sans ces entrées, les liens d'invitation et de réinitialisation
aboutissent à une erreur — côté Supabase, pas côté application.
