/**
 * Aide de chaque écran, par rôle : à quoi sert l'écran, ses gestes clés,
 * les termes du glossaire qu'il emploie (`help-glossary.ts`).
 *
 * Rédigée d'après le code et les libellés de chaque écran ; à tenir à jour
 * avec eux. `src/lib/help.test.ts` vérifie que chaque écran de chaque rôle
 * a la sienne, dans les deux langues, et que chaque terme existe.
 */
export const pages = {
  radiologist: {
    worklist: {
      title: "À lire",
      purpose:
        "Les examens qu’on vous confie, classés par échéance : ceux qui vous sont attribués et, si vous êtes sur la liste d’urgence d’une clinique, les urgences à prendre. Vous ne voyez ni les examens des autres radiologues, ni leurs comptes-rendus.",
      steps: [
        "Regardez les indicateurs : « Attribués à vous », « Urgences à prendre », « En retard » et « Prochaine échéance ».",
        "Filtrez par modalité ou par clinique, cliquez sur « Urgences seulement », ou cherchez un patient.",
        "Lisez d’abord « Attribués à vous », par échéance. Une urgence de « Urgences à prendre » revient au premier radiologue qui la prend.",
        "Cliquez sur une ligne (ou J, K puis Entrée) pour ouvrir l’examen, puis sur « Prendre en charge » dans l’écran de lecture.",
        "Laissez la page ouverte : la file se met à jour toute seule toutes les 30 secondes et signale chaque nouvelle urgence à prendre.",
      ],
      terms: [
        "attribution",
        "listeUrgence",
        "urgence",
        "delaiPromis",
        "priseEnCharge",
      ],
    },
    myStudies: {
      title: "Mes examens",
      purpose:
        "Les examens que vous avez pris en charge et qui restent à signer, par ordre d’échéance. Vous les retrouvez ici sans les chercher dans la file.",
      steps: [
        "Repérez les examens les plus pressés : la colonne « Échéance » indique le temps restant, les plus proches en tête.",
        "Cliquez sur une ligne pour rouvrir l’examen dans l’écran de lecture et reprendre son compte-rendu.",
        "Signez le compte-rendu : l’examen quitte cette liste et rejoint vos « Comptes-rendus ».",
        "Si la liste est vide, ouvrez un examen qui vous est attribué, depuis la file « À lire », pour le prendre en charge.",
      ],
      terms: ["examen", "priseEnCharge", "delaiPromis", "signature"],
    },
    training: {
      title: "Formation",
      purpose:
        "Des examens réels anonymisés, à lire et rédiger dans le vrai écran de lecture, sans patient ni clinique. La formation vous est ouverte avant même la validation de votre dossier.",
      steps: [
        "Lisez « Le parcours, comme sur un vrai examen » en haut de la page.",
        "Choisissez un exercice d’après sa modalité, sa région et son état : « À faire », « En cours » ou « Signé ».",
        "Cliquez sur « Commencer » pour ouvrir un nouvel exercice, ou sur « Reprendre » pour continuer celui en cours.",
        "Cliquez sur « Revoir » pour relire un exercice signé, et son corrigé quand la carte indique « Corrigé disponible ».",
      ],
      terms: ["exercice", "priseEnCharge", "specimen", "corrige"],
    },
    trainingExercise: {
      title: "Exercice de formation",
      purpose:
        "Un exercice dans le vrai écran de lecture, sur un examen réel anonymisé. Rien de ce que vous faites ici n’atteint un patient ni une clinique : l’exercice signé n’est transmis à personne.",
      steps: [
        "Lisez la « Consigne » et le renseignement clinique, puis parcourez les images dans le viewer.",
        "Cliquez sur « Commencer l’exercice », puis rédigez les sections, avec « Modèle » si besoin.",
        "Cliquez sur « Signer l’exercice » et confirmez : le texte est alors figé, comme un vrai compte-rendu.",
        "Cliquez sur « Télécharger le PDF spécimen », puis comparez votre texte au « Corrigé » quand il existe.",
        "Complétez avec « Ajouter l’addendum », ou cliquez sur « Recommencer l’exercice » pour repartir de zéro.",
      ],
      terms: ["exercice", "viewer", "specimen", "corrige", "addendum"],
    },
    reports: {
      title: "Comptes-rendus",
      purpose:
        "Les comptes-rendus que vous avez signés. Chacun s’ouvre tel qu’il a été signé, avec son PDF, son lien de vérification et ses addenda.",
      steps: [
        "Tapez un nom de patient, un identifiant ou une modalité dans la recherche.",
        "Cliquez sur une ligne pour ouvrir le compte-rendu tel qu’il a été signé.",
        "Sur le compte-rendu ouvert, téléchargez le PDF ou ajoutez un addendum.",
        "Cliquez sur « Page suivante » en bas de la liste pour voir les comptes-rendus suivants.",
      ],
      terms: ["compteRendu", "signature", "addendum"],
    },
    report: {
      title: "Compte-rendu",
      purpose:
        "Un compte-rendu tel qu’il a été signé : il n’est plus modifiable. Vous pouvez télécharger son PDF et le corriger par un addendum, daté, signé et visible de la clinique.",
      steps: [
        "Vérifiez le bandeau : « Signé par », « Date de signature » et le lien de « Vérification publique ».",
        "Cliquez sur « Télécharger le PDF » pour obtenir le document signé.",
        "Pour corriger, écrivez dans « Nouvel addendum », puis cliquez sur « Signer l’addendum ».",
        "Saisissez votre code personnel pour confirmer : l’addendum s’affiche sous le document, daté et signé.",
      ],
      terms: ["compteRendu", "addendum", "codePersonnel", "codeVerification"],
    },
    templates: {
      title: "Modèles",
      purpose:
        "Les modèles de compte-rendu de votre organisation et ceux fournis par IMAFRIK. Vous les relisez ici en entier ; ils s’appliquent et se créent dans l’écran de lecture.",
      steps: [
        "Cherchez un modèle par nom ou par région, ou filtrez par modalité.",
        "Cliquez sur un modèle pour lire son texte en entier, tel qu’il sera appliqué.",
        "Dans l’écran de lecture, cliquez sur « Modèle » pour compléter les sections encore vides.",
        "Pour en créer un, cliquez sur « Enregistrer comme modèle » depuis un compte-rendu en cours.",
        "Supprimez un modèle de votre organisation avec « Supprimer » ; ceux « Fourni par IMAFRIK » ne se suppriment pas.",
      ],
      terms: ["modele", "organisation", "compteRendu"],
    },
    settings: {
      title: "Paramètres",
      purpose:
        "Votre dossier de radiologue, vérifié par l’équipe IMAFRIK avant d’ouvrir l’accès aux examens, ce qui est apposé quand vous signez, votre profil et la sécurité de votre compte.",
      steps: [
        "Dans « Exercice et justificatifs », enregistrez votre exercice, puis déposez votre justificatif avec « Choisir un fichier » et « Envoyer ».",
        "Dans « Signature et cachet », cliquez sur « Tracer » ou « Importer », puis sur « Envoyer à la vérification ».",
        "Créez votre code personnel à six chiffres avec « Créer le code » : il est demandé à chaque signature et à chaque addendum.",
        "Vérifiez votre « Profil » ; changer de nom ou de numéro d’ordre demande une nouvelle vérification par l’équipe IMAFRIK.",
        "Activez la « Double authentification » si ce n’est pas fait, et retrouvez vos textes acceptés dans « Engagements ».",
      ],
      terms: [
        "justificatif",
        "cachet",
        "codePersonnel",
        "doubleAuthentification",
        "engagement",
      ],
    },
    reading: {
      title: "Écran de lecture",
      purpose:
        "L’écran où vous lisez un examen et rédigez son compte-rendu : les images dans le viewer à gauche, le compte-rendu à droite. Une fois signé, le compte-rendu part à la clinique et n’est plus modifiable.",
      steps: [
        "Lisez le « Renseignement clinique » et parcourez les images ; une antériorité partagée s’ouvre en lecture seule, dans un nouvel onglet.",
        "Cliquez sur « Prendre en charge » : l’examen vous est réservé jusqu’à la signature, ou jusqu’à « Rendre l’examen », qui efface le brouillon et prévient la clinique.",
        "Rédigez les sections, avec « Modèle » pour remplir celles encore vides ; le texte s’enregistre automatiquement.",
        "Cliquez sur « Signer », vérifiez les points signalés, saisissez votre code personnel, puis cliquez sur « Signer et transmettre ».",
        "Cliquez sur « Examen suivant » pour enchaîner ; pour corriger un compte-rendu signé, cliquez sur « Corriger par un addendum ».",
      ],
      terms: [
        "viewer",
        "renseignementClinique",
        "priseEnCharge",
        "anteriorite",
        "codePersonnel",
      ],
    },
  },
  clinic: {
    dashboard: {
      title: "Tableau de bord",
      purpose:
        "Le point de départ de votre clinique : les comptes-rendus signés à télécharger, vos derniers examens envoyés et l’activité des 30 derniers jours.",
      steps: [
        "Lisez les quatre indicateurs : examens à attribuer, en cours de lecture, comptes-rendus prêts et délai médian sur 30 jours. Un examen « À attribuer » n’est vu d’aucun radiologue.",
        "Dans « Comptes-rendus à télécharger », cliquez sur « Télécharger le PDF » pour récupérer un compte-rendu signé.",
        "Cliquez sur le nom d’un patient pour lire son compte-rendu complet avant de le télécharger.",
        "Suivez vos envois dans « Derniers examens envoyés » : l’état de chacun s’affiche à droite, et la mention « Urgent » signale une urgence.",
        "Cliquez sur « Envoyer un examen » pour transmettre de nouvelles images, ou sur « Tout voir » pour ouvrir la liste complète.",
      ],
      terms: ["compteRendu", "examen", "codeVerification", "urgence"],
    },
    send: {
      title: "Envoyer un examen",
      purpose:
        "Pour envoyer un examen depuis votre navigateur, sans rien installer, par exemple un examen gravé sur CD. Si votre établissement a la passerelle IMAFRIK, vos examens partent seuls et cette page sert à vérifier leur arrivée.",
      steps: [
        "Glissez les fichiers DICOM de l’examen dans « Dépôt depuis ce navigateur », ou cliquez sur « Choisir des fichiers ».",
        "Pour un CD, cliquez sur « Choisir un dossier » et sélectionnez le dossier entier : le sommaire et les fichiers qui ne sont pas des images sont écartés.",
        "Suivez l’état de chaque fichier (« Envoyé », « Déjà reçu », « Refusé »). L’examen apparaît dans le suivi d’ici une minute.",
        "Si vous avez une passerelle, vérifiez la date affichée après « Dernier examen reçu ».",
        "Si un examen envoyé n’apparaît pas, lancez sur le poste de la passerelle le script indiqué à l’écran, puis consultez le guide remis à l’installation.",
      ],
      terms: ["examen", "dicom", "passerelle"],
    },
    studies: {
      title: "Examens",
      purpose:
        "Tous les examens envoyés par votre clinique, avec le radiologue qui les lit et l’état de leur compte-rendu. C’est ici que vous attribuez vos examens à vos radiologues.",
      steps: [
        "Cliquez sur « À attribuer » pour ne voir que les examens qu’aucun radiologue ne voit encore, les plus pressés en tête.",
        "Sur une ligne, cliquez sur « Attribuer », choisissez un radiologue parmi ceux qui lisent la modalité, cochez les antériorités utiles, puis cliquez sur « Attribuer ».",
        "Tapez un nom de patient, un identifiant ou une modalité dans la recherche, puis appuyez sur Entrée.",
        "Dans la colonne « Compte-rendu », repérez les documents « À télécharger ». Un bord rouge et « Urgent » signalent une urgence.",
        "Cliquez sur une ligne pour ouvrir la fiche de l’examen, ou sur « Envoyer » pour transmettre un nouvel examen.",
      ],
      terms: ["attribution", "anteriorite", "modalitesLues", "urgence"],
    },
    study: {
      title: "Fiche de l’examen",
      purpose:
        "Tout sur un examen : ses images, qui le lit, l’avancement de la lecture et son compte-rendu une fois signé. Tant que le compte-rendu n’est pas signé, vous pouvez l’attribuer, partager des antériorités, signaler une urgence et compléter le renseignement clinique.",
      steps: [
        "Dans « Attribution », cliquez sur « Attribuer » (ou « Réattribuer ») : choisissez le radiologue, cochez les antériorités à lui partager, ou retirez-en une.",
        "Suivez la lecture dans « Avancement », de « Examen reçu » à « Compte-rendu remis ».",
        "Si l’examen ne peut pas attendre, cochez « Examen urgent ». Rien n’est transmis au radiologue avant d’avoir cliqué sur « Enregistrer ».",
        "Décrivez le contexte et la question posée au radiologue dans « Renseignement clinique », puis cliquez sur « Enregistrer ».",
        "Une fois le compte-rendu signé, cliquez sur « Télécharger le PDF », ou sur « Document complet » pour l’ouvrir.",
      ],
      terms: [
        "attribution",
        "anteriorite",
        "urgence",
        "listeUrgence",
        "renseignementClinique",
      ],
    },
    reports: {
      title: "Comptes-rendus",
      purpose:
        "Les comptes-rendus signés et transmis à votre établissement. Vous y retrouvez un document par patient et téléchargez son PDF.",
      steps: [
        "Cherchez un patient par son nom, son identifiant ou la modalité, puis appuyez sur Entrée.",
        "Repérez la mention « À télécharger » : ce compte-rendu n’a pas encore été récupéré par votre clinique.",
        "Cliquez sur « PDF » au bout de la ligne pour le télécharger. Il passe alors en « Téléchargé ».",
        "Cliquez sur une ligne pour ouvrir le compte-rendu, par exemple pour télécharger de nouveau un PDF déjà récupéré.",
      ],
      terms: ["compteRendu", "signature", "examen"],
    },
    report: {
      title: "Compte-rendu",
      purpose:
        "Le compte-rendu tel que le radiologue l’a signé. Il ne se modifie plus : une correction éventuelle s’affiche dessous, datée et signée.",
      steps: [
        "Vérifiez en tête le signataire, la date de signature et, s’il est indiqué, son numéro d’ordre.",
        "Cliquez sur « Télécharger le PDF » pour récupérer le document signé.",
        "Lisez la section « Addenda » sous le texte, si elle apparaît : elle contient les corrections faites après la signature.",
        "Ouvrez le lien de « Vérification publique » : c’est la page où un patient ou un confrère contrôle l’authenticité du document.",
      ],
      terms: ["compteRendu", "signature", "addendum", "codeVerification"],
    },
    team: {
      title: "Équipe",
      purpose:
        "Les membres de votre établissement qui ont accès à IMAFRIK : ses responsables, qui envoient les examens et gèrent l’équipe, et ses radiologues. C’est ici que vous invitez ou retirez vos collègues, et réglez ce que lit chacun de vos radiologues.",
      steps: [
        "Cliquez sur « Inviter », saisissez le nom complet et l’adresse électronique de la personne, puis choisissez son rôle.",
        "« Responsable » a les mêmes droits que vous. « Radiologue » n’accède aux examens qu’après vérification de son numéro d’ordre.",
        "Cliquez sur « Envoyer l’invitation » : la personne reçoit un lien par courriel et choisit elle-même son mot de passe.",
        "Pour un radiologue, « Modalités et urgences » règle ce qu’il lit et la liste d’urgence ; « Règles d’attribution » lui confie d’office une modalité ou des jours de garde.",
        "Pour retirer un membre, ouvrez le menu au bout de sa ligne, puis « Retirer de l’équipe » : son accès est coupé aussitôt. Le dernier responsable ne se retire pas.",
      ],
      terms: [
        "responsable",
        "habilitation",
        "modalitesLues",
        "listeUrgence",
        "regleAttribution",
      ],
    },
    teamRules: {
      title: "Règles d’attribution",
      purpose:
        "Confie d’office les examens de la clinique dès leur arrivée : au radiologue de leur modalité, sinon au radiologue de garde du planning. Ce que les règles ne couvrent pas reste à attribuer, et vous pouvez toujours réattribuer.",
      steps: [
        "Dans « Radiologue par modalité », choisissez au besoin qui reçoit tous les examens d’une modalité, par exemple l’échographie, à toute heure.",
        "Dans « Planning de la semaine », cliquez sur « Ajouter un créneau », choisissez le radiologue, cochez ses jours et, s’il ne couvre pas la journée, ses heures.",
        "Pour une garde de nuit, mettez une fin avant le début, par exemple de 20:00 à 08:00 : le créneau finit le lendemain matin.",
        "Deux radiologues de garde en même temps ne se partagent pas les examens : l’écran vous le signale, et vous choisirez pour ceux que les deux peuvent lire.",
        "Cliquez sur « Enregistrer les règles ». Elles valent pour les examens qui arrivent ensuite, jamais pour ceux déjà attribués.",
      ],
      terms: [
        "regleAttribution",
        "planning",
        "modalitesLues",
        "attribution",
        "listeUrgence",
      ],
    },
    settings: {
      title: "Paramètres",
      purpose:
        "Vos réglages personnels et ceux de votre clinique. Le plus important est « Qui lit vos examens » : tous les radiologues de la plateforme, ou seulement ceux de votre équipe. Chaque bloc s’enregistre séparément.",
      steps: [
        "Dans « Profil » et « Langue », vérifiez votre nom, votre fonction et la langue de vos écrans, puis cliquez sur « Enregistrer » dans chaque bloc.",
        "Dans « Qui lit vos examens », choisissez « Tous les radiologues de la plateforme » ou « Nos radiologues uniquement », puis cliquez sur « Enregistrer ».",
        "Avec « Nos radiologues uniquement », assurez-vous que vos radiologues couvrent aussi la nuit et le week-end.",
        "Pour changer de mot de passe, remplissez les trois champs et cliquez sur « Changer le mot de passe ». Vérifiez que la double authentification est « Active ».",
        "Dans « Engagements », cliquez sur « Télécharger mon exemplaire » pour obtenir la convention de service acceptée.",
      ],
      terms: ["pool", "priseEnCharge", "doubleAuthentification", "engagement"],
    },
  },
  admin: {
    cockpit: {
      title: "Tour de contrôle",
      purpose:
        "Montre l’état de la plateforme à l’instant : alertes, files de lecture, délais promis, réseau et exploitation. Chaque bloc mène à l’écran qui en donne le détail. Les chiffres sont calculés à l’ouverture : rechargez la page pour les actualiser.",
      steps: [
        "Commencez par les alertes en tête de page : celles suivies d’une flèche ouvrent l’écran où agir.",
        "Lisez les quatre compteurs : « En attente de lecture », « Hors délai », « En cours de lecture » et « Signés aujourd’hui ».",
        "Vérifiez dans « Délais promis » la part des urgences et des routines rendues dans le délai, sur trente jours.",
        "Dans « Réseau », cliquez sur une ligne, par exemple « Demandes à traiter », pour ouvrir l’écran correspondant.",
        "Dans « Exploitation », repérez une tâche en échec ou en retard, puis ouvrez « Système » pour le détail.",
      ],
      terms: [
        "delaiPromis",
        "urgence",
        "urgenceNonPrise",
        "examen",
        "passerelle",
      ],
    },
    analytics: {
      title: "Activité",
      purpose:
        "Analyse l’activité sur une période : volumes reçus, délais de lecture, durée de chaque étape du parcours d’un examen, heures d’arrivée et modalités, puis les mêmes chiffres par clinique et par radiologue.",
      steps: [
        "Choisissez la période en haut de page : 7 j, 30 j, 90 j ou 1 an.",
        "Gardez « Tout le réseau » ou choisissez une clinique dans la liste pour ne voir que son activité.",
        "Lisez les totaux de la période, puis comparez le « Délai de lecture » à la ligne du délai promis en routine.",
        "Dans « Parcours d’un examen », repérez l’étape mise en évidence : c’est la plus longue.",
        "Dans « Par clinique », cliquez sur un nom pour n’afficher que cette clinique, et repérez les débits signalés en couleur.",
      ],
      terms: ["delaiPromis", "urgence", "priseEnCharge", "passerelle", "pacs"],
    },
    flow: {
      title: "Flux d’images",
      purpose:
        "Suit les derniers examens reçus, de l’acquisition à la remise du compte-rendu, avec leur débit de réception et la durée de chaque étape. Ouvrez-le quand une clinique signale un retard : vous voyez si la cause est la liaison, la file ou la lecture.",
      steps: [
        "Choisissez une clinique dans la liste « Tout le réseau » pour ne suivre que ses examens.",
        "Lisez la synthèse : « Débit médian », « Acheminement médian », « Volume reçu » et « En file ».",
        "Parcourez la liste, les plus récents en tête : clinique, débit, frise des étapes, statut et radiologue.",
        "Repérez dans la frise l’étape la plus longue, à l’aide de la légende : Acheminement, Transfert, File, Lecture, Remise.",
        "Repérez les débits affichés en couleur : ils signalent une liaison lente entre la passerelle et le PACS central.",
      ],
      terms: ["examen", "passerelle", "pacs", "priseEnCharge", "compteRendu"],
    },
    organisations: {
      title: "Organisations",
      purpose:
        "Liste les cliniques et les groupes de radiologie de la plateforme : membres, examens reçus sur 30 jours, dernier envoi, raccordement du PACS et état. C’est ici que vous créez une clinique et invitez son équipe.",
      steps: [
        "Cliquez sur « Nouvelle clinique », puis saisissez le nom de l’établissement, la ville et la langue des comptes-rendus et des invitations.",
        "Indiquez ses responsables, un au moins, puis qui lit ses examens : ses propres radiologues, à inviter aussi, ou les « Radiologues du réseau IMAFRIK ».",
        "Cliquez sur « Créer et inviter l’équipe » : chacun reçoit son invitation, et la fiche s’ouvre pour raccorder la passerelle.",
        "Repérez « PACS non raccordé » et tout « Dernier envoi » en couleur, plus ancien que 24 heures : la passerelle est peut-être à l’arrêt.",
        "Sur une ligne, invitez une personne ou réglez les fonctions d’IA par les icônes, ou cliquez sur « Suspendre » pour couper l’accès de ses membres.",
      ],
      terms: ["responsable", "groupe", "pool", "contratService", "pacs"],
      guides: ["onboardClinic"],
    },
    organisation: {
      title: "Fiche de la clinique",
      purpose:
        "Suit la mise en service d’une clinique et son activité sur trente jours. Vous y raccordez ses passerelles par un code, réglez la conservation des images, la langue et le logo des comptes-rendus, et pouvez mettre fin au contrat.",
      steps: [
        "Suivez la « Mise en service » : la première étape non franchie est celle qui appelle une action.",
        "Dans « Raccorder une passerelle », cliquez sur « Émettre un code » (15 minutes, une seule fois) et dictez-le à l’installateur, qui le saisit dans le kit.",
        "Quand le poste apparaît « En attente d’approbation » dans « Passerelles », vérifiez-le avec la clinique, puis cliquez sur « Approuver ».",
        "Dans « Liste d’urgence » et « Règles d’attribution », choisissez les radiologues, de la clinique ou du réseau, qui prennent ses urgences ou reçoivent d’office ses examens.",
        "Réglez au besoin la conservation des images, la langue des comptes-rendus et le logo en filigrane.",
      ],
      terms: [
        "passerelle",
        "codeEnrolement",
        "listeUrgence",
        "regleAttribution",
        "contratService",
      ],
      guides: ["onboardClinic"],
    },
    gateways: {
      title: "Passerelles",
      purpose:
        "Vue d’ensemble des passerelles de toutes les cliniques : statut, adresse, certificat, signe de vie. L’écran montre aussi ce qui empêche le serveur d’enrôler, la tâche qui applique la confiance au PACS et le kit d’installation.",
      steps: [
        "Lisez d’abord les bandeaux en tête : ce qui manque au serveur pour enrôler, puis les alertes.",
        "Filtrez par statut, par exemple « En attente d’approbation », pour voir les postes qui attendent une décision.",
        "Cliquez sur « Approuver » ou « Rejeter » sur la ligne, ou sur le nom du poste pour ouvrir sa fiche.",
        "Dans « Application de la confiance au PACS », vérifiez que le dernier cycle est « À jour » ou « Appliqué » et que rien n’attend.",
        "Cliquez sur « Télécharger le kit », puis « Copier l’empreinte ». Sur le poste, `certutil -hashfile kit-passerelle.zip SHA256` doit donner la même, sinon ne l’installez pas.",
      ],
      terms: [
        "passerelle",
        "tacheHote",
        "confiancePacs",
        "certificat",
        "empreinte",
      ],
      guides: ["onboardClinic"],
    },
    gateway: {
      title: "Fiche de la passerelle",
      purpose:
        "Détaille une passerelle : statut expliqué, poste, réseau privé, cycle de vie, signal de vie, certificats et historique. Seuls les gestes que le statut permet sont proposés.",
      steps: [
        "Lisez le statut et son explication en tête de fiche : les gestes permis s’affichent à côté.",
        "Avant « Approuver », vérifiez avec la clinique au téléphone le nom du poste, son MachineGuid, l’adresse d’enrôlement et son nœud en ligne.",
        "Pour « Suspendre », « Rejeter » ou « Révoquer », saisissez un motif d’au moins trois caractères, conservé au journal d’audit.",
        "Cliquez sur « Forcer le renouvellement » pour que le poste refasse sa clé et son certificat à son prochain signal de vie.",
        "Contrôlez « Signal de vie » et « Certificats » : séries en attente d’envoi, disque libre, échéance et état au PACS.",
      ],
      terms: [
        "passerelle",
        "certificat",
        "reseauPrive",
        "aeTitle",
        "journalAudit",
      ],
    },
    accounts: {
      title: "Comptes",
      purpose:
        "Liste tous les comptes de la plateforme. Vous y rattachez les inscrits à une organisation, examinez les justificatifs, signatures et cachets des radiologues, vérifiez la double authentification et traitez les demandes d’effacement.",
      steps: [
        "Utilisez les filtres « À valider », « Signature à vérifier » et « En attente », ou cherchez un compte par nom ou adresse.",
        "Pour un compte « Rattaché à aucune organisation », cliquez sur « Rattacher », puis choisissez l’organisation et le rôle.",
        "Cliquez sur « Examiner le dossier » ou « Signature à vérifier », ouvrez les pièces, puis acceptez ou refusez avec un motif.",
        "Pour un téléphone perdu ou changé, vérifiez l’identité par un autre canal, puis cliquez sur « Réinitialiser ».",
        "Sur l’appartenance d’un radiologue, l’icône de réglage ouvre ses « Modalités lues » : elles bornent ce qu’on peut lui attribuer.",
      ],
      terms: [
        "rattachement",
        "habilitation",
        "justificatif",
        "modalitesLues",
        "signature",
      ],
    },
    studies: {
      title: "Examens",
      purpose:
        "Liste les examens de toute la plateforme, toutes organisations confondues, pour répondre vite à une clinique. Le nom du patient ouvre les images et le compte-rendu en consultation seule, et chaque ouverture est tracée.",
      steps: [
        "Cherchez un examen par patient, identifiant ou modalité dans la barre de recherche.",
        "Cliquez sur « Urgences en cours » pour voir les urgences pas encore rendues, les plus en retard en tête.",
        "Cliquez sur le nom du patient pour ouvrir les images et le compte-rendu, sans pouvoir rédiger ni signer.",
        "Pour un examen non signé, cliquez sur le bouton d’attribution, choisissez un radiologue qui lit sa modalité, cochez les antériorités utiles, puis cliquez sur « Attribuer ».",
        "Pour le reprendre à son titulaire, rouvrez la même fenêtre et cliquez sur « Retirer l’attribution » : l’examen attend une nouvelle attribution.",
      ],
      terms: ["attribution", "anteriorite", "urgence", "modalitesLues", "pool"],
    },
    requests: {
      title: "Demandes reçues",
      purpose:
        "Rassemble les demandes envoyées par le formulaire de contact du site, par des établissements ou des radiologues. Chacune se suit de « Nouvelle » à « Convertie » ou « Écartée », avec les notes de l’équipe.",
      steps: [
        "Filtrez par demandeur, « Établissements » ou « Radiologues », et par étape du suivi : les nouvelles s’affichent par défaut.",
        "Contactez le demandeur en cliquant sur son adresse électronique ou sur son numéro de téléphone.",
        "Pour un radiologue, relevez le « N° d’ordre déclaré » : il est vérifié avant tout accès aux examens.",
        "Pour accueillir un radiologue, cliquez sur « Inviter comme radiologue » quand le bouton est proposé : la demande passe à « Convertie ».",
        "Choisissez l’étape du suivi, ajoutez vos notes, puis cliquez sur « Enregistrer ».",
      ],
      terms: ["numeroOrdre", "habilitation"],
    },
    billing: {
      title: "Facturation",
      purpose:
        "Les actes d’un mois, par clinique et par modalité : examens reçus en routine et en urgence, et comptes-rendus signés. C’est la base de la facture de chaque clinique ; un examen sans compte-rendu signé s’y repère avant d’être facturé à tort.",
      steps: [
        "Changez de mois avec les flèches placées de part et d’autre du mois affiché.",
        "Lisez les totaux du mois : « Actes reçus », « Dont urgences » et « Comptes-rendus signés ».",
        "Contrôlez le chiffre « Sans compte-rendu signé » : une fois le mois clos, il est « à vérifier avant facture ».",
        "Parcourez le tableau de chaque clinique : par modalité, « Routine », « Urgence », « Total » et « Signés ».",
        "Cliquez sur « Exporter en CSV » pour télécharger les lignes du mois.",
      ],
      terms: ["acte", "urgence", "compteRendu", "signature"],
    },
    system: {
      title: "Système",
      purpose:
        "L’état technique de la plateforme : dépendances, PACS central, et filets de sécurité comme les sauvegardes et les exercices de restauration. L’écran est en lecture seule : rien ne s’y règle.",
      steps: [
        "Regardez d’abord « Services » : « Opérationnels » si tout répond, « Dégradés » si une dépendance ou une tâche de sécurité échoue.",
        "Contrôlez le « PACS central », les « Examens conservés » et le « Volume d’images » sur le disque du PACS.",
        "Parcourez les « Dépendances » : une croix rouge et un détail signalent un service qui ne répond pas.",
        "Dans « Filets de sécurité », repérez le point rouge d’une tâche en échec ou dont la dernière exécution est trop ancienne.",
        "Consultez l’« Historique d’exploitation » pour les exécutions récentes, toutes tâches confondues.",
      ],
      terms: ["pacs", "filetSecurite", "examen"],
    },
    audit: {
      title: "Journal d’audit",
      purpose:
        "Chaque geste sensible, horodaté et attribué : examen consulté, compte-rendu signé, réglage modifié, membre ajouté. C’est la pièce à produire quand on demande qui a vu un dossier. Lecture seule : le journal s’écrit par le service, jamais d’ici.",
      steps: [
        "Lisez les entrées, les plus récentes en tête : date, action, auteur (« Système » ou « Règle d’attribution » pour un geste automatique), organisation et ressource.",
        "Choisissez une action dans la liste « Toutes les actions » pour n’afficher qu’un type de geste, par exemple « Examen consulté ».",
        "Survolez la référence d’une ressource pour lire son identifiant complet.",
        "Cliquez sur « Entrées plus anciennes », en bas de page, pour remonter le journal 50 entrées à la fois.",
        "Cliquez sur « Revenir aux plus récentes » pour retrouver le début du journal.",
      ],
      terms: ["journalAudit", "organisation", "regleAttribution"],
    },
    controls: {
      title: "Réglages",
      purpose:
        "Réglages qui s’appliquent à toute la plateforme dès le prochain affichage : délais promis, bandeau de maintenance, connexion Tailscale et politique d’accès du réseau privé. Chaque modification est tracée dans le journal d’audit.",
      steps: [
        "Réglez les « Délais promis aux cliniques » en minutes : « Urgence » entre 5 et 720, « Routine » entre 15 et 2 880.",
        "Saisissez au besoin le « Bandeau de maintenance », vérifiez son aperçu, puis cliquez sur « Enregistrer ».",
        "Dans « Connexion Tailscale », cliquez sur « Éprouver la connexion » pour vérifier le jeton et les portées du client OAuth.",
        "Pour « Enregistrer une connexion » ou la remplacer, saisissez l’identifiant, le secret et le code de votre application d’authentification.",
        "Dans « Politique d’accès », cliquez sur « Comparer » ; si elle diffère, « Pousser la politique versionnée » avec votre code.",
      ],
      terms: [
        "delaiPromis",
        "reseauPrive",
        "passerelle",
        "doubleAuthentification",
        "journalAudit",
      ],
    },
    worklist: {
      title: "À lire",
      purpose:
        "La file de lecture de toute la plateforme, en consultation : examens à attribuer et examens chez un radiologue, par ordre d’échéance. L’équipe la surveille sans rien prendre en charge.",
      steps: [
        "Lisez les indicateurs : « À attribuer », « Urgences à prendre », « En retard » et « Prochaine échéance ».",
        "Affinez la file avec la recherche, « Urgences seulement », les pastilles de modalité ou la liste « Toutes les cliniques ».",
        "Repérez dans « Chez un radiologue » les examens attribués ou en lecture, avec le nom du radiologue dans la colonne « Suivi ».",
        "Ouvrez un examen d’un clic, ou avec j, k et Entrée, pour le consulter : vous ne pouvez ni le prendre en charge ni le signer.",
        "Laissez l’écran ouvert : la file se met à jour toutes les 30 secondes et signale chaque nouvelle urgence.",
      ],
      terms: ["consultation", "urgence", "delaiPromis", "priseEnCharge"],
    },
    reports: {
      title: "Comptes-rendus",
      purpose:
        "Tous les comptes-rendus de la plateforme, toutes cliniques confondues, en cours de rédaction compris. En consultation : l’équipe les suit et télécharge les PDF signés, sans rédiger ni signer.",
      steps: [
        "Choisissez l’état : « Tous », « En cours de rédaction », « Signés » ou « Remis ».",
        "Cherchez un patient, un identifiant ou une modalité dans la barre de recherche.",
        "Lisez sur chaque ligne l’examen, la clinique, le radiologue qui rédige ou a signé, et la date de signature.",
        "Ouvrez un brouillon pour suivre sa rédaction dans l’écran de lecture, ou un compte-rendu signé pour sa fiche.",
        "Cliquez sur « PDF » pour télécharger un compte-rendu signé sans l’ouvrir.",
      ],
      terms: ["consultation", "compteRendu", "brouillon", "signature"],
    },
    report: {
      title: "Compte-rendu signé",
      purpose:
        "Un compte-rendu signé, tel qu’il a été transmis, sans aucune commande d’édition. L’équipe le lit, le télécharge et peut l’annuler s’il a été signé par erreur ; elle ne peut ni le modifier ni y ajouter d’addendum.",
      steps: [
        "Vérifiez en tête « Signé par », le numéro d’ordre et la « Date de signature ».",
        "Lisez le compte-rendu tel qu’il a été signé, puis ses « Addenda » s’il y en a.",
        "Ouvrez le lien « Vérification publique » pour contrôler le document comme le ferait un tiers.",
        "Cliquez sur « Télécharger le PDF » pour obtenir le document signé.",
        "Pour une erreur qu’un addendum ne répare pas, cliquez sur « Annuler le compte-rendu » et donnez un motif de 10 caractères au moins.",
      ],
      terms: [
        "compteRendu",
        "signature",
        "addendum",
        "annulation",
        "codeVerification",
      ],
    },
    templates: {
      title: "Modèles",
      purpose:
        "Les modèles de comptes-rendus de toute la plateforme, fournis par IMAFRIK ou créés par les organisations, lus en entier. En consultation : l’équipe les relit sans pouvoir les supprimer, car ils appartiennent aux organisations.",
      steps: [
        "Cherchez un modèle par nom ou par région dans le champ « Nom, région… ».",
        "Filtrez par modalité avec les pastilles ; « Toutes » les affiche de nouveau.",
        "Cliquez sur un modèle de la liste pour le lire en entier, dans la forme exacte d’un compte-rendu.",
        "Repérez son origine : « Fourni par IMAFRIK », ou « Organisation » sous le nom d’un modèle créé par une organisation.",
      ],
      terms: ["consultation", "modele", "organisation", "compteRendu"],
    },
    training: {
      title: "Formation",
      purpose:
        "Les exercices de formation : des examens réels anonymisés, sans patient ni clinique. L’équipe y voit aussi les cas « En relecture », cachés aux radiologues, pour les prévisualiser et les faire relire avant publication.",
      steps: [
        "Parcourez les cartes : modalité, région, titre, indication et source des images de chaque cas.",
        "Repérez les cas « En relecture » : visibles de l’équipe IMAFRIK seulement, tant qu’un radiologue n’a pas relu le contexte clinique.",
        "Cliquez sur « Prévisualiser » pour ouvrir un cas en relecture dans l’écran de lecture, sans exercice.",
        "Vérifiez sur chaque carte « Contexte relu par » et la source des images, avec « Voir la source ».",
        "Sur un cas publié, cliquez sur « Commencer » pour faire l’exercice vous-même, comme un radiologue.",
      ],
      terms: ["exercice", "specimen", "priseEnCharge"],
    },
    trainingExercise: {
      title: "Prévisualisation d’un cas",
      purpose:
        "Un cas de formation dans le vrai écran de lecture. En relecture, il s’ouvre en prévisualisation : images, renseignement clinique et consigne, sans exercice, rédaction ni signature.",
      steps: [
        "Lisez le bandeau « Prévisualisation » : le cas est en relecture, l’exercice s’ouvrira une fois le cas publié.",
        "Faites défiler les images du cas dans le viewer, à gauche, ou passez en « Plein écran ».",
        "Relisez le « Renseignement clinique » et la « Consigne », affichés au-dessus du compte-rendu.",
        "Revenez à la liste des cas avec la flèche de retour.",
        "Sur un cas publié, cliquez sur « Commencer l’exercice » pour le faire vous-même : rien n’atteint un patient.",
      ],
      terms: ["exercice", "viewer", "renseignementClinique"],
    },
    reading: {
      title: "Écran de lecture",
      purpose:
        "La consultation d’un examen : images, renseignement clinique et compte-rendu tel qu’il est, brouillon compris. L’équipe ne peut ni prendre en charge, ni rédiger, ni signer ; chaque ouverture est tracée à son nom dans le journal d’audit.",
      steps: [
        "Consultez les images dans le viewer, à gauche ; « Plein écran » les agrandit.",
        "Lisez le « Renseignement clinique » transmis par la clinique, au-dessus du compte-rendu.",
        "Face à un brouillon, lisez le bandeau « Brouillon non signé » : l’écran suit la rédaction et se met à jour tout seul.",
        "Si le volet affiche « Compte-rendu en préparation », attendez la signature du radiologue : rien ne se rédige ici.",
        "Pour un compte-rendu signé par erreur, cliquez sur « Annuler le compte-rendu » et donnez le motif.",
      ],
      terms: [
        "consultation",
        "viewer",
        "brouillon",
        "renseignementClinique",
        "annulation",
      ],
    },
    settings: {
      title: "Paramètres",
      purpose:
        "Le compte de l’administrateur IMAFRIK : profil, langue, mot de passe et double authentification. Les réglages de la plateforme, eux, se font dans « Réglages ».",
      steps: [
        "Corrigez au besoin votre « Nom complet » et votre « Titre », puis cliquez sur « Enregistrer ».",
        "Choisissez la « Langue » de vos écrans, des messages du service et de vos courriels, puis enregistrez.",
        "Changez votre mot de passe avec « Changer le mot de passe » : vos sessions sur d’autres appareils seront fermées.",
        "Vérifiez que la « Double authentification » est « Active » ; sinon, cliquez sur « Activer ».",
      ],
      terms: ["doubleAuthentification", "organisation"],
    },
  },
};
