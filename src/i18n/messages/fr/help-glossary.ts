/**
 * Glossaire de l'aide : chaque terme de la plateforme défini une seule
 * fois, repris dans l'aide de chaque écran qui l'emploie.
 *
 * Les définitions disent ce que le terme veut dire **sur IMAFRIK**, dans
 * les mots d'une clinique ou d'un radiologue : pas de jargon technique
 * sans explication, aucune promesse que la plateforme ne tient pas.
 */
export const glossary = {
  addendum: {
    term: "Addendum",
    definition:
      "Correction ajoutée à un compte-rendu déjà signé. Le texte signé n’est jamais modifié : l’addendum s’y ajoute, daté et signé avec le code personnel, et la clinique le voit.",
  },
  acte: {
    term: "Acte",
    definition:
      "Examen reçu dont le compte-rendu est signé, compté pour la facture de la clinique au mois de sa réception. Une urgence est facturée au tarif d’urgence.",
  },
  consultation: {
    term: "Consultation",
    definition:
      "Accès en lecture seule de l’équipe IMAFRIK aux écrans des radiologues (file, brouillons, comptes-rendus, images) et, dans la vue des cliniques, à ceux du responsable d’une clinique. Elle voit sans prendre en charge, rédiger ni signer, et chaque ouverture est tracée.",
  },
  vueCliniques: {
    term: "Vue des cliniques",
    definition:
      "Les écrans du responsable d’une clinique, ouverts par l’équipe IMAFRIK avec les données de cette clinique et les mêmes chiffres. L’équipe y attribue, règle le planning et dépose des archives ZIP au nom de la clinique ; ni envoi fichier par fichier, ni invitation, ni renseignement clinique, et un PDF téléchargé n’est pas remis. Chaque ouverture est tracée au journal d’audit.",
  },
  groupeModalites: {
    term: "Groupe de modalités",
    definition:
      "Classement des examens par appareil : Radiographie (HSG comprise), Mammographie, Échographie, Scanner, IRM, Autres. Les listes d’examens se filtrent par groupe ; c’est aussi ce qu’un radiologue lit.",
  },
  dureeLecture: {
    term: "Durée de lecture",
    definition:
      "Temps entre le début de la lecture d’un examen et la signature de son compte-rendu, en médiane. La prise en charge, elle, va de l’attribution au début de la lecture.",
  },
  filetSecurite: {
    term: "Filet de sécurité",
    definition:
      "Tâche planifiée qui protège la plateforme : sauvegarde chiffrée, exercice de restauration, réconciliation du PACS, conservation des données, surveillance du serveur. L’écran Système montre sa dernière exécution.",
  },
  formuleAbonnement: {
    term: "Formule d’abonnement",
    definition:
      "Abonnement mensuel de la clinique : Essentiel, Pro ou Établissement, sur devis. L’équipe IMAFRIK la renseigne d’après la convention ; sans elle, le relevé n’a ni abonnement ni total.",
  },
  aeTitle: {
    term: "AE Title",
    definition:
      "Nom DICOM d’un appareil ou d’un logiciel d’imagerie, seize caractères au plus. Chaque passerelle reçoit le sien à l’enrôlement, et le PACS d’IMAFRIK n’accepte ses envois que depuis l’adresse de cette passerelle.",
  },
  annulation: {
    term: "Compte-rendu annulé",
    definition:
      "Compte-rendu signé retiré pour une erreur qu’un addendum ne répare pas, comme un texte rédigé sur le mauvais examen. Il est archivé tel quel, la vérification publique le dit annulé, et l’examen revient dans la file pour une vraie lecture.",
  },
  anteriorite: {
    term: "Antériorité",
    definition:
      "Examen précédent du même patient, dans la même clinique. Le responsable de la clinique, ou l’équipe IMAFRIK, peut la partager avec le radiologue qui lit un examen : images et compte-rendu signé, en lecture seule. Rien n’est partagé d’office, et chaque partage est tracé.",
  },
  attribution: {
    term: "Attribution",
    definition:
      "Réservation d’un examen à un radiologue précis, par le responsable de la clinique ou, pour les radiologues du réseau, par l’équipe IMAFRIK, ou d’office à son arrivée par une règle d’attribution. Lui seul le voit et peut le prendre en charge ; il en est prévenu par courriel, sans aucune donnée du patient.",
  },
  brouillon: {
    term: "Brouillon",
    definition:
      "Compte-rendu en cours de rédaction, enregistré par la plateforme ; une copie reste aussi gardée sur le poste. La clinique ne voit que le compte-rendu signé, jamais le brouillon.",
  },
  corrige: {
    term: "Corrigé",
    definition:
      "Compte-rendu de référence d’un exercice de formation, rédigé ou validé par un radiologue, avec les points attendus. Il s’affiche une fois l’exercice signé, quand il existe.",
  },
  numeroOrdre: {
    term: "Numéro d’ordre",
    definition:
      "Numéro d’inscription du radiologue à l’Ordre des médecins. Il figure dans le dossier que l’équipe IMAFRIK examine, et s’imprime sous sa signature.",
  },
  rattachement: {
    term: "Rattachement",
    definition:
      "Lien entre un compte et une organisation, avec un rôle. Un compte rattaché à aucune organisation ne voit aucun examen.",
  },
  responsable: {
    term: "Responsable",
    definition:
      "Membre d’une clinique : il envoie ses examens, les attribue à ses radiologues, partage les antériorités et gère l’équipe, dont il invite et retire responsables et radiologues. Une clinique en garde toujours un : le dernier ne peut pas être retiré.",
  },
  cachet: {
    term: "Cachet",
    definition:
      "Image du cachet du radiologue, déposée par lui et vérifiée par l’équipe IMAFRIK avant d’être imprimée au pied de ses comptes-rendus. Facultative.",
  },
  certificat: {
    term: "Certificat",
    definition:
      "Pièce d’identité numérique d’une passerelle, valable 90 jours et renouvelée par le poste lui-même. La clé qui l’accompagne naît sur le poste et ne le quitte jamais.",
  },
  codeEnrolement: {
    term: "Code d’enrôlement",
    definition:
      "Code à usage unique, valable 15 minutes, émis par l’équipe IMAFRIK pour raccorder le poste d’une clinique. Il se saisit dans le kit d’installation et remplace tout fichier de clés.",
  },
  codePersonnel: {
    term: "Code personnel",
    definition:
      "Code à six chiffres propre au radiologue, demandé à chaque signature et à chaque addendum. Cinq erreurs de suite le verrouillent quinze minutes. Personne d’autre ne le connaît, pas même l’équipe IMAFRIK.",
  },
  codeVerification: {
    term: "Code de vérification",
    definition:
      "Code imprimé sur chaque compte-rendu PDF. Un patient ou un confrère peut le saisir sur imafrik.tech pour s’assurer que le document est authentique.",
  },
  compteRendu: {
    term: "Compte-rendu",
    definition:
      "Document médical rédigé et signé par le radiologue à la lecture d’un examen. Une fois signé, il est transmis à la clinique et ne se modifie plus : il se complète par un addendum.",
  },
  confiancePacs: {
    term: "Confiance du PACS",
    definition:
      "Liste des certificats et des AE Title que le PACS d’IMAFRIK accepte. Elle est écrite par la tâche d’hôte à partir des décisions prises dans la tour de contrôle, jamais à la main.",
  },
  contratService: {
    term: "Contrat de service",
    definition:
      "Lien entre une clinique et un groupe de radiologie. Il autorise les radiologues du groupe à lire les examens de la clinique quand elle est ouverte au pool.",
  },
  delaiPromis: {
    term: "Délai promis",
    definition:
      "Temps entre la réception d’un examen et la signature de son compte-rendu auquel IMAFRIK s’engage : 30 minutes pour une urgence et 2 heures en routine, sauf réglage contraire de l’équipe.",
  },
  delaiMedian: {
    term: "Délai médian",
    definition:
      "Délai en deçà duquel la moitié des examens est rendue. Contrairement à la moyenne, qu’un seul examen très long tire vers le haut, il ne se laisse pas déformer par un cas exceptionnel.",
  },
  centile90: {
    term: "90e centile",
    definition:
      "Délai en deçà duquel neuf examens sur dix sont rendus : il montre les attentes les plus longues sans s’arrêter au seul pire cas.",
  },
  dicom: {
    term: "DICOM",
    definition:
      "Format et protocole standard des images médicales. Les appareils de la clinique envoient leurs examens en DICOM à la passerelle, qui les transmet au PACS d’IMAFRIK.",
  },
  doubleAuthentification: {
    term: "Double authentification",
    definition:
      "Second contrôle à la connexion : un code à six chiffres affiché par une application d’authentification sur votre téléphone. Obligatoire pour tous les comptes.",
  },
  empreinte: {
    term: "Empreinte",
    definition:
      "Suite de 64 caractères calculée à partir d’un fichier (SHA-256) : un seul octet modifié la change entièrement. Comparer l’empreinte du kit sur le poste à celle de la tour de contrôle prouve qu’il est intact.",
  },
  engagement: {
    term: "Engagements",
    definition:
      "Le contrat du radiologue et la convention de l’établissement, acceptés en ligne, datés et conservés. Le contrat interdit au radiologue de sortir de la plateforme les images ou les données d’un examen : ni capture, ni photo de l’écran, ni impression, ni copie. Les paramètres montrent la version acceptée.",
  },
  examen: {
    term: "Examen",
    definition:
      "Ensemble des images d’un patient prises lors d’un même passage (une radiographie, un scanner, une IRM), envoyé par la clinique pour être lu. Il compte souvent plusieurs séries.",
  },
  exercice: {
    term: "Exercice",
    definition:
      "Cas de l’espace de formation, lu comme un vrai examen mais sans patient réel ni valeur médicale. Son compte-rendu se compare à un corrigé relu par un radiologue.",
  },
  forfaitTechnique: {
    term: "Forfait technique",
    definition:
      "Somme facturée par IMAFRIK à la clinique pour chaque acte, selon son type d’examen, au tarif normal ou urgent. Elle est distincte de l’honoraire du radiologue.",
  },
  groupe: {
    term: "Groupe de radiologie",
    definition:
      "Organisation qui réunit des radiologues. Lié à des cliniques par des contrats de service, il lit les examens qu’elles ouvrent au pool.",
  },
  habilitation: {
    term: "Habilitation",
    definition:
      "Vérification, par l’équipe IMAFRIK, du droit d’exercer d’un radiologue, sur la base de son justificatif. Sans habilitation en cours de validité, il ne voit aucun examen.",
  },
  horsGrille: {
    term: "Hors grille",
    definition:
      "Acte d’une modalité absente de la grille des forfaits techniques, comme l’échographie ou la mammographie : il est compté, sans forfait facturé.",
  },
  honoraire: {
    term: "Honoraire",
    definition:
      "Rémunération du radiologue pour la lecture d’un examen. Son montant se fixe entre la clinique et le radiologue et lui revient en totalité : IMAFRIK n’y prélève aucune commission.",
  },
  idee: {
    term: "Idée (Vos idées)",
    definition:
      "Piste d’amélioration d’IMAFRIK proposée par un radiologue ou un responsable de clinique : un titre, une description, une catégorie. L’équipe IMAFRIK la lit et y répond. Elle ne contient jamais l’identité d’un patient.",
  },
  etatIdee: {
    term: "État d’une idée",
    definition:
      "Où l’équipe IMAFRIK en est : reçue (pas encore lue), à l’étude, prévue (dans une prochaine version), livrée (disponible) ou non retenue (pas pour le moment). L’auteur est prévenu par courriel à chaque changement.",
  },
  regroupement: {
    term: "Regroupement d’idées",
    definition:
      "Deux idées qui demandent la même chose sont regroupées : la seconde est rattachée à l’idée principale et en suit l’état. Son auteur en est prévenu, sans lire l’idée d’un autre.",
  },
  journalAudit: {
    term: "Journal d’audit",
    definition:
      "Registre des gestes sensibles (ouverture d’un examen, signature, changement de droits…), avec leur auteur et leur heure. Il ne peut être ni modifié ni effacé.",
  },
  justificatif: {
    term: "Justificatif",
    definition:
      "Document déposé par le radiologue pour prouver son droit d’exercer. L’équipe IMAFRIK l’examine, l’accepte ou le refuse, et fixe sa fin de validité.",
  },
  listeUrgence: {
    term: "Liste d’urgence",
    definition:
      "Radiologues qu’une clinique, ou l’équipe IMAFRIK, autorise à prendre une urgence sans attendre qu’on la leur attribue, dans les modalités qu’ils lisent. Ils sont prévenus par courriel ; le premier qui la prend l’obtient, et elle disparaît chez les autres.",
  },
  decoupeProposee: {
    term: "Découpe proposée",
    definition:
      "Mise en page d’un compte-rendu en cinq rubriques : indication clinique, technique, comparatif, résultats, conclusion. L’indication, les résultats et la conclusion sont obligatoires pour signer. L’autre choix est la feuille blanche.",
  },
  feuilleBlanche: {
    term: "Feuille blanche",
    definition:
      "Mise en page où le radiologue rédige à sa façon (sous-titres, gras, listes), puis une conclusion à part, obligatoire. En-tête, logos, identité, signature, cachet et QR restent automatiques. Le mode de départ se règle dans les paramètres.",
  },
  modele: {
    term: "Modèle",
    definition:
      "Trame de compte-rendu réutilisable (plan, phrases types) qu’un radiologue applique dans l’éditeur au lieu de tout réécrire.",
  },
  modalitesLues: {
    term: "Modalités lues",
    definition:
      "Ce qu’un radiologue lit : radiographie (HSG comprise), mammographie, échographie, scanner, IRM, autres. Réglées par l’équipe IMAFRIK, elles bornent ce qu’on peut lui attribuer, les urgences qu’il voit et les lignes du planning où il peut figurer.",
  },
  moisClos: {
    term: "Mois clos",
    definition:
      "Mois dont l’équipe IMAFRIK a figé la facturation. Son relevé ne change plus, même si une priorité change, si un compte-rendu est annulé ou si une formule est modifiée.",
  },
  organisation: {
    term: "Organisation",
    definition:
      "Une clinique, un groupe de radiologie ou l’équipe IMAFRIK. Un même compte peut appartenir à plusieurs organisations et passer de l’une à l’autre.",
  },
  pacs: {
    term: "PACS",
    definition:
      "Serveur qui reçoit et conserve les images médicales. Celui d’IMAFRIK reçoit les examens envoyés par les passerelles et les affiche dans le viewer.",
  },
  passerelle: {
    term: "Passerelle",
    definition:
      "Logiciel installé sur un poste de la clinique. Il reçoit les images des appareils et les envoie, chiffrées, au PACS d’IMAFRIK. Il s’installe avec le kit d’installation et un code d’enrôlement.",
  },
  planning: {
    term: "Planning d’attribution",
    definition:
      "Lignes fixées par le responsable de la clinique, ou l’équipe IMAFRIK : quel radiologue, quels jours, à quelles heures, pour quelle modalité, chaque semaine ou pour une période. À son arrivée, un examen va d’office au radiologue de la ligne la plus précise qui le couvre ; deux lignes aussi précises le laissent à attribuer.",
  },
  pool: {
    term: "Réseau IMAFRIK (pool)",
    definition:
      "Radiologues des groupes sous contrat avec une clinique ouverte au réseau. L’équipe IMAFRIK leur attribue les examens de cette clinique ; chacun ne voit que ce qui lui est confié.",
  },
  priseEnCharge: {
    term: "Prise en charge",
    definition:
      "Geste par lequel un radiologue commence la lecture d’un examen qui lui est attribué, ou prend une urgence de sa liste d’urgence. Tant qu’il n’a pas signé, il peut le rendre : l’examen redevient « à attribuer ».",
  },
  renseignementClinique: {
    term: "Renseignement clinique",
    definition:
      "Motif de l’examen et informations utiles transmises par la clinique au radiologue : symptômes, antécédents, question posée.",
  },
  regleAttribution: {
    term: "Règle d’attribution",
    definition:
      "Consigne fixée à l’avance par le responsable de la clinique, ou l’équipe IMAFRIK, dans le planning d’attribution. À l’arrivée d’un examen, elle le confie au radiologue prévu s’il peut le lire. Elle ne reprend jamais un examen déjà attribué.",
  },
  reseauPrive: {
    term: "Réseau privé",
    definition:
      "Liaison chiffrée (Tailscale) entre la passerelle d’une clinique et le serveur d’IMAFRIK. Les images ne circulent jamais en clair sur internet.",
  },
  serie: {
    term: "Série",
    definition:
      "Suite d’images acquises d’un même geste au cours d’un examen, par exemple une séquence d’IRM ou une reconstruction de scanner.",
  },
  signature: {
    term: "Signature",
    definition:
      "Validation du compte-rendu par le radiologue, avec son code personnel. Elle fige le texte, produit le PDF et le transmet à la clinique.",
  },
  specimen: {
    term: "Spécimen",
    definition:
      "PDF d’un exercice de formation, marqué comme tel et sans valeur médicale. Il ne porte jamais la signature manuscrite du radiologue.",
  },
  tacheHote: {
    term: "Tâche d’hôte",
    definition:
      "Programme du serveur qui applique au PACS la confiance décidée dans la tour de contrôle, toutes les 15 secondes. Elle refuse d’écrire un état incohérent plutôt que de couper une clinique.",
  },
  urgence: {
    term: "Urgence",
    definition:
      "Examen signalé urgent par la clinique. Son échéance est plus proche que celle d’un examen de routine, ce qui le fait remonter dans la file, et son compte-rendu doit être signé dans le délai promis pour les urgences.",
  },
  urgenceNonPrise: {
    term: "Urgence non prise",
    definition:
      "Urgence qu’aucun radiologue n’a commencé à lire 10 minutes après son signalement, attribuée ou non. Les responsables de la clinique et l’équipe IMAFRIK sont prévenus par courriel, une seule fois, et la tour de contrôle l’affiche en rouge.",
  },
  viewer: {
    term: "Viewer (visionneuse)",
    definition:
      "Outil d’affichage des images médicales intégré à IMAFRIK : défilement des coupes, fenêtrage, mesures et reconstructions. Sur ordinateur, l’examen peut aussi s’ouvrir dans Weasis.",
  },
  depot: {
    term: "Dépôt d’images",
    definition:
      "Envoi d’une archive ZIP d’images depuis le navigateur, par le responsable d’une clinique ou par l’équipe IMAFRIK en son nom. L’archive est contrôlée, puis ses images entrent sur la plateforme au nom de la clinique, comme celles de sa passerelle : l’examen arrive « à attribuer ». Chaque dépôt a son compte rendu et figure au journal d’audit.",
  },
  archiveZip: {
    term: "Archive ZIP",
    definition:
      "Fichier qui regroupe et compresse un dossier, ici l’export DICOM d’un ou plusieurs examens. Sous Windows : clic droit sur le dossier, « Envoyer vers », « Dossier compressé ». 2 Go et 10 000 fichiers au plus, sans mot de passe.",
  },
  repriseEnvoi: {
    term: "Reprise de l’envoi",
    definition:
      "Après une coupure du réseau, l’envoi d’une archive reprend seul, là où il s’était arrêté, sans renvoyer ce qui est déjà arrivé. Page fermée, il reprend quand on choisit de nouveau le même fichier, dans les 72 heures, même depuis un autre poste.",
  },
  fichierIgnore: {
    term: "Fichier ignoré",
    definition:
      "Fichier d’une archive déposée qui n’est pas entré sur la plateforme : document, image ordinaire, sommaire de CD, fichier chiffré ou corrompu, examen d’une autre clinique. Le compte rendu du dépôt le nomme, avec sa raison.",
  },
  doublon: {
    term: "Doublon",
    definition:
      "Image présente deux fois dans une archive, ou déjà reçue par IMAFRIK (même identifiant d’image DICOM) : elle n’est envoyée et comptée qu’une fois.",
  },
  weasis: {
    term: "Weasis",
    definition:
      "Visualiseur DICOM libre (Hôpitaux universitaires de Genève), installé sur l’ordinateur, proposé à côté du viewer pour ses reconstructions (MPR, MIP, MinIP). Il s’ouvre depuis l’écran de lecture, dans un profil IMAFRIK sans import, export, envoi ni enregistrement d’image, avec le même accès que le viewer : les seules images de cet examen, ouverture tracée. Il garde les images sur le poste jusqu’à sa fermeture : le contrat d’exercice demande de le fermer après chaque lecture, sur un poste à session personnelle et disque chiffré.",
  },
  mpr: {
    term: "MPR, MIP, MinIP",
    definition:
      "Reconstructions d’un examen en coupes : MPR, le volume recoupé dans les trois plans (axial, coronal, sagittal) ; MIP et MinIP, la projection de l’intensité maximale ou minimale d’une épaisseur choisie, pour les vaisseaux ou les voies aériennes.",
  },
};
