# Déploiement

## Région

`cdg1` (Paris). C'est le point de présence Vercel le plus proche de
l'Afrique de l'Ouest ; le trafic Lomé–Europe y transite déjà pour la
plupart des services. Un déploiement par défaut atterrirait aux
États-Unis, ce qui ajouterait un aller-retour transatlantique à chaque
requête **et** poserait une question de localisation des traitements que
l'annexe de traitement des données ne prévoit pas.

Les **images**, elles, ne passent pas par Vercel : elles vont
directement du navigateur au stockage objet, dans l'Union européenne.

## En-têtes de sécurité

Posés dans `vercel.json`, pour tout le domaine :

| En-tête | Ce qu'il empêche |
| --- | --- |
| `Strict-Transport-Security` | Une première visite en clair, interceptable. |
| `X-Content-Type-Options` | Qu'un fichier téléversé soit interprété comme du script. |
| `X-Frame-Options` | Qu'un tiers encadre le portail pour capter des clics. |
| `Referrer-Policy` | Qu'une adresse d'examen fuite vers un site externe par l'en-tête `Referer`. |
| `Permissions-Policy` | Un accès caméra ou micro qu'aucun écran ne demande. |

`SAMEORIGIN` plutôt que `DENY` : le viewer d'images est chargé dans une
`iframe` de notre propre domaine.

## Deux pièges rencontrés

**Le premier déploiement d'un projet part en production**, quelle que
soit la commande. `vercel deploy` sans `--prod` produit bien un aperçu —
mais seulement à partir du deuxième. Sur un projet neuf, il faut donc
soit retirer l'alias de production immédiatement, soit accepter que la
première mise en ligne soit publique.

**Avec l'intégration Git, `main` va toujours en production.** Un
déploiement de démonstration ne peut donc pas vivre sur cette branche :
il faut une branche dédiée, dont Vercel fait un aperçu.

## Ce que sert un déploiement de production non configuré

Rien. L'intergiciel réécrit toute requête vers `/configuration-requise`,
avec un statut 503 et l'indication des variables manquantes.

Ce n'est pas une précaution théorique : servir le jeu de démonstration
sous une adresse de production présenterait de faux patients à de vrais
utilisateurs. Le refus est donc net — mais lisible, là où une exception
aurait produit un 500 muet.

## Variables d'environnement

À déclarer dans **Vercel → Settings → Environment Variables**, pour
chaque environnement où elles s'appliquent.

| Variable | Preview | Production | Note |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | staging | production | Publique. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging | production | Publique ; encadrée par RLS. |
| `NEXT_PUBLIC_API_URL` | API de staging | API de production | Sans elle, jeu de démonstration. |
| `NEXT_PUBLIC_SITE_URL` | URL du déploiement | domaine final | Sert aux liens des courriels. |

> ⚠️ **Jamais** la clé `service_role` : elle contourne les politiques
> RLS, et toute variable `NEXT_PUBLIC_*` part dans le navigateur.

Un déploiement de **production** sans les variables Supabase **échoue au
démarrage**, volontairement : servir le jeu de démonstration sous un
domaine de production afficherait de faux patients à de vrais
utilisateurs.

## Adresses de redirection Supabase

À ajouter dans **Authentication → URL Configuration** avant le premier
lien d'invitation :

```
https://<déploiement>.vercel.app/auth/callback
https://<domaine-final>/auth/callback
```

## Indexation

Seuls l'accueil et les pages légales sont indexables, et **uniquement
lorsque le service est réellement configuré**. Tant que le déploiement
tourne en mode démonstration, `robots.txt` interdit tout : un aperçu
indexé ferait figurer dans les moteurs des pages légales encore à l'état
de projet.

## Ce qu'il reste à faire avant une mise en production réelle

1. Faire relire les trois pages légales par un conseil et remplacer les
   mentions entre crochets.
2. Confirmer ou revoir les engagements de délai affichés sur l'accueil.
3. Renouveler les identifiants R2 et le mot de passe de base exposés en
   août 2026 (voir le `CHANGELOG.md` du dépôt backend).
4. Créer le projet Supabase de production — celui de staging ne doit
   jamais recevoir de données réelles.
