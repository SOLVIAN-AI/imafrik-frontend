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
    noCandidatesClinic:
      "Aucun de vos radiologues ne peut recevoir cet examen : vérifiez leurs modalités dans « Équipe », ou demandez à l’équipe IMAFRIK de l’attribuer à un radiologue du réseau.",
    noCandidatesTeam:
      "Aucun radiologue habilité ne peut recevoir cet examen : vérifiez les rattachements, le contrat de service et les modalités.",
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
  demoAction: "L’attribution des examens",
};
