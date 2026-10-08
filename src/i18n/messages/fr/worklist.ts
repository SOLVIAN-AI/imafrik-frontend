/**
 * Textes de la zone « worklist », en français : file de lecture du
 * radiologue, examens qu'il a pris en charge, barre de recherche et
 * filtres des listes d'examens. Voir `fr/common.ts` pour les conventions.
 */
export const worklist = {
  /** Périmètre de la file, sous le titre. */
  scope: {
    empty: "File de travail du groupe",
    clinics: (list: string) => `File de travail du groupe : ${list}`,
    count: (count: number) =>
      `File de travail du groupe : ${count} établissements`,
  },
  metrics: {
    toTake: "À prendre",
    mineHint: (count: number) => `et ${count} chez vous`,
    urgentOpen: "Urgences libres",
    urgentHint: "à prendre d’abord",
    overdue: "En retard",
    overdueHint: "délai dépassé",
    nextDeadline: "Prochaine échéance",
  },
  /** Alertes à l'arrivée d'une urgence libre. */
  arrivals: {
    many: (count: number) => `${count} nouvelles urgences dans la file`,
    one: (study: string) => `Nouvelle urgence : ${study}`,
  },
  truncated:
    "La file compte plus d’examens que l’écran n’en affiche : seuls les plus proches de leur échéance sont listés. Affinez avec la recherche ou les filtres.",
  /** Sections de la file. */
  groups: {
    mine: { title: "Pris en charge par vous", hint: "à terminer" },
    open: { title: "À prendre", hint: "par ordre d’échéance" },
    colleagues: {
      title: "Chez un confrère",
      hint: "consultation seulement",
    },
  },
  refreshNote: (seconds: number) =>
    `La file se met à jour toute seule toutes les ${seconds} secondes.`,
  noResults: {
    title: "Aucun résultat",
    detail: "Modifiez la recherche ou retirez les filtres.",
  },
  /** Échéance d'un examen. */
  deadline: {
    /** Par exemple « reste 12 min ». */
    remaining: (duration: string) => `reste ${duration}`,
    /** Par exemple « dépassé de 3 h ». */
    overdue: (duration: string) => `dépassé de ${duration}`,
    /** Infobulle : l'heure de l'échéance. */
    dueAt: (time: string) => `Échéance à ${time}`,
  },
  /** Tableau de la file. */
  table: {
    columns: {
      deadline: "Échéance",
      patient: "Patient",
      study: "Examen",
      follow: "Suivi",
      received: "Reçu",
    },
    clinicalInfo: (text: string) => `Renseignements cliniques : ${text}`,
    colleague: "Un confrère",
    /** Aide du clavier : « j / k {browse}, Entrée {open} ». */
    keyboard: {
      browse: "ou flèches pour parcourir la file,",
      enter: "Entrée",
      open: "pour ouvrir l’examen.",
    },
    /**
     * État vide. Il dit ce qui se passe, pas seulement qu'il ne se passe
     * rien : une file vide est une bonne nouvelle, pas une erreur de
     * chargement.
     */
    empty: {
      title: "File à jour",
      detail:
        "Aucun examen n’attend de lecture. Les nouveaux examens apparaissent ici dès leur réception.",
    },
  },
  myStudies: {
    description: "Examens que vous avez pris en charge et qui restent à rendre",
    empty: {
      title: "Aucun examen en cours",
      detail: "Prenez un examen en charge depuis la file « À lire ».",
    },
  },
  filters: {
    modalities: "Modalités",
    clinic: "Clinique",
    allClinics: "Toutes les cliniques",
  },
  /** Barre d'outils des listes d'examens. */
  toolbar: {
    searchLabel: "Rechercher un patient ou une modalité",
    searchPlaceholder: "Patient, identifiant, modalité…",
    urgentShort: "Urgences",
    urgentOnly: "Urgences seulement",
    invalidSearch: "Recherche invalide.",
  },
};
