/**
 * Engagements contractuels : contrat d'exercice du radiologue, convention
 * de service de l'établissement. En français. Voir `fr/common.ts` pour
 * les conventions, et `lib/agreements.ts` pour les règles.
 */
export const agreements = {
  demoAction: "l’acceptation d’un engagement",

  /** Écran `/engagements` : une version nouvelle à accepter. */
  page: {
    title: "Vos engagements",
    lead: "Une version de vos engagements attend votre accord. Votre portail s’ouvre dès que vous l’avez acceptée.",
    metaTitle: "Engagements",
  },

  /** Lecture et acceptation d’un document. */
  review: {
    version: (version: string, date: string) =>
      `Version ${version}, en vigueur le ${date}`,
    translationNotice:
      "Traduction de courtoisie : seule la version française fait foi, et c’est elle que vous acceptez.",
    documentLabel: (title: string) => `Texte : ${title}`,
    download: "Télécharger le PDF",
    downloadAccepted: "Télécharger mon exemplaire",
    acceptRadiologist: (version: string) =>
      `J’ai lu le contrat d’exercice (version ${version}) et je l’accepte.`,
    acceptClinic: (version: string) =>
      `J’ai lu la convention de service (version ${version}) et je l’accepte au nom de l’établissement.`,
    capacityLabel: "Votre qualité",
    capacityHint:
      "Telle qu’elle figurera sur le certificat d’acceptation, par exemple « Directeur général ».",
    authorityLabel: "Je déclare être habilité(e) à engager l’établissement.",
    submit: "Accepter",
    submitAndContinue: "Accepter et continuer",
    acceptedOn: (date: string, by: string | null) =>
      by ? `Acceptée le ${date} par ${by}.` : `Acceptée le ${date}.`,
    accepted: "Engagement accepté.",
    proofNote:
      "Votre acceptation est horodatée et rattachée à l’empreinte du texte affiché. Votre exemplaire reste téléchargeable dans vos paramètres.",
    cannotAccept:
      "Une personne habilitée de votre établissement doit accepter la convention. Votre portail s’ouvrira dès qu’elle l’aura fait.",
    changed:
      "Le texte a changé pendant votre lecture : relisez la version en vigueur.",
    unavailable: "En démonstration, aucun engagement n’est présenté.",
  },

  /** Carte des paramètres : les engagements acceptés. */
  settings: {
    title: "Engagements",
    lead: "Les textes que vous avez acceptés, et votre exemplaire de chacun.",
    pending: "À accepter",
    review: "Lire et accepter",
    none: "Aucun engagement n’est attaché à votre compte.",
  },

  problems: {
    capacity_missing: "Indiquez votre qualité au sein de l’établissement.",
    authority_missing:
      "Cochez la déclaration : seule une personne habilitée peut engager l’établissement.",
  },
};
