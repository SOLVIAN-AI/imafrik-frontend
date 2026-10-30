/**
 * « Vos idées » : les pistes d’amélioration que proposent les radiologues
 * et les responsables de clinique, et la boîte où l’équipe IMAFRIK les suit.
 */
export const ideas = {
  title: "Vos idées",
  description:
    "Une piste pour améliorer IMAFRIK ? Proposez-la : l’équipe la lit, vous répond et vous prévient à chaque étape.",
  /** Raccourci depuis l’écran où l’on se trouve (barre du haut, aide). */
  shortcut: "Proposer une idée pour cet écran",
  form: {
    title: "Proposer une idée",
    intro:
      "Ce qui vous ferait gagner du temps, de la clarté ou de la sécurité au quotidien.",
    titleLabel: "Titre",
    titlePlaceholder: "En quelques mots",
    bodyLabel: "Description",
    bodyPlaceholder:
      "Ce qui vous gêne aujourd’hui, et ce que vous aimeriez à la place.",
    counter: (count: number, max: number) => `${count} sur ${max}`,
    categoryLabel: "Catégorie",
    benefitLabel: "Ça me ferait gagner",
    benefitInfo:
      "Facultatif : ce que l’idée vous apporterait d’abord. L’équipe s’en sert pour classer les idées.",
    benefitNone: "Je ne sais pas",
    patientTitle: "Jamais l’identité d’un patient",
    patientWarning:
      "N’écrivez ni nom, ni identifiant, ni date de naissance d’un patient, même pour donner un exemple : décrivez la situation, sans la personne. Aucune capture d’écran n’est jointe.",
    contextLabel: "Contexte joint",
    contextInfo:
      "Le nom de l’écran, la version de l’application et le type d’appareil aident l’équipe à comprendre l’idée. Jamais l’adresse de la page ni une image.",
    contextScreen: (screen: string) => `Écran « ${screen} »`,
    contextNoScreen: "Sans écran précis",
    contextVersion: (version: string) => `version ${version}`,
    attachContext: "Joindre ce contexte",
    submit: "Envoyer l’idée",
    sent: "Merci ! Votre idée est envoyée : l’équipe IMAFRIK la lira.",
    errors: {
      titleShort: (min: number) =>
        `Le titre compte au moins ${min} caractères.`,
      titleLong: (max: number) => `Le titre compte au plus ${max} caractères.`,
      bodyShort: (min: number) =>
        `Décrivez l’idée en ${min} caractères au moins.`,
      bodyLong: (max: number) =>
        `La description compte au plus ${max} caractères.`,
      category: "Choisissez une catégorie.",
      responseLong: (max: number) =>
        `La réponse compte au plus ${max} caractères.`,
    },
  },
  mine: {
    title: "Mes idées",
    empty: "Aucune idée pour l’instant",
    emptyDetail:
      "Les idées que vous proposez apparaissent ici, avec leur état et la réponse de l’équipe IMAFRIK.",
    proposedOn: "Proposée le",
    response: "Réponse de l’équipe IMAFRIK",
    grouped:
      "Regroupée avec une idée semblable, déjà reçue : elle en suit l’état.",
  },
  categories: {
    reading: "Lecture et visualiseur",
    reporting: "Compte rendu et dictée",
    assignment: "Attribution et planning",
    studies: "Examens et envoi d’images",
    billing: "Facturation",
    other: "Autre",
  },
  benefits: {
    time: "Du temps",
    clarity: "De la clarté",
    safety: "De la sécurité",
  },
  /** Ce que l’idée ferait gagner, sur sa carte. */
  benefitTags: {
    time: "Gain de temps",
    clarity: "Gain de clarté",
    safety: "Gain de sécurité",
  },
  status: {
    received: "Reçue",
    under_review: "À l’étude",
    planned: "Prévue",
    shipped: "Livrée",
    declined: "Non retenue",
  },
  statusPlural: {
    received: "Reçues",
    under_review: "À l’étude",
    planned: "Prévues",
    shipped: "Livrées",
    declined: "Non retenues",
  },
  statusLabel: "État",
  statusInfo:
    "Reçue : pas encore lue. À l’étude : l’équipe l’examine. Prévue : dans une prochaine version. Livrée : disponible. Non retenue : pas pour le moment.",
  devices: {
    desktop: "ordinateur",
    tablet: "tablette",
    phone: "téléphone",
  },
  inbox: {
    title: "Idées",
    description: (total: number, fresh: number) =>
      `${total} idée${total > 1 ? "s" : ""} proposée${total > 1 ? "s" : ""}, dont ${fresh} reçue${fresh > 1 ? "s" : ""} à lire`,
    searchLabel: "Rechercher une idée",
    searchPlaceholder: "Titre, texte, auteur…",
    empty: "Aucune idée reçue",
    emptyDetail:
      "Les radiologues et les responsables de clinique proposent leurs idées depuis « Vos idées ».",
    truncated: (shown: number, total: number) =>
      `Les ${shown} idées les plus récentes sur ${total}.`,
    unknownAuthor: "Compte supprimé",
    noOrganization: "Sans organisation",
    context: "Contexte",
    noContext: "Sans contexte",
    responseLabel: "Réponse à l’auteur",
    responsePlaceholder:
      "Ce que l’équipe en pense, ce qui est prévu. L’auteur la lit dans « Vos idées » et la reçoit par courriel.",
    groupLabel: "Même idée que…",
    groupInfo:
      "Rattache cette idée à une idée principale qui demande la même chose : elle en suit l’état, et son auteur en est prévenu.",
    groupNone: "Aucune : idée principale",
    groupSearch: "Rechercher une idée principale",
    groupNoMatch: "Aucune idée ne correspond.",
    groupMatches: (count: number) =>
      count === 0 ? "Aucune idée" : count > 1 ? `${count} idées` : "1 idée",
    groupedUnder: (title: string) => `Même idée que « ${title} »`,
    duplicates: (count: number) =>
      count > 1
        ? `${count} idées regroupées avec elle`
        : "1 idée regroupée avec elle",
    followsMain: "Suit l’état de l’idée principale",
    respondedBy: (name: string) => `Répondu par ${name}`,
    saved: "Idée mise à jour",
    savedNotified: "Idée mise à jour : l’auteur est prévenu par courriel",
  },
  demoActions: {
    submit: "L’envoi d’une idée",
    tracking: "Le suivi d’une idée",
  },
};
