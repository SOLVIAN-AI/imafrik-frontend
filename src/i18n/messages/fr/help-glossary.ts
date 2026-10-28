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
      "Examen reçu, compté pour la facture de la clinique au mois de sa réception, par modalité. Une urgence est facturée au tarif d’urgence.",
  },
  consultation: {
    term: "Consultation",
    definition:
      "Accès en lecture seule de l’équipe IMAFRIK aux écrans des radiologues : file, brouillons, comptes-rendus et images. Elle voit tout sans prendre en charge, rédiger ni signer, et chaque ouverture d’examen est tracée.",
  },
  filetSecurite: {
    term: "Filet de sécurité",
    definition:
      "Tâche planifiée qui protège la plateforme : sauvegarde chiffrée, exercice de restauration, réconciliation du PACS, conservation des données, surveillance du serveur. L’écran Système montre sa dernière exécution.",
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
      "Réservation d’un examen à un radiologue précis, par le responsable de la clinique ou, pour les radiologues du réseau, par l’équipe IMAFRIK. Lui seul le voit et peut le prendre en charge ; il en est prévenu par courriel, sans aucune donnée du patient.",
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
      "Le contrat du radiologue et la convention de l’établissement, acceptés en ligne, datés et conservés. Les paramètres montrent la version acceptée.",
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
      "Somme facturée par IMAFRIK à la clinique pour chaque examen, selon son type. Elle est distincte de l’honoraire du radiologue.",
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
  honoraire: {
    term: "Honoraire",
    definition:
      "Rémunération du radiologue pour la lecture d’un examen. Elle lui revient en totalité : IMAFRIK n’y prélève aucune commission.",
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
  modele: {
    term: "Modèle",
    definition:
      "Trame de compte-rendu réutilisable (plan, phrases types) qu’un radiologue applique dans l’éditeur au lieu de tout réécrire.",
  },
  modalitesLues: {
    term: "Modalités lues",
    definition:
      "Ce qu’un radiologue lit : radiographie (HSG comprise), mammographie, échographie, scanner, IRM, autres. Réglées par la clinique pour ses radiologues, ou par l’équipe IMAFRIK, elles bornent ce qu’on peut lui attribuer et les urgences qu’il voit.",
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
  viewer: {
    term: "Viewer (visionneuse)",
    definition:
      "Outil d’affichage des images médicales intégré à IMAFRIK : défilement des coupes, fenêtrage, mesures et reconstructions.",
  },
};
