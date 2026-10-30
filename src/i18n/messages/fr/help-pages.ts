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
        "Filtrez par clinique, modalité ou « Urgences » : chaque choix dit son nombre d’examens, sur toute la file. Ou cherchez un patient.",
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
        "Repérez les plus pressés : la colonne « Échéance » indique le temps restant. Filtrez par clinique, modalité ou « Urgences », ou cherchez un patient.",
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
        "Filtrez par modalité ou par état, « À faire », « En cours » ou « Signé » : chaque choix dit son nombre d’exercices.",
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
        "Cherchez un patient, ou filtrez par clinique, modalité, urgence ou période : les plus récemment signés en tête.",
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
        "Filtrez par origine ou modalité, chaque choix avec son nombre de modèles, ou cherchez un modèle par nom ou par région.",
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
    ideas: {
      title: "Vos idées",
      purpose:
        "Proposez une piste pour améliorer IMAFRIK et suivez ce qu’elle devient : l’équipe IMAFRIK lit chaque idée, la fait avancer et vous répond. Vous ne voyez que vos propres idées.",
      steps: [
        "Donnez un titre court, décrivez ce qui vous gêne et ce que vous aimeriez à la place, puis choisissez la catégorie.",
        "Si vous le savez, dites ce que l’idée vous ferait gagner : du temps, de la clarté ou de la sécurité.",
        "N’écrivez jamais l’identité d’un patient : ni nom, ni identifiant, ni date de naissance. Aucune capture d’écran n’est jointe.",
        "Depuis un autre écran, l’ampoule de la barre du haut ouvre ce formulaire avec le nom de l’écran ; décochez « Joindre ce contexte » au besoin.",
        "Cliquez sur « Envoyer l’idée », puis suivez-la dans « Mes idées » : son état et la réponse de l’équipe. Un courriel vous prévient.",
      ],
      terms: ["idee", "etatIdee"],
    },
    reading: {
      title: "Écran de lecture",
      purpose:
        "L’écran où vous lisez un examen et rédigez son compte-rendu : les images dans le viewer à gauche, le compte-rendu à droite. Une fois signé, le compte-rendu part à la clinique et n’est plus modifiable. Les images ne sortent pas d’IMAFRIK : ni capture, ni photo, ni impression.",
      steps: [
        "Lisez le « Renseignement clinique » et parcourez les images, ou, sur ordinateur, « Ouvrir dans Weasis » ; une antériorité s’ouvre en lecture seule.",
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
      guides: ["weasis"],
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
        "Tous les examens envoyés par votre clinique, avec le radiologue qui les lit et l’état de leur compte-rendu. C’est ici que vous attribuez vos examens à vos radiologues, modalité par modalité si vous le souhaitez.",
      steps: [
        "Cliquez sur l’état « À attribuer » pour ne voir que les examens qu’aucun radiologue ne voit encore, les plus pressés en tête.",
        "Filtrez par radiologue, modalité, état, urgence ou période : chaque choix dit son nombre d’examens, et ils se combinent.",
        "Sur une ligne, cliquez sur « Attribuer », choisissez un radiologue parmi ceux qui lisent la modalité, cochez les antériorités utiles, puis cliquez sur « Attribuer ».",
        "Tapez un nom de patient, un identifiant ou une modalité dans la recherche, puis appuyez sur Entrée.",
        "Cliquez sur une ligne pour ouvrir la fiche de l’examen, ou sur « Déposer des images » pour envoyer une archive ZIP, qui reprend après chaque coupure.",
      ],
      terms: [
        "attribution",
        "groupeModalites",
        "anteriorite",
        "modalitesLues",
        "urgence",
      ],
    },
    deposits: {
      title: "Dépôts d’images",
      purpose:
        "Pour envoyer les images d’un ou plusieurs examens en une archive ZIP, quand la connexion est faible ou que la passerelle est en panne. L’envoi reprend après chaque coupure, et chaque dépôt a son compte rendu.",
      steps: [
        "Compressez le dossier d’images exporté en ZIP : clic droit sur le dossier, « Envoyer vers », « Dossier compressé ».",
        "Glissez l’archive dans « Déposer une archive ZIP », ou cliquez sur « Choisir une archive ». Gardez la page ouverte : la progression, le débit et le temps restant s’affichent.",
        "Si la connexion se coupe, ne faites rien : l’envoi reprend seul au retour du réseau. Page fermée ? Cliquez sur « Reprendre » dans « Mes dépôts » et choisissez le même fichier.",
        "Une fois reçue, l’archive est contrôlée. Ouvrez son compte rendu : examens transmis, doublons, fichiers ignorés et pourquoi.",
        "Les examens arrivent dans « Examens », « à attribuer », une minute environ après le contrôle.",
      ],
      terms: [
        "depot",
        "archiveZip",
        "repriseEnvoi",
        "fichierIgnore",
        "doublon",
      ],
    },
    depositReport: {
      title: "Compte rendu d’un dépôt",
      purpose:
        "Ce que l’archive a donné : examens, séries et images transmis, doublons, et fichiers ignorés avec leur raison.",
      steps: [
        "Lisez l’état en tête : intégré, en contrôle, refusé (et quoi faire), ou envoi interrompu (et jusqu’à quand le reprendre).",
        "Survolez ou touchez ⓘ près de chaque nombre pour savoir ce qu’il compte.",
        "Cliquez sur « Ouvrir l’examen » pour l’attribuer ; « En cours d’intégration » devient un lien d’ici une minute.",
        "Dans « Fichiers ignorés », ouvrez une raison pour voir les fichiers concernés et ce qu’il faut faire.",
      ],
      terms: ["depot", "fichierIgnore", "doublon", "dicom"],
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
        "Cherchez un patient, ou filtrez par signataire, modalité, urgence ou période : les plus récemment signés en tête.",
        "Choisissez l’état « À télécharger » : les comptes-rendus que votre clinique n’a pas encore récupérés, avec leur nombre.",
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
        "Filtrez par rôle, modalité lue ou « Sur la liste d’urgence », chaque choix avec son nombre, ou cherchez un membre par nom ou adresse.",
        "Cliquez sur « Inviter », saisissez nom, adresse électronique et rôle, puis « Envoyer l’invitation » : la personne choisit elle-même son mot de passe.",
        "« Responsable » a les mêmes droits que vous. « Radiologue » n’accède aux examens qu’après vérification de son numéro d’ordre.",
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
    activity: {
      title: "Activité et facturation",
      purpose:
        "Le bilan de chaque mois en trois parties, à un clic depuis l’en-tête : l’activité, les performances de chaque radiologue, puis le relevé de facturation, le même que celui de l’équipe IMAFRIK. Réservé aux responsables de la clinique.",
      steps: [
        "Changez de mois avec les flèches ; « Activité », « Performances par radiologue » et « Facturation » mènent à chaque partie.",
        "Dans les performances, triez les colonnes ; le bouton ⓘ d’un intitulé dit ce que mesure l’indicateur, celui du titre ce que disent les flèches.",
        "Sans compte-rendu signé dans le mois, le tableau le dit : ses délais restent vides jusqu’au premier acte signé.",
        "Dans « Facturation », lisez l’abonnement, les forfaits techniques et le total HT, provisoire jusqu’à la clôture du mois.",
        "Cliquez sur « Exporter en CSV » pour télécharger le relevé du mois.",
      ],
      terms: ["delaiMedian", "centile90", "dureeLecture", "acte", "moisClos"],
    },
    settings: {
      title: "Paramètres",
      purpose:
        "Vos réglages personnels et ceux de votre clinique. Le plus important est « Qui lit vos examens » : vos radiologues et ceux du réseau IMAFRIK, ou seulement les vôtres. Chaque bloc s’enregistre séparément.",
      steps: [
        "Dans « Profil » et « Langue », vérifiez votre nom, votre fonction et la langue de vos écrans, puis cliquez sur « Enregistrer » dans chaque bloc.",
        "Dans « Qui lit vos examens », choisissez « Nos radiologues et le réseau IMAFRIK » ou « Nos radiologues uniquement », puis cliquez sur « Enregistrer ».",
        "Avec « Nos radiologues uniquement », assurez-vous que vos radiologues couvrent aussi la nuit et le week-end.",
        "Pour changer de mot de passe, remplissez les trois champs et cliquez sur « Changer le mot de passe ». Vérifiez que la double authentification est « Active ».",
        "Dans « Engagements », cliquez sur « Télécharger mon exemplaire » pour obtenir la convention de service acceptée.",
      ],
      terms: ["pool", "priseEnCharge", "doubleAuthentification", "engagement"],
    },
    ideas: {
      title: "Vos idées",
      purpose:
        "Proposez ce qui faciliterait la vie de votre clinique sur IMAFRIK, et suivez ce que l’idée devient : l’équipe IMAFRIK la lit, la fait avancer et vous répond. Vous ne voyez que vos propres idées.",
      steps: [
        "Donnez un titre court, décrivez ce qui vous gêne et ce que vous aimeriez à la place, puis choisissez la catégorie.",
        "Si vous le savez, dites ce que l’idée vous ferait gagner : du temps, de la clarté ou de la sécurité.",
        "N’écrivez jamais l’identité d’un patient : ni nom, ni identifiant, ni date de naissance. Aucune capture d’écran n’est jointe.",
        "Depuis un autre écran, l’ampoule de la barre du haut ouvre ce formulaire avec le nom de l’écran ; décochez « Joindre ce contexte » au besoin.",
        "Cliquez sur « Envoyer l’idée », puis suivez-la dans « Mes idées » : son état et la réponse de l’équipe. Un courriel vous prévient.",
      ],
      terms: ["idee", "etatIdee"],
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
        "L’activité de la plateforme en trois rubriques, à un clic dès l’en-tête : vue d’ensemble d’une période, performances de chaque radiologue sur un mois, activité par clinique. Chaque rubrique a son adresse, à partager telle quelle.",
      steps: [
        "Choisissez la rubrique : « Vue d’ensemble », « Par radiologue » ou « Par clinique » ; « Facturation » ouvre les relevés du mois.",
        "Filtrez par clinique, et par modalité hors « Par radiologue » ; la période (7 j à 1 an) vaut pour la vue d’ensemble, le mois pour les radiologues.",
        "Dans « Par radiologue », triez les colonnes ; le bouton ⓘ d’un intitulé dit ce que mesure l’indicateur, celui du titre ce que disent les flèches.",
        "Depuis « Comptes », « Voir ses performances » ouvre cette rubrique sur la ligne du radiologue, mise en évidence.",
        "Sans compte-rendu signé dans le mois, le tableau le dit : ses délais restent vides jusqu’au premier acte signé.",
      ],
      terms: [
        "delaiMedian",
        "centile90",
        "delaiPromis",
        "dureeLecture",
        "priseEnCharge",
      ],
    },
    flow: {
      title: "Flux d’images",
      purpose:
        "Suit les derniers examens reçus, de l’acquisition à la remise du compte-rendu, avec leur débit de réception et la durée de chaque étape. Ouvrez-le quand une clinique signale un retard : vous voyez si la cause est la liaison, la file ou la lecture.",
      steps: [
        "Filtrez par clinique, modalité, état ou urgence : le service filtre avant de retenir les 100 derniers examens.",
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
        "Filtrez « Non raccordée » ou « Silencieuse depuis 24 h » : la passerelle est peut-être à l’arrêt. Cherchez une organisation par nom ou ville.",
        "Sur une ligne, invitez une personne ou réglez les fonctions d’IA par les icônes, ou cliquez sur « Suspendre » pour couper l’accès de ses membres.",
      ],
      terms: ["responsable", "groupe", "pool", "contratService", "pacs"],
      guides: ["onboardClinic"],
    },
    organisation: {
      title: "Fiche de la clinique",
      purpose:
        "Suit la mise en service d’une clinique et son activité sur trente jours. Vous y raccordez ses passerelles par un code, renseignez sa formule d’abonnement, réglez la conservation des images, la langue et le logo des comptes-rendus, et pouvez mettre fin au contrat.",
      steps: [
        "Suivez la « Mise en service » : la première étape non franchie est celle qui appelle une action.",
        "Dans « Raccorder une passerelle », cliquez sur « Émettre un code » (15 minutes, une seule fois) et dictez-le à l’installateur, qui le saisit dans le kit.",
        "Quand le poste apparaît « En attente d’approbation » dans « Passerelles », vérifiez-le avec la clinique, puis cliquez sur « Approuver ».",
        "Dans « Liste d’urgence » et « Règles d’attribution », choisissez les radiologues, de la clinique ou du réseau, qui prennent ses urgences ou reçoivent d’office ses examens.",
        "Renseignez son « Abonnement », puis au besoin la conservation des images, la langue des comptes-rendus et le logo en filigrane.",
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
        "Filtrez par clinique, statut (« En attente d’approbation » : à décider) ou « Muettes » : aucun signe de vie depuis 30 minutes.",
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
        "Liste tous les comptes de la plateforme. Vous y rattachez les inscrits, examinez les dossiers des radiologues, réglez les modalités que chacun lit, vérifiez la double authentification et traitez les demandes d’effacement.",
      steps: [
        "Filtrez par organisation, rôle, modalité lue, compte (« À valider », « Signature à vérifier », « En attente ») ou sans double authentification.",
        "Pour un compte « Rattaché à aucune organisation », cliquez sur « Rattacher », puis choisissez l’organisation et le rôle.",
        "Cliquez sur « Examiner le dossier » ou « Signature à vérifier », ouvrez les pièces, puis acceptez ou refusez avec un motif.",
        "Sur la ligne d’un radiologue, lisez ses modalités et ses listes d’urgence ; « Modalités » les règle, « Voir ses performances » ouvre ses chiffres.",
        "Pour un téléphone perdu ou changé, vérifiez l’identité par un autre canal, puis cliquez sur « Réinitialiser ».",
      ],
      terms: [
        "rattachement",
        "habilitation",
        "modalitesLues",
        "listeUrgence",
        "signature",
      ],
    },
    studies: {
      title: "Examens",
      purpose:
        "Liste les examens de toute la plateforme, toutes organisations confondues, pour répondre vite à une clinique. Le nom du patient ouvre les images et le compte-rendu en consultation seule, et chaque ouverture est tracée.",
      steps: [
        "Filtrez par clinique ou radiologue (tapez un nom s’ils sont nombreux), modalité, état, « Urgences en cours » ou période : chaque choix dit son nombre d’examens.",
        "Cherchez un examen par patient, identifiant ou modalité. « Effacer les filtres » rend toute la liste ; l’adresse garde vos filtres, à partager.",
        "Cliquez sur le nom du patient pour ouvrir les images et le compte-rendu, sans pouvoir rédiger ni signer.",
        "Pour un examen non signé, cliquez sur « Attribuer » en fin de ligne, choisissez un radiologue qui lit sa modalité, cochez les antériorités utiles, puis validez.",
        "« Personne ne peut le recevoir » : la fenêtre dit pourquoi et quoi faire. Pour reprendre un examen à son titulaire : « Réattribuer », puis « Retirer l’attribution ».",
      ],
      terms: [
        "groupeModalites",
        "attribution",
        "anteriorite",
        "urgence",
        "pool",
      ],
    },
    deposits: {
      title: "Dépôts",
      purpose:
        "Les archives ZIP déposées par les cliniques, ou par l’équipe en leur nom, et leur compte rendu. C’est aussi d’ici que l’équipe dépose pour une clinique qui le demande.",
      steps: [
        "Filtrez par clinique, état ou période : « Refusé » et « En cours d’envoi » disent où une clinique bute.",
        "Pour déposer au nom d’une clinique, choisissez-la dans « Clinique », puis glissez l’archive ou cliquez sur « Choisir une archive ».",
        "Le dépôt est tracé à votre nom au journal d’audit ; la clinique le voit marqué « Équipe IMAFRIK ».",
        "Ouvrez une ligne pour lire son compte rendu, ou annulez un envoi interrompu que personne ne reprendra.",
      ],
      terms: ["depot", "archiveZip", "repriseEnvoi", "fichierIgnore"],
    },
    depositReport: {
      title: "Compte rendu d’un dépôt",
      purpose:
        "Le compte rendu que lit la clinique, avec le nom de qui a déposé : examens, séries et images transmis, doublons, fichiers ignorés et leur raison.",
      steps: [
        "Lisez l’état en tête et, pour une archive refusée, ce que la clinique doit faire.",
        "Cliquez sur « Ouvrir l’examen » : il s’ouvre dans la vue des cliniques, comme son responsable le voit.",
        "Dans « Fichiers ignorés », ouvrez une raison pour voir les fichiers concernés.",
      ],
      terms: ["depot", "fichierIgnore", "doublon", "vueCliniques"],
    },
    requests: {
      title: "Demandes reçues",
      purpose:
        "Rassemble les demandes envoyées par le formulaire de contact du site, par des établissements ou des radiologues. Chacune se suit de « Nouvelle » à « Convertie » ou « Écartée », avec les notes de l’équipe.",
      steps: [
        "Filtrez par demandeur, étape du suivi ou période, chaque option comptée ; cherchez par nom, adresse ou établissement.",
        "Contactez le demandeur en cliquant sur son adresse électronique ou sur son numéro de téléphone.",
        "Pour un radiologue, relevez le « N° d’ordre déclaré » : il est vérifié avant tout accès aux examens.",
        "Pour accueillir un radiologue, cliquez sur « Inviter comme radiologue » quand le bouton est proposé : la demande passe à « Convertie ».",
        "Choisissez l’étape du suivi, ajoutez vos notes, puis cliquez sur « Enregistrer ».",
      ],
      terms: ["numeroOrdre", "habilitation"],
    },
    ideas: {
      title: "Idées",
      purpose:
        "Les pistes d’amélioration proposées par les radiologues et les responsables de clinique. L’équipe IMAFRIK les lit, y répond, les fait avancer d’un état à l’autre et regroupe les doublons.",
      steps: [
        "Filtrez par clinique, rôle, catégorie, état ou période, chaque option comptée ; cherchez un mot du titre, du texte ou le nom de l’auteur.",
        "Commencez par les idées « Reçues » : le cockpit en donne le nombre, et son alerte mène ici.",
        "Choisissez l’état, écrivez une réponse, puis cliquez sur « Enregistrer » : l’auteur est prévenu par courriel.",
        "Pour un doublon, choisissez l’idée principale dans « Même idée que… » : l’idée regroupée suit son état, et son auteur est prévenu.",
        "Le contexte dit d’où vient l’idée : écran, version, appareil. Chaque geste est tracé au journal d’audit.",
      ],
      terms: ["idee", "etatIdee", "regroupement", "journalAudit"],
    },
    billing: {
      title: "Facturation",
      purpose:
        "Le relevé de chaque clinique pour un mois, celui que voit son responsable : abonnement, forfaits techniques des actes et actes par radiologue. Un mois fini se vérifie, puis se clôt : ses relevés ne changent plus.",
      steps: [
        "Changez de mois avec les flèches placées de part et d’autre du mois affiché.",
        "Lisez les totaux : « Total HT », « Actes facturés », « Sans compte-rendu signé » et « Sans formule ».",
        "Filtrez par clinique ou « Sans formule » : ces cliniques n’ont ni abonnement ni total ; ouvrez leur fiche et renseignez l’« Abonnement ».",
        "Le mois fini, vérifiez les relevés puis cliquez sur « Clore le mois » : ce geste est définitif.",
        "Cliquez sur « Exporter en CSV » pour télécharger les relevés du mois.",
      ],
      terms: [
        "acte",
        "forfaitTechnique",
        "formuleAbonnement",
        "moisClos",
        "horsGrille",
      ],
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
        "Dans l’« Historique d’exploitation », filtrez par tâche ou « Échecs seulement » : chaque choix dit son nombre d’exécutions récentes.",
      ],
      terms: ["pacs", "filetSecurite", "examen"],
    },
    audit: {
      title: "Journal d’audit",
      purpose:
        "Chaque geste sensible, horodaté et attribué : examen consulté, compte-rendu signé, réglage modifié, membre ajouté. C’est la pièce à produire quand on demande qui a vu un dossier. Lecture seule : le journal s’écrit par le service, jamais d’ici.",
      steps: [
        "Lisez les entrées, les plus récentes en tête : date, action, auteur (« Système » ou « Règle d’attribution » pour un geste automatique), organisation et ressource.",
        "Filtrez par organisation, auteur, famille (« Comptes-rendus »…), action ou période : la liste se relit, depuis les plus récentes.",
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
    clinicViews: {
      title: "Vue des cliniques",
      purpose:
        "Choisissez une clinique pour ouvrir ses écrans tels que les voit son responsable, avec ses vraies données, en lecture seule. Chaque ouverture est tracée au journal d’audit.",
      steps: [
        "Cliquez sur une clinique de la liste, ou choisissez-la dans « Vue des cliniques » de la navigation.",
        "Le bandeau « Consultation de » rappelle sur chaque écran quelle clinique vous consultez.",
        "Passez d’un écran à l’autre depuis la navigation : tableau de bord, examens, comptes-rendus, équipe, activité et facturation.",
        "Cliquez sur « Retour à la console » pour revenir à la tour de contrôle.",
      ],
      terms: ["vueCliniques", "consultation", "journalAudit"],
    },
    clinicDashboard: {
      title: "Tableau de bord de la clinique",
      purpose:
        "Le tableau de bord du responsable de la clinique consultée : examens à attribuer, en lecture, comptes-rendus prêts et délai médian sur 30 jours, avec les mêmes chiffres que lui.",
      steps: [
        "Lisez les quatre indicateurs : un examen « À attribuer » n’est vu d’aucun radiologue.",
        "Dans « Comptes-rendus à télécharger », ouvrez un compte-rendu. Un PDF téléchargé par l’équipe ne le marque pas remis à la clinique.",
        "Dans « Derniers examens envoyés », cliquez sur un examen pour ouvrir sa fiche.",
        "Changez de clinique avec le sélecteur de la navigation : vous restez sur le même écran.",
      ],
      terms: ["vueCliniques", "attribution", "delaiMedian", "compteRendu"],
    },
    clinicStudies: {
      title: "Examens de la clinique",
      purpose:
        "Les examens de la clinique consultée, tels que les voit son responsable, avec le radiologue de chacun. L’équipe y attribue un examen par son propre portail ; elle n’envoie aucun examen au nom de la clinique.",
      steps: [
        "Cliquez sur l’état « À attribuer » pour ne voir que les examens qu’aucun radiologue ne voit encore ; les autres filtres s’y ajoutent.",
        "Sur une ligne, cliquez sur « Attribuer » : la fenêtre de l’équipe propose aussi les radiologues du réseau qui lisent la clinique.",
        "Tapez un nom de patient, un identifiant ou une modalité dans la recherche, puis appuyez sur Entrée.",
        "Cliquez sur une ligne pour ouvrir la fiche de l’examen.",
        "« Personne ne peut le recevoir » sur une ligne : ouvrez « Attribuer », la fenêtre dit pourquoi et mène à l’écran qui le règle.",
      ],
      terms: ["vueCliniques", "attribution", "anteriorite", "urgence"],
    },
    clinicStudy: {
      title: "Fiche de l’examen",
      purpose:
        "Un examen de la clinique consultée, tel que le voit son responsable : images, attribution, avancement et compte-rendu signé. Le renseignement clinique et l’urgence restent au responsable : ils se lisent ici sans se modifier.",
      steps: [
        "Dans « Attribution », lisez qui lit l’examen et depuis quand ; « Attribuer » ou « Réattribuer » le confie par le portail de l’équipe.",
        "Suivez la lecture dans « Avancement », de « Examen reçu » à « Compte-rendu remis ».",
        "Cliquez sur « Ouvrir les images » pour l’écran de lecture, en consultation : l’ouverture est tracée à votre nom.",
        "Une fois le compte-rendu signé, ouvrez « Document complet ». Votre téléchargement du PDF ne le marque pas remis.",
      ],
      terms: [
        "vueCliniques",
        "attribution",
        "anteriorite",
        "renseignementClinique",
        "consultation",
      ],
    },
    clinicReports: {
      title: "Comptes-rendus de la clinique",
      purpose:
        "Les comptes-rendus signés et remis de la clinique consultée, ceux que voit son responsable. « À télécharger » dit que la clinique ne l’a pas encore récupéré : un téléchargement par l’équipe n’y change rien.",
      steps: [
        "Cherchez un patient, ou filtrez par signataire, modalité, urgence ou période : les plus récemment signés en tête.",
        "Choisissez l’état « À télécharger » : les comptes-rendus que la clinique n’a pas encore récupérés, avec leur nombre.",
        "Cliquez sur une ligne pour ouvrir le compte-rendu signé.",
        "Le PDF que vous téléchargez est tracé à votre nom, sans marquer le compte-rendu remis.",
      ],
      terms: ["vueCliniques", "compteRendu", "signature"],
    },
    clinicReport: {
      title: "Compte-rendu signé",
      purpose:
        "Un compte-rendu signé de la clinique consultée, tel que le lit son responsable : le document, son signataire et ses addenda, sans commande d’édition ni annulation.",
      steps: [
        "Vérifiez en tête le signataire, la date de signature et, s’il est indiqué, son numéro d’ordre.",
        "Lisez la section « Addenda » sous le texte, si elle apparaît.",
        "Cliquez sur « Télécharger le PDF » : le téléchargement est tracé à votre nom, sans marquer le compte-rendu remis.",
        "Pour annuler un compte-rendu signé par erreur, ouvrez-le depuis « Comptes-rendus » du bloc « Lectures ».",
      ],
      terms: ["vueCliniques", "compteRendu", "addendum", "codeVerification"],
    },
    clinicTeam: {
      title: "Équipe de la clinique",
      purpose:
        "L’équipe de la clinique consultée : ses responsables et ses radiologues, avec les modalités que lit chacun et sa place sur la liste d’urgence. En consultation, l’équipe IMAFRIK n’y invite ni n’y retire personne.",
      steps: [
        "Filtrez par rôle, modalité lue ou « Sur la liste d’urgence », ou cherchez un membre ; lisez les modalités de chaque radiologue.",
        "Un avis signale une clinique sans responsable, ou avec un seul : personne n’y prendrait le relais.",
        "Cliquez sur « Liste d’urgence » pour la régler depuis la fiche de la clinique, radiologues du réseau compris.",
        "Cliquez sur « Règles d’attribution » pour lire et régler qui reçoit d’office les examens.",
      ],
      terms: [
        "vueCliniques",
        "responsable",
        "modalitesLues",
        "listeUrgence",
        "regleAttribution",
      ],
    },
    clinicTeamRules: {
      title: "Règles d’attribution de la clinique",
      purpose:
        "Les règles qui confient d’office les examens de la clinique consultée, à leur arrivée. L’équipe IMAFRIK les règle ici comme depuis la fiche de la clinique, radiologues du réseau compris.",
      steps: [
        "Dans « Radiologue par modalité », lisez ou choisissez qui reçoit tous les examens d’une modalité.",
        "Dans « Planning de la semaine », ajoutez ou retirez un créneau : radiologue, jours et, au besoin, heures.",
        "Deux radiologues de garde en même temps laissent l’examen à attribuer : l’écran le signale.",
        "Cliquez sur « Enregistrer les règles ». Elles valent pour les examens qui arrivent ensuite.",
      ],
      terms: ["regleAttribution", "planning", "modalitesLues", "attribution"],
    },
    clinicActivity: {
      title: "Activité et facturation de la clinique",
      purpose:
        "Le bilan du mois de la clinique consultée, par les mêmes calculs que pour son responsable : examens reçus, délais, performances de chaque radiologue et relevé de facturation.",
      steps: [
        "Changez de mois avec les flèches placées de part et d’autre du mois affiché.",
        "Lisez l’activité, puis « Performances par radiologue » ; cliquez sur un intitulé pour trier.",
        "Dans « Facturation », lisez l’abonnement, les forfaits techniques et le total HT, provisoire jusqu’à la clôture du mois.",
        "Cliquez sur « Formule d’abonnement » pour la renseigner depuis la fiche de la clinique, ou sur « Exporter en CSV ».",
      ],
      terms: [
        "delaiMedian",
        "acte",
        "forfaitTechnique",
        "formuleAbonnement",
        "moisClos",
      ],
    },
    worklist: {
      title: "À lire : la répartition",
      purpose:
        "Le poste de répartition de l’équipe IMAFRIK : la file de toute la plateforme, par échéance. Vous y attribuez d’affilée chaque examen en attente et réattribuez ceux qui sont chez un radiologue. « Examens » reste le registre complet, où l’attribution reste possible.",
      steps: [
        "Filtrez par clinique (liste par ordre alphabétique, avec recherche), modalité, urgence ou nom : par exemple les scanners d’une clinique, à répartir d’affilée.",
        "Dans « À attribuer », cliquez sur « Attribuer », choisissez un radiologue qui lit la modalité et les antériorités utiles : la ligne passe aussitôt « Chez un radiologue ».",
        "« Personne d’éligible » : cliquez quand même sur « Attribuer ». La fenêtre dit pourquoi et mène à l’écran qui le règle : habilitation, modalités, pool.",
        "Dans « Chez un radiologue », « Réattribuer » confie l’examen à un autre ou retire l’attribution, tant que le compte-rendu n’est pas signé.",
        "Le nombre sur « À lire » compte les examens à attribuer, en rouge si une urgence attend, même « Lectures » replié. La file se met à jour toutes les 30 secondes.",
      ],
      terms: [
        "attribution",
        "anteriorite",
        "urgence",
        "modalitesLues",
        "habilitation",
      ],
    },
    reports: {
      title: "Comptes-rendus",
      purpose:
        "Tous les comptes-rendus de la plateforme, toutes cliniques confondues, en cours de rédaction compris. En consultation : l’équipe les suit et télécharge les PDF signés, sans rédiger ni signer.",
      steps: [
        "Filtrez par clinique, radiologue, modalité, état (« En cours de rédaction », « Signés », « Remis »), urgence ou période.",
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
        "Filtrez par origine, « IMAFRIK » ou « Organisation », ou par modalité : chaque choix dit son nombre de modèles.",
        "Cherchez un modèle par nom ou par région dans le champ « Nom, région… ».",
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
        "Filtrez par modalité ou par état, puis parcourez les cartes : région, titre, indication et source des images de chaque cas.",
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
        "Consultez les images dans le viewer, à gauche, ou, sur ordinateur, avec « Ouvrir dans Weasis » ; « Plein écran » les agrandit.",
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
      guides: ["weasis"],
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
