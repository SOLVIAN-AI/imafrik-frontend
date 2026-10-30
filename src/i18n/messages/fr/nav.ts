/** Navigation et cadre de l'application, en français. */
export const nav = {
  /** Entrées de la navigation, par clé (`NavItem.key`). */
  items: {
    worklist: "À lire",
    myStudies: "Mes examens",
    reports: "Comptes-rendus",
    templates: "Modèles",
    training: "Formation",
    settings: "Paramètres",
    dashboard: "Tableau de bord",
    send: "Envoyer un examen",
    depositImages: "Déposer des images",
    studies: "Examens",
    team: "Équipe",
    planning: "Planning",
    activity: "Activité et facturation",
    cockpit: "Cockpit",
    analytics: "Activité",
    flow: "Flux d’images",
    organisations: "Organisations",
    gateways: "Passerelles",
    deposits: "Dépôts",
    accounts: "Comptes",
    requests: "Demandes reçues",
    ideaInbox: "Idées",
    billing: "Facturation",
    system: "Système",
    audit: "Journal d’audit",
    controls: "Réglages",
    ideas: "Vos idées",
  },
  /** Groupes de la navigation, par clé (`NavGroup.key`). */
  groups: {
    production: "Production",
    account: "Compte",
    tracking: "Suivi",
    facility: "Établissement",
    administration: "Administration",
    clinicView: "Vue des cliniques",
    radiologistView: "Lectures",
  },
  mainNavigation: "Navigation principale",
  switchOrganisation: "Changer d’organisation",
  myOrganisations: "Mes organisations",
  myProfile: "Mon profil",
  signOut: "Se déconnecter",
  /** Libellé accessible d'un compteur : `{count}` éléments, dont des urgences. */
  countWithUrgent: (count: number) => `${count}, dont des urgences`,
  /** Ce que compte un compteur, en toutes lettres (`NavItem.countLabel`). */
  countLabels: {
    planConflicts: (count: number) =>
      count > 1
        ? `${count} conflits cette semaine`
        : `${count} conflit cette semaine`,
  },
  openNavigation: "Ouvrir la navigation",
  closeNavigation: "Fermer la navigation",
  home: "Accueil IMAFRIK",
  searchPlaceholder: "Rechercher un patient, un écran…",
  theme: {
    toLight: "Passer en thème clair",
    toDark: "Passer en thème sombre",
    toggle: "Changer de thème",
  },
  demo: {
    badge: "Démonstration",
    hint: "Aucune donnée réelle : les patients et les examens affichés sont inventés.",
  },
  maintenance: "Information de l’équipe IMAFRIK :",
  palette: {
    title: "Palette de commandes",
    groups: { studies: "Examens", goTo: "Aller à", preferences: "Préférences" },
    escape: "Échap",
    results: "Résultats",
    noResult: "Aucun résultat. « Entrée » cherche dans toute la liste.",
    typeMore: "Tapez au moins deux lettres pour chercher un patient.",
    language: (name: string) => `Afficher l’application en ${name}`,
  },
};
