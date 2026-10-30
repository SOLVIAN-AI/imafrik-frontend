/**
 * Vue des cliniques, en français : l'équipe IMAFRIK ouvre en consultation
 * les écrans du responsable d'une clinique (`lib/clinic-view.ts`).
 */
export const clinicView = {
  /** Sélecteur de la navigation. */
  picker: {
    choose: "Choisir une clinique",
    /** Nom accessible du sélecteur, suivi de la clinique consultée. */
    label: "Clinique consultée",
    change: "Changer de clinique",
    empty: "Aucune clinique raccordée",
  },
  /** Bandeau permanent des écrans de la vue. */
  banner: {
    region: "Vue des cliniques",
    title: (name: string) => `Consultation de ${name}`,
    detail:
      "Les écrans de son responsable, avec ses données. Chacun de vos gestes est tracé à votre nom.",
    suspended: "Clinique suspendue : son responsable n’y a plus accès.",
    sheet: "Fiche de la clinique",
    back: "Retour à la console",
  },
  /** Page d'entrée, quand aucune clinique n'est choisie. */
  chooser: {
    title: "Vue des cliniques",
    description:
      "Choisissez une clinique : ses écrans s’ouvrent tels que les voit son responsable.",
    empty: "Aucune clinique n’est encore raccordée à la plateforme.",
  },
  /** Variantes des écrans du responsable, vus par l'équipe. */
  team: {
    noManager:
      "Cette clinique n’a aucun responsable : ses écrans ne sont vus que par l’équipe IMAFRIK.",
    soleManager:
      "La clinique n’a qu’un responsable : elle resterait sans relais en son absence.",
    urgentList: "Liste d’urgence",
  },
  activity: {
    plan: "Formule d’abonnement",
    console: "Par radiologue, dans la console",
  },
  reports: {
    teamDownload:
      "Un PDF téléchargé par l’équipe IMAFRIK ne marque pas le compte-rendu remis à la clinique.",
  },
};
