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
  /** Ce que comptent les options et la liste, en toutes lettres. */
  nouns: {
    studies: (count: number) =>
      count > 1 ? `${count} examens` : `${count} examen`,
  },
  /** Liste vide à cause des filtres. */
  empty: {
    studies: "Aucun examen ne correspond à ces filtres",
    detail: (filters: string) =>
      `Filtres retenus : ${filters}. Effacez-en un pour élargir la liste.`,
  },
};
