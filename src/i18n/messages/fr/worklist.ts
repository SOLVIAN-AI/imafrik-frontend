/**
 * Textes de la zone « worklist », en français : file de lecture du
 * radiologue, examens qu'il a pris en charge, barre de recherche et
 * filtres des listes d'examens. Voir `fr/common.ts` pour les conventions.
 */
export const worklist = {
  /** Périmètre de la file, sous le titre. */
  scope: {
    empty: "Les examens qu’on vous confie",
    clinics: (list: string) => `Les examens qu’on vous confie : ${list}`,
    count: (count: number) =>
      `Les examens qu’on vous confie : ${count} établissement${count > 1 ? "s" : ""}`,
  },
  /** La file vue par l'équipe IMAFRIK : son poste de répartition. */
  supervision: {
    scope: {
      empty: "Toute la plateforme, à répartir",
      clinics: (list: string) => `Toute la plateforme, à répartir : ${list}`,
      count: (count: number) =>
        `Toute la plateforme, à répartir : ${count} établissement${count > 1 ? "s" : ""}`,
    },
    /** Attribution depuis la file. */
    assign: {
      column: "Attribution",
    },
    readingHint: (count: number) => `et ${count} chez un radiologue`,
    reading: { title: "Chez un radiologue", hint: "attribués ou en lecture" },
    open: { title: "À attribuer", hint: "en attente d’un radiologue" },
    toAssign: "À attribuer",
  },
  metrics: {
    toTake: "Attribués à vous",
    mineHint: (count: number) => `dont ${count} en cours`,
    urgentOpen: "Urgences à prendre",
    urgentHint: "la première prise vous revient",
    /** Bulle de « Urgences à prendre », pour le radiologue. */
    urgentOpenInfo:
      "Urgences des cliniques dont vous êtes sur la liste d’urgence, dans les modalités que vous lisez, que personne n’a encore prises : la première prise vous revient.",
    /** La même, pour l'équipe IMAFRIK qui consulte la file. */
    urgentOpenInfoSupervision:
      "Urgences reçues que personne n’a encore prises : les radiologues de la liste d’urgence de leur clinique peuvent les prendre sans attribution.",
    overdue: "En retard",
    overdueHint: "délai dépassé",
    nextDeadline: "Prochaine échéance",
  },
  /** Alertes à l'arrivée d'une urgence libre. */
  arrivals: {
    many: (count: number) => `${count} nouvelles urgences à prendre`,
    one: (study: string) => `Nouvelle urgence à prendre : ${study}`,
  },
  truncated:
    "La file compte plus d’examens que l’écran n’en affiche : seuls les plus proches de leur échéance sont listés. Affinez avec la recherche ou les filtres.",
  /** Sections de la file. */
  groups: {
    mine: { title: "Attribués à vous", hint: "par ordre d’échéance" },
    open: {
      title: "Urgences à prendre",
      hint: "liste d’urgence : la première prise vous revient",
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
    /** Bulles des intitulés qui ne se lisent pas d'eux-mêmes. */
    info: {
      deadline:
        "Temps restant avant la fin du délai promis à la clinique, compté depuis la réception : en ambre dans son dernier quart, en rouge une fois dépassé.",
      /** `assigned` et `inProgress` : les états, tels que les montre la colonne. */
      follow: (assigned: string, inProgress: string) =>
        `État de l’examen : « ${assigned} » tant que sa lecture n’a pas commencé, « ${inProgress} » une fois pris en charge, jusqu’à la signature.`,
      followSupervision:
        "Le radiologue qui détient l’examen ; pour un examen à attribuer, combien de radiologues peuvent le recevoir, selon les modalités qu’ils lisent.",
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
        "Aucun examen ne vous attend. Un examen apparaît ici dès qu’on vous l’attribue, et une urgence de votre liste d’urgence dès sa réception.",
    },
  },
  myStudies: {
    description: "Examens que vous lisez et qui restent à signer",
    empty: {
      title: "Aucun examen en cours",
      detail:
        "Ouvrez un examen qui vous est attribué, depuis la file « À lire », pour le prendre en charge.",
    },
  },
  filters: {
    modalities: "Modalités",
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
    studyCount: (count: number) =>
      count > 1 ? `${count} examens` : `${count} examen`,
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
