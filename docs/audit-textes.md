# Audit des textes de l'interface

Inventaire de tout ce qu'un utilisateur lit à l'écran, et de ce qui ne
va pas. **774 chaînes distinctes** dans 60 fichiers.

Le classement est par gravité, pas par écran : ce qui est **faux** se
corrige avant ce qui est **maladroit**.

---

## A. Affirmations fausses — 1 cas

### A1. La reprise après coupure

`src/components/marketing/faq.tsx`

> « Les envois interrompus reprennent automatiquement au rétablissement
> de la liaison : **le PACS conserve la file.** »

**C'est faux.** Un C-STORE DICOM qui échoue n'est pas mis en file
d'attente par la plupart des consoles : l'examen reste sur la modalité,
et personne ne s'en aperçoit avant que le radiologue ne le réclame. Sur
des sites où l'électricité et la liaison tombent plusieurs fois par
jour, cette phrase promet exactement ce qui manque.

C'est aussi, mot pour mot, **l'argument qui justifie une passerelle
locale** : c'est elle qui tient la file, pas le PACS de la clinique.
Tant que la passerelle n'existe pas, la phrase doit être retirée ; une
fois qu'elle existe, elle devient vraie et devient un argument de vente.

---

## B. Affirmations invérifiables — 9 cas

Ni fausses ni vraies : rien ne permet aujourd'hui de les tenir. Chacune
est un engagement contractuel déguisé en argument.

| Texte | Où | Problème |
| --- | --- | --- |
| « Comptes-rendus en moins de deux heures » | accroche, écran de connexion | Aucun examen n'a jamais été lu. |
| « Vingt minutes pour les urgences » | écran de connexion | Idem. |
| « 24/7 — nuits, week-ends, jours fériés » | accroche | Suppose une garde organisée. |
| « Radiologues inscrits à l'Ordre » | 4 écrans | Aucun radiologue n'est encore recruté. |
| « Réponse sous un jour ouvré » | contact | Qui répond ? |
| « une proposition chiffrée sous quarante-huit heures » | tarifs, contact | Aucune grille n'existe. |
| « Le raccordement d'un PACS prend en général une demi-journée » | FAQ | Inventé. |
| « Support pendant les heures ouvrées » | tarifs | Aucun support n'existe. |
| « le lien expire au bout de sept jours » / « dans une heure » | invitation, mot de passe | À vérifier contre la configuration Supabase réelle. |

**Ce qu'il faut en faire :** soit les tenir — et alors elles se
décident, pas se rédigent —, soit les formuler comme un objectif
(« notre engagement de service : … ») plutôt que comme un constat.

---

## C. Valeurs fictives affichées comme réelles — 4 cas

| Valeur | Où | Risque |
| --- | --- | --- |
| `+228 00 00 00 00` | page contact | **Publié sur le web.** Un numéro manifestement faux sur une page de contact décrédibilise tout le reste. |
| `contact@imafrik.com` | contact, mentions légales | La boîte existe-t-elle ? Un courriel de prospect perdu est un client perdu. |
| `dicom.imafrik.com` · port `11112` | envoi, paramètres, mise en service | Ce nom ne résout pas. Un technicien le recopiera dans un PACS et passera une matinée à chercher pourquoi rien n'arrive. |
| `STJOSEPH_LOME` | paramètres | Valeur de démonstration présentée comme la configuration de l'établissement. |

---

## D. Mentions légales incomplètes — 3 pages

`mentions-legales`, `confidentialite`, `cgu` portent des `[crochets]`
visibles : forme juridique, immatriculation, siège, hébergeur,
autorité de contrôle, droit applicable, durées de conservation.

Volontaire — un crochet se remarque, une page incomplète mise en ligne
ne se remarque pas. Mais ces pages sont **indexables** dès que le
service passe en production.

---

## E. Le tiret cadratin — 16 emplois

Il est correct en français, et j'en ai fait un tic. Dans la moitié des
cas une virgule ou un deux-points dit la même chose plus sobrement.

À garder (véritable incise ou apposition) :

- « L'ensemble des éléments composant le service — code, interface,
  marques — demeure la propriété de… »
- « Manipulateur — envoie et suit » *(libellé d'option, lecture rapide)*

À remplacer (le tiret n'y remplace qu'une ponctuation ordinaire) :

| Actuel | Proposé |
| --- | --- |
| « Vérifiez la saisie — les caractères se recopient mal » | « Vérifiez la saisie : les caractères se recopient mal » |
| « Hors ligne — conservé sur ce poste » | « Hors ligne, conservé sur ce poste » |
| « Envoyez n'importe quel examen — un examen de test suffit » | « Envoyez n'importe quel examen ; un examen de test suffit » |
| « Examens — administration » | « Tous les examens » |
| « une organisation dont vous n'êtes pas membre — ou vous êtes connecté sous une autre casquette » | deux phrases |

---

## F. Textes trop longs — 45 dépassent 140 signes

Un paragraphe d'aide de trois lignes dans un formulaire n'est pas lu.
Les plus lourds, à réduire de moitié :

- l'encart « Pas encore de compte ? » de la connexion ;
- les six réponses de la FAQ ;
- les descriptions des quatre garanties de sécurité ;
- l'aide de l'étape « premier envoi ».

---

## G. Le point le plus grave : le produit n'est pas décrit correctement

Toute la copie repose sur une hypothèse : **la clinique possède déjà un
PACS capable d'émettre vers Internet.** Elle est présente dans :

| Écran | Ce qui est écrit |
| --- | --- |
| Accroche | « Votre clinique envoie ses images depuis son PACS » |
| Fonctionnement, étape 1 | « Le PACS pousse l'examen automatiquement » |
| Pour les cliniques | « Aucun investissement : ni serveur, ni licence » |
| FAQ | « Faut-il remplacer notre PACS ? Non. » |
| Mise en service, étape 2 | « Ces valeurs se recopient dans votre PACS » |
| Envoyer un examen | « Envoi automatique » vs « dépôt manuel » |
| Tarifs | « Mise en service et raccordement du PACS » |

Si le produit fournit une **passerelle installée dans la clinique**,
tous ces textes sont à réécrire : ce n'est plus « raccordez votre PACS »
mais « nous installons une passerelle qui reçoit vos modalités ». Et
« aucun investissement » devient faux si un boîtier est facturé.

**Cette réécriture attend la décision d'architecture.** La faire deux
fois serait du gâchis.
