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
    clinic_staff: "Clinique",
  },
  studyStatus: {
    received: "À lire",
    assigned: "Attribué",
    in_progress: "En cours",
    reported: "Rendu",
    delivered: "Livré",
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
};
