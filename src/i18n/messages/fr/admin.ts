/**
 * Textes de la tour de contrôle (`/admin`), en français. Voir
 * `fr/common.ts` pour les conventions.
 *
 * Les données — noms d'organisations et de personnes, adresses, codes,
 * bandeau saisi par l'équipe — ne passent jamais par ici : elles
 * s'affichent telles qu'enregistrées.
 */
export const admin = {
  /** Vocabulaire commun aux écrans de la tour de contrôle. */
  shared: {
    routine: "Routine",
    urgent: "Urgence",
    urgentPlural: "Urgences",
    wholeNetwork: "Tout le réseau",
    filterByClinic: "Filtrer par clinique",
    filter: "Filtre",
    all: "Tous",
    summary: "Synthèse",
    examinations: "Examens",
    receivedStudies: "Examens reçus",
    mostRecentFirst: "Les plus récents en tête",
    medianTurnaround: "Délai médian",
    imagesReceived: "Images reçues",
    volumeReceived: "Volume reçu",
    signedReports: "Comptes-rendus signés",
    ofWhichUrgent: "Dont urgences",
    unassigned: "Non attribué",
    never: "jamais",
    csvExport: "Exporter en CSV",
    /** Ancienneté relative : `age` est déjà formaté (« 3 h »). */
    ago: (age: string) => `il y a ${age}`,
    studyCount: (count: number, shown: string) =>
      `${shown} examen${count > 1 ? "s" : ""}`,
    imageCount: (count: number, shown: string) =>
      `${shown} image${count > 1 ? "s" : ""}`,
  },

  /** Alertes du cockpit. Leur message vient du service, déjà traduit. */
  alerts: {
    label: "Alertes",
    severity: {
      critical: "Critique",
      warning: "Attention",
      info: "Information",
    },
    /** Préfixe lu par les lecteurs d'écran devant le message. */
    severityPrefix: (severity: string) => `${severity} : `,
    allClear:
      "Tout est nominal : délais tenus, passerelles actives, sauvegardes à jour.",
  },

  /** Tâches d'exploitation. */
  ops: {
    labels: {
      backup: "Sauvegarde",
      restore_drill: "Exercice de restauration",
      reconciliation: "Réconciliation PACS",
      host_watch: "Surveillance de l’hôte",
      retention: "Conservation des données",
    },
    /** Ce que garantit chaque tâche, en une phrase. */
    purpose: {
      backup:
        "Copie chiffrée (age) de la base et de l’index du PACS vers R2, chaque nuit.",
      restore_drill:
        "Restauration réelle de la dernière sauvegarde dans une base jetable, chaque semaine : une sauvegarde jamais restaurée n’en est pas une.",
      reconciliation:
        "Rattrape les examens que le PACS a reçus sans que l’application en soit prévenue.",
      host_watch:
        "Disque, conteneurs, certificats HTTPS et DICOM du serveur central.",
      retention:
        "Applique les durées de conservation fixées par contrat : images des examens remis, demandes reçues de plus de trois ans. Chaque purge est tracée.",
    },
    /** Cibles lisibles, par identifiant technique. */
    targets: {
      supabase: "base applicative",
      "orthanc-index": "index du PACS",
    } as Record<string, string>,
    succeeded: "Réussie",
    failed: "En échec",
    neverRun: "jamais exécutée",
    /** Suivi du nom de la commande d'installation, en police à chasse fixe. */
    emptyBefore: "Aucune exécution enregistrée. Les tâches s’installent avec",
    emptyAfter: ".",
  },

  /** Étapes du parcours d'un examen. */
  stages: {
    labels: {
      arrival: "Acheminement",
      transfer: "Transfert",
      queue: "File",
      reading: "Lecture",
      delivery: "Remise",
    },
    details: {
      arrival: "acquisition → dernière image reçue",
      transfer: "première → dernière image",
      queue: "réception → prise en charge",
      reading: "prise en charge → signature",
      delivery: "signature → téléchargement",
    },
    ongoingSuffix: " (en cours)",
    /** « file en cours » : `stage` est le libellé de l'étape. */
    ongoing: (stage: string) => `${stage.toLowerCase()} en cours`,
  },

  /** Graphiques. */
  charts: {
    period: "Période",
    day: "Jour",
    weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    hour: (hour: number) => `${hour}h`,
    /** Graduation de l'axe des heures, dans une colonne étroite. */
    hourTick: (hour: number) => `${hour}h`,
    /** Infobulle d'une barre : période, série, valeur. */
    point: (label: string, serie: string, value: string) =>
      `${label} · ${serie} : ${value}`,
    heatmapCell: (day: string, hour: string, count: number) =>
      `${day} ${hour} : ${count} examen${count > 1 ? "s" : ""}`,
    noData: "Aucune donnée sur la période.",
    ring: (label: string, value: string | null) =>
      `${label} : ${value ?? "aucune donnée"}`,
  },

  /** Paramètres d'adresse et filtres. */
  filters: {
    byAction: "Filtrer par action",
    allActions: "Toutes les actions",
  },

  cockpit: {
    title: "Tour de contrôle",
    description:
      "État de la plateforme à l’instant : files, délais, réseau et exploitation.",
    detailedAnalytics: "Analyses détaillées",
    receivedDescription: "Quatorze derniers jours, par priorité",
    activity: "Activité",
    receivedCaption: "Examens reçus par jour, sur quatorze jours",
    sla: "Délais promis",
    slaDescription: "Examens signés sur trente jours",
    slaRing: (label: string) => `${label} : part rendue dans le délai`,
    promised: (duration: string) => `(promis en ${duration})`,
    median: "Médiane",
    p90: "9 sur 10 sous",
    signed: "Signés",
    network: "Réseau",
    clinicsActive: "Cliniques actives",
    clinicsConnected: "Passerelles raccordées",
    outOf: (total: number) => `sur ${total}`,
    radiologistsActive: "Radiologues actifs",
    newRequests: "Demandes à traiter",
    operations: "Exploitation",
    operationsDescription: "Dernière exécution de chaque tâche",
    system: "Système",
    computedBefore: "Calculé le",
    computedAfter: "(UTC). Rechargez la page pour actualiser.",
    waiting: "En attente de lecture",
    waitingHint: (urgent: number, oldest: string) =>
      `dont ${urgent} urgence${urgent > 1 ? "s" : ""} ; le plus ancien attend depuis ${oldest}`,
    emptyQueue: "file vide",
    overdue: "Hors délai",
    overdueHint: (urgent: number, routine: number) =>
      `${urgent} urgence${urgent > 1 ? "s" : ""} · ${routine} routine`,
    inProgress: "En cours de lecture",
    inProgressHint: "pas encore signés",
    signedToday: "Signés aujourd’hui",
    signedTodayHint: (received: number, delivered: number) =>
      `${received} reçus · ${delivered} remis`,
  },

  activity: {
    description: (scope: string, days: number) =>
      `${scope} · ${days} derniers jours`,
    period: "Période",
    arrivals: "Heures d’arrivée",
    arrivalsDescription:
      "Examens reçus par jour de la semaine et heure (UTC, heure de Lomé)",
    arrivalsCaption: "Examens reçus par jour de la semaine et par heure",
    modalities: "Modalités",
    modalitiesDescription: "Examens reçus · délai médian",
    totals: "Totaux de la période",
    ofReceived: (share: string) => `${share} des reçus`,
    withinSla: "Dans les délais promis",
    withinSlaHint: (urgent: string, routine: string) =>
      `urgence ${urgent} · routine ${routine}`,
    perStudy: (size: string) => `${size} par examen`,
    perWeek: "Par semaine",
    perDay: "Par jour",
    receivedPerWeek: "Examens reçus par semaine",
    receivedPerDay: "Examens reçus par jour",
    median: "Médiane",
    p90: "9 examens sur 10",
    turnaround: "Délai de lecture",
    turnaroundWeekly:
      "De la réception à la signature, en moyenne hebdomadaire des valeurs quotidiennes",
    turnaroundDaily: "De la réception à la signature, par jour",
    turnaroundCaption: "Délai de réception à signature, en minutes",
    routineTarget: (duration: string) => `Promis en routine : ${duration}`,
    journey: "Parcours d’un examen",
    journeyDescription:
      "Durée médiane de chaque étape, la plus longue étant mise en évidence",
    byClinic: "Par clinique",
    byClinicDescription:
      "Le débit est celui de la liaison entre la passerelle et le PACS central",
    noClinic: "Aucune clinique sur la période.",
    columns: {
      clinic: "Clinique",
      received: "Reçus",
      signed: "Signés",
      median: "Délai médian",
      withinSla: "Dans les délais",
      throughput: "Débit",
      volume: "Volume",
      lastSent: "Dernier envoi",
    },
    byRadiologist: "Par radiologue",
    byRadiologistDescription:
      "Délai total (réception → signature) et temps de lecture (prise en charge → signature)",
    noReport: "Aucun compte-rendu signé sur la période.",
    signed: "signés",
    radiologistTimes: (total: string, reading: string) =>
      `délai ${total} · lecture ${reading}`,
  },

  flow: {
    description: (count: number) =>
      `Les ${count} derniers examens reçus, de l’acquisition à la remise du compte-rendu`,
    emptyTitle: "Aucun examen reçu",
    emptyDetail:
      "Les examens apparaissent ici dès que le PACS central les a reçus.",
    medianThroughput: "Débit médian",
    slowestTenth: (rate: string) => `10 % sous ${rate}`,
    medianArrival: "Acheminement médian",
    arrivalHint: "acquisition → dernière image",
    inQueue: "En file",
    inQueueHint: "pas encore pris en charge",
  },

  studies: {
    metaTitle: "Tous les examens",
    urgentDescription: (count: number) =>
      `${count} urgence${count > 1 ? "s" : ""} pas encore rendue${count > 1 ? "s" : ""}`,
    allDescription: (count: number) =>
      `${count} examen${count > 1 ? "s" : ""}, toutes organisations confondues`,
    openUrgent: "Urgences en cours",
    openImages: (patient: string) => `Ouvrir les images de ${patient}`,
    stuck: (count: number) =>
      `${count} examen${count > 1 ? "s" : ""} urgent${count > 1 ? "s" : ""} en attente de prise en charge.`,
    columns: {
      patient: "Patient",
      study: "Examen",
      facility: "Établissement",
      status: "Statut",
      radiologist: "Radiologue",
      uid: "UID",
      waiting: "Attente",
    },
  },

  organisations: {
    clinicCount: (count: number) =>
      `${count} ${count > 1 ? "cliniques" : "clinique"}`,
    groupCount: (count: number) =>
      `${count} ${count > 1 ? "groupes de radiologie" : "groupe de radiologie"}`,
    memberCount: (count: number) =>
      `${count} ${count > 1 ? "membres" : "membre"}`,
    received30d: (count: number) =>
      `${count} ${count > 1 ? "examens" : "examen"} en 30 j`,
    kind: { clinic: "Clinique", radiology_group: "Groupe" },
    lastSent: "Dernier envoi :",
    columns: {
      organisation: "Organisation",
      kind: "Nature",
      pacs: "PACS",
      members: "Membres",
      days30: "30 jours",
      lastSent: "Dernier envoi",
      state: "État",
      actions: "Actions",
    },
    totalStudies: (count: number) => `${count} examens au total`,
    noPacs: "Pas de PACS",
    pacsConnected: "PACS raccordé",
    pacsNotConnected: "PACS non raccordé",
    active: "Active",
    suspended: "Suspendue",
    suspend: "Suspendre",
    reactivate: "Réactiver",
    confirmSuspend: (name: string) =>
      `Suspendre ${name} ? Tous ses membres perdent l’accès immédiatement.`,
    inviteInto: (name: string) => `Inviter dans ${name}`,
  },

  clinic: {
    metaTitle: "Clinique",
    active: "active",
    suspended: "suspendue",
    contractEnded: "contrat terminé",
    openToPool: "ouverte au pool",
    ownRadiologists: "radiologues attitrés",
    backToOrganisations: "Organisations",
    detailedActivity: "Activité détaillée",
    onboarding: "Mise en service",
    stepsDone: (done: number, total: number) =>
      `${done} étape${done > 1 ? "s" : ""} sur ${total}`,
    /** Étapes de la mise en service, par clé du service. */
    steps: {
      created: "Organisation créée",
      connected: "Passerelle raccordée",
      team: "Équipe invitée",
      first_study: "Premier examen reçu",
      first_report: "Premier compte-rendu signé",
      first_delivery: "Premier compte-rendu remis",
    },
    stepDone: " : fait",
    stepNext: " : prochaine étape",
    stepUpcoming: " : à venir",
    pending: "En attente",
    retention: "Conservation des images",
    noLimit: "Sans limite, aucune purge",
    retentionDays: (days: number) => `${days} jours après remise`,
    summary: "Synthèse sur trente jours",
    received30d: "Reçus · 30 jours",
    noStudyReceived: "aucun examen reçu",
    receiptToSignature: "réception → signature",
    throughput: "Débit de réception",
    throughputHint: "médiane par examen",
    overThirtyDays: "sur trente jours",
    lastThirtyDays: "Trente derniers jours",
    receivedCaption: "Examens reçus par jour, sur trente jours",
    withinSla: "Rendus dans les délais",
    recent: "Derniers examens",
    recentDescription: "Du scanner de la clinique au compte-rendu remis",
    fullFlow: "Tout le flux",
    noRecent:
      "Aucun examen reçu. Une fois la passerelle installée, l’examen de test du kit apparaît ici en moins d’une minute.",
  },

  /** Durée de conservation des images d'une clinique. */
  retention: {
    integerDays: "Durée : un nombre entier de jours.",
    confirmPurge: (clinic: string, days: number) =>
      `Purger les images des examens de ${clinic} remis depuis plus de ${days} jours ?\n\n` +
      "La purge commence au prochain passage quotidien et ne se défait pas. " +
      "Les comptes-rendus restent ; la clinique garde ses originaux.",
    saved: "Durée de conservation enregistrée.",
    explanation:
      "Durée prévue au contrat, après la remise du compte-rendu. Au-delà, les images quittent le PACS central ; la fiche de l’examen et le compte-rendu signé restent, et la clinique garde ses originaux. Vide : aucune purge automatique, les images sont conservées sans limite, y compris après la fin du contrat.",
    label: "Conservation des images (jours)",
    purgedHint: (count: number) =>
      `${count} examen${count > 1 ? "s" : ""} déjà purgé${count > 1 ? "s" : ""}. Entre 30 et 7 300 jours.`,
    hint: "Entre 30 et 7 300 jours. Laissez vide pour ne jamais purger les images automatiquement, même après la fin du contrat.",
    noLimit: "Sans limite",
  },

  /** Langue des comptes-rendus d'une clinique. */
  /** Fonctions d'IA d'une organisation : activées une à une, par l'équipe IMAFRIK. */
  aiFeatures: {
    open: (name: string) => `Fonctions d’IA de ${name}`,
    title: "Fonctions d’IA",
    explanation:
      "Une fonction n’est offerte qu’aux radiologues qui travaillent dans cette organisation. Elle ne modifie jamais un compte-rendu et ne bloque jamais une signature. Chaque changement est inscrit au journal d’audit.",
    review: "Relecture avancée avant signature",
    reviewHint:
      "Signale les incohérences entre les sections d’un brouillon. Le texte est envoyé au modèle sans le nom, l’identifiant ni la date de naissance du patient.",
    loadFailed: "Impossible de lire l’état actuel. Réessayez.",
    saved: "Fonctions d’IA enregistrées.",
  },

  clinicLogo: {
    title: "Logo en filigrane",
    none: "Aucun logo",
    since: "Posé",
    explanation:
      "Le logo de la clinique s’imprime en grand, pâle et légèrement flouté, au centre de chaque page du compte-rendu signé, derrière le texte. Les comptes-rendus déjà signés gardent leur logo ; le changement vaut pour les suivants.",
    preview: "Logo actuel de la clinique",
    choose: "Choisir un logo",
    replace: "Remplacer le logo",
    remove: "Retirer le logo",
    formats:
      "PNG, JPEG ou WebP, 2 Mo au plus. Un fond transparent donne le meilleur rendu.",
    saved: "Logo enregistré : il s’imprimera sur les prochains comptes-rendus.",
    removed:
      "Logo retiré : les prochains comptes-rendus n’auront plus de filigrane.",
    tooLarge: "Ce fichier dépasse 2 Mo.",
    badType: "Déposez un PNG, un JPEG ou un WebP.",
    unreadable: "Ce fichier n’a pas pu être lu.",
  },
  reportLanguage: {
    title: "Langue des comptes-rendus",
    explanation:
      "Les intitulés du compte-rendu PDF signé, ses mentions et la page de vérification suivent cette langue. Les comptes-rendus déjà signés ne changent pas. Les radiologues la voient dans l’éditeur.",
    saved: "Langue des comptes-rendus enregistrée.",
  },

  /**
   * Contrat d'une clinique, et sa fin : un geste définitif, confirmé en
   * saisissant le nom de la clinique.
   */
  contract: {
    title: "Contrat",
    underContract: "Sous contrat",
    /** Avant la date de fin, affichée à part. */
    endedOnBefore: "Contrat terminé le ",
    endedOnAfter: "",
    endedDetail:
      "La clinique est suspendue et retirée du pool : ses membres n’ont plus accès à IMAFRIK. Les comptes-rendus signés restent conservés vingt ans et vérifiables par leur QR code. Cette fiche n’est plus qu’en lecture seule.",
    readOnly: "Lecture seule : le contrat de cette clinique est terminé.",
    dangerZone: "Zone de danger",
    endTitle: "Mettre fin au contrat",
    endDescription:
      "Suspend la clinique, la retire du pool et ferme ses contrats de service. Ce geste est définitif.",
    dialogTitle: (clinic: string) => `Mettre fin au contrat de ${clinic}`,
    dialogDescription:
      "Ce geste est définitif et tracé dans le journal d’audit. Il enclenche :",
    consequences: [
      "tous les membres de la clinique perdent l’accès à IMAFRIK, dès leur requête suivante ;",
      "la clinique est retirée du pool et ses contrats de service sont fermés ;",
      "les comptes-rendus signés restent conservés vingt ans et vérifiables par leur QR code ;",
      "les images ne sont pas purgées par la fin du contrat : elles suivent la durée de conservation fixée pour la clinique, et restent sans limite si aucune n’est fixée ;",
      "l’export complet des données est à lancer ensuite sur le serveur, puis à remettre à la clinique par un canal chiffré.",
    ],
    /** Avant le nom de la clinique, affiché à part. */
    confirmBefore: "Pour confirmer, saisissez le nom de la clinique : ",
    confirmLabel: "Nom de la clinique",
    confirmHint: "Majuscules et espaces de bord mis à part, le nom exact.",
    unreportedTitle: (count: number) =>
      count > 1
        ? `${count} examens ne sont pas encore rendus`
        : "1 examen n’est pas encore rendu",
    abandonLabel: "Abandonner ces examens",
    abandonDetail:
      "Ils ne seront pas lus pour cette clinique : les lectures en cours s’arrêtent et leurs brouillons sont effacés.",
    submit: "Mettre fin au contrat",
    done: (clinic: string) => `Contrat de ${clinic} terminé.`,
    abandoned: (count: number) =>
      count > 1
        ? `${count} examens non rendus ont été abandonnés.`
        : "1 examen non rendu a été abandonné.",
    exportTitle: "Export des données de la clinique",
    exportIntro:
      "À lancer maintenant sur le serveur, depuis le poste d’exploitation :",
    copy: "Copier la commande",
    copied: "Commande copiée",
    exportReminder:
      "L’archive contient des données de santé nominatives : remettez-la à la clinique par un canal chiffré, puis effacez-la de la machine qui l’a produite.",
    endedExportReminder:
      "Si l’export n’a pas encore été remis à la clinique, lancez-le sur le serveur, remettez-le par un canal chiffré, puis effacez-le de la machine qui l’a produit.",
  },

  users: {
    accountCount: (count: number) => `${count} compte${count > 1 ? "s" : ""}`,
    withoutMfa: (count: number) =>
      `${count} sans double authentification parmi les rôles sensibles`,
    pendingFilter: "En attente",
    searchLabel: "Rechercher un compte",
    searchPlaceholder: "Nom ou adresse…",
    pendingTitle: "En attente de rattachement",
    allTitle: "Comptes",
    pendingDescription:
      "Inscrits, rattachés à aucune organisation : ils ne voient aucun examen.",
    allDescription:
      "Appartenances, double authentification, dernière connexion",
    noPending: "Aucun compte en attente",
    noneFound: "Aucun compte trouvé",
    tryAnother: "Essayez un autre nom ou une autre adresse.",
    pendingHint:
      "Les radiologues qui s’inscrivent apparaissent ici jusqu’à leur rattachement.",
    unknownEmail: "adresse inconnue",
    unattached: "Rattaché à aucune organisation",
    signedIn: "Connecté",
    neverSignedIn: "Jamais connecté, compte créé le",
    mfaUnknown: "MFA inconnue",
    mfaActive: "MFA active",
    mfaRequired: "Exigée pour les radiologues et les administrateurs",
    mfaMissing: "MFA manquante",
    mfaNone: "Sans MFA",
    /** Filtre et section des radiologues dont le numéro d'ordre attend sa validation. */
    unverifiedFilter: "À valider",
    unverifiedTitle: "Dossiers à examiner",
    unverifiedDescription:
      "Radiologues dont le justificatif attend la décision de l’équipe IMAFRIK : diplôme, attestation d’inscription, ou renouvellement d’une attestation.",
    noUnverified: "Aucun dossier à examiner",
    unverifiedHint:
      "Un radiologue apparaît ici dès qu’il dépose un justificatif, et de nouveau s’il change de nom, de titre ou de numéro d’ordre.",
  },

  /**
   * Validation du numéro d'ordre d'un radiologue par l'équipe IMAFRIK.
   * La vérification elle-même (inscription à l'Ordre, droit d'exercer) se
   * fait hors de la plateforme ; le geste en enregistre le résultat.
   */
  /** Annulation d'un compte-rendu signé par erreur. */
  voidReport: {
    trigger: "Annuler le compte-rendu",
    title: (patient: string) => `Annuler le compte-rendu de ${patient}`,
    description:
      "Réservé à une erreur qu’un addendum ne répare pas : essai signé sur un examen réel, compte-rendu rédigé sur le mauvais examen. Le document est archivé tel quel et retiré ; l’examen revient dans la file pour une vraie lecture ; la vérification publique le dit annulé. Le geste est tracé.",
    reason: "Motif de l’annulation",
    reasonHint:
      "Conservé avec le document annulé, jamais rendu public. 10 caractères au moins.",
    reasonInvalid: "Indiquez un motif de 10 à 500 caractères.",
    submit: "Annuler le compte-rendu",
    done: (patient: string) =>
      `Compte-rendu de ${patient} annulé : l’examen est de nouveau dans la file.`,
    demoAction: "L’annulation d’un compte-rendu",
  },

  credentials: {
    status: {
      verified: "Habilité",
      pending: "À valider",
      expired: "Attestation expirée",
      undeclared: "Dossier incomplet",
      license_missing: "Numéro manquant",
      documents_missing: "Justificatif manquant",
    },
    practice: {
      registered: "Inscrit à l’Ordre",
      resident: "Résident",
    },
    verifiedOn: "Habilité le",
    validUntil: "Attestation valable jusqu’au",
    licenseLabel: "N° d’ordre",
    review: {
      trigger: "Examiner le dossier",
      title: (name: string) => `Dossier de ${name}`,
      description:
        "Ouvrez le justificatif, vérifiez-le, puis acceptez ou refusez. Chaque consultation et chaque décision sont tracées dans le journal d’audit.",
      loading: "Chargement du dossier…",
      noDocument:
        "Aucun justificatif en attente : le radiologue doit d’abord déposer le sien.",
      view: "Ouvrir le document",
      viewFailed: "Le document n’a pas pu être ouvert. Réessayez.",
      self: "Vous ne pouvez pas décider de votre propre habilitation : un autre membre de l’équipe IMAFRIK doit examiner votre dossier.",
      licenseHint:
        "Vérifiez auprès de l’Ordre des médecins que ce numéro est inscrit au nom de cette personne : il sera imprimé sous sa signature.",
      validUntil: "Date de fin lue sur l’attestation",
      validUntilHint:
        "Corrigez-la si elle diffère de celle déclarée. L’accès se ferme le lendemain.",
      /** Fin à moins d'un mois : à confirmer avant d'habiliter. */
      validUntilShort: (days: number) =>
        `L’accès se fermerait ${days === 0 ? "dès demain" : `dans ${days + 1} jours`} : une attestation vaut d’ordinaire une année universitaire.`,
      validUntilShortConfirm: "J’ai vérifié cette date sur l’attestation",
      accept: "Accepter et habiliter",
      accepted: (name: string) =>
        `${name} est habilité : son accès aux examens est ouvert.`,
      reject: "Refuser",
      reason: "Motif du refus",
      reasonHint:
        "Adressé au radiologue, qui le lira dans ses paramètres : dites ce qu’il doit corriger.",
      rejectSubmit: "Refuser ce justificatif",
      rejected: (name: string) =>
        `Justificatif de ${name} refusé : le motif lui est transmis.`,
    },
    revoke: {
      trigger: "Retirer l’habilitation",
      title: (name: string) => `Retirer l’habilitation de ${name}`,
      description:
        "Cette personne perd aussitôt l’accès aux examens. Ceux qu’elle a pris en charge et pas encore signés retournent au pool, et ses brouillons sur ces examens sont effacés. Les comptes-rendus déjà signés ne changent pas.",
      submit: "Retirer l’habilitation",
      done: (name: string, released: number) =>
        released === 0
          ? `Habilitation de ${name} retirée.`
          : `Habilitation de ${name} retirée : ${released} examen${released > 1 ? "s rendus" : " rendu"} au pool.`,
    },
  },

  /** Rattachement d'un compte à une organisation. */
  /** Attribution d'un examen à un radiologue par l'équipe. */
  assign: {
    trigger: "Attribuer",
    triggerLabel: (patient: string) => `Attribuer l’examen de ${patient}`,
    title: "Attribuer l’examen",
    description:
      "Le radiologue choisi le trouve dans « Mes examens » ; lui seul peut le prendre en charge, et il est prévenu par courriel.",
    current: "Titulaire actuel",
    currentSince: "attribué le",
    claimedByRadiologist: "pris en charge par le radiologue",
    nobody: "Personne : l’examen est dans la file commune.",
    candidates: "Radiologues qui verraient cet examen",
    noCandidates:
      "Aucun radiologue habilité ne lit les examens de cette clinique : vérifiez les rattachements et le contrat de service.",
    pool: "Libéral",
    clinicRadiologist: "Radiologue de la clinique",
    load: (count: number) =>
      count === 0
        ? "Aucun examen en cours"
        : `${count} examen${count > 1 ? "s" : ""} en cours`,
    draftWarning: (name: string) =>
      `${name} a commencé à rédiger ce compte-rendu. Son brouillon sera effacé.`,
    confirmDraft: "J’ai compris : effacer le brouillon",
    submit: "Attribuer",
    reassign: "Réattribuer",
    release: "Remettre dans la file",
    assigned: (name: string) => `Examen attribué à ${name}.`,
    assignedNotNotified: (name: string) =>
      `Examen attribué à ${name}. Le courriel n’est pas parti : prévenez-le directement.`,
    released: "Examen remis dans la file commune.",
    signed: "Compte-rendu signé : l’examen ne s’attribue plus.",
    loading: "Chargement des radiologues…",
  },

  grant: {
    trigger: "Rattacher",
    title: (name: string) => `Rattacher ${name}`,
    description:
      "Le compte accède aux examens de l’organisation dès sa prochaine requête. Vérifiez son dossier avant : numéro d’ordre, diplôme, identité.",
    organisation: "Organisation",
    groupSuffix: " (groupe)",
    role: "Rôle",
    submit: "Rattacher",
    done: (name: string, organisation: string | null) =>
      `${name} est rattaché(e) à ${organisation ?? "l’organisation"}.`,
  },

  /**
   * Anonymisation d'un compte : le droit à l'effacement, appliqué tout de
   * suite. Le service fait la même chose, d'office, cinq ans après la fin
   * de la relation.
   */
  anonymize: {
    trigger: "Anonymiser",
    title: "Droit à l’effacement",
    dialogTitle: (name: string) => `Anonymiser le compte de ${name}`,
    dialogDescription:
      "Le geste qui répond à une demande d’effacement. Il est définitif et tracé dans le journal d’audit. Il enclenche :",
    consequences: [
      "le compte de connexion est supprimé : adresse électronique, mot de passe, double authentification et sessions ; la personne ne peut plus se connecter ;",
      "ses examens en cours retournent au pool, et ses brouillons sur ces examens sont effacés ;",
      "si elle a signé un compte-rendu, rédigé un addendum ou laissé une trace au journal d’audit, son nom, son titre et son numéro d’ordre restent attachés à ces documents ; sa signature et ses préférences sont effacées ;",
      "sinon, son profil est supprimé entièrement.",
    ],
    /** Avant le nom du compte, affiché à part. */
    confirmBefore: "Pour confirmer, saisissez le nom du compte : ",
    confirmLabel: "Nom du compte",
    confirmHint: "Majuscules et espaces de bord mis à part, le nom exact.",
    activeTitle: "Ce compte est encore membre d’une organisation active",
    removeLabel: "Retirer ses appartenances",
    removeDetail:
      "La personne perd aussitôt l’accès à toutes ses organisations, et ses jetons de visualisation et de dépôt sont révoqués.",
    submit: "Anonymiser définitivement",
    done: (name: string, kept: boolean) =>
      kept
        ? `Compte de ${name} anonymisé : son identité reste attachée aux documents signés et au journal d’audit.`
        : `Compte de ${name} anonymisé et supprimé.`,
  },

  /** Réinitialisation de la double authentification. */
  mfaReset: {
    confirm: (name: string) =>
      `Réinitialiser la double authentification de ${name} ?\n\n` +
      "Vérifiez d’abord son identité par un autre canal, par exemple en l’appelant à un numéro connu. " +
      "À sa prochaine connexion, il ou elle enrôlera un nouveau téléphone.",
    done: (name: string) => `Double authentification de ${name} réinitialisée.`,
    title: "Téléphone perdu ou changé",
    button: "Réinitialiser",
  },

  requests: {
    description: (count: number, fresh: number) =>
      `${count} demande${count > 1 ? "s" : ""} · ${fresh} à traiter`,
    inviteRadiologist: "Inviter comme radiologue",
    inviteTrackingFailed:
      "Invitation envoyée, mais la demande n’a pas pu passer à « Convertie » : mettez-la à jour à la main.",
    stage: "Étape du suivi",
    allFilter: (count: number) => `Toutes · ${count}`,
    /** Étapes du suivi, au singulier : l'état d'une demande. */
    status: {
      new: "Nouvelle",
      contacted: "Contactée",
      converted: "Convertie",
      dismissed: "Écartée",
    },
    /** Étapes du suivi, au pluriel : les filtres. */
    statusPlural: {
      new: "Nouvelles",
      contacted: "Contactées",
      converted: "Converties",
      dismissed: "Écartées",
    },
    noRequest: "Aucune demande",
    nothingInStage: "Rien dans cette étape",
    emptyDetail:
      "Les demandes envoyées depuis le formulaire de contact du site apparaissent ici.",
    notesLabel: "Notes de l’équipe",
    notesPlaceholder: "Notes : rappel prévu, devis envoyé…",
    saved: "Suivi enregistré.",
    /** Qui écrit : un établissement de santé ou un radiologue. */
    requester: "Demandeur",
    allRequesters: "Tous",
    requesterKind: {
      clinic: "Établissement",
      radiologist: "Radiologue",
    },
    requesterKindPlural: {
      clinic: "Établissements",
      radiologist: "Radiologues",
    },
    /** Numéro d'ordre déclaré par un radiologue, à vérifier. */
    license: "N° d’ordre déclaré",
    licenseMissing: "N° d’ordre non communiqué",
  },

  billing: {
    description: (month: string) =>
      `${month} : actes reçus, par clinique et par modalité`,
    month: "Mois",
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    csvFilename: (month: string) => `imafrik-actes-${month}.csv`,
    csvHeaders: [
      "Mois",
      "Clinique",
      "Modalité",
      "Routine",
      "Urgence",
      "Total",
      "Comptes-rendus signés",
    ],
    totals: "Totaux du mois",
    received: "Actes reçus",
    urgentRate: "facturées au tarif d’urgence",
    unreported: "Sans compte-rendu signé",
    monthInProgress: "le mois est en cours",
    checkBeforeInvoice: "à vérifier avant facture",
    procedures: "Actes",
    emptyTitle: "Aucun acte ce mois-ci",
    emptyDetail: "Les examens reçus apparaissent ici, regroupés par clinique.",
    clinicSummary: (received: string, urgent: string, reported: string) =>
      `${received} actes · ${urgent} urgences · ${reported} comptes-rendus signés`,
    columns: {
      modality: "Modalité",
      routine: "Routine",
      urgent: "Urgence",
      total: "Total",
      signed: "Signés",
    },
    total: "Total",
  },

  system: {
    description: (environment: string, release: string | null) =>
      `Environnement ${environment} · version ${release ?? "inconnue"}`,
    services: "Services",
    operational: "Opérationnels",
    degraded: "Dégradés",
    responding: (ok: number, total: number) => `${ok} sur ${total} répondent`,
    tasksFailing: (count: number) =>
      count > 1
        ? `${count} tâches de sécurité en échec`
        : "1 tâche de sécurité en échec",
    pacs: "PACS central",
    engineVersion: "version du moteur",
    storedStudies: "Examens conservés",
    inPacs: "dans le PACS",
    imageVolume: "Volume d’images",
    onPacsDisk: "sur le disque du PACS",
    dependencies: "Dépendances",
    up: "Répond",
    down: "Ne répond pas",
    safetyNets: "Filets de sécurité",
    safetyNetsDescription: "Dernière exécution de chaque tâche planifiée",
    history: "Historique d’exploitation",
    historyDescription: "Exécutions récentes, toutes tâches confondues",
  },

  audit: {
    description:
      "Chaque geste sensible, horodaté et attribué, en lecture seule",
    olderEntries: "Entrées plus anciennes",
    backToLatest: "Revenir aux plus récentes",
    emptyTitle: "Aucune entrée",
    emptyForAction: "Aucune entrée pour cette action.",
    emptyDetail:
      "Le journal se remplit à mesure que la plateforme est utilisée.",
    system: "Système",
    /**
     * Actions du journal, par code. La liste reprend les actions écrites
     * par le service et par les fonctions de la base ; une action
     * inconnue ici s'affiche telle quelle.
     */
    actions: {
      "study.viewed": "Examen consulté",
      "study.claimed": "Examen pris en charge",
      "study.released": "Examen rendu au pool",
      "study.assigned": "Examen attribué à un radiologue",
      "study.unassigned": "Examen remis dans la file",
      "study.updated": "Urgence ou renseignement clinique modifié",
      "study.images_purged": "Images purgées du PACS",
      "report.signed": "Compte-rendu signé",
      "report.addendum": "Addendum ajouté",
      "report.delivered": "Compte-rendu remis",
      "report.downloaded": "Compte-rendu téléchargé",
      "report.voided": "Compte-rendu annulé",
      "report.ai_reviewed": "Brouillon relu par l’IA",
      "membership.created": "Membre ajouté",
      "membership.removed": "Membre retiré",
      "organization.state_changed": "Organisation activée ou suspendue",
      "organization.pool_changed": "Ouverture au pool modifiée",
      "organization.retention_changed": "Durée de conservation modifiée",
      "organization.report_language_changed":
        "Langue des comptes-rendus modifiée",
      "organization.logo_changed": "Logo des comptes-rendus modifié",
      "organization.contract_ended": "Contrat de la clinique terminé",
      "organization.exported": "Données de l’organisation exportées",
      "organization.ai_features_changed": "Fonctions d’IA activées ou coupées",
      "user.mfa_reset_requested":
        "Réinitialisation de la double authentification demandée",

      "profile.identity_changed": "Nom, titre ou numéro d’ordre modifié",
      "user.mfa_reset": "Double authentification réinitialisée",
      "user.credential_document_uploaded": "Justificatif déposé",
      "user.credential_document_viewed": "Justificatif consulté",
      "user.credentials_verified": "Radiologue habilité",
      "user.credentials_rejected": "Justificatif refusé",
      "user.credentials_revoked": "Habilitation retirée",
      "user.anonymization_requested": "Anonymisation d’un compte demandée",
      "user.anonymized": "Compte anonymisé",
      "platform.settings_changed": "Réglages modifiés",
      "contact_request.tracked": "Demande reçue suivie",
      "agreement.accepted": "Engagement accepté",
    },
  },

  settings: {
    description:
      "S’appliquent à toute la plateforme dès le prochain affichage et sont tracés dans le journal d’audit",
    platform: "Plateforme",
    lastChanged: "Dernière modification le",
    unreadable:
      "Les réglages sont momentanément illisibles : le service ne répond pas. Réessayez dans un instant.",
    operatorOnly: "Depuis le poste d’exploitation",
    operatorOnlyDescription: "Volontairement absents de cet écran",
    /** Gestes réservés au poste d'exploitation, par clé. */
    operatorTasks: {
      clinic: {
        task: "Raccorder une clinique",
        why: "Génère le certificat DICOM TLS et la clé Tailscale à usage unique : des secrets qui ne transitent pas par le web.",
      },
      revoke: {
        task: "Révoquer une passerelle",
        why: "La révocation touche l’autorité de certification, gardée hors ligne.",
      },
      restore: {
        task: "Restaurer une sauvegarde",
        why: "Le déchiffrement exige la clé privée age, conservée hors du web et jamais saisie dans un formulaire.",
      },
      deploy: {
        task: "Déployer une version",
        why: "Chaque déploiement passe par la CI, ses tests et son approbation.",
      },
    },
    saved: "Réglages enregistrés.",
    typedValue: (duration: string) => ` Valeur saisie : ${duration}.`,
    targets: "Délais promis aux cliniques",
    urgentHint: (preview: string) => `Entre 5 et 720 minutes.${preview}`,
    routineHint: (preview: string) => `Entre 15 et 2 880 minutes.${preview}`,
    banner: "Bandeau de maintenance",
    bannerLabel: "Message affiché à tous les utilisateurs",
    bannerHint: (length: number, max: number) =>
      `${length} / ${max} caractères. Laissez vide pour n’afficher aucun bandeau.`,
    bannerPlaceholder:
      "Ex. : Maintenance du PACS dimanche de 2 h à 3 h (heure de Lomé). Les envois reprendront automatiquement.",
    bannerPreview: "Aperçu du bandeau",
  },

  /** Messages des actions serveur : validation et démonstration. */
  validation: {
    urgentInvalid: "Délai d’urgence invalide",
    urgentInteger: "Délai d’urgence : un nombre entier de minutes",
    urgentMin: "Délai d’urgence : 5 minutes au moins",
    urgentMax: "Délai d’urgence : 12 heures au plus",
    routineInvalid: "Délai de routine invalide",
    routineInteger: "Délai de routine : un nombre entier de minutes",
    routineMin: "Délai de routine : 15 minutes au moins",
    routineMax: "Délai de routine : 48 heures au plus",
    bannerMax: "Bandeau : 280 caractères au plus",
    urgentAboveRoutine:
      "Le délai d’urgence ne peut dépasser le délai de routine",
    organisationInvalid: "Organisation invalide",
    notesMax: "Notes : 4 000 caractères au plus",
    retentionInvalid: "Durée invalide",
    retentionInteger: "Durée : un nombre entier de jours",
    retentionMin: "Durée : 30 jours au moins",
    retentionMax: "Durée : 20 ans au plus",
    languageUnknown: "Langue inconnue.",
    stateInvalid: "État invalide.",
    emailInvalid: "Adresse invalide",
    nameRequired: "Le nom est requis",
    confirmNameRequired: "Saisissez le nom de la clinique pour confirmer",
    confirmAccountNameRequired: "Saisissez le nom du compte pour confirmer",
  },
  demoActions: {
    assignment: "L’attribution des examens",
    clinicLogo: "Le logo des comptes-rendus",
    settings: "La modification des réglages",
    grant: "Le rattachement",
    tracking: "Le suivi des demandes",
    mfaReset: "La réinitialisation",
    credentials: "La validation des numéros d’ordre",
    retention: "La durée de conservation",
    reportLanguage: "La langue des comptes-rendus",
    aiFeatures: "L’activation des fonctions d’IA",
    contractEnd: "La fin de contrat",
    anonymize: "L’anonymisation",
    suspension: "La suspension",
    invitation: "L’invitation",
  },

  /**
   * Textes que le service produirait, fabriqués par le jeu de
   * démonstration : alertes, résumés d'exploitation, dépendances.
   */
  demo: {
    alerts: {
      urgentOverdue: (count: number, minutes: number) =>
        `${count} urgence${count > 1 ? "s attendent" : " attend"} depuis plus de ${minutes} min`,
      routineOverdue: (count: number, hours: number) =>
        `${count} examen${count > 1 ? "s dépassent" : " dépasse"} le délai de ${hours} h`,
      clinicSilent: (clinic: string, hours: number) =>
        `${clinic} n’a rien envoyé depuis ${hours} h : passerelle à vérifier`,
      hostWatchFailed: "Surveillance de l’hôte en échec : disque /var à 83 %",
      unverifiedRadiologists: (count: number) =>
        count > 1
          ? `${count} radiologues attendent l’examen de leur justificatif`
          : `${count} radiologue attend l’examen de son justificatif`,
      newRequests: (count: number) =>
        `${count} demande${count > 1 ? "s reçues" : " reçue"} par le site ${count > 1 ? "attendent" : "attend"} une réponse`,
    },
    ops: {
      backupDatabase: "41,3 Mo chiffrés · 18 tables vérifiées",
      backupDatabasePrevious: "41,1 Mo chiffrés · 18 tables vérifiées",
      backupIndex: "3,8 Mo chiffrés",
      restoreDrill: "Restauration conforme : 18 tables, 0 écart",
      reconciliationClean: "0 examen manquant",
      reconciliationCaught: "1 examen rattrapé",
      retention:
        "3 examen(s) purgé(s) du PACS, 0 en échec, 0 demande(s) reçue(s) supprimée(s), 0 compte(s) anonymisé(s), 0 reporté(s)",
      hostWatchFailed: "Disque /var à 83 % (seuil d’alerte : 80 %)",
      hostWatchOk: "Disque /var à 79 %",
    },
    environment: "démonstration",
    services: {
      database: "Base de données",
      pacs: "PACS central",
      storage: "Stockage objet",
      network: "Réseau privé",
    },
    serviceDetails: {
      storage: "R2 · comptes-rendus",
      network: (gateways: number) => `Tailscale · ${gateways} passerelles`,
    },
  },
};
