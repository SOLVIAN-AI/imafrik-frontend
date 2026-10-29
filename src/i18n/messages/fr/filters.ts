/**
 * Filtres des listes : la barre commune, ses dimensions et ses nombres
 * (`components/filters`, `lib/filters`).
 */
export const filters = {
  /** Nom de la barre, pour les lecteurs d'écran. */
  bar: "Filtres",
  clear: "Effacer les filtres",
  clinic: "Clinique",
  allClinics: "Toutes les cliniques",
  clinicSearch: "Rechercher une clinique",
  clinicNoMatch: "Aucune clinique ne correspond.",
  clinicMatches: (count: number) =>
    count === 0
      ? "Aucune clinique"
      : count > 1
        ? `${count} cliniques`
        : "1 clinique",
  kind: "Nature",
  allKinds: "Toutes les natures",
  kinds: { clinic: "Cliniques", radiology_group: "Groupes de radiologie" },
  standing: "Statut",
  allStandings: "Tous les statuts",
  standings: { active: "Actives", suspended: "Suspendues" },
  link: "Raccordement",
  allLinks: "Tous les raccordements",
  links: {
    connected: "PACS raccordé",
    not_connected: "Non raccordée",
    silent: "Silencieuse depuis 24 h",
  },
  author: "Auteur",
  allAuthors: "Tous les auteurs",
  authorSearch: "Rechercher un auteur",
  authorNoMatch: "Aucun auteur ne correspond.",
  authorMatches: (count: number) =>
    count === 0 ? "Aucun auteur" : count > 1 ? `${count} auteurs` : "1 auteur",
  family: "Famille",
  allFamilies: "Toutes les familles",
  action: "Action",
  actionSearch: "Rechercher une action",
  actionNoMatch: "Aucune action ne correspond.",
  actionMatches: (count: number) =>
    count === 0 ? "Aucune action" : count > 1 ? `${count} actions` : "1 action",
  allRequesters: "Tous les demandeurs",
  requestSearch: "Rechercher une demande",
  requestSearchPlaceholder: "Nom, adresse, établissement…",
  stage: "Étape",
  allStages: "Toutes les étapes",
  organization: "Organisation",
  allOrganizations: "Toutes les organisations",
  organizationSearch: "Rechercher une organisation",
  organizationNoMatch: "Aucune organisation ne correspond.",
  organizationMatches: (count: number) =>
    count === 0
      ? "Aucune organisation"
      : count > 1
        ? `${count} organisations`
        : "1 organisation",
  role: "Rôle",
  allRoles: "Tous les rôles",
  account: "Compte",
  allAccounts: "Tous les comptes",
  /** Passerelles silencieuses : aucun signe de vie depuis trente minutes. */
  mute: "Muettes",
  /** Relevés de cliniques sans formule d'abonnement renseignée. */
  noPlan: "Sans formule",
  mfa: "Double authentification",
  withoutMfa: "Sans double authentification",
  radiologist: "Radiologue",
  allRadiologists: "Tous les radiologues",
  radiologistSearch: "Rechercher un radiologue",
  radiologistNoMatch: "Aucun radiologue ne correspond.",
  radiologistMatches: (count: number) =>
    count === 0
      ? "Aucun radiologue"
      : count > 1
        ? `${count} radiologues`
        : "1 radiologue",
  state: "État",
  allStates: "Tous les états",
  /** États d'un examen, dans une liste. */
  states: {
    to_assign: "À attribuer",
    reading: "En lecture",
    ready: "Prêt",
    delivered: "Remis",
  },
  period: "Période",
  allDates: "Toutes les dates",
  /** Périodes, par date de réception. */
  periods: {
    "1": "24 h",
    "7": "7 jours",
    "30": "30 jours",
    "90": "90 jours",
    "365": "12 mois",
  },
  modality: "Modalité",
  allModalities: "Toutes les modalités",
  urgency: "Urgence",
  allPriorities: "Toutes les priorités",
  urgent: "Urgences",
  origin: "Origine",
  allOrigins: "Toutes les origines",
  /** Origine d'un modèle de compte-rendu. */
  origins: { imafrik: "IMAFRIK", organization: "Organisation" },
  task: "Tâche",
  allTasks: "Toutes les tâches",
  /** Radiologues qui prennent une urgence sans attribution. */
  urgentList: "Liste d’urgence",
  onUrgentList: "Sur la liste d’urgence",
  allMembers: "Tous les membres",
  failures: "Échecs",
  allRuns: "Toutes les exécutions",
  failuresOnly: "Échecs seulement",
  memberSearch: "Rechercher un membre",
  memberSearchPlaceholder: "Nom, adresse électronique…",
  /** Ce que comptent les options et la liste, en toutes lettres. */
  nouns: {
    entries: (count: number) =>
      count > 1 ? `${count} entrées` : `${count} entrée`,
    requests: (count: number) =>
      count > 1 ? `${count} demandes` : `${count} demande`,
    gateways: (count: number) =>
      count > 1 ? `${count} passerelles` : `${count} passerelle`,
    statements: (count: number) =>
      count > 1 ? `${count} relevés` : `${count} relevé`,
    accounts: (count: number) =>
      count > 1 ? `${count} comptes` : `${count} compte`,
    studies: (count: number) =>
      count > 1 ? `${count} examens` : `${count} examen`,
    reports: (count: number) =>
      count > 1 ? `${count} comptes-rendus` : `${count} compte-rendu`,
    organizations: (count: number) =>
      count > 1 ? `${count} organisations` : `${count} organisation`,
    members: (count: number) =>
      count > 1 ? `${count} membres` : `${count} membre`,
    templates: (count: number) =>
      count > 1 ? `${count} modèles` : `${count} modèle`,
    cases: (count: number) => `${count} cas`,
    runs: (count: number) =>
      count > 1 ? `${count} exécutions` : `${count} exécution`,
  },
  /** Liste vide à cause des filtres. */
  empty: {
    entries: "Aucune entrée ne correspond à ces filtres",
    requests: "Aucune demande ne correspond à ces filtres",
    gateways: "Aucune passerelle ne correspond à ces filtres",
    statements: "Aucun relevé ne correspond à ces filtres",
    studies: "Aucun examen ne correspond à ces filtres",
    reports: "Aucun compte-rendu ne correspond à ces filtres",
    accounts: "Aucun compte ne correspond à ces filtres",
    organizations: "Aucune organisation ne correspond à ces filtres",
    members: "Aucun membre ne correspond à ces filtres",
    templates: "Aucun modèle ne correspond à ces filtres",
    cases: "Aucun cas ne correspond à ces filtres",
    runs: "Aucune exécution ne correspond à ces filtres",
    detail: (filters: string) =>
      `Filtres retenus : ${filters}. Effacez-en un pour élargir la liste.`,
    /** Liste vide à cause de la recherche seule. */
    searchTitle: "Aucun résultat pour cette recherche",
    searchDetail: "Vérifiez l’orthographe, ou cherchez par un autre mot.",
  },
};
