/**
 * Textes de l'attribution des examens, en français : la fenêtre
 * d'attribution et ses antériorités, partagée par le responsable de la
 * clinique et l'équipe IMAFRIK, les modalités lues par un radiologue et
 * la liste d'urgence. Voir `fr/common.ts` pour les conventions.
 */
export const assignment = {
  /** Fenêtre d'attribution d'un examen. */
  dialog: {
    trigger: "Attribuer",
    triggerReassign: "Réattribuer",
    triggerLabel: (patient: string) => `Attribuer l’examen de ${patient}`,
    triggerReassignLabel: (patient: string) =>
      `Réattribuer l’examen de ${patient}`,
    title: "Attribuer l’examen",
    description:
      "Le radiologue choisi le trouve dans « Attribués à vous » ; lui seul le voit et peut le prendre en charge, et il est prévenu par courriel.",
    current: "Titulaire actuel",
    currentSince: "attribué le",
    urgentTaken: "urgence prise sur la liste d’urgence",
    nobody: "Personne : l’examen attend une attribution.",
    candidates: "Radiologues qui peuvent le recevoir",
    candidatesHint: (modality: string) =>
      `Habilités, et lecteurs de la modalité ${modality}.`,
    pool: "Réseau IMAFRIK",
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
    share: "Partager",
    release: "Retirer l’attribution",
    assigned: (name: string) => `Examen attribué à ${name}.`,
    assignedNotNotified: (name: string) =>
      `Examen attribué à ${name}. Le courriel n’est pas parti : prévenez-le directement.`,
    released: "Attribution retirée : l’examen attend une nouvelle attribution.",
    shared: (count: number) =>
      count > 1 ? `${count} antériorités partagées.` : "Antériorité partagée.",
    unshared: "Antériorité retirée.",
    signed: "Compte-rendu signé : l’examen ne s’attribue plus.",
    loading: "Chargement des radiologues…",
  },
  /**
   * Personne ne peut recevoir l'examen : la fenêtre, la fiche et les
   * listes disent pourquoi, et quoi faire. Le bouton « Attribuer » reste.
   */
  blocked: {
    title: "Personne ne peut recevoir cet examen",
    /** Sur la ligne d'une liste. */
    short: "Personne ne peut le recevoir",
    candidates: (count: number) =>
      count > 1 ? `${count} radiologues possibles` : "1 radiologue possible",
    /** Dans une colonne étroite (suivi de « À lire »). */
    compact: "Personne d’éligible",
    candidatesCompact: (count: number) =>
      count > 1 ? `${count} éligibles` : "1 éligible",
    /** Pourquoi, pour l'équipe IMAFRIK (raison du service). */
    reasons: {
      clinic_inactive:
        "La clinique est suspendue : ses examens ne s’attribuent plus.",
      no_reader:
        "Aucun radiologue ne lit cette clinique : elle n’a pas de radiologue à elle, et aucun groupe du réseau n’a de contrat avec elle.",
      not_credentialed:
        "Les radiologues qui lisent cette clinique ne sont pas encore habilités : leur justificatif n’est pas validé.",
      modality_not_read:
        "Aucun radiologue habilité ne lit cette modalité pour cette clinique.",
    },
    modalityNotRead: (group: string) =>
      `Aucun radiologue habilité ne lit « ${group} » pour cette clinique.`,
    /** Raison inconnue (service injoignable), pour l'équipe. */
    unknown:
      "Aucun radiologue habilité, qui lit cette clinique et sa modalité, ne peut le recevoir.",
    /** Pour le responsable : il ne choisit que parmi ses radiologues. */
    clinic: "Aucun de vos radiologues ne peut recevoir cet examen.",
    whatToDo: "Pour pouvoir l’attribuer",
    remedies: {
      reactivate: {
        text: "Réactivez la clinique depuis sa fiche.",
        link: "Fiche de la clinique",
      },
      openToPool: {
        text: "Vérifiez sur sa fiche qu’elle est ouverte au pool, avec un contrat de service actif.",
        link: "Fiche de la clinique",
      },
      attachRadiologist: {
        text: "Ou rattachez-lui un radiologue habilité, depuis « Comptes ».",
        link: "Comptes",
      },
      validateCredentials: {
        text: "Validez le justificatif d’un radiologue qui lit la clinique : il devient habilité.",
        link: "Justificatifs à valider",
      },
      setModalities: {
        text: "Cochez cette modalité pour un radiologue habilité : bouton « Modalités » de sa ligne, dans « Comptes ».",
        link: "Comptes",
      },
      checkTeam: {
        text: "Vérifiez dans « Équipe » que vos radiologues sont validés et lisent cette modalité.",
        link: "Équipe",
      },
      askTeam: {
        text: "Sinon, demandez à l’équipe IMAFRIK de l’attribuer à un radiologue du réseau.",
        link: "",
      },
    },
  },
  /** Antériorités du patient, proposées dans la fenêtre d'attribution. */
  priors: {
    title: "Antériorités du patient",
    hint: "Rien n’est partagé d’office : cochez ce que le radiologue doit voir, images et compte-rendu signé, en lecture seule.",
    forHolder: (name: string) => `Partagées avec ${name}`,
    certain: "Même patient",
    certainHint: "même identifiant patient",
    probable: "Probablement le même patient, à vérifier",
    probableHint: "même nom et même date de naissance, identifiant différent",
    selectAll: "Tout sélectionner",
    none: "Aucun examen antérieur de ce patient dans la clinique.",
    signedReport: "Compte-rendu signé",
    noReport: "Sans compte-rendu signé",
    alreadyShared: "Partagée",
    revoke: "Retirer",
    revokeLabel: (study: string) => `Retirer l’antériorité ${study}`,
    loading: "Recherche des antériorités…",
    identity: (name: string, id: string, birth: string) =>
      [name, id && `ID ${id}`, birth && `né(e) le ${birth}`]
        .filter(Boolean)
        .join(" · "),
  },
  /** Bloc « Attribution » de la fiche d'un examen, côté clinique. */
  sheet: {
    title: "Attribution",
    toAssign: "À attribuer",
    toAssignHint:
      "Aucun radiologue ne voit cet examen tant que vous ne l’avez pas attribué.",
    urgentWaiting:
      "Urgence : visible des radiologues de votre liste d’urgence, le premier qui la prend l’obtient.",
    holder: (name: string) => `Attribué à ${name}`,
    since: "depuis le",
    priorsShared: (count: number) =>
      count === 0
        ? "Aucune antériorité partagée"
        : count > 1
          ? `${count} antériorités partagées`
          : "1 antériorité partagée",
    signedBy: (name: string) => `Lu et signé par ${name}`,
  },
  /** Liste des examens de la clinique. */
  list: {
    all: "Tous",
    toAssign: "À attribuer",
    filterLabel: "Afficher",
    radiologist: "Radiologue",
    unassigned: "À attribuer",
    /** Colonne du bouton « Attribuer ». */
    action: "Attribution",
    /** Onglets des groupes de modalités d'une liste d'examens. */
    modalityLabel: "Modalités",
    allModalities: "Toutes",
    /** Nom accessible d'un onglet : groupe et nombre d'examens. */
    modalityCount: (label: string, count: number) =>
      count > 1 ? `${label}, ${count} examens` : `${label}, ${count} examen`,
  },
  /** Groupes de modalités qu'un radiologue lit. */
  modalities: {
    radiography: "Radiographie",
    mammography: "Mammographie",
    ultrasound: "Échographie",
    ct: "Scanner",
    mri: "IRM",
    other: "Autres",
    all: "Toutes les modalités",
  },
  /** Réglages de lecture d'un radiologue, dans « Équipe ». */
  reading: {
    title: (name: string) => `Lecture de ${name}`,
    description:
      "Sur la liste d’urgence, il peut prendre une urgence sans attendre qu’on la lui confie. Les modalités qu’il lit sont réglées par l’équipe IMAFRIK.",
    trigger: "Liste d’urgence",
    triggerLabel: (name: string) => `Liste d’urgence : ${name}`,
    urgentTitle: (name: string) => `${name} et la liste d’urgence`,
    urgentSaved: (name: string) => `Liste d’urgence de ${name} enregistrée.`,
    /** Bouton libellé des modalités, sur la ligne d'un compte. */
    button: "Modalités",
    buttonLabel: (name: string) => `Modalités lues par ${name}`,
    modalities: "Modalités lues",
    modalitiesHint: "Au moins une. Toutes cochées : il lit tout.",
    urgent: "Liste d’urgence",
    urgentHint:
      "Il est prévenu par courriel quand une urgence attend, et peut la prendre sans attribution. Le premier qui la prend l’obtient.",
    urgentBadge: "Liste d’urgence",
    saved: (name: string) => `Lecture de ${name} enregistrée.`,
    submit: "Enregistrer",
  },
  /** Liste d'urgence d'une clinique, réglée par l'équipe IMAFRIK. */
  urgentReaders: {
    title: "Liste d’urgence",
    description:
      "Radiologues autorisés à prendre une urgence de cette clinique sans attribution, prévenus par courriel à son arrivée. Le premier qui la prend l’obtient.",
    trigger: "Régler la liste d’urgence",
    empty:
      "Aucun radiologue habilité ne peut lire cette clinique : rattachez-en un, ou ouvrez-la au réseau.",
    none: "Personne sur la liste : les urgences attendent une attribution.",
    count: (count: number) =>
      count > 1
        ? `${count} radiologues sur la liste`
        : "1 radiologue sur la liste",
    saved: "Liste d’urgence enregistrée.",
    submit: "Enregistrer",
    loading: "Chargement des radiologues…",
  },
  /**
   * Planning d'attribution d'une clinique : à l'arrivée d'un examen, il
   * l'attribue au radiologue de la ligne la plus précise qui le couvre.
   */
  plan: {
    title: "Planning d’attribution",
    trigger: "Planning d’attribution",
    description: "Qui reçoit les examens de la clinique, à leur arrivée.",
    adminDescription:
      "Qui reçoit les examens de cette clinique à leur arrivée, radiologues du réseau compris.",
    howItWorks:
      "À son arrivée, un examen va d’office au radiologue de la ligne qui le couvre. Si plusieurs lignes le couvrent, la plus précise l’emporte : la modalité, puis la période, puis les heures. Ce que le planning ne couvre pas reste à attribuer, et vous pouvez toujours réattribuer depuis l’examen.",
    timeZone: (zone: string) => `Heures et dates de la clinique (${zone}).`,
    previousWeek: "Semaine précédente",
    nextWeek: "Semaine suivante",
    thisWeek: "Cette semaine",
    followingWeek: "Semaine prochaine",
    weekLabel: (from: string, to: string) => `Semaine du ${from} au ${to}`,
    today: "Aujourd’hui",
    view: "Présentation",
    byRadiologist: "Par radiologue",
    byModality: "Par modalité",
    radiologistColumn: "Radiologue",
    modalityColumn: "Modalité",
    allModalities: "Toutes modalités",
    nobodyThatDay: "Personne de prévu",
    allDay: "Journée",
    hours: (from: string, to: string) => `${from}–${to}`,
    weekly: "Chaque semaine",
    dated: (from: string, to: string) => `Du ${from} au ${to}`,
    conflictBadge: "Conflit",
    conflictInfo:
      "Deux lignes aussi précises l’une que l’autre, pour deux radiologues, se recouvrent : pendant ce temps, le planning ne tranche pas et l’examen reste à attribuer.",
    conflict: (first: string, second: string, days: string) =>
      `${first} et ${second} sont prévus en même temps (${days}), aussi précisément l’un que l’autre : le planning ne tranche pas, un examen arrivé pendant ce temps restera à attribuer. Précisez une modalité, une période ou des heures.`,
    cannotReceive: (name: string) =>
      `${name} ne peut pas encore recevoir d’examen (habilitation ou rattachement) : ses lignes ne comptent pas.`,
    notReading: (name: string, modality: string) =>
      `${name} ne lit pas : ${modality}. Cette ligne ne compte pas ; l’équipe IMAFRIK règle les modalités que lit chaque radiologue.`,
    network: "Réseau IMAFRIK",
    networkLocked:
      "Placé par l’équipe IMAFRIK : vous pouvez retirer sa ligne, pas la modifier.",
    linesTitle: "Lignes de la semaine",
    linesInfo:
      "Les lignes qui valent pendant la semaine affichée : celles de chaque semaine, et celles dont la période la touche.",
    noLines:
      "Aucune ligne cette semaine : les examens arrivent à attribuer, vous les attribuez vous-même.",
    add: "Ajouter une ligne",
    edit: "Modifier",
    editLabel: (line: string) => `Modifier la ligne : ${line}`,
    remove: "Retirer",
    removeLabel: (line: string) => `Retirer la ligne : ${line}`,
    removeTitle: "Retirer cette ligne ?",
    removeDescription: (line: string) =>
      `${line}. Les examens qui arriveront ne lui seront plus attribués par cette ligne ; rien de ce qui est déjà attribué ne change.`,
    removed: "Ligne retirée.",
    updatedBy: (name: string, date: string) => `${name}, le ${date}`,
    copy: "Recopier la semaine précédente",
    copyInfo:
      "Les lignes datées de la semaine précédente sont reprises sur celle-ci. Les lignes de chaque semaine valent déjà.",
    copyNothing: "La semaine précédente n’a aucune ligne datée à recopier.",
    copyTitle: "Remplacer les lignes de cette semaine ?",
    copyDescription: (count: number) =>
      count > 1
        ? `Cette semaine a déjà ${count} lignes datées : elles seront remplacées par celles de la semaine précédente.`
        : "Cette semaine a déjà une ligne datée : elle sera remplacée par celles de la semaine précédente.",
    copyReplace: "Remplacer",
    copied: (copied: number, skipped: number) =>
      [
        copied === 0
          ? "Aucune ligne recopiée : leurs jours sont déjà passés."
          : copied > 1
            ? `${copied} lignes recopiées.`
            : "1 ligne recopiée.",
        skipped > 0 &&
          (skipped > 1
            ? `${skipped} laissées : leur radiologue ne peut plus y figurer, ou est du réseau.`
            : "1 laissée : son radiologue ne peut plus y figurer, ou est du réseau."),
      ]
        .filter(Boolean)
        .join(" "),
    dialogAdd: "Ajouter une ligne",
    dialogEdit: "Modifier la ligne",
    dialogDescription:
      "Un radiologue et des jours ; au besoin une modalité, des heures et une période.",
    radiologist: "Radiologue",
    chooseRadiologist: "Choisir un radiologue",
    modality: "Modalité",
    modalityAll: "Toutes",
    modalityNotRead: (name: string) => `${name} ne lit pas cette modalité.`,
    days: "Jours",
    allWeek: "Toute la semaine",
    workweek: "Du lundi au vendredi",
    dayShort: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    dayNames: [
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche",
    ],
    daysRange: (from: string, to: string) => `${from} à ${to}`,
    hoursLabel: "Heures",
    allDayLong: "Toute la journée",
    from: "De",
    to: "à",
    overnight: "jusqu’au lendemain matin",
    duration: "Durée",
    everyWeek: "Chaque semaine",
    shownWeek: (from: string, to: string) =>
      `Cette semaine seulement, du ${from} au ${to}`,
    period: "Une période",
    periodFrom: "Du",
    periodTo: "Au",
    problems: {
      radiologist: "Choisissez un radiologue.",
      days: "Cochez au moins un jour.",
      hours: "Indiquez une heure de début et une heure de fin.",
      sameHours: "Le début et la fin ne peuvent pas être à la même heure.",
      period: "Indiquez le premier et le dernier jour de la période.",
      periodOrder: "La période finit après avoir commencé.",
      periodTooLong: "Une période dure un an au plus.",
      periodPast: "Cette période est déjà passée.",
      noDayInPeriod: "Aucun des jours choisis ne tombe dans cette période.",
      modalityNotRead: "Ce radiologue ne lit pas cette modalité.",
    },
    submitAdd: "Ajouter",
    submitEdit: "Enregistrer",
    added: "Ligne ajoutée.",
    updated: "Ligne modifiée.",
    noRadiologists:
      "Aucun radiologue dans votre équipe : invitez-en un depuis « Équipe » pour composer le planning.",
    noRadiologistsAdmin:
      "Aucun radiologue ne peut lire cette clinique : rattachez-en un, ou ouvrez-la au réseau.",
    back: "Équipe",
    summary: (weekly: number, dated: number) =>
      weekly === 0 && dated === 0
        ? "Aucune ligne : les examens arrivent à attribuer."
        : [
            weekly > 0 &&
              `${weekly} ligne${weekly > 1 ? "s" : ""} chaque semaine`,
            dated > 0 &&
              `${dated} ligne${dated > 1 ? "s" : ""} datée${dated > 1 ? "s" : ""}`,
          ]
            .filter(Boolean)
            .join(" · "),
    /** Ce que le planning a décidé pour un examen, à son arrivée. */
    trace: {
      byPlanning: "Attribué par le planning",
      assignedBy: (line: string) => `Attribué par le planning : ${line}`,
      ruleApplied: (line: string) => `Règle appliquée : ${line}`,
      conflict: (names: string) => `Conflit du planning : ${names}`,
      ineligible: "Prévu au planning, sans pouvoir le recevoir",
      uncovered: "Hors planning",
      conflictLong: (names: string) =>
        `Le planning ne l’a pas attribué : ${names} sont prévus aussi précisément l’un que l’autre. Attribuez-le, et précisez le planning.`,
      ineligibleLong:
        "Le planning ne l’a pas attribué : le radiologue prévu ne pouvait pas le recevoir (habilitation, modalité lue). Attribuez-le à un autre.",
      uncoveredLong:
        "Le planning ne l’a pas attribué : aucune ligne ne couvrait son arrivée. Attribuez-le vous-même.",
    },
    /** Règle qui a confié un examen d'office, nommée sur sa fiche. */
    byRule: {
      modality: "radiologue de la modalité",
      schedule: "planning d’attribution",
    },
    assignedBy: (rule: string) => `Attribué par la règle : ${rule}`,
  },
  demoAction: "L’attribution des examens",
};
