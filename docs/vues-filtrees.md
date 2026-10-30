# Vues filtrées

> Règle produit posée par le propriétaire d’IMAFRIK : « partout où une vue
> filtrée est nécessaire, on doit l’avoir : par modalités, par clinique,
> plus tard par pays, etc. »

Ce document fait trois choses :

1. il recense chaque écran à liste ou à tableau, pour chaque rôle, avec ses
   filtres d’aujourd’hui, ceux qui manquent et la donnée disponible côté
   service ;
2. il fixe l’architecture commune : une barre de filtres partagée, un
   modèle de « dimension de filtre » où ajouter une dimension (le pays) se
   fait en un seul endroit, l’état dans l’adresse et les comptes par
   option ;
3. il découpe le travail en petites PR, par priorité.

**État au 29 octobre 2026.** Recensement fait sur `main` (728bb77) et sur
la PR « Attribuer toujours visible » (#98, fusionnée depuis), qui a créé
la liste déroulante des cliniques (`ClinicDropdown`, motif combobox) et
l’a branchée dans « Examens », « À lire », « Activité » et « Flux ». Ce
composant est devenu la liste déroulante commune (`FilterDropdown`) :
généralisé, pas réécrit. Plan validé le 29 octobre 2026, ses cinq
décisions comprises (section 5) ; la recherche des comptes est sortie de
l’adresse en premier (PR #99).

---

## 1. Règles d’affichage

Elles valent pour tous les écrans, sans exception locale.

| Règle | Détail |
| --- | --- |
| **Puces pour une liste fixe et courte** | Modalités, état, urgence, rôle, demandeur, période. Valeurs connues du code, dix au plus. |
| **Liste déroulante pour une liste qui grandit** | Pays, cliniques, radiologues, auteurs, actions du journal. Tri alphabétique selon la langue (`Intl.Collator`, accents et majuscules ignorés, « Centre 2 » avant « Centre 10 ») ; recherche dès 8 options, accents ignorés. |
| **« Tous » ou « Toutes » par défaut** | Première option, et valeur quand le paramètre est absent : « Toutes les modalités », « Toutes les cliniques », « Tous les radiologues », « Tous les pays », « Tous les états », « Toutes les dates ». Dans une rangée de puces déjà nommée (« Modalité »), la puce dit seulement « Toutes ». « Tout le réseau » disparaît au profit de « Toutes les cliniques ». |
| **Un filtre actif reste toujours visible** | La valeur retenue se lit sur la puce ou sur le bouton de la liste, jamais derrière un bouton « Filtres » replié. Dans un service de lecture d’examens, une liste filtrée à l’insu de l’utilisateur peut faire manquer une urgence. |
| **Une dimension à une seule valeur n’est pas proposée** | Sauf si elle est active. Le responsable d’une clinique ne voit pas de choix de clinique ; le pays n’apparaît que le jour où un deuxième pays est raccordé. |
| **L’état vit dans l’adresse** | Une vue filtrée se partage, se met en favori, survit au rechargement. Paramètres courts, en français, stables (section 3.4). |
| **Une recherche nominative ne va jamais dans l’adresse** | Nom de patient, de médecin, courriel : cookie httpOnly par liste (`lib/search/list-search.ts`), comme aujourd’hui pour les examens. |
| **Chaque option porte son nombre** | Compté avec tous les autres filtres actifs, sauf le sien (section 3.5). Une option à zéro reste affichée, grisée, pour que la rangée ne bouge pas. |
| **Clavier et lecteur d’écran** | Puces : liens dans un groupe nommé, `aria-current` sur la puce active, nombre lu en clair (« Scanner, 12 examens »). Liste déroulante : motif combobox de l’ARIA (celui de `ClinicDropdown`). Le nombre de résultats est annoncé après chaque changement. |
| **Téléphone sans défilement horizontal** | À 390 px, la barre passe à la ligne ; une rangée de plus de trois puces devient une liste déroulante sans recherche (section 3.7). Aucune barre ne défile en largeur. |
| **En-têtes de colonnes sur une ligne** | Règle commune existante (`thead th`, `globals.css`), vérifiée par `e2e/en-tetes.spec.ts` ; chaque écran touché y est ajouté. |
| **Liste vide à cause des filtres** | Elle le dit et nomme les filtres : « Aucun examen pour Scanner, CHU Campus. » avec « Effacer les filtres ». |

---

## 2. Recensement

Colonnes des tableaux :

- **Volume** : *borné* (quelques dizaines de lignes, au plus 200 : un
  filtre sur la page suffit) ou *croissant* (sans borne : filtre et
  comptes par le service, pagination par curseur).
- **API prête** : le service accepte déjà le filtre ; **API à étendre** :
  il faut une PR backend (B1 à B3, section 4).
- **Priorité** : P1 travail quotidien, P2 pilotage de l’équipe, P3 confort.

### 2.1 Radiologue

| Écran | Liste | Volume | Filtres aujourd’hui | À ajouter | Donnée | Priorité |
| --- | --- | --- | --- | --- | --- | --- |
| `/worklist` « À lire » | Examens attribués et urgences de sa liste | Borné (un appel de 200) | Recherche (cookie) ; urgences `?urgent=1` ; modalités en codes DICOM, choix multiple `?modalite=CT,MR` ; clinique ; comptes sur la file non filtrée ; **tout filtré sur la page** | Modalité en groupes, comme partout ; clinique en liste déroulante ; « En retard » | API prête : `modality_group`, `clinic_id`, `priority`. Comptes en un appel : B1 | P1 |
| `/mes-examens` | Examens pris, non rendus | Borné | **Aucun** (pagination seule) | Recherche (nouvelle portée), modalité, clinique, urgence, état (pas commencé, en cours) | API prête (`mine` + filtres) | P1 |
| `/comptes-rendus` | Ses comptes-rendus signés | Croissant | Recherche | Modalité, clinique, urgence, période de signature ; tri par date de signature | Modalité, clinique, urgence : prêtes. Période, tri : B1 | P1 |
| `/modeles` | Modèles de comptes-rendus | Borné | Recherche et modalité DICOM dans l’état local, hors adresse, sans compte | Modalité en groupes, dans l’adresse, avec comptes ; origine (IMAFRIK, établissement) | Sur la page | P3 |
| `/formation` | Cas d’entraînement | Borné | Aucun | État (à faire, brouillon, soumis), modalité | Sur la page | P3 |
| `/lecture/[id]` | Antériorités du patient | Quelques lignes | Aucun | Aucun : liste courte, triée par date | | |

### 2.2 Responsable de clinique

| Écran | Liste | Volume | Filtres aujourd’hui | À ajouter | Donnée | Priorité |
| --- | --- | --- | --- | --- | --- | --- |
| `/tableau-de-bord` | « Comptes-rendus prêts » (10), « Derniers envois » (5) | Fixe | Aucun | « Voir tout » vers la liste déjà filtrée (`/comptes-rendus?etat=a-telecharger`) | | P3 |
| `/examens` | Tous les envois de la clinique | Croissant | Vue « Tous / À attribuer » `?vue=`, **sans compte** ; modalités `?modalite=` avec comptes ; recherche | État (À attribuer, En lecture, Prêt, Remis) avec comptes ; urgence ; radiologue ; période | État, urgence : prêts (comptes : B1). Radiologue, période : B1 | P1 |
| `/comptes-rendus` | Comptes-rendus reçus | Croissant | Recherche | État « À télécharger, Téléchargés » (la navigation compte déjà les premiers) ; modalité ; urgence ; signataire ; période ; tri par signature | État, modalité, urgence : prêts. Signataire, période, tri : B1 | P1 |
| `/equipe` | Membres | Borné | Aucun | Rôle, modalité lue, liste d’urgence, recherche (nom, courriel) | Sur la page | P3 |
| `/activite` | Tableaux du mois (modalités, performances, relevé) | Fixe | Mois `?mois=` ; tri des performances en état local | Tri des performances dans l’adresse | | P3 |
| `/equipe/regles` | Lignes du planning d’attribution de la semaine | Borné (200 lignes en cours ou à venir) | Radiologue (liste déroulante), modalité (puces, une ligne « toutes modalités » vaut pour chacune), semaine `?semaine=`, présentation `?vue=modalite` | | Sur la page | Fait |
| `/envoyer`, `/parametres` | Dépôt, justificatifs | | | Aucun : ce ne sont pas des listes à parcourir | | |

### 2.3 Équipe IMAFRIK

| Écran | Liste | Volume | Filtres aujourd’hui | À ajouter | Donnée | Priorité |
| --- | --- | --- | --- | --- | --- | --- |
| `/admin/examens` | Tous les examens du réseau | Croissant | Urgences ouvertes `?urgent=1` ; clinique (pastilles jusqu’à 6, liste déroulante dans la PR en cours) ; modalités ; recherche ; comptes serveur | État ; radiologue ; période ; pays | État : prêt. Radiologue, période : B1. Pays : B3 | P1, **écran de référence du socle** |
| Lectures › `/worklist` (répartition) | En lecture, À attribuer | Borné | Ceux du radiologue, plus « Attribuer » | Radiologue ; état (à attribuer, attribué, en lecture) ; « En retard » | Comme le radiologue | P1 |
| Lectures › `/comptes-rendus` | Brouillons et comptes-rendus du réseau | Croissant | État `?etat=` **sans compte** ; recherche | Clinique, modalité, urgence ; signataire ; période | Clinique, modalité, urgence : prêts. Le reste : B1 | P1 |
| `/admin/utilisateurs` « Comptes » | Comptes | Borné (500 en dur, sans le dire) | État (À valider, Signatures, En attente) avec comptes, trois appels de plus ; modalité lue en `<select>` sans compte ; **recherche dans l’adresse** (`?q=`) | Rôle, organisation, double authentification absente, habilitation, inactifs ; recherche hors de l’adresse | Sur la page (tout est renvoyé) ; pagination : B2 | P2 |
| `/admin/organisations` | Cliniques et groupes | Borné, puis croissant | **Aucun** | Recherche (nom, ville) ; type ; état (active, suspendue, fin de contrat) ; raccordement (PACS raccordé, silencieuse depuis 24 h) ; pays | Sur la page ; pays : B3 | P2 |
| `/admin/vue-clinique` et sélecteur de la navigation | Cliniques à consulter | Borné, puis croissant | Aucun ; le sélecteur n’a **pas de recherche** | Liste déroulante avec recherche ; pays | Sur la page | P2 |
| `/admin/flux` | 100 derniers examens, frise | Croissant (coupé à 100) | Clinique | Modalité, urgence, état, transfert lent ; pagination | B2 (`/admin/pipeline`) | P2 |
| `/admin/activite` | Vue d’ensemble, par radiologue, par clinique | Fixe | Onglet ; `?jours=` ; `?mois=` ; clinique sans compte ; `?radiologue=` met une ligne en évidence (choix gardé : la comparaison reste lisible) | Modalité (vue d’ensemble) ; tri du tableau des cliniques ; pays | Modalité : B2 (`/admin/analytics`) ; pays : B3 | P2 |
| `/admin/facturation` | Un relevé par clinique | Borné | Mois | Clinique ; « Sans formule » ; formule ; pays | Sur la page ; pays : B3 | P2 |
| `/admin/passerelles` | Passerelles | Borné | État `?statut=` avec comptes serveur | Clinique ; recherche (nom du poste) ; muette ; certificat bientôt échu ; pays | Sur la page (tout est renvoyé) ; clinique côté serveur : B2 | P2 |
| `/admin/audit` | Journal | Croissant | Action : `<select>` plat de 76 actions | Action groupée par famille, avec recherche ; clinique ; auteur ; période ; type de ressource | Clinique (`organization_id`) et auteur (`actor_id`) : **prêts, inutilisés**. Période, type : B2 | P2 |
| `/admin/demandes` | Demandes du site | Borné (200 en dur) | Demandeur, état, avec comptes, sur la page | Recherche ; période | Sur la page ; pagination : B2 | P2 |
| `/admin/idees` | Idées des radiologues et des responsables | Borné (500 par défaut, dit à l’écran au-delà) | Clinique (liste déroulante), rôle, catégorie, état, période, avec comptes, sur la page ; recherche (cookie) | | Sur la page | P2 |
| `/admin/systeme` | Services, tâches et exécutions | Fixe | Aucun | « Échecs seulement », type de tâche | Sur la page | P3 |
| `/admin`, `/admin/reglages`, `/admin/organisations/[id]`, `/admin/passerelles/[id]` | Synthèses, formulaires, sous-listes courtes | Fixe | | Aucun. Les alertes du cockpit mènent déjà à des listes filtrées | | |

### 2.4 Vue des cliniques (équipe IMAFRIK)

`/admin/vue-clinique/[clinique]/…` montre les écrans du responsable
(`components/clinic-screens`) avec les données de la clinique choisie. Ses
listes héritent donc des filtres du responsable sans travail propre :
examens (état, urgence, modalité, radiologue, période), comptes-rendus
(état, modalité, signataire, période), équipe (rôle, modalité lue). Seule
condition : les routes `/admin/clinics/{id}/view/…` acceptent les mêmes
paramètres que `/studies` (B1).

### 2.5 Démonstration

Tous les filtres existants fonctionnent en démonstration : `demoPage`
applique état, priorité, groupe de modalités, clinique, recherche, ordre
et curseur ; comptes, journal, passerelles et demandes sont filtrés de la
même façon. Trois manques :

- les examens ne viennent que de 2 des 5 cliniques : la liste des
  cliniques en montre 3 à zéro ;
- 5 cliniques, moins que les 8 qui ouvrent la recherche : elle ne se voit
  jamais en démonstration (vitest la couvre) ;
- addenda, justificatifs et engagements sont vides.

Chaque PR d’écran garde ses filtres actifs en démonstration, avec les
mêmes fonctions pures que le vrai service (section 3.9).

### 2.6 Défauts relevés en chemin

1. **`?modalite=` n’a pas le même sens partout.** Codes DICOM multiples
   dans « À lire », groupe unique ailleurs. `/worklist?modalite=scanner`
   passe la validation (« SCANNER » ressemble à un code) et **vide la
   file**. Corrigé par PR F2.
2. **Les filtres de « À lire » s’appliquent après la coupe à 200 lignes** :
   au-delà, liste et comptes sont faux sans le dire. F2.
3. **`/comptes-rendus` trie par réception mais affiche la date de
   signature**, et retire après pagination les lignes sans compte-rendu :
   une page peut montrer moins de lignes que son compte. F4 et B1.
4. **La recherche des comptes est dans l’adresse** (`?q=`) : noms et
   courriels finissent dans l’historique et les journaux d’accès. F5.
5. **Les onglets de modalités et le contrôle segmenté défilent en
   largeur** sur téléphone (`overflow-x-auto`). F1.
6. **Activité, onglet « Cliniques »** : le lien d’une clinique perd
   `onglet=` et ramène à la vue d’ensemble. F7.
7. **Sélecteur de la vue des cliniques** dans la navigation : sans
   recherche. F6.

---

## 3. Architecture commune

### 3.1 Ce qui existe, et ce qui le remplace

Aujourd’hui, sept briques différentes font le même travail :
`ModalityTabs`, `WorklistFilterBar`, `ModalityFilter`, `ClinicFilter` et
`ClinicDropdown`, `Segmented`, `AuditFilter`, `SearchBox`. Chacune lit et
écrit l’adresse à sa façon (lien, `router.push`, `router.replace`), compte
ou ne compte pas, défile ou passe à la ligne.

Elles sont remplacées par un module pur et quatre composants (en place
depuis le socle, F1 ; `facets.ts` arrive avec la première liste filtrée
sur la page) :

```
src/lib/filters/
├── dimensions.ts   registre des dimensions : le seul endroit à toucher pour en ajouter une
├── screens.ts      dimensions de chaque écran, dans l’ordre commun ; NETWORK
├── url.ts          lecture validée de l’adresse, écriture
├── facets.ts       comptes par option pour les listes filtrées sur la page (à venir)
└── choice.ts       tri selon la langue, recherche, clavier (issu de clinic-choice.ts)

src/components/filters/
├── filter-bar.tsx       la barre : dimensions, « Effacer les filtres », annonce du résultat
├── filter-chips.tsx     puces et bascule (issues de ModalityTabs et des pastilles de la file)
├── filter-dropdown.tsx  liste déroulante (ClinicDropdown généralisé)
├── filtered-empty.tsx   liste vide à cause des filtres
└── icons.ts             pictogramme de chaque dimension
```

`ClinicDropdown` reste une enveloppe de la liste déroulante commune, pour
les écrans pas encore passés à la barre.

`ListToolbar` reste à sa place dans l’en-tête de la liste : recherche
(cookie) et actualisation. Le bouton « Urgences seulement » qu’elle porte
devient la dimension « Urgence » de la barre.

### 3.2 Le modèle : une dimension de filtre

```ts
// src/lib/filters/dimensions.ts
export interface FilterDimension {
  /** Paramètre d’adresse : court, en français, stable (`modalite`). */
  param: string;
  /** `chips` (valeurs fixes), `dropdown` (valeurs des données), `toggle` (une valeur). */
  presentation: Presentation;
  /** Valeurs fixes, dans l’ordre d’affichage ; absentes si elles viennent des données. */
  values?: readonly string[];
  /** Valeur de l’adresse vers la valeur interne, `null` si inconnue (= « Tous »). */
  read(raw: string): string | null;
  write(value: string): string;
  /** Nom (« Modalité ») et option par défaut (« Toutes les modalités »). */
  text(t: AppMessages): { name: string; all: string };
  /** Nom d’une valeur fixe (« Scanner »). */
  valueLabel?(t: AppMessages, value: string): string;
  /** Textes de la recherche d’une liste déroulante qui grandit. */
  searchText?(t: AppMessages): SearchText;
}

export const DIMENSIONS = { clinic, modality, urgency } satisfies Record<string, FilterDimension>;
// demain : country, radiologist, state, period, role, action, author, requester
```

L’ordre du registre est l’ordre de la barre, le même sur tous les
écrans : où (pays, clinique), qui (radiologue, auteur), quoi (modalité),
où en est-on (état, urgence), quand (période). Le pictogramme de chaque
dimension vit à côté des composants (`components/filters/icons.ts`) : le
registre reste pur.

### 3.3 Les dimensions de chaque écran

```ts
// src/lib/filters/screens.ts
/** Le réseau : tout écran de l’équipe qui couvre plusieurs cliniques. */
export const NETWORK = ["clinic"] as const; // demain : ["country", "clinic"]

export const LIST_FILTERS = {
  "admin-examens": [...NETWORK, "modality", "urgency"],
  // chaque PR d’écran ajoute le sien
} as const satisfies Record<string, readonly DimensionKey[]>;
```

Une page serveur lit les filtres, interroge le service avec, puis décrit
la barre (options et nombres de chaque dimension) :

```ts
const keys = LIST_FILTERS["admin-examens"];
const draft = readFilters(params, keys); // modalité, urgence
const clinicCounts = await getClinicCounts({ ...base, modalityGroup: draft.modality });
const filters = readFilters(params, keys, { clinic: clinicCounts.clinics.map((c) => c.id) });
// … listStudyPageAt({ ...base, modalityGroup, clinic: filters.clinic, … })
// <FilterBar dimensions={bar} active={filters} result={{ count: total, noun: "studies" }} />
```

La règle « une dimension à une seule valeur n’est pas proposée » (section
1) dispense chaque écran de savoir qui le regarde : la clinique disparaît
d’elle-même pour un responsable, le pays tant que le réseau n’en compte
qu’un.

### 3.4 L’adresse

| Dimension | Paramètre | Valeurs | Présentation | Comptes | Filtre |
| --- | --- | --- | --- | --- | --- |
| Pays | `pays` | code ISO 3166-1 en minuscules (`tg`, `bj`), nom affiché par `Intl.DisplayNames` dans la langue de l’écran | Liste déroulante | Oui | Service (`country`, B3) |
| Clinique | `clinique` | identifiant | Liste déroulante | Oui | Service (`clinic_id`) ou page |
| Radiologue | `radiologue` | identifiant | Liste déroulante | Oui | Service (`radiologist_id`, B1) ou page |
| Modalité | `modalite` | `radiographie`, `mammographie`, `echographie`, `scanner`, `irm`, `autres` | Puces | Oui | Service (`modality_group`) ou page |
| État | `etat` | propre à la liste (`a-attribuer`, `en-lecture`, `pret`, `remis` ; `a-telecharger`, `telecharge`…) | Puces | Oui | Service (`status`) ou page |
| Urgence | `urgent` | `1` | Puces « Toutes », « Urgences » | Oui | Service (`priority`) |
| Période | `jours` | `1`, `7`, `30`, `90`, `365` | Puces | Non | Service (`received_after`, B1) |
| Mois | `mois` | `AAAA-MM` | Navigateur de mois (existant) | Non | Service |
| Rôle | `role` | `radiologue`, `responsable`, `equipe` | Puces | Oui | Page |
| Action (journal) | `action` | code de l’action | Liste déroulante groupée par famille | Non | Service |
| Auteur (journal) | `auteur` | identifiant | Liste déroulante | Non | Service (`actor_id`) |
| Demandeur | `demandeur` | `etablissement`, `radiologue` | Puces | Oui | Page |
| Recherche | aucun | texte, dans un cookie | Champ | Non | Service (`q`) |
| Page | `apres`, `avant` | curseur | | | |

- **Lecture validée** (`readFilters`) : une valeur inconnue est ignorée
  (« Tous »), jamais transmise au service, comme `lib/admin-params.ts`
  aujourd’hui. Une clinique ou un radiologue hors des options connues
  aussi.
- **Écriture** (`filterHref`) : les autres paramètres restent, la page
  repart du début (`apres`, `avant` retirés), une dimension restreinte
  perd sa valeur si elle sort des options (un pays choisi retire une
  clinique d’un autre pays). Les puces sont des liens (`replace`, sans
  défilement ni préchargement) : elles marchent avant le chargement du
  script. La liste déroulante remplace l’adresse (`router.replace`) : le
  bouton Retour ramène à l’écran précédent, pas au filtre précédent.
- **Compatibilité** : les anciennes adresses restent lues. `?vue=a-attribuer`
  devient `?etat=a-attribuer` ; `?statut=` des passerelles devient
  `?etat=` ; `?modalite=CT,MR` de la file devient le groupe du premier code
  (`scanner`). Les liens du cockpit (`?urgent=1`, `?validation=attente`)
  ne changent pas.
- **Choix unique par dimension.** La file acceptait plusieurs modalités ;
  elle s’aligne sur les autres écrans : un seul groupe, des comptes qui
  s’additionnent, une même adresse partout. La liste d’un radiologue est
  déjà réduite aux modalités qu’il lit, le besoin du choix multiple n’y
  apparaît pas. Le modèle garde une option `multiple` si un besoin réel
  se présente.

### 3.5 Les comptes par option

**Règle** : le nombre affiché sur l’option X de la dimension D est celui
des lignes qui passent tous les filtres actifs **sauf celui de D**.
Choisir « Scanner » ne fait pas disparaître « IRM » ; on voit ce qu’on
obtiendra avant de cliquer. C’est déjà la règle de
`/studies/modality-counts` et de `/studies/clinic-counts`.

- **Listes filtrées par le service** : un seul appel, `GET /studies/facets`
  (B1), qui renvoie les comptes de chaque dimension demandée selon cette
  règle (modalité, clinique, état, urgence, radiologue ; demain pays). Il
  remplace les deux routes de comptes actuelles, gardées le temps de la
  bascule.
- **Listes filtrées sur la page** : `countFacets(rows, dimensions,
  filters)` dans `lib/filters/facets.ts`, fonction pure, testée seule.
- **Pas de compte** pour la période, le mois, l’action et l’auteur du
  journal : soit sans intérêt, soit trop coûteux à compter.

### 3.6 Les composants

- **`FilterBar`** : reçoit l’écran, les filtres lus, les comptes et les
  options des listes qui grandissent ; rend chaque dimension dans l’ordre
  commun, « Effacer les filtres » dès qu’un filtre est actif, et une
  région `aria-live="polite"` qui annonce le nombre de résultats après un
  changement (« 23 examens »).
- **`FilterChips`** : puces-liens dans un groupe nommé (`role="group"`,
  `aria-label` « Modalité »), `aria-current="true"` sur la puce active,
  nombre lu en clair (« Scanner, 12 examens »). Passe à la ligne, ne
  défile jamais.
- **`FilterDropdown`** : `ClinicDropdown` généralisé, sans en changer le
  comportement : icône, nom, option « Tous » ou « Toutes », phrase du
  nombre et textes de recherche deviennent des propriétés. Tri selon la
  langue, recherche dès 8 options, clavier complet (flèches, Origine,
  Fin, pages, première lettre, Échap), liste alignée sur le bord libre et
  tenue dans la largeur d’un téléphone. `ClinicDropdown` reste une
  enveloppe de deux lignes tant que des écrans l’appellent.
  `clinic-choice.ts` devient `lib/filters/choice.ts`, ses tests suivent.
- **`FilteredEmpty`** : « Aucun examen pour Scanner, CHU Campus. » et
  « Effacer les filtres ».

### 3.7 Téléphone

À moins de 640 px :

- la barre passe à la ligne ; aucun conteneur ne défile en largeur ;
- une dimension en puces de plus de trois options (modalité, état,
  période) devient une liste déroulante sans recherche, qui affiche sa
  valeur (« Modalité : Scanner ») ; urgence, rôle et demandeur restent en
  puces ;
- les cibles tactiles font au moins 36 px de haut (`min-h-9`, déjà la
  règle de la liste ouverte).

Pas de feuille « Filtres » qui cache les choix derrière un bouton : la
règle « un filtre actif reste visible » (section 1) l’emporte sur le gain
de place.

### 3.8 Ajouter une dimension : le pays

La colonne existe déjà : `organizations.country char(2) not null default
'TG'`, que le service n’expose pas encore. Le jour venu :

1. **Service (B3)** : exposer `country` dans les modèles des organisations
   et des cliniques consultées, le saisir à la création d’une clinique,
   accepter `country` sur `/studies`, `/studies/facets`, `/admin/analytics`,
   `/admin/performance`, `/admin/pipeline`, `/admin/billing/statements`,
   `/admin/gateways`, `/admin/users`, `/admin/audit`. Aucune migration.
2. **Frontend** : la dimension `country` dans `lib/filters/dimensions.ts`
   (son paramètre, sa lecture, ses textes) et son pictogramme, puis
   `NETWORK = ["country", "clinic"]` dans `lib/filters/screens.ts` : tous
   les écrans du réseau la déclarent d’un coup. Chacun transmet ensuite
   `filters.country` au service et ses nombres à la barre, comme il le
   fait pour la clinique ; la liste des cliniques se restreint au pays
   choisi.
3. **Textes** : le nom de la dimension et « Tous les pays » ; les noms
   des pays viennent de `Intl.DisplayNames`, dans la langue de l’écran.

Tant que toutes les cliniques sont au Togo, la dimension reste invisible
(une seule valeur) : elle peut être livrée avant le premier pays.

### 3.9 Démonstration et tests

- **Démonstration** : les données de démonstration se filtrent avec les
  mêmes fonctions que la page (`lib/filters/url.ts`, `facets.ts`) ; une
  dimension ajoutée au registre y fonctionne sans code propre.
- **Vitest** : lecture et écriture de l’adresse (valeurs inconnues,
  compatibilité, dimension restreinte), comptes « sauf soi-même », tri
  selon la langue, recherche sans accents, clavier.
- **Playwright (démonstration)**, par écran touché : choix au clavier et
  à la souris, adresse partagée puis rechargée, comptes, liste vide
  filtrée, annonce du résultat, 1 440 et 390 px sans défilement
  horizontal (`mise-en-page.spec.ts`), en-têtes sur une ligne
  (`en-tetes.spec.ts`), audit axe-core, anglais.
- **Aides** : la page d’aide de chaque écran touché dit comment filtrer
  (5 étapes au plus, 180 caractères par étape, règle de `help.test.ts`).
- **Captures** avant et après, à 1 440 et 390 px, jointes à chaque PR.

---

## 4. Priorités et découpage en PR

Ordre de priorité : d’abord ce qui sert chaque jour à lire et à rendre
des examens (risque de manquer une urgence, volumes qui croissent), puis
le pilotage de l’équipe, puis le confort. Chaque PR frontend part de
`main` après la fusion de la précédente ; une PR backend part seule et se
fusionne avant le frontend qui l’appelle.

| PR | Dépôt | Contenu | Dépend de | Taille |
| --- | --- | --- | --- | --- |
| **F1** | frontend | Socle : `lib/filters`, `components/filters`, `ClinicDropdown` généralisé ; `/admin/examens` passé sur la barre commune (écran de référence) ; téléphone sans défilement | PR « Attribuer » fusionnée | M |
| **B1** | backend | `GET /studies/facets` (et sa variante de la vue des cliniques) ; `radiologist_id` (attribué ou signataire) et `received_after` sur `/studies` ; `order=signed` | | M |
| **F2** | frontend | « À lire » (radiologue et répartition) : modalité en groupes, filtres envoyés au service, comptes, radiologue et état pour l’équipe ; « Mes examens » : recherche, modalité, clinique, urgence, état | F1, B1 | M |
| **F3** | frontend | « Examens » du responsable, de la vue des cliniques et de l’équipe : état avec comptes, urgence, radiologue, période ; démonstration répartie sur les cinq cliniques | F2 | M |
| **F4** | frontend | « Comptes-rendus », trois rôles et vue des cliniques : état « À télécharger », modalité, clinique, urgence, signataire, période, tri par signature ; « Voir tout » du tableau de bord | F3 | M |
| **B2** | backend | `/admin/pipeline` (modalité, urgence, état, curseur) ; `/admin/audit` (période, type de ressource) ; `/admin/gateways?clinic_id` ; `/admin/analytics?modality_group` ; pagination de `/admin/users` et `/admin/contact-requests` | | M |
| **F5** | frontend | « Comptes » : rôle, organisation, double authentification absente, habilitation, inactifs ; modalité lue en puces avec comptes ; recherche hors de l’adresse | F1 | S |
| **F6** | frontend | « Organisations », choix de la vue des cliniques et sélecteur de la navigation : recherche, type, état, raccordement | F1 | S |
| **F7** | frontend | « Flux », « Activité », « Facturation », « Passerelles » : clinique partout, modalité et urgence au flux, « Sans formule », passerelles muettes | F1, B2 | M |
| **F8** | frontend | « Journal d’audit » (action groupée avec recherche, clinique, auteur, période) et « Demandes reçues » (recherche, période) | F1, B2 | S |
| **F9** | frontend | « Équipe », « Modèles », « Formation », « Système » | F1 | S |
| **B3** | backend | Pays : `country` exposé, saisi à la création, accepté par les routes de la section 3.8 | B1, B2 | S |
| **F10** | frontend | Pays : la dimension et `NETWORK` ; une clinique hors du Togo dans la démonstration | F1, B3 | S |

Tailles : S, un ou deux écrans sans module nouveau ; M, un module commun ou plusieurs écrans.

Chaque PR : textes FR et EN, aide de l’écran, vitest, e2e des specs
touchées en démonstration, lint, typecheck, captures avant et après. Les
PR backend : `make test` en local (la CI ne démarre pas faute de
facturation GitHub), `make openapi`, puis `npm run api:types` dans la PR
frontend qui suit.

---

## 5. Décisions à valider

1. **Choix unique par dimension**, file comprise (section 3.4). Proposé.
2. **États des examens** du responsable : « À attribuer », « En
   lecture », « Prêt », « Remis », avec « Tous les états » par défaut, à la
   place des deux vues « Tous / À attribuer ». Proposé.
3. **« Tout le réseau » devient « Toutes les cliniques »**, pour une seule
   règle de libellé. Proposé.
4. **Période par défaut** : « Toutes les dates » sur les listes ; sur
   « Activité », 30 jours restent la valeur par défaut, une analyse a
   besoin d’une fenêtre. Le relevé de facturation reste mensuel.
5. **Pays livré invisible avant le premier pays** (section 3.8), ou
   attendu jusque-là. Proposé : livré en dernier, quand le reste est en
   place.
