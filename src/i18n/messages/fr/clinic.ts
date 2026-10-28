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
      toAssign: "À attribuer",
      toAssignHint: "aucun radiologue ne les voit encore",
      urgentWaiting: (count: number) =>
        count > 1
          ? `dont ${count} urgences, ouvertes à votre liste d’urgence`
          : "dont 1 urgence, ouverte à votre liste d’urgence",
      sent: "Envoyés sur 30 jours",
      inReading: "En cours de lecture",
      reportsReady: "Comptes-rendus prêts",
      toDownload: "à télécharger",
      medianTurnaround: "Délai médian sur 30 jours",
      turnaroundHint: "de la réception à la signature",
    },
    readyTitle: "Comptes-rendus à télécharger",
    readyEmpty: "Aucun compte-rendu en attente de récupération.",
    readyNote:
      "Chaque PDF porte un code de vérification que votre patient ou un confrère peut contrôler sur imafrik.tech. Chaque téléchargement est tracé.",
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
    columns: {
      patient: "Patient",
      study: "Examen",
      status: "Statut",
      sent: "Envoyé",
      report: "Compte-rendu",
    },
    pending: "En attente",
  },
  /** Fiche d'un examen. */
  study: {
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
    /** Urgence et renseignement clinique, complétés par la clinique. */
    clinical: {
      title: "Urgence et renseignement clinique",
      urgentLabel: "Examen urgent",
      urgentDetail:
        "Lu en priorité, dans le délai promis pour les urgences. À réserver aux situations qui ne peuvent pas attendre.",
      urgentUnsaved:
        "Pas encore transmise : enregistrez pour signaler l’urgence au radiologue.",
      urgentRemovalUnsaved:
        "Pas encore transmis : enregistrez pour retirer l’urgence.",
      infoLabel: "Renseignement clinique",
      infoHint:
        "Contexte et question posée au radiologue. Il les retrouve dans son écran de lecture et peut les reprendre dans l’indication.",
      infoPlaceholder:
        "Ex. : céphalées brutales depuis deux heures, déficit moteur gauche. Suspicion d’AVC.",
      save: "Enregistrer",
      saved: "Examen mis à jour.",
      lockedNote: "Modifiable jusqu’à la signature du compte-rendu.",
      tooLong: (max: string) =>
        `Le renseignement clinique ne peut dépasser ${max} caractères.`,
      demoAction: "L’enregistrement de l’urgence et du renseignement clinique",
    },
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
    soleManager:
      "Vous êtes le seul responsable de la clinique : invitez-en un second, qui prendra le relais en votre absence. Le dernier responsable ne peut pas être retiré.",
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
    /** Rappel quand le rôle choisi est celui de radiologue. */
    radiologistNote:
      "Un radiologue n’accède aux examens qu’après la vérification de son numéro d’ordre par l’équipe IMAFRIK. Il le renseigne lui-même à sa première connexion.",
    /** Rappel quand le rôle choisi est celui de responsable. */
    managerNote:
      "Un responsable envoie les examens, les confie aux radiologues de la clinique et gère l’équipe : il invite et retire responsables et radiologues.",
    added: (name: string, organization: string) =>
      `${name} a été ajouté(e) à ${organization}.`,
  },
  /** Comptes-rendus signés : liste et document. */
  reports: {
    title: "Comptes-rendus",
    descriptionClinic: "Documents signés et transmis à votre établissement",
    descriptionRadiologist: "Les comptes-rendus que vous avez signés",
    /** Équipe IMAFRIK : tous les comptes-rendus de la plateforme. */
    descriptionAdmin: (count: number) =>
      `${count} compte${count > 1 ? "s" : ""}-rendu${count > 1 ? "s" : ""}, toutes cliniques confondues, en cours de rédaction compris`,
    filter: "État des comptes-rendus",
    filters: {
      all: "Tous",
      draft: "En cours de rédaction",
      signed: "Signés",
      delivered: "Remis",
    },
    draftBy: (name: string) => `En rédaction · ${name}`,
    emptyAdmin:
      "Les comptes-rendus de toutes les cliniques apparaissent ici, dès que leur rédaction commence.",
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
  /** Activité et facturation de la clinique, pour son responsable (`/activite`). */
  activity: {
    title: "Activité et facturation",
    month: "Mois",
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    activity: {
      title: "Activité",
      description:
        "Les examens reçus dans le mois, et ce qu’ils sont devenus, même signés après la fin du mois",
      received: "Examens reçus",
      ofWhichUrgent: (count: number) =>
        count > 1 ? `dont ${count} urgences` : `dont ${count} urgence`,
      signed: "Rendus",
      pending: (count: number) =>
        count > 1
          ? `${count} attendent leur compte-rendu`
          : `${count} attend son compte-rendu`,
      median: "Délai médian",
      medianHint: "de la réception au compte-rendu signé",
      withinSla: "Dans les délais promis",
      slaHint: (routine: string, urgent: string) =>
        `${routine} en routine, ${urgent} en urgence`,
      byModality: "Par modalité",
      columns: {
        modality: "Modalité",
        routine: "Routine",
        urgent: "Urgence",
        signed: "Rendus",
        median: "Délai médian",
        withinSla: "Dans les délais",
      },
      emptyTitle: "Aucun examen reçu ce mois-ci",
      emptyDetail:
        "Les examens que la clinique envoie apparaissent ici, mois par mois.",
    },
    /** Les parties de l'écran, en tête. */
    anchors: {
      label: "Sur cette page",
      activity: "Activité",
      performance: "Performances par radiologue",
      billing: "Facturation",
    },
    performance: {
      title: "Performances par radiologue",
      description:
        "Examens reçus dans le mois : délais, délais promis tenus, tendance par rapport au mois précédent. Cliquez sur un intitulé pour trier.",
      emptyTitle: "Aucune activité de radiologue ce mois-ci",
      emptyDetail:
        "Les performances s’affichent dès qu’un examen reçu dans le mois est confié à un radiologue habilité, puis signé.",
      noSigned:
        "Aucun compte-rendu signé ce mois-ci : les délais restent vides jusqu’au premier acte signé. Les examens en cours et rendus sont déjà comptés.",
      legendTitle: "Ce que mesure chaque colonne",
      /** Une phrase par indicateur : info-bulle de l'intitulé et légende. */
      legend: {
        signed:
          "Comptes-rendus signés des examens reçus dans le mois, urgences comprises.",
        median:
          "La moitié des examens est rendue plus vite, de la réception à la signature ; un examen exceptionnellement long ne le déforme pas.",
        mean: "La moyenne des délais de la réception à la signature, qu’un seul examen très long tire vers le haut.",
        p90: "Neuf examens sur dix sont rendus plus vite : il montre les plus longues attentes.",
        withinSla: (routine: string, urgent: string) =>
          `Part signée dans le délai promis à la clinique : ${routine} en routine, ${urgent} en urgence.`,
        pickup:
          "Délai médian entre l’attribution de l’examen et le début de sa lecture.",
        reading:
          "Durée médiane entre le début de la lecture et la signature du compte-rendu.",
        released:
          "Examens rendus par le radiologue avant de les signer (« Rendre l’examen »), dans le mois.",
        urgentClaimed:
          "Urgences prises sans attribution sur la liste d’urgence, dans le mois.",
        open: "À l’instant : examens attribués pas encore commencés, puis examens en lecture.",
        trend:
          "Flèche sous un chiffre : l’écart avec le mois précédent, en vert s’il s’améliore.",
      },
      groups: {
        overall: "Toutes priorités",
        routine: "Routine",
        urgent: "Urgence",
        workflow: "Médianes",
        month: "Dans le mois",
      },
      columns: {
        name: "Radiologue",
        signed: "Actes signés",
        median: "Délai médian",
        withinSla: "Dans les délais",
        routineMedian: "Médian",
        routineMean: "Moyen",
        routineP90: "90e centile",
        routineWithinSla: "Dans les délais",
        urgentMedian: "Médian",
        urgentMean: "Moyen",
        urgentP90: "90e centile",
        urgentWithinSla: "Dans les délais",
        pickup: "Prise en charge",
        reading: "Lecture",
        released: "Rendus sans signature",
        urgentClaimed: "Urgences prises",
        open: "En cours",
      },
      sortBy: (column: string) => `Trier par ${column}`,
      urgentShare: (count: number) =>
        count > 1 ? `dont ${count} urgences` : `dont ${count} urgence`,
      open: (waiting: number, reading: number) =>
        `${waiting} attribué${waiting > 1 ? "s" : ""} non commencé${waiting > 1 ? "s" : ""}, ${reading} en lecture`,
      points: (value: string) => `${value} pt`,
      trend: {
        better: (value: string) =>
          `en amélioration de ${value} sur le mois précédent`,
        worse: (value: string) => `en recul de ${value} sur le mois précédent`,
        same: "stable sur le mois précédent",
      },
    },
    billing: {
      title: "Facturation",
      provisional:
        "Relevé provisoire : il suit l’activité du mois jusqu’à sa clôture par l’équipe IMAFRIK.",
      closedBefore: "Mois clos le ",
      closedAfter: " : ce relevé ne change plus.",
      none: "Aucun relevé pour ce mois : la clinique n’était pas encore en service.",
      noPlan: "Formule non renseignée",
      noPlanDetail:
        "L’équipe IMAFRIK renseigne votre formule d’abonnement. En attendant, ni l’abonnement ni le total ne sont chiffrés.",
      plans: {
        essential: "Formule Essentiel",
        pro: "Formule Pro",
        facility: "Formule Établissement",
      },
      subscription: "Abonnement",
      perMonth: "par mois",
      technicalFees: "Forfaits techniques",
      technicalFeesDetail:
        "Un forfait par examen reçu dans le mois dont le compte-rendu est signé, au tarif normal ou urgent.",
      baseTariff:
        "Chaque acte est compté au tarif de base de sa modalité (radiographie, scanner, IRM) : le classement des examens complexes reste à définir.",
      feeClasses: {
        radiography: "Radiographie",
        complex_radiography: "Radiographie complexe",
        hysterosalpingography: "Hystérosalpingographie",
        ct: "Scanner",
        complex_ct: "Scanner complexe",
        mri: "IRM",
      },
      columns: {
        type: "Type d’examen",
        routine: "Normal",
        urgent: "Urgent",
        amount: "Montant",
      },
      acts: (count: number) => (count > 1 ? `${count} actes` : `${count} acte`),
      unitPrice: (amount: string) => `à ${amount}`,
      urgentActs: (count: number) => `dont ${count} en urgence`,
      noActs: "Aucun acte facturé ce mois-ci.",
      outOfGrid: (list: string) => `Hors grille : ${list}`,
      outOfGridDetail:
        "Modalités absentes de la grille des forfaits : aucun forfait facturé.",
      unreported: (count: number) =>
        count > 1
          ? `${count} examens reçus sans compte-rendu signé : non facturés`
          : `${count} examen reçu sans compte-rendu signé : non facturé`,
      fees: "Honoraires des radiologues",
      feesDetail:
        "Actes signés par chaque radiologue. Le montant de l’honoraire se fixe entre la clinique et le radiologue et lui revient à 100 % : IMAFRIK ne l’encaisse pas.",
      noFees: "Aucun acte signé ce mois-ci.",
      total: "Total HT",
      totalHint: "abonnement et forfaits techniques",
      totalMissing: "non chiffré sans formule",
      amount: (amount: string) => `${amount} FCFA`,
      csvFilename: (month: string) => `imafrik-releve-${month}.csv`,
      csvHeaders: [
        "Mois",
        "Poste",
        "Détail",
        "Actes",
        "Dont urgences",
        "Tarif normal (FCFA HT)",
        "Tarif urgent (FCFA HT)",
        "Montant (FCFA HT)",
      ],
      csv: {
        subscription: "Abonnement",
        technicalFee: "Forfait technique",
        outOfGrid: "Hors grille",
        unreported: "Non facturé",
        unreportedDetail: "Sans compte-rendu signé",
        fees: "Honoraires",
        total: "Total",
      },
    },
  },
};
