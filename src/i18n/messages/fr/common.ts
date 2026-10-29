/**
 * Vocabulaire partagé par tous les écrans de l'application, en français.
 *
 * Langue de référence : le type de chaque espace de noms anglais est tiré
 * de celui-ci, une entrée oubliée est une erreur de compilation. Les
 * pluriels sont des fonctions : la grammaire de chaque langue y est
 * écrite, pas reconstituée en ajoutant un « s ».
 */
export const common = {
  /** Description par défaut des pages, pour les moteurs et les aperçus. */
  appDescription: "Plateforme de téléradiologie",
  /** Lien d’évitement, premier arrêt de la tabulation sur chaque page. */
  skipToContent: "Aller au contenu",
  actions: {
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Enregistré",
    cancel: "Annuler",
    close: "Fermer",
    confirm: "Confirmer",
    delete: "Supprimer",
    retry: "Réessayer",
    refresh: "Actualiser",
    back: "Retour",
    open: "Ouvrir",
    search: "Rechercher",
    clearFilters: "Retirer les filtres",
    copy: "Copier",
    copied: "Copié",
    download: "Télécharger",
    signOut: "Se déconnecter",
    seeAll: "Tout voir",
  },
  roles: {
    platform_admin: "Administrateur IMAFRIK",
    radiologist: "Radiologue",
    clinic_staff: "Responsable",
  },
  /**
   * États d'un examen, côté radiologue et équipe IMAFRIK. « Signé » et
   * « Remis » partout : les écrans disaient tantôt « Rendu », « signés »,
   * tantôt « Livré », « remis » ou « Remise » pour le même état.
   */
  studyStatus: {
    received: "À lire",
    assigned: "Attribué",
    in_progress: "En cours",
    reported: "Signé",
    delivered: "Remis",
  },
  /** Les mêmes états, vus de la clinique : ce qu'elle attend, sans jargon. */
  studyStatusClinic: {
    received: "En attente",
    assigned: "En lecture",
    in_progress: "En lecture",
    reported: "Prêt à télécharger",
    delivered: "Téléchargé",
  },
  urgent: "Urgent",
  sex: { M: "Homme", F: "Femme", O: "Autre" },
  /** Initiales du sexe, pour les lignes compactes. */
  sexShort: { M: "H", F: "F", O: "A" },
  /** Pied des listes paginées par le service. */
  pagination: {
    label: "Pages de la liste",
    shown: (shown: number, total: number) =>
      `${shown} affiché${shown > 1 ? "s" : ""} sur ${total}`,
    first: "Revenir au début",
    next: "Page suivante",
  },
  units: {
    minute: "min",
    hour: "h",
    day: "j",
    bytes: ["o", "ko", "Mo", "Go"],
    months: (count: number) => `${count} mois`,
    years: (count: number) => (count === 1 ? "1 an" : `${count} ans`),
  },
  errors: {
    unexpected: "Une erreur inattendue est survenue. Réessayez.",
    invalidId: "Identifiant invalide.",
    demoUnavailable: (what: string) =>
      `${what} n’est pas disponible en démonstration : aucun service n’est branché.`,
    sessionExpired: "Session expirée.",
    network: "Le service ne répond pas. Vérifiez la connexion, puis réessayez.",
    invalidRequest: "Requête invalide.",
    serviceUnavailable:
      "Le service est momentanément indisponible. Réessayez dans un instant.",
    requestFailed: "La demande n’a pas abouti.",
    apiNotConfigured: "L’API n’est pas configurée.",
    unexpectedResponse: "Le service a renvoyé une réponse inattendue.",
    unreachable:
      "Le service est injoignable. Vérifiez la connexion, puis réessayez.",
  },
  language: {
    label: "Langue",
    fr: "Français",
    en: "English",
  },
  /** Bulle d'information (ⓘ) posée sur un intitulé ou le libellé d'une mesure. */
  infoTip: {
    /** Nom du bouton ⓘ : `label` est l'intitulé qu'il explique. */
    about: (label: string) => `À propos de « ${label} »`,
    learnMore: "En savoir plus",
    /** Nom complet du lien « En savoir plus » : `term` est le terme du glossaire. */
    learnMoreAbout: (term: string) =>
      `En savoir plus sur « ${term} » dans le glossaire`,
  },
  /**
   * Ce que mesure un indicateur de délai, en une phrase : la bulle de son
   * intitulé, partout où il s'affiche (activité, performances, tableaux de
   * bord, tour de contrôle).
   */
  measures: {
    median:
      "La moitié des examens est rendue plus vite, de la réception à la signature ; un examen exceptionnellement long ne le déforme pas.",
    mean: "La moyenne des délais de la réception à la signature, qu’un seul examen très long tire vers le haut.",
    p90: "Neuf examens sur dix sont rendus plus vite : il montre les plus longues attentes.",
    withinSla: (routine: string, urgent: string) =>
      `Part des examens signés dans le délai promis à la clinique : ${routine} en routine, ${urgent} en urgence.`,
  },
};
