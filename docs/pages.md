# Carte des écrans

Ce document est l'inventaire de référence des pages du frontend IMAFRIK :
ce qui existe, ce qui reste à construire, et dans quel ordre. Il se lit
avant d'ajouter une route, pour éviter deux écrans qui font la même
chose sous deux noms différents.

Chaque écran porte une **phase** :

| Phase | Signification |
| --- | --- |
| **V1** | Nécessaire pour faire tourner la première clinique en production. |
| **V2** | Nécessaire pour en faire tourner dix sans intervention manuelle. |
| **V3** | Confort, analyse, différenciation commerciale. |

---

## 1. Le principe : une application, trois portails

Une seule application Next.js, un seul domaine, une seule
authentification. Ce que voit l'utilisateur dépend de son **rôle dans
l'organisation active** — pas d'un sous-domaine ni d'un déploiement
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

---

## 2. Vitrine publique — `(marketing)`

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
| `/verifier/[jeton]` | **Vérification publique d'un compte-rendu signé.** Le PDF porte un code ; le scanner mène ici, qui confirme l'authenticité du document, son signataire et sa date. Aucun compte requis, aucune donnée patient affichée. Sert l'API `GET /verify/{verify_token}`. | V1 |
| `/mentions-legales` | Éditeur, hébergeur, directeur de publication. | V1 |
| `/confidentialite` | Politique de confidentialité et traitement des données de santé. | V1 |
| `/cgu` | Conditions d'utilisation et contrat de service. | V1 |

**10 écrans.**

> La vitrine vit dans la même application que le produit. Elle partage le
> système de design, se déploie d'un coup et évite un second dépôt à
> maintenir. Le coût — un déploiement du produit pour changer un
> paragraphe d'accueil — est négligeable sur Vercel.

---

## 3. Authentification — `(auth)`

| Route | Écran | Phase |
| --- | --- | --- |
| `/connexion` | Identifiant et mot de passe. | V1 |
| `/invitation/[jeton]` | Rejoindre une organisation sur invitation : le destinataire choisit son mot de passe et entre directement dans l'application. | V1 |
| `/mot-de-passe-oublie` | Demande de lien de réinitialisation. | V1 |
| `/nouveau-mot-de-passe` | Saisie du nouveau mot de passe, après le lien reçu. | V1 |
| `/rejoindre` | **Candidature d'un radiologue.** Pas une inscription : un dossier, soumis à validation. Voir la décision n° 1. | V2 |
| `/verification` | Second facteur (code à usage unique). Voir la décision n° 4. | V2 |

**6 écrans**, plus deux gestionnaires de route sans interface :
`/auth/callback` (retour Supabase) et `/deconnexion`.

---

## 4. Mise en service — `(onboarding)`

Une seule coquille, des étapes matérialisées par des segments d'URL :
l'utilisateur peut revenir en arrière, fermer l'onglet et reprendre au
même endroit. Un assistant qui garde tout son état en mémoire perd le
travail au premier rechargement.

### Clinique

| Route | Étape | Phase |
| --- | --- | --- |
| `/bienvenue/etablissement` | Raison sociale, adresse, contact médical responsable. | V1 |
| `/bienvenue/connexion-pacs` | Paramètres d'envoi DICOM : AET, adresse, port, avec les valeurs à recopier dans la console du PACS. L'étape la plus délicate — elle se fait souvent au téléphone avec le technicien. | V1 |
| `/bienvenue/premier-envoi` | Attente et confirmation du premier examen reçu. Rien ne rassure autant qu'une image qui arrive. | V1 |
| `/bienvenue/equipe` | Invitation des collègues. | V2 |
| `/bienvenue/termine` | Récapitulatif et entrée dans le portail. | V1 |

### Radiologue

| Route | Étape | Phase |
| --- | --- | --- |
| `/bienvenue/profil` | Identité, spécialité, sur-spécialités lues. | V1 |
| `/bienvenue/qualifications` | Numéro d'ordre, diplômes, assurance en responsabilité civile professionnelle. Pièces jointes. | V2 |
| `/bienvenue/signature` | Bloc de signature apposé au bas des comptes-rendus : titre, mention légale, image de signature. | V1 |
| `/bienvenue/preferences` | Modalités et régions lues, disponibilités, notifications. Alimente l'affectation des examens. | V2 |
| `/bienvenue/validation` | Écran d'attente pendant l'examen du dossier par IMAFRIK. | V2 |

**10 étapes, une coquille.**

---

## 5. Portail clinique — `(app)`

Ce que doit avoir sous la main quelqu'un qui envoie des examens et
attend des comptes-rendus.

| Route | Écran | Phase |
| --- | --- | --- |
| `/tableau-de-bord` | Envoyés aujourd'hui, en cours de lecture, prêts à récupérer, délai moyen. La question du matin. | V1 |
| `/examens` | Tous les examens envoyés, avec leur état d'avancement. | V1 |
| `/examens/[id]` | Fiche d'un examen : images en consultation, état, compte-rendu dès qu'il est signé, téléchargement du PDF. Écran partagé — le radiologue y accède aussi, et y trouve le bouton qui ouvre la lecture. | V1 |
| `/envoyer` | Envoi manuel de fichiers DICOM depuis le navigateur, et rappel des paramètres d'envoi automatique. Voir la décision n° 2. | V1 |
| `/comptes-rendus` | Comptes-rendus reçus, recherche par patient ou par date. | V1 |
| `/equipe` | Membres, rôles, invitations. | V2 |
| `/facturation` | Consommation, factures, contrat de service. | V2 |
| `/patients` | Vue par patient : tous ses examens, tous ses comptes-rendus. | V3 |
| `/parametres` | Établissement, paramètres DICOM, notifications, sécurité. | V1 |

**9 écrans.**

---

## 6. Portail radiologue — `(app)` et `(reading)`

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

## 7. Back-office IMAFRIK — `(admin)`

Réservé à l'équipe Solvian AI. Tant qu'il n'existe pas, ces opérations
se font en SQL — tenable pour une clinique, intenable pour dix.

| Route | Écran | Phase |
| --- | --- | --- |
| `/admin/organisations` | Cliniques et cabinets, création, suspension. | V1 |
| `/admin/examens` | Recherche globale, réattribution, déblocage. | V1 |
| `/admin/radiologues` | Validation des candidatures et des pièces justificatives. | V2 |
| `/admin/contrats` | Qui sert qui : table `service_contracts`, qui détermine la visibilité inter-organisations. | V2 |
| `/admin/facturation` | Facturation des cliniques, rémunération des radiologues. | V2 |
| `/admin/audit` | Journal d'accès. Table `audit_log` déjà en base. Obligatoire dès qu'un litige survient. | V2 |
| `/admin` | Vue d'ensemble : volumes, délais, incidents. | V3 |
| `/admin/parametres` | Paramètres de la plateforme. | V3 |

**8 écrans.**

---

## 8. Écrans système

| Fichier | Écran | Phase |
| --- | --- | --- |
| `not-found.tsx` | Page inconnue. | V1 |
| `error.tsx` | Erreur inattendue, avec un moyen de repartir. | V1 |
| `forbidden.tsx` | Accès refusé — cas fréquent ici : un examen appartenant à une autre organisation. Le message doit dire quoi faire, pas seulement refuser. | V1 |

**3 écrans.**

---

## 9. Décompte

| Domaine | Écrans | Dont V1 |
| --- | --- | --- |
| Vitrine publique | 10 | 6 |
| Authentification | 6 | 4 |
| Mise en service | 10 | 6 |
| Portail clinique | 9 | 6 |
| Portail radiologue | 9 | 6 *(2 faits)* |
| Back-office | 8 | 2 |
| Système | 3 | 3 |
| **Total** | **55** | **33** |

Cinquante-cinq écrans à terme, **trente-trois pour la mise en
production**, dont deux sont construits. C'est l'ordre de grandeur
normal d'un SaaS métier : l'essentiel du volume est dans les portails et
la mise en service, pas dans la vitrine.

---

## 10. Ce qui n'est pas un écran

À ne pas compter, et surtout à ne pas transformer en page :

- **Les modales** — signature d'un compte-rendu, invitation d'un membre,
  confirmation de suppression. Elles gardent le contexte visible.
- **Les panneaux latéraux** — aperçu d'un examen depuis la liste, détail
  d'une facture.
- **La palette de commandes** (⌘K) — recherche et navigation, présente
  partout.
- **Les gestionnaires de route** — `/auth/callback`, `/deconnexion`,
  téléchargement de PDF : ils redirigent ou renvoient un fichier, ils
  n'affichent rien.

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
4. **Second facteur d'authentification ?** Recommandation : oui pour les
   comptes qui accèdent aux images, au moins en option, avant la
   première mise en production réelle.

---

## 12. Ordre de construction proposé

1. **Les deux portails** — clinique et radiologue, avec des données de
   démonstration. C'est là que se juge le produit.
2. **La mise en service** — les deux parcours, qui décident de la
   première impression.
3. **L'authentification** — Supabase en rendu serveur, cookies
   `httpOnly`, protection des routes.
4. **Le branchement de l'API** — client généré depuis `openapi.json`,
   remplacement du jeu de démonstration.
5. **La vitrine et les pages légales** — indispensables le jour de la
   mise en ligne, sans valeur avant.
6. **Le back-office** — le jour où le SQL manuel devient un risque.
