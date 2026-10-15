/**
 * Habilitation des radiologues : exercice, justificatifs, décision de
 * l'équipe IMAFRIK. En français. Voir `fr/common.ts` pour les conventions.
 *
 * Un seul espace de noms pour tout ce que l'habilitation fait dire aux
 * écrans (parcours d'accueil, paramètres, file de lecture, écran de
 * lecture, administration) : chaque état se dit d'une seule façon.
 */
export const credentials = {
  /** Geste refusé en démonstration. */
  demoAction: "le dépôt d’un justificatif",

  /**
   * Ce que chaque état empêche, et ce qu'il reste à faire. Lu par le
   * bandeau de la file, l'écran de lecture et la dernière étape du
   * parcours d'accueil.
   */
  states: {
    undeclared: {
      title: "Complétez votre dossier",
      detail:
        "Indiquez votre exercice et déposez votre justificatif : l’équipe IMAFRIK l’examine avant d’ouvrir votre accès aux examens.",
      action: "Compléter mon dossier",
    },
    license_missing: {
      title: "Renseignez votre numéro d’ordre",
      detail:
        "Votre numéro d’ordre est imprimé sous votre signature : l’équipe IMAFRIK le vérifie avec votre diplôme avant d’ouvrir votre accès aux examens.",
      action: "Renseigner mon numéro",
    },
    documents_missing: {
      title: "Déposez votre justificatif",
      detail:
        "L’équipe IMAFRIK ouvre votre accès aux examens après avoir examiné votre justificatif.",
      action: "Déposer mon justificatif",
    },
    pending: {
      title: "Votre dossier est en cours de vérification",
      detail:
        "L’équipe IMAFRIK examine votre justificatif. Les examens apparaîtront ici dès sa validation ; vous n’avez rien d’autre à faire.",
      action: "Voir mon dossier",
    },
    expired: {
      title: "Votre attestation d’inscription a expiré",
      detail:
        "Déposez votre nouvelle attestation : l’accès aux examens reprend dès sa validation par l’équipe IMAFRIK.",
      action: "Déposer ma nouvelle attestation",
    },
  },
  why: "Un compte-rendu signé engage un médecin : son droit d’exercer est vérifié avant tout accès aux examens.",

  /** Pastille d'état, vue par le radiologue lui-même. */
  chip: {
    undeclared: "Dossier à compléter",
    license_missing: "Numéro manquant",
    documents_missing: "Justificatif à déposer",
    pending: "En cours de vérification",
    expired: "Attestation expirée",
    verified: "Validé par IMAFRIK",
  },

  /** Choix de l'exercice. */
  practice: {
    legend: "Votre exercice",
    registered: {
      title: "Inscrit à l’Ordre des médecins",
      detail: "Vous déposez votre diplôme et renseignez votre numéro d’ordre.",
    },
    resident: {
      title: "En cours de spécialisation",
      detail:
        "Vous déposez votre attestation d’inscription, avec sa date de fin.",
    },
    changeWarning:
      "Changer d’exercice suspend votre accès aux examens jusqu’à la validation de votre nouveau justificatif.",
    save: "Enregistrer mon exercice",
    saved: "Exercice enregistré.",
  },

  /** Justificatifs : dépôt et suivi. */
  documents: {
    kinds: {
      diploma: "Diplôme",
      enrollment_certificate: "Attestation d’inscription",
    },
    hints: {
      diploma:
        "Votre diplôme de docteur en médecine ou de spécialiste, en PDF ou en photo lisible.",
      enrollment_certificate:
        "L’attestation d’inscription en spécialisation de l’année en cours, en PDF ou en photo lisible.",
    },
    formats: "PDF, JPEG ou PNG, 10 Mo au plus.",
    privacy:
      "Seule l’équipe IMAFRIK consulte ce document, et chaque consultation est tracée.",
    missingFile: "Choisissez le fichier de votre justificatif.",
    choose: "Choisir un fichier",
    replace: "Remplacer le fichier",
    send: "Envoyer",
    sending: (percent: number) => `Envoi… ${percent} %`,
    sent: "Justificatif envoyé : l’équipe IMAFRIK va l’examiner.",
    selected: (name: string, size: string) => `${name} · ${size}`,
    tooLarge:
      "Ce fichier dépasse 10 Mo : photographiez le document, ou compressez le PDF.",
    badType: "Format non accepté : déposez un PDF, ou une photo JPEG ou PNG.",
    failed: "L’envoi n’a pas abouti. Réessayez dans un instant.",
    connectionLost:
      "La connexion a été interrompue pendant l’envoi. Vérifiez votre réseau, puis réessayez.",
    validUntil: "Date de fin de l’attestation",
    validUntilHint:
      "Votre accès aux examens court jusqu’à cette date ; IMAFRIK vous prévient 30 jours avant.",
    validUntilRequired: "Indiquez la date de fin de votre attestation.",
    validUntilPast:
      "Cette date est passée : déposez votre attestation la plus récente.",
    history: "Vos dépôts",
    uploadedOn: (date: string) => `Déposé le ${date}`,
    validUntilOn: (date: string) => `Valable jusqu’au ${date}`,
    status: {
      pending: "En cours d’examen",
      accepted: "Accepté",
      rejected: "Refusé",
    },
    rejectionReason: "Motif",
    renewal: (days: number, date: string) =>
      days <= 0
        ? `Votre attestation prend fin aujourd’hui (${date}) : déposez la nouvelle dès maintenant.`
        : `Votre attestation prend fin dans ${days} jour${days > 1 ? "s" : ""}, le ${date} : déposez la nouvelle pour que votre accès ne s’interrompe pas.`,
  },

  /** Section des paramètres. */
  settings: {
    title: "Exercice et justificatifs",
    description:
      "Ce que l’équipe IMAFRIK vérifie avant d’ouvrir votre accès aux examens.",
    validUntil: (date: string) =>
      `Accès ouvert jusqu’au ${date}, fin de votre attestation.`,
  },
};
