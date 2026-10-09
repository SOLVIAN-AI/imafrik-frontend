/** Paramètres de l'utilisateur, en français. */
export const settings = {
  title: "Paramètres",
  profile: {
    title: "Profil",
    descriptionRadiologist:
      "Imprimé sur les comptes-rendus que vous signerez. Ceux déjà signés ne changent pas.",
    descriptionStaff:
      "Votre identité au sein de l’établissement. Elle figure dans le journal d’accès aux examens.",
    fullName: "Nom complet",
    titleField: "Titre",
    titleHintRadiologist:
      "Imprimé devant votre nom, par exemple « Dr » ou « Pr ».",
    titleHintStaff: "Fonction dans l’établissement.",
    license: "Numéro d’ordre",
    licenseHint:
      "Imprimé sous votre signature. L’équipe IMAFRIK le vérifie avant d’ouvrir l’accès aux examens.",
    /** Validation du numéro d'ordre, affichée à côté du champ. */
    licenseStatus: {
      verified: "Validé par IMAFRIK",
      pending: "En cours de vérification",
      missing: "À renseigner",
    },
    /** Avertissement quand le numéro saisi remplace un numéro existant. */
    licenseChangeWarning:
      "Un nouveau numéro doit être vérifié de nouveau par l’équipe IMAFRIK. D’ici là, vous n’aurez plus accès aux examens.",
    licenseChangeConfirm: {
      title: "Changer de numéro d’ordre ?",
      description: (previous: string, next: string) =>
        next
          ? `Le numéro ${previous} sera remplacé par ${next}. L’équipe IMAFRIK devra vérifier ce nouveau numéro : d’ici là, vous n’aurez plus accès aux examens, et ceux que vous avez pris en charge pourront être confiés à un confrère.`
          : `Le numéro ${previous} sera retiré de votre profil. Sans numéro d’ordre, vous n’aurez plus accès aux examens.`,
      submit: "Enregistrer et faire vérifier",
    },
    saved: "Profil enregistré.",
    nameRequired: "Le nom est requis",
  },
  language: {
    title: "Langue",
    description:
      "Celle de vos écrans, des messages du service et des courriels que vous recevez.",
    saved: "Langue enregistrée.",
    unknown: "Langue inconnue.",
    /** Rappel quand la langue des comptes-rendus d'une clinique diffère. */
    reportsNote:
      "La langue des comptes-rendus PDF est celle de chaque clinique, fixée à son contrat.",
  },
  pool: {
    title: "Qui lit vos examens",
    description:
      "Le réglage s’applique immédiatement ; un examen déjà pris en charge ne change pas de main.",
    poolTitle: "Tous les radiologues de la plateforme",
    poolDetail:
      "Vos examens entrent dans la file commune. Le premier radiologue disponible les prend en charge.",
    ownTitle: "Nos radiologues uniquement",
    ownDetail:
      "Seuls les radiologues que vous avez invités dans votre équipe voient vos examens. Personne d’autre.",
    ownWarning:
      "Aucun radiologue de la plateforme ne pourra lire vos examens, y compris la nuit et le week-end. Assurez-vous que vos propres radiologues couvrent ces périodes.",
    saved: "Réglage enregistré.",
  },
  password: {
    title: "Mot de passe",
    description: "Vos sessions ouvertes sur d’autres appareils seront fermées.",
    submit: "Changer le mot de passe",
    newPassword: "Nouveau mot de passe",
    confirmation: "Confirmation",
    changed: "Mot de passe changé.",
    rules: {
      length: "Douze caractères au minimum",
      uppercase: "Une lettre majuscule",
      digitOrSymbol: "Un chiffre ou un symbole",
      tooLong: (max: number) => `${max} caractères au maximum`,
    },
    refused: (rule: string) => `Mot de passe refusé : ${rule.toLowerCase()}.`,
    mismatch: "Les deux saisies diffèrent.",
    weak: "Ce mot de passe est refusé : choisissez-en un plus long, différent du précédent.",
    failed:
      "Le mot de passe n’a pas pu être changé. Le lien a peut-être expiré.",
    demoAction: "Le changement de mot de passe",
    secondFactorFirst:
      "Votre compte est protégé par la double authentification : saisissez d’abord votre code, puis changez le mot de passe.",
  },
  profileDemoAction: "L’enregistrement du profil",
  mfa: {
    title: "Double authentification",
    description:
      "Un code à usage unique, en plus du mot de passe, à chaque connexion.",
    active: "Active",
    required: "Exigée pour votre rôle",
    recommended: "Recommandée, non activée",
    activeDetail:
      "Téléphone perdu ou changé : contactez l’équipe IMAFRIK, qui réinitialise l’accès après vérification de votre identité.",
    inactiveDetail:
      "Un mot de passe volé ne suffit plus à ouvrir votre compte. Une fois activée, elle vous est demandée à chaque connexion.",
    enable: "Activer",
  },
};
