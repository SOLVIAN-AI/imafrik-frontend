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
    identityChangeConfirm: {
      title: "Modifier votre identité de signataire ?",
      description:
        "Votre nom et votre titre s’impriment sous chaque compte-rendu que vous signez, avec votre numéro d’ordre. L’équipe IMAFRIK devra vérifier ce changement : d’ici là, vous n’aurez plus accès aux examens, et ceux que vous avez pris en charge pourront être confiés à un confrère.",
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
    currentPassword: "Mot de passe actuel",
    currentRequired: "Saisissez votre mot de passe actuel.",
    currentInvalid: "Le mot de passe actuel est incorrect.",
    tooManyAttempts:
      "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
    unavailable:
      "Le service d’authentification ne répond pas. Réessayez dans un instant.",
    linkRequired:
      "Ce lien ne permet plus de choisir un mot de passe. Demandez-en un nouveau depuis « Mot de passe oublié ».",
  },
  profileDemoAction: "L’enregistrement du profil",
  signing: {
    title: "Signature et cachet",
    description:
      "Votre signature et votre cachet sont apposés sur chaque compte-rendu que vous signez, après la saisie de votre code personnel. Les comptes-rendus déjà signés gardent ceux de leur PDF.",
    demoAction: "L’enregistrement d’une signature ou d’un cachet",
    optional: "Facultatifs",
    kinds: { signature: "Signature manuscrite", stamp: "Cachet" },
    none: {
      signature: "Aucune signature enregistrée.",
      stamp: "Aucun cachet enregistré.",
    },
    noneDetail:
      "Facultatif : sans image, le compte-rendu porte votre nom, votre numéro d’ordre et son code de vérification.",
    inUse: {
      signature: "Imprimée sur vos comptes-rendus",
      stamp: "Imprimé sur vos comptes-rendus",
    },
    legacy: "Posée par l’équipe IMAFRIK",
    pending: "En cours de vérification par l’équipe IMAFRIK",
    pendingDetail: (hasAccepted: boolean): string =>
      hasAccepted
        ? "L’image actuelle reste utilisée jusqu’à son acceptation."
        : "Elle s’imprimera dès son acceptation.",
    rejected: "Refusée par l’équipe IMAFRIK",
    rejectedReason: (reason: string) => `Motif : ${reason}`,
    previewAlt: {
      signature: "Votre signature",
      stamp: "Votre cachet",
    },
    pendingAlt: {
      signature: "Votre nouvelle signature, en cours de vérification",
      stamp: "Votre nouveau cachet, en cours de vérification",
    },
    draw: "Tracer",
    import: "Importer",
    formats:
      "PNG ou JPEG, 2 Mo au plus. Sur fond blanc : le blanc est rendu transparent.",
    stampHint: "Le cachet doit porter votre nom et votre numéro d’ordre.",
    errors: {
      badType: "Déposez une image PNG ou JPEG.",
      tooLarge: "Ce fichier dépasse 2 Mo.",
      unreadable: "Ce fichier n’a pas pu être lu.",
    },
    sent: {
      signature:
        "Signature envoyée : l’équipe IMAFRIK la vérifie avant qu’elle ne s’imprime.",
      stamp:
        "Cachet envoyé : l’équipe IMAFRIK le vérifie avant qu’il ne s’imprime.",
    },
    submit: {
      drawTitle: "Tracer votre signature",
      importTitle: {
        signature: "Importer votre signature",
        stamp: "Importer votre cachet",
      },
      description:
        "L’équipe IMAFRIK vérifie l’image avant qu’elle ne s’imprime. D’ici là, l’image actuelle reste utilisée.",
      preview: "Image choisie",
      send: "Envoyer à la vérification",
    },
    pad: {
      label:
        "Cadre de signature : signez avec la souris, un stylet ou le doigt",
      hint: "Signez dans le cadre avec la souris, un stylet ou le doigt.",
      clear: "Effacer",
      undo: "Annuler le dernier trait",
      problems: {
        empty: "Tracez votre signature dans le cadre.",
        tooShort:
          "Ce tracé est trop rapide pour une signature : prenez le temps de signer.",
        tooSmall: "Ce tracé est trop petit : signez en occupant le cadre.",
      },
      alternative:
        "Vous ne pouvez pas tracer à l’écran ? Importez une photo ou un scan de votre signature.",
    },
    pin: {
      title: "Code personnel",
      set: "Défini",
      notSet: "À créer",
      setDetail: "Demandé à chaque signature et à chaque addendum.",
      notSetDetail:
        "Obligatoire pour signer. Créez-le ici, ou dans la fenêtre de votre prochaine signature.",
      lockedDetail: (time: string) =>
        `Verrouillé après cinq erreurs, jusqu’à ${time}.`,
      define: "Créer le code",
      change: "Changer le code",
      forgotten:
        "Code oublié : demandez à l’équipe IMAFRIK de l’effacer, puis créez-en un nouveau. Elle ne le choisit jamais à votre place.",
      label: "Code personnel",
      hint: "Six chiffres.",
      newLabel: "Nouveau code",
      confirmLabel: "Confirmation",
      currentLabel: "Code actuel",
      createTitle: "Créez votre code personnel",
      createDetail:
        "Six chiffres, demandés à chaque signature et à chaque addendum. Évitez les suites (123456) et les chiffres répétés.",
      problems: {
        format: "Le code compte six chiffres.",
        trivial: "Ce code est trop simple à deviner : choisissez-en un autre.",
        mismatch: "Les deux saisies du code ne concordent pas.",
      },
      locked: (time: string) =>
        `Code verrouillé après cinq erreurs. Réessayez à ${time}.`,
      dialog: {
        createTitle: "Créer votre code personnel",
        changeTitle: "Changer votre code personnel",
        createDescription:
          "Il vous sera demandé à chaque signature et à chaque addendum. Ne le communiquez à personne, pas même à l’équipe IMAFRIK.",
        changeDescription:
          "Saisissez votre code actuel, puis le nouveau, deux fois. Cinq erreurs sur le code actuel le verrouillent quinze minutes.",
        created: "Code personnel créé.",
        changed: "Code personnel changé.",
      },
      demoAction: "La définition du code personnel",
    },
  },
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
