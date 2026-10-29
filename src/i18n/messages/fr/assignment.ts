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
      "Les modalités qu’il lit bornent ce qu’on peut lui attribuer ; la liste d’urgence lui permet de prendre une urgence sans attendre qu’on la lui confie.",
    trigger: "Modalités et urgences",
    triggerLabel: (name: string) => `Modalités et urgences de ${name}`,
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
   * Règles d'attribution d'une clinique : le radiologue de chaque
   * modalité, puis le planning de la semaine.
   */
  rules: {
    title: "Règles d’attribution",
    trigger: "Règles d’attribution",
    description:
      "Qui reçoit d’office les examens de la clinique, à leur arrivée.",
    adminDescription:
      "Qui reçoit d’office les examens de cette clinique à leur arrivée, radiologues du réseau compris.",
    howItWorks:
      "À l’arrivée d’un examen, le radiologue de sa modalité le reçoit ; sinon, le seul radiologue de garde qui peut le lire. Sinon il reste à attribuer. Une règle ne reprend jamais un examen déjà attribué : vous pouvez toujours réattribuer.",
    modalitiesTitle: "Radiologue par modalité",
    modalitiesHint:
      "Il reçoit tous les examens de cette modalité, à toute heure, s’il peut les lire.",
    nobody: "Personne",
    notReading: (name: string) => `${name} ne lit pas cette modalité`,
    scheduleTitle: "Planning de la semaine",
    scheduleHint: (zone: string) =>
      `Les examens qu’aucun radiologue de modalité ne reçoit vont au radiologue de garde. Heures de la clinique (${zone}).`,
    noSlots:
      "Aucun créneau : en dehors des modalités désignées, les examens restent à attribuer.",
    addSlot: "Ajouter un créneau",
    slotLabel: (index: number) => `Créneau ${index}`,
    radiologist: "Radiologue",
    chooseRadiologist: "Choisir un radiologue",
    days: "Jours",
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
    allDay: "Toute la journée",
    from: "De",
    to: "à",
    overnight: "jusqu’au lendemain matin",
    removeSlot: "Retirer",
    removeSlotLabel: (index: number) => `Retirer le créneau ${index}`,
    problems: {
      radiologist: "Choisissez un radiologue.",
      days: "Cochez au moins un jour.",
      hours: "Indiquez une heure de début et une heure de fin.",
      sameHours: "Le début et la fin ne peuvent pas être à la même heure.",
    },
    overlap: (first: string, second: string, days: string) =>
      `${first} et ${second} sont de garde en même temps (${days}) : un examen que les deux peuvent lire restera à attribuer.`,
    cannotReceive: (name: string) =>
      `${name} ne peut pas encore recevoir d’examen (habilitation ou rattachement) : la règle le passe.`,
    network: "Réseau IMAFRIK",
    submit: "Enregistrer les règles",
    saved: "Règles d’attribution enregistrées.",
    invalid: "Complétez ou retirez les créneaux signalés avant d’enregistrer.",
    noRadiologists:
      "Aucun radiologue dans votre équipe : invitez-en un depuis « Équipe » pour fixer des règles.",
    noRadiologistsAdmin:
      "Aucun radiologue ne peut lire cette clinique : rattachez-en un, ou ouvrez-la au réseau.",
    back: "Équipe",
    summary: (slots: number, modalities: number) =>
      slots === 0 && modalities === 0
        ? "Aucune règle : les examens arrivent à attribuer."
        : [
            modalities > 0 &&
              `${modalities} modalité${modalities > 1 ? "s" : ""} désignée${modalities > 1 ? "s" : ""}`,
            slots > 0 && `${slots} créneau${slots > 1 ? "x" : ""} de garde`,
          ]
            .filter(Boolean)
            .join(" · "),
    /** Règle qui a confié un examen, nommée sur sa fiche. */
    byRule: {
      modality: "radiologue de la modalité",
      schedule: "planning de la semaine",
    },
    assignedBy: (rule: string) => `Attribué par la règle : ${rule}`,
  },
  demoAction: "L’attribution des examens",
};
