/**
 * Portail clinique, en français : tableau de bord, examens, envoi,
 * équipe, et comptes-rendus (écrans partagés avec les radiologues).
 * Voir `fr/common.ts` pour les conventions.
 */
export const clinic = {
  /** Tableau de bord de la clinique. */
  dashboard: {
    title: "Tableau de bord",
    send: "Envoyer un examen",
    metrics: {
      sent: "Envoyés sur 30 jours",
      inReading: "En cours de lecture",
      reportsReady: "Comptes-rendus prêts",
      toDownload: "à télécharger",
      medianTurnaround: "Délai médian sur 30 jours",
      turnaroundHint: "de la réception à la signature",
    },
    readyTitle: "Comptes-rendus à télécharger",
    readyEmpty: "Aucun compte-rendu en attente de récupération.",
    /** Suit la modalité : « IRM Genou, signé par Dr X ». */
    signedBy: (name: string) => `signé par ${name}`,
    recentTitle: "Derniers examens envoyés",
    recentEmpty: "Aucun examen envoyé pour le moment.",
  },
  /** Liste des examens. */
  studies: {
    title: "Examens",
    count: (count: number) =>
      count > 1 ? `${count} examens` : `${count} examen`,
    send: "Envoyer",
    noResult: "Aucun résultat",
    noResultDetail: "Modifiez la recherche pour élargir la liste.",
    empty: "Aucun examen envoyé",
    emptyDetail:
      "Les examens transmis par votre passerelle ou déposés depuis le navigateur apparaissent ici.",
    reportAvailable: "Compte-rendu disponible",
    columns: {
      patient: "Patient",
      study: "Examen",
      status: "Statut",
      slices: "Coupes",
      sent: "Envoyé",
      report: "Compte-rendu",
    },
    available: "Disponible",
    pending: "En attente",
  },
  /** Fiche d'un examen. */
  study: {
    readAndWrite: "Lire et rédiger",
    report: "Compte-rendu",
    signedBy: "Signé par",
    fullDocument: "Document complet",
    reportInProgress: "Le compte-rendu est en cours de rédaction.",
    reportPending:
      "Le compte-rendu sera disponible dès qu’un radiologue aura signé.",
    progress: "Avancement",
    information: "Informations",
    facility: "Établissement",
    clinicalInfo: "Renseignement",
    series: "Séries",
    receivedAt: "Reçu le",
    radiologist: "Radiologue",
    unassigned: "Non attribué",
    studyUid: "UID d’étude",
    images: "Images",
    seriesCount: (count: number) =>
      count > 1 ? `${count} séries` : `${count} série`,
    /**
     * Nombre de coupes.
     *
     * @param count   Nombre, pour l'accord.
     * @param display Nombre déjà formaté dans la langue (séparateur de milliers).
     */
    slices: (count: number, display: string) =>
      count > 1 ? `${display} coupes` : `${display} coupe`,
    openImages: "Ouvrir les images",
    viewerNote: "Les images s’ouvrent dans le viewer, avec un accès tracé.",
  },
  /**
   * Étapes de l'avancement, du point de vue de la clinique : `in_progress`
   * s'y dit « lecture en cours », pas « en cours ».
   */
  timeline: {
    received: {
      title: "Examen reçu",
      detail: "Les images sont arrivées sur la plateforme.",
    },
    assigned: {
      title: "Attribué à un radiologue",
      detail: "Un médecin a pris l’examen en charge.",
    },
    in_progress: {
      title: "Lecture en cours",
      detail: "Le compte-rendu est en cours de rédaction.",
    },
    reported: {
      title: "Compte-rendu signé",
      detail: "Le document est disponible au téléchargement.",
    },
    delivered: {
      title: "Compte-rendu remis",
      detail: "L’établissement a récupéré le document.",
    },
  },
  /** Envoi d'un examen. */
  send: {
    title: "Envoyer un examen",
    description: (organization: string) =>
      `Les images de ${organization} sont chiffrées pendant le transfert`,
    browserUpload: "Dépôt depuis ce navigateur",
    gateway: "Passerelle de l’établissement",
    gatewayText:
      "Si votre établissement est équipé de la passerelle IMAFRIK, vos consoles n’ont rien à faire de plus : chaque examen part automatiquement, chiffré, une minute après la dernière image.",
    lastReceived: "Dernier examen reçu : ",
    noneYet: "aucun pour l’instant",
    /**
     * Encadrent le nom du script de vérification. Le guide est nommé
     * comme dans le paquet de la clinique, qui suit la langue de ses
     * comptes-rendus (`LISEZ-MOI.txt` ou `README.txt`).
     */
    troubleshootBefore: "Un examen envoyé qui n’apparaît pas ? Lancez",
    troubleshootAfter: (guide: string) =>
      `sur le poste de la passerelle, puis consultez le guide remis à l’installation (${guide}).`,
  },
  /** Dépôt d'examens depuis le navigateur. */
  uploader: {
    dropTitle: "Déposez ici les fichiers de l’examen",
    dropDetail:
      "Ou choisissez le dossier entier d’un CD : le sommaire et les fichiers qui ne sont pas des images sont écartés automatiquement.",
    chooseFiles: "Choisir des fichiers",
    chooseFolder: "Choisir un dossier",
    /** « 3 / 5 fichiers traités ». */
    progress: (done: number, total: number) =>
      `${done} / ${total} ${total > 1 ? "fichiers" : "fichier"} ${done > 1 ? "traités" : "traité"}`,
    rejected: (count: number) =>
      `, ${count} ${count > 1 ? "refusés" : "refusé"}`,
    finished: ". L’examen apparaîtra dans le suivi d’ici une minute.",
    waiting: "En attente",
    sending: (percent: number) => `Envoi… ${percent} %`,
    stored: "Envoyé",
    duplicate: "Déjà reçu",
    ignored: "Sommaire du CD, écarté",
    refused: (status: number) => `Refusé (${status})`,
    connectionLost: "Connexion interrompue",
    unavailable: "Dépôt indisponible",
    demoAction: "Le dépôt d’examens",
  },
  /** Écran « Équipe » et actions sur les membres. */
  team: {
    title: "Équipe",
    count: (count: number) =>
      count > 1 ? `${count} membres` : `${count} membre`,
    you: "(vous)",
    roleSince: (role: string, date: string) => `${role} depuis le ${date}`,
    since: (date: string) => `Depuis le ${date}`,
    remove: "Retirer de l’équipe",
    removeConfirm: (name: string) =>
      `Retirer ${name} de l’équipe ? Son accès est coupé immédiatement.`,
    removed: (name: string) => `${name} a été retiré(e) de l’équipe.`,
    actionsFor: (name: string) => `Actions pour ${name}`,
    invalidEmail: "Adresse invalide",
    nameRequired: "Le nom est requis",
    nameTooLong: "Le nom est trop long",
    inviteDemoAction: "L’invitation",
    removeDemoAction: "Le retrait d’un membre",
    poolDemoAction: "Ce réglage",
  },
  /** Modale d'invitation, partagée avec le back-office. */
  invite: {
    button: "Inviter",
    title: (organization: string) => `Inviter dans ${organization}`,
    description:
      "La personne reçoit un lien par courriel et choisit elle-même son mot de passe. Si elle utilise déjà IMAFRIK, elle est simplement ajoutée.",
    fullName: "Nom complet",
    email: "Adresse électronique",
    role: "Rôle",
    submit: "Envoyer l’invitation",
    added: (name: string, organization: string) =>
      `${name} a été ajouté(e) à ${organization}.`,
  },
  /** Comptes-rendus signés : liste et document. */
  reports: {
    title: "Comptes-rendus",
    descriptionClinic: "Documents signés et transmis à votre établissement",
    descriptionRadiologist: "Les comptes-rendus que vous avez signés",
    searchPlaceholder: "Patient, identifiant, modalité…",
    searchLabel: "Rechercher un compte-rendu",
    noResult: "Aucun résultat",
    noResultDetail: "Essayez un autre nom ou un autre identifiant.",
    empty: "Aucun compte-rendu",
    emptyDetail:
      "Les comptes-rendus signés apparaissent ici, avec leur PDF et leur lien de vérification.",
    toDownload: "À télécharger",
    downloaded: "Téléchargé",
    signedBy: "Signé par",
    signatureDate: "Date de signature",
    license: (number: string) => `Ordre n° ${number}`,
    publicVerification: "Vérification publique",
    downloadPdf: "Télécharger le PDF",
  },
};
