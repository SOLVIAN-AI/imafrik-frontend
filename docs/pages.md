# Carte des écrans

Ce document est l'inventaire de référence des pages du frontend IMAFRIK :
ce qui existe, ce qui reste à construire, et dans quel ordre. Il se lit
avant d'ajouter une route, pour éviter deux écrans qui font la même
chose sous deux noms différents.

Chaque écran porte une **phase** :

> **État au 18 août 2026 :** les phases V1 sont construites, sauf
> mention contraire dans les tableaux ci-dessous. Les écrans marqués
> **Fait** sont en place et vérifiés dans le navigateur.

| Phase | Signification |
| --- | --- |
| **V1** | Nécessaire pour faire tourner la première clinique en production. |
| **V2** | Nécessaire pour en faire tourner dix sans intervention manuelle. |
| **V3** | Confort, analyse, différenciation commerciale. |

---

## 1. Le principe : une application, trois portails

Une seule application Next.js, un seul domaine, une seule
authentification. Ce que voit l'utilisateur dépend de son **rôle dans
l'organisation active**, pas d'un sous-domaine ni d'un déploiement
séparé.

Trois raisons :

1. **Un utilisateur peut appartenir à plusieurs organisations**, avec un
   rôle différent dans chacune (AD-7). Un radiologue peut aussi être
   administrateur du cabinet qui l'emploie. Deux applications
   l'obligeraient à se reconnecter pour changer de casquette.
2. **Le châssis est le même** : navigation latérale, sélecteur
   d'organisation, recherche, thème. Seul le contenu de la navigation
   change.
3. **Un seul système de design, un seul déploiement, un seul jeu de
   tests.**

Les groupes de routes Next matérialisent cette séparation sans
apparaître dans les URL :

```
src/app/
├── (marketing)/     vitrine publique, aucun compte requis
├── (auth)/          connexion, invitation, mot de passe
├── (onboarding)/    parcours de première mise en service
├── (app)/           portails clinique et radiologue (châssis complet)
├── (reading)/       écran de lecture (châssis retiré, place aux images)
│                    → `/lecture/[id]`, distinct de `/examens/[id]` qui
│                      reste la fiche d'un examen dans le châssis
└── (admin)/         back-office IMAFRIK
```

### Application bilingue

Chaque écran de l'application existe en français et en anglais. Deux
langues distinctes cohabitent :

- **La langue de l'utilisateur** (`profiles.locale`), choisie dans
  Paramètres ou par la palette de commandes : celle des écrans, des
  messages du service (`Accept-Language`) et des courriels de son compte.
  La connexion la reporte dans le cookie `imafrik-langue`, que lit le
  rendu serveur.
- **La langue des comptes-rendus d'une clinique**
  (`organizations.report_language`), fixée au contrat par l'équipe
  IMAFRIK (fiche de la clinique, ou `make clinic … LANGUE=en`) : celle du
  PDF signé, de sa page de vérification, des titres de section dans
  l'éditeur et des phrases types du menu « / ». Quand elle diffère de
  celle de l'écran, l'écran de lecture le signale.

Les textes vivent dans `src/i18n/messages/{fr,en}/`, un fichier par
zone. Le français est la référence : le type `AppMessages` en est déduit,
et une clé manquante en anglais est une erreur de compilation. Un
composant serveur lit `getMessages()`, un composant client
`useMessages()` ; les formats (dates, nombres, durées) prennent la
langue. Une date anglaise écrit son mois en lettres : `06/10/2026` se lit
le 10 juin aux États-Unis.

Le test `src/i18n/no-hardcoded-text.test.ts` refuse toute phrase
française écrite en dur hors des dictionnaires ; les données de
démonstration (patients, comptes-rendus, organisations fictives) en sont
exclues, ce sont des données.

---

## 2. Vitrine publique : `(marketing)`

Aucun compte requis. C'est ce que voit une clinique de Lomé qui découvre
le produit, et c'est là que se joue la crédibilité d'un service qui
manipule des données de santé.

| Route | Écran | Phase |
| --- | --- | --- |
| `/` | Accueil : promesse, preuve, appel à l'action. | V1 |
| `/cliniques` | Ce que le service change pour un établissement : délai de compte-rendu, absence d'investissement matériel, continuité la nuit et le week-end. | V2 |
| `/radiologues` | Ce que le service change pour un médecin : volume, souplesse, outil de lecture. Porte d'entrée du recrutement. | V2 |
| `/tarifs` | Grille tarifaire. Un service de santé qui cache ses prix inquiète. | V2 |
| `/securite` | Hébergement, chiffrement, journalisation, localisation des données, sous-traitance. **Page commerciale, pas juridique** : c'est la première question d'un directeur d'établissement. | V1 |
| `/contact` | Demande de démonstration. | V1 |
| `/verifier/[jeton]` | **Vérification publique d'un compte-rendu signé.** Le PDF porte un code ; le scanner mène ici, qui confirme l'authenticité du document, son signataire et sa date. Aucun compte requis ; du patient, seule l'initiale du nom est affichée. Sert l'API `GET /verify/{verify_token}`. | V1 |
| `/mentions-legales` | Éditeur, hébergeur, directeur de publication. | V1 |
| `/confidentialite` | Politique de confidentialité et traitement des données de santé. | V1 |
| `/cgu` | Conditions d'utilisation et contrat de service. | V1 |

**10 écrans**, chacun en français et en anglais pour ce qui est en ligne.

### Version anglaise

Le site public existe aussi en anglais, pour les établissements
anglophones (Ghana, Nigeria, Liberia, Sierra Leone, Gambie). Chaque page a
son adresse dans sa langue :

| Français | Anglais |
| --- | --- |
| `/` | `/en` |
| `/securite` | `/en/security` |
| `/contact` | `/en/contact` |
| `/verifier/[jeton]` | `/en/verify/[jeton]` |
| `/mentions-legales` | `/en/legal-notice` |
| `/confidentialite` | `/en/privacy` |
| `/cgu` | `/en/terms` |

- **Les textes** vivent dans `src/content/marketing/fr.ts` et `en.ts`,
  deux objets du même type (`MarketingCopy`) : une entrée oubliée dans
  une langue est une erreur de compilation. Les pages juridiques, rédigées
  plutôt que composées, ont une version par langue dans
  `src/components/marketing/legal/`, et les faits qu'elles citent
  (sous-traitants, durées) sont bilingues dans `lib/legal.ts`.
- **Les adresses** se correspondent dans `lib/i18n/routes.ts`, seule
  table de correspondance : le sélecteur « FR | EN » mène à la même page
  dans l'autre langue, et chaque page déclare son équivalent (`hreflang`).
- **La langue de la page** est déduite de l'adresse par le proxy, qui la
  transmet à la disposition racine pour `<html lang>`.
- **Aucune redirection automatique** selon la langue du navigateur : elle
  empêcherait de partager une page dans l'autre langue, et d'indexer les
  deux.
- **La version française fait foi** pour les documents juridiques ; la
  traduction le rappelle en tête de page.
- **La connexion suit la langue choisie.** Chaque page du site mémorise
  sa langue dans un cookie (`imafrik-langue`, un code de langue et rien
  d'autre) ; la connexion et la demande de réinitialisation s'affichent
  dans cette langue et portent elles aussi le sélecteur. Le changement de
  langue recharge la page entière (`?langue=en`, que le proxy retire
  après avoir posé le cookie), en conservant la destination demandée.
- **L'application suit la langue de l'utilisateur**, choisie dans
  Paramètres et enregistrée sur son compte (`profiles.locale`) : voir
  « Application bilingue » ci-dessous. Chaque disposition déclare sa
  langue (`HtmlLang`), pour que `<html lang>` reste juste après une
  navigation interne d'une langue à l'autre.

> La vitrine vit dans la même application que le produit. Elle partage le
> système de design, se déploie d'un coup et évite un second dépôt à
> maintenir. Le coût (un déploiement du produit pour changer un
> paragraphe d'accueil) est négligeable sur Vercel.

---

## 3. Authentification : `(auth)`

| Route | Écran | Phase |
| --- | --- | --- |
| `/connexion` | Identifiant et mot de passe. | V1 |
| `/mot-de-passe-oublie` | Demande de lien de réinitialisation. | V1 |
| `/nouveau-mot-de-passe` | Saisie du nouveau mot de passe, après le lien de réinitialisation. | V1 |
| `/invitation` | **Accueil d'un invité** : établissement ou groupe, rôle en clair, qui a invité, ville ; puis le choix du mot de passe. Ouvert avant la double authentification. | V1, fait |
| `/rejoindre` | **Candidature d'un radiologue.** Pas une inscription : un dossier, soumis à validation. Voir la décision n° 1. | V2 |
| `/double-authentification` | **Second facteur** : enrôlement d'une application TOTP (QR code, clé de secours) ou saisie du code. Obligatoire pour radiologues et administration : imposé au jeton (voir AD-8 du dépôt backend). | V1, fait |

| `/en-attente` | Compte valide rattaché à aucune organisation active : candidature en cours d'examen ou organisation suspendue. | V1 |

**7 écrans**, plus un gestionnaire de route sans interface :
`/auth/callback`, retour des liens Supabase. La **déconnexion** est une
action serveur, qui révoque d'abord les jetons de visualisation puis
ferme la session.

### Arrivée d'un invité

Le courriel d'invitation envoyé par l'API ramène à
`/auth/callback?suite=/invitation` (une réinitialisation de mot de passe,
elle, à `suite=/nouveau-mot-de-passe`). Le parcours :

1. **`/invitation`** lit `GET /me/invitation` côté serveur et présente
   l'organisation qui accueille, le rôle en clair, la personne qui a
   invité et la date. Un invité qui n'attendait pas ce lien sait qu'il
   doit fermer la page et écrire à contact@imafrik.tech. Le proxy laisse
   passer cet écran pour une session `mfa_required`, et le service y
   répond dans ce même état ; le jeton n'ouvre toujours aucune donnée.
2. **Mot de passe** : même formulaire et mêmes règles que
   `/nouveau-mot-de-passe`.
3. **Double authentification** quand le rôle l'exige (radiologue, équipe
   IMAFRIK) : `/double-authentification?suite=/bienvenue`.
4. **Mise en service** : `/bienvenue`.

Si l'invitation ne peut pas être lue (aucune appartenance, service
indisponible), l'écran retombe sur le seul choix du mot de passe, et la
suite est la même. L'écran porte le sélecteur de langue des écrans
d'entrée. En démonstration, il présente une invitation fixe : personnel
de l'accueil de la Clinique Saint-Joseph, invité par la gestionnaire de
la clinique ; l'enregistrement du mot de passe y est indisponible.

---

## 4. Mise en service : `(onboarding)`

Une seule coquille, des étapes matérialisées par des segments d'URL :
l'utilisateur peut revenir en arrière, fermer l'onglet et reprendre au
même endroit. Un assistant qui garde tout son état en mémoire perd le
travail au premier rechargement.

### Clinique

| Route | Étape | Phase |
| --- | --- | --- |
| `/bienvenue/etablissement` | Raison sociale, adresse, contact médical responsable. | V1 |
| `/bienvenue/connexion-pacs` | Paramètres d'envoi DICOM : AET, adresse, port, avec les valeurs à recopier dans la console du PACS. L'étape la plus délicate : elle se fait souvent au téléphone avec le technicien. | V1 |
| `/bienvenue/premier-envoi` | Attente et confirmation du premier examen reçu. Rien ne rassure autant qu'une image qui arrive. | V1 |
| `/bienvenue/equipe` | Invitation des collègues. | V2 |
| `/bienvenue/termine` | Récapitulatif et entrée dans le portail. | V1 |

### Radiologue

| Route | Étape | Phase |
| --- | --- | --- |
| `/bienvenue/profil` | Identité et numéro d'ordre (obligatoire, vérifié par l'équipe IMAFRIK avant tout accès aux examens). **Fait.** | V1 |
| `/bienvenue/qualifications` | Numéro d'ordre, diplômes, assurance en responsabilité civile professionnelle. Pièces jointes. | V2 |
| `/bienvenue/signature` | Bloc de signature apposé au bas des comptes-rendus : titre, mention légale, image de signature. | V1 |
| `/bienvenue/preferences` | Modalités et régions lues, disponibilités, notifications. Alimente l'affectation des examens. | V2 |
| `/bienvenue/validation` | Écran d'attente pendant l'examen du dossier par IMAFRIK. Pour l'instant, l'étape `/bienvenue/termine` explique l'attente de validation du numéro d'ordre. | V2 |

**10 étapes, une coquille.**

---

## 5. Portail clinique : `(app)`

Ce que doit avoir sous la main quelqu'un qui envoie des examens et
attend des comptes-rendus.

| Route | Écran | Phase |
| --- | --- | --- |
| `/tableau-de-bord` | Envoyés aujourd'hui, en cours de lecture, prêts à récupérer, délai moyen. La question du matin. | V1 |
| `/examens` | Tous les examens envoyés, avec leur état d'avancement. | V1 |
| `/examens/[id]` | Fiche d'un examen : images en consultation, état, compte-rendu dès qu'il est signé, téléchargement du PDF. Écran partagé : le radiologue y accède aussi, et y trouve le bouton qui ouvre la lecture. | V1 |
| `/envoyer` | Envoi manuel de fichiers DICOM depuis le navigateur, et rappel des paramètres d'envoi automatique. Voir la décision n° 2. | V1 |
| `/comptes-rendus` | Comptes-rendus reçus, recherche par patient, identifiant ou modalité (faite par le service), liste paginée. | V1 |
| `/equipe` | Membres, rôles, invitations. | V2 |
| `/facturation` | Consommation, factures, contrat de service. | V2 |
| `/patients` | Vue par patient : tous ses examens, tous ses comptes-rendus. | V3 |
| `/parametres` | Établissement, paramètres DICOM, notifications, sécurité. | V1 |

**9 écrans.**

---

## 6. Portail radiologue : `(app)` et `(reading)`

| Route | Écran | Phase |
| --- | --- | --- |
| `/worklist` | File de travail commune. **Fait.** | V1 |
| `/lecture/[id]` | Écran de lecture : images et compte-rendu en écran scindé. **Fait.** | V1 |
| `/mes-examens` | Ce que le radiologue a pris en charge et n'a pas encore rendu. | V1 |
| `/comptes-rendus` | Ses comptes-rendus signés. | V1 |
| `/comptes-rendus/[id]` | Compte-rendu signé, en lecture seule, avec ses éventuels addenda. | V1 |
| `/modeles` | Modèles de comptes-rendus, par modalité et par région. Table `report_templates` déjà en base. Gain de temps décisif sur les examens normaux. | V2 |
| `/activite` | Volume lu, délais, répartition par modalité. | V3 |
| `/honoraires` | Relevé de rémunération. Voir la décision n° 3. | V2 |
| `/parametres` | Profil, signature, notifications, préférences de lecture. | V1 |

**9 écrans**, dont 2 déjà construits.

---

## 7. Back-office IMAFRIK : `(admin)`

Réservé à l'équipe IMAFRIK : la tour de contrôle. Aucune donnée de
patient dans les vues de pilotage (AD-13 du dépôt backend).

| Route | Écran | État |
| --- | --- | --- |
| `/admin` | **Cockpit** : alertes, files en direct, délais promis tenus, réseau, exploitation. | Fait |
| `/admin/activite` | Volumes, délais (médiane, 9 sur 10), étapes du parcours, heures d'arrivée, par clinique (débit), modalité, radiologue. Période et clinique dans l'adresse. | Fait |
| `/admin/flux` | Flux d'images examen par examen : débit de réception, frise acquisition → remise. | Fait |
| `/admin/organisations` | Volumes sur 30 jours, dernier envoi, suspension, invitation. | Fait |
| `/admin/organisations/[id]` | Mise en service d'une clinique, activité, **durée de conservation des images**, état du contrat et **fin de contrat**. | Fait |
| `/admin/utilisateurs` | Comptes : rattachement, **validation des numéros d'ordre** (filtre « À valider », `?validation=attente`), double authentification, réinitialisation. | Fait |
| `/admin/examens` | Recherche globale, urgences en cours. | Fait |
| `/admin/demandes` | Demandes reçues par le site (établissement ou radiologue, numéro d'ordre déclaré), suivi et notes. | Fait |
| `/admin/facturation` | Actes du mois par clinique et modalité, export CSV protégé contre l'injection de formules. | Fait |
| `/admin/systeme` | Dépendances, PACS, version, filets de sécurité (sauvegardes, exercices, réconciliation, conservation). | Fait |
| `/admin/audit` | Journal d'audit, filtré par action, paginé par curseur. | Fait |
| `/admin/reglages` | Délais promis, bandeau de maintenance. | Fait |
| `/admin/contrats` | Qui sert qui (`service_contracts`). | V2 (en SQL pour l'instant) |

**13 écrans.**

### Qui crée les comptes, et la validation des radiologues

- **Personnel d'une clinique** : créé par la clinique elle-même, depuis
  `/equipe` (invitation par courriel). L'équipe IMAFRIK n'intervient pas.
- **Radiologues** : un radiologue fait sa demande par le formulaire de
  contact du site (« Je suis : un radiologue »), avec son numéro d'ordre,
  ou il est invité par la clinique qui l'emploie ou par l'équipe IMAFRIK.
  Dans tous les cas, **il n'accède à aucun examen tant que l'équipe
  IMAFRIK n'a pas validé son numéro d'ordre** : la base lui masque tous
  les examens et le service refuse prise en charge, rendu, brouillon,
  enregistrement, signature et addenda (403, message explicite).

Le parcours :

1. Le radiologue renseigne son numéro d'ordre : étape « profil » de la
   mise en service (champ obligatoire), ou `/parametres`. La dernière
   étape de la mise en service, sa file et « Mes examens » lui disent
   ensuite que la vérification est en cours, et pourquoi.
2. Le cockpit signale les radiologues en attente (alerte
   `unverified_radiologists`), qui mène à `/admin/utilisateurs?validation=attente`.
3. L'équipe vérifie le numéro **auprès de l'Ordre des médecins**, hors de
   la plateforme, puis le valide : la confirmation affiche le numéro
   exact, celui qui sera imprimé sous la signature. Le geste est tracé
   (`user.credentials_verified`, avec le numéro).
4. Retirer la validation (`user.credentials_revoked`) coupe l'accès à la
   requête suivante et rend au pool les examens en cours de ce
   radiologue ; ses brouillons sur ces examens sont effacés.
5. Un radiologue qui change de numéro perd sa validation (déclencheur en
   base) : les paramètres l'en avertissent et demandent confirmation.

En démonstration, deux radiologues attendent leur validation (l'un sans
numéro), l'alerte du cockpit est présente, et les gestes de validation
répondent « indisponible en démonstration ».

### Fin de contrat d'une clinique

En bas de la fiche d'une clinique, une zone de danger : « Mettre fin au
contrat ». La boîte de dialogue dit ce que le geste enclenche, puis
n'active le bouton qu'une fois le nom de la clinique saisi (casse et
espaces de bord ignorés, comme le service).

- **Effet** (`POST /admin/clinics/{id}/end-contract`) : clinique
  suspendue, ses membres perdent l'accès à leur requête suivante ;
  retirée du pool ; contrats de service fermés ; geste tracé
  (`organization.contract_ended`, avec le nombre d'examens abandonnés).
  Les comptes-rendus signés restent conservés vingt ans (verrou R2) et
  vérifiables par leur QR code ; les images suivent la durée de
  conservation du contrat.
- **Examens non rendus** : le service refuse (409) et en donne le
  nombre. L'écran affiche son message et demande une seconde
  confirmation explicite, « Abandonner ces examens », avant de réessayer.
- **Ensuite** : la commande d'export renvoyée par le service s'affiche, à
  copier. L'archive contient des données de santé nominatives : elle se
  remet à la clinique par un canal chiffré, puis s'efface de la machine
  qui l'a produite.
- **Contrat terminé** : bandeau daté en tête de fiche, réglages en
  lecture seule, rappel de l'export.

En démonstration, toutes les cliniques sont sous contrat et le geste
répond « indisponible en démonstration ».

---

## 8. Écrans système

| Fichier | Écran | Phase |
| --- | --- | --- |
| `not-found.tsx` | Page inconnue. | V1 |
| `error.tsx` | Erreur inattendue, avec un moyen de repartir. | V1 |
| `forbidden.tsx` | Accès refusé, cas fréquent ici : un examen appartenant à une autre organisation. Le message doit dire quoi faire, pas seulement refuser. | V1 |

**3 écrans.**

---

## 9. Décompte et état

| Domaine | Écrans prévus | Dont V1 | **Construits** |
| --- | --- | --- | --- |
| Vitrine publique | 10 | 6 | **7** |
| Authentification | 6 | 4 | **4** |
| Mise en service | 10 | 6 | **10** |
| Portail clinique | 9 | 6 | **7** |
| Portail radiologue | 9 | 6 | **7** |
| Back-office | 8 | 2 | **2** |
| Système | 3 | 3 | **3** |
| **Total** | **55** | **33** | **40** |

### Fait

- **Vitrine** : accueil, sécurité, contact, vérification publique d'un
  compte-rendu, mentions légales, protection des données, conditions
  d'utilisation.
- **Authentification** : connexion, mot de passe oublié, nouveau mot de
  passe, invitation. Session Supabase en rendu serveur, cookies
  `httpOnly`, intergiciel de protection, retour des liens par courriel.
- **Mise en service** : les deux parcours complets, état dans l'URL,
  brouillon persisté, validation par section.
- **Portail clinique** : tableau de bord, envoi (dépôt manuel et
  paramètres PACS), suivi des examens, fiche d'examen, comptes-rendus,
  équipe, paramètres.
- **Portail radiologue** : file de travail, écran de lecture, mes
  examens, comptes-rendus, compte-rendu signé, modèles, paramètres.
- **Back-office** : organisations, examens toutes organisations
  confondues.
- **Système** : 404, 403, erreur.

### Reste à faire

| Écran | Phase | Pourquoi il n'est pas fait |
| --- | --- | --- |
| `/cliniques`, `/radiologues`, `/tarifs` | V2 | L'accueil couvre les deux publics ; ces pages n'ont d'intérêt qu'avec du contenu commercial propre. |
| `/rejoindre` (candidature radiologue) | V2 | Dépend du parcours de validation côté back-office. |
| `/patients` (clinique) | V3 | Confort ; la recherche par patient existe déjà dans les comptes-rendus. |
| `/facturation`, `/honoraires` | V2 | Décision n° 3 non tranchée : la rémunération passe-t-elle par l'application ? |
| `/activite` (radiologue) | V3 | Analyse ; sans valeur avant plusieurs mois d'exploitation. |
| `/admin/contrats` | V2 | Les contrats de service se créent en SQL ; tenable tant que le réseau compte quelques groupes. |

## 10. Ce qui n'est pas un écran

À ne pas compter, et surtout à ne pas transformer en page :

- **Les modales** : signature d'un compte-rendu, invitation d'un membre,
  confirmation de suppression. Elles gardent le contexte visible.
- **Les panneaux latéraux** : aperçu d'un examen depuis la liste, détail
  d'une facture.
- **La palette de commandes** (⌘K) : recherche et navigation, présente
  partout.
- **Les gestionnaires de route** (`/auth/callback`) : il redirige, il
  n'affiche rien. Le PDF d'un compte-rendu est servi par un lien signé
  de courte durée, obtenu par une action serveur.

---

## 11. Quatre décisions à trancher

Elles changent le nombre d'écrans et leur contenu ; elles sont posées
ici pour être tranchées explicitement.

1. **Inscription libre ou sur invitation ?** Recommandation : sur
   invitation pour les cliniques (il y a un contrat de service derrière)
   et sur candidature pour les radiologues (les qualifications se
   vérifient). Une inscription ouverte donnerait des comptes non
   validés en face de données de santé.
2. **Envoi manuel de fichiers DICOM depuis le navigateur ?**
   Recommandation : oui, dès la V1. Toutes les cliniques n'ont pas un
   PACS capable d'envoyer vers l'extérieur, et certaines n'ont qu'un
   graveur de CD. Sans cet écran, une partie du marché visé ne peut pas
   utiliser le service.
3. **La rémunération des radiologues passe-t-elle par l'application ?**
   Si oui, `/honoraires` et `/admin/facturation` deviennent structurants
   et il faut un modèle tarifaire par acte en base.
4. ~~**Second facteur d'authentification ?**~~ **Tranché (8 octobre
   2026)** : obligatoire pour les radiologues et l'administration, imposé
   à l'émission du jeton ; facultatif pour les établissements, et alors
   exigé à chaque connexion. Voir AD-8 du dépôt backend.

---

## 12. Ordre de construction proposé

1. **Les deux portails** : clinique et radiologue, avec des données de
   démonstration. C'est là que se juge le produit.
2. **La mise en service** : les deux parcours, qui décident de la
   première impression.
3. **L'authentification** : Supabase en rendu serveur, cookies
   `httpOnly`, protection des routes.
4. **Le branchement de l'API** : client généré depuis `openapi.json`,
   remplacement du jeu de démonstration.
5. **La vitrine et les pages légales** : indispensables le jour de la
   mise en ligne, sans valeur avant.
6. **Le back-office** : le jour où le SQL manuel devient un risque.
