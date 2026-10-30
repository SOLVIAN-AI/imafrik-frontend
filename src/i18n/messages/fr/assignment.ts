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
   * Planning d'attribution d'une clinique : il propose le radiologue de
   * chaque examen à attribuer, une personne confirme.
   */
  plan: {
    title: "Planning d’attribution",
    trigger: "Planning d’attribution",
    description: "Qui est prévu pour lire les examens de la clinique.",
    adminDescription:
      "Qui est prévu pour lire les examens de cette clinique, radiologues du réseau compris.",
    howItWorks:
      "Le planning propose, il n’attribue rien : sur chaque examen à attribuer, le radiologue prévu s’affiche et vous le confirmez d’un geste. Si plusieurs lignes couvrent un examen, la plus précise l’emporte : la modalité, puis la période, puis les heures.",
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
      "Deux lignes aussi précises l’une que l’autre, pour deux radiologues, se recouvrent : pendant ce temps, personne n’est prévu et vous choisissez sur l’examen.",
    conflict: (first: string, second: string, days: string) =>
      `${first} et ${second} sont prévus en même temps (${days}), aussi précisément l’un que l’autre : personne n’est prévu, vous choisirez sur l’examen. Précisez une modalité, une période ou des heures.`,
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
      "Aucune ligne cette semaine : les examens arrivent sans radiologue prévu, vous les attribuez vous-même.",
    add: "Ajouter une ligne",
    edit: "Modifier",
    editLabel: (line: string) => `Modifier la ligne : ${line}`,
    remove: "Retirer",
    removeLabel: (line: string) => `Retirer la ligne : ${line}`,
    removeTitle: "Retirer cette ligne ?",
    removeDescription: (line: string) =>
      `${line}. Les examens qu’elle couvrait n’auront plus ce radiologue de prévu ; rien de ce qui est déjà attribué ne change.`,
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
        ? "Aucune ligne : les examens arrivent sans radiologue prévu."
        : [
            weekly > 0 &&
              `${weekly} ligne${weekly > 1 ? "s" : ""} chaque semaine`,
            dated > 0 &&
              `${dated} ligne${dated > 1 ? "s" : ""} datée${dated > 1 ? "s" : ""}`,
          ]
            .filter(Boolean)
            .join(" · "),
    /** Règle qui avait confié un examen d'office, avant le planning qui propose. */
    byRule: {
      modality: "radiologue de la modalité",
      schedule: "planning de la semaine",
    },
    assignedBy: (rule: string) => `Attribué par la règle : ${rule}`,
  },
  /** Le radiologue que le planning prévoit, sur un examen à attribuer. */
  planned: {
    column: "Prévu",
    info: "Le radiologue que le planning de la clinique prévoit pour cet examen, d’après son heure d’arrivée. Rien n’est attribué tant que personne ne confirme.",
    by: (name: string) => `Prévu : ${name}`,
    conflict: (names: string) => `Le planning hésite : ${names}`,
    confirm: "Confirmer",
    confirmLabel: (patient: string, name: string) =>
      `Confirmer : ${name} pour l’examen de ${patient}`,
    confirmAll: (count: number) => `Tout confirmer (${count})`,
    confirmAllLabel: (count: number) =>
      count > 1
        ? `Tout confirmer (${count}) : les examens de la page à leur radiologue prévu`
        : "Tout confirmer (1) : l’examen de la page à son radiologue prévu",
    confirmAllInfo:
      "Attribue chaque examen de la page qui a un radiologue prévu. Un examen attribué entre-temps, ou dont le planning a changé, est laissé tel quel.",
    confirmed: (count: number) =>
      count > 1
        ? `${count} examens attribués à leur radiologue prévu.`
        : count === 1
          ? "Examen attribué au radiologue prévu."
          : "Aucun examen attribué.",
    left: (count: number) =>
      count > 1
        ? `${count} examens laissés : attribués entre-temps, ou le planning a changé.`
        : "1 examen laissé : attribué entre-temps, ou le planning a changé.",
    dialogBadge: "Prévu",
    dialogHint: (name: string) =>
      `${name} est présélectionné : le planning le prévoit pour cet examen.`,
    dialogConflict: (names: string) =>
      `Le planning prévoit ${names} aussi précisément l’un que l’autre : choisissez.`,
  },
  demoAction: "L’attribution des examens",
};
