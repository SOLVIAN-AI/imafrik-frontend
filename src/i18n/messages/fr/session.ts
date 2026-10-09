/**
 * Textes de la zone « session », en français : double authentification,
 * nouveau mot de passe, verrouillage après inactivité, compte en attente,
 * écrans d'erreur et de configuration. Voir `fr/common.ts` pour les
 * conventions.
 */
export const session = {
  mfa: {
    title: "Double authentification",
    enrollIntro:
      "Votre compte donne accès à des examens médicaux : il est protégé par un code à usage unique, en plus du mot de passe. Une configuration d’une minute, une seule fois.",
    verifyIntro:
      "Saisissez le code à six chiffres affiché par votre application d’authentification.",
    steps: {
      install:
        "Installez une application d’authentification sur votre téléphone : Google Authenticator, Microsoft Authenticator ou 2FAS.",
      scan: "Ouvrez cette application, touchez « Ajouter un compte » ou « + », puis scannez avec elle le QR code qui s’affichera. L’appareil photo du téléphone ne suffit pas. Si vous ne pouvez pas scanner, une clé à saisir sera aussi proposée.",
      enterCode:
        "Saisissez ici le code à six chiffres que l’application affiche alors.",
    },
    setUp: "Configurer mon application",
    codeLabel: "Code à six chiffres",
    verify: "Vérifier",
    noSmartphone: "Pas de smartphone ?",
    lostPhone: "Téléphone perdu ou changé ?",
    support:
      "Contactez l’équipe IMAFRIK : après vérification de votre identité, elle réinitialise l’accès et vous configurez un nouvel appareil.",
    scanHint:
      "Dans votre application d’authentification, touchez « Ajouter un compte » ou « + », puis scannez ce QR code. L’appareil photo du téléphone ne suffit pas : c’est l’application qui doit le lire.",
    qrAlt: "QR code à scanner avec votre application d’authentification",
    cannotScan:
      "Impossible de scanner, ou application installée sur cet appareil ? Dans l’application, choisissez la saisie d’une clé et entrez celle-ci :",
    copyKey: "Copier la clé",
    /** Nom du facteur enregistré auprès du service d'authentification. */
    factorName: "Application d’authentification",
    errors: {
      demo: "La double authentification n’est pas disponible en démonstration.",
      serviceDown: "Le service d’authentification ne répond pas. Réessayez.",
      alreadyEnrolled:
        "Une application est déjà associée à ce compte. Pour changer de téléphone, contactez l’équipe IMAFRIK.",
      enrollFailed: "L’enrôlement n’a pas pu démarrer. Réessayez.",
      codeFormat: "Le code compte six chiffres.",
      unknownFactor: "Facteur inconnu.",
      tooManyAttempts:
        "Trop d’essais. Patientez une minute avant de recommencer.",
      wrongCode:
        "Code incorrect ou expiré. Saisissez le code affiché maintenant.",
      notApplied: "La vérification n’a pas été prise en compte. Réessayez.",
    },
  },
  newPassword: {
    title: "Nouveau mot de passe",
    description: "Vos sessions ouvertes sur d’autres appareils seront fermées.",
    password: "Nouveau mot de passe",
    confirmation: "Confirmation",
    mismatch: "Les deux saisies diffèrent.",
    submit: "Enregistrer le mot de passe",
  },
  /**
   * Accueil d'une personne invitée : qui l'accueille, pour quel rôle, puis
   * le choix du mot de passe. Atteint par le lien du courriel d'invitation.
   */
  invitation: {
    metaTitle: "Invitation",
    eyebrow: "Invitation",
    welcome: (organization: string) => `Bienvenue chez ${organization}`,
    intro:
      "Votre compte IMAFRIK est prêt. Vérifiez ci-dessous qui vous invite, puis choisissez votre mot de passe.",
    detailsLabel: "Votre invitation",
    role: "Rôle",
    city: "Ville",
    invitedBy: "Invitation de",
    sentOn: "Envoyée le",
    /** Le rôle en clair, tel que l'invité le comprend. */
    roleNames: {
      clinic_staff: "Personnel de l’établissement",
      radiologist: "Radiologue",
      platform_admin: "Équipe IMAFRIK",
    },
    /** Ce que le rôle permet, en une phrase. */
    roleDetails: {
      clinic_staff:
        "Vous envoyez les examens de l’établissement et récupérez les comptes-rendus signés.",
      radiologist:
        "Vous lisez et signez les examens confiés au groupe, sous votre nom et votre numéro d’ordre.",
      platform_admin:
        "Vous administrez la plateforme : établissements raccordés, comptes, exploitation.",
    },
    organizationKinds: {
      clinic: "Établissement de santé",
      radiology_group: "Groupe de radiologie",
    },
    /** Avant l'adresse de contact, présentée comme un lien. */
    notExpectedBefore:
      "Vous n’attendiez pas cette invitation ? Fermez cette page et écrivez-nous à ",
    notExpectedAfter: ".",
    stepsLabel: "Étapes de votre arrivée",
    steps: {
      password: "Mot de passe",
      mfa: "Double authentification",
      onboarding: "Prise en main",
    },
    passwordTitle: "Choisissez votre mot de passe",
    nextMfa:
      "Ensuite, vous configurerez la double authentification, exigée pour votre rôle.",
    nextOnboarding:
      "Ensuite, quelques étapes pour prendre en main votre espace.",
    submit: "Enregistrer et continuer",
  },
  inactivity: {
    title: "Session bientôt fermée",
    /** Début du préavis, avant le compte à rebours. */
    detailBefore: (minutes: number) =>
      `Aucune activité depuis près de ${minutes} minutes. Pour protéger les examens affichés, la session se ferme dans `,
    /** Compte à rebours, en secondes. */
    seconds: (seconds: number) => `${seconds} s`,
    /** Fin du préavis, après le compte à rebours. */
    detailAfter: ". Vos comptes-rendus sont enregistrés.",
    signOutNow: "Fermer maintenant",
    staySignedIn: "Rester connecté",
  },
  membership: {
    unknown: "Appartenance inconnue.",
    switchRefused: "La bascule d’organisation a été refusée.",
  },
  pending: {
    metaTitle: "Compte en attente",
    eyebrow: "En attente",
    title: "Votre compte n’ouvre encore aucun espace",
    notLinked:
      "Vous êtes bien connecté, mais votre compte n’est rattaché à aucun établissement ni groupe de radiologie actif.",
    nextSteps: (email: string) =>
      `Si vous venez de déposer votre dossier, il est en cours de vérification. Si vous utilisiez déjà IMAFRIK, votre accès a pu être retiré par votre établissement : rapprochez-vous de lui, ou écrivez-nous à ${email}.`,
    otherOrganizations:
      "Votre organisation active n’est plus accessible, mais vous pouvez poursuivre dans l’une de vos autres organisations.",
    openOrganization: (name: string) => `Continuer dans ${name}`,
    resuming: "Mise à jour de votre accès…",
  },
  serviceUnavailable: {
    eyebrow: "Interruption de service",
    title: "Service momentanément indisponible",
    detail:
      "IMAFRIK ne répond pas pour l’instant. Vos données ne sont pas perdues : réessayez dans quelques minutes.",
  },
  appError: {
    title: "Cet écran n’a pas pu s’afficher",
    detail:
      "Le service n’a pas répondu comme prévu. Ces erreurs sont le plus souvent passagères : réessayez dans un instant.",
    reference: (digest: string) => `Référence : ${digest}`,
  },
  configuration: {
    metaTitle: "Configuration requise",
    title: "Ce déploiement n’est pas configuré",
    lead: "Le service refuse de servir plutôt que de présenter des données de démonstration sous une adresse de production.",
    footer:
      "À déclarer dans les variables d’environnement du déploiement, puis redéployer.",
    /** Rôle de chaque variable, par clé (voir `lib/deployment.ts`). */
    purposes: {
      supabase: "authentification et lecture des appartenances",
      api: "examens, comptes-rendus et jetons de visualisation",
      viewer: "affichage des images dans l’écran de lecture",
      viewerIsolation:
        "doit être servi depuis une autre origine que le site : il ne doit partager ni ses cookies ni son stockage",
      siteUrl: "liens des courriels et lien de vérification des comptes-rendus",
      siteUrlDurable:
        "doit être l’adresse durable du site, en https, et non une adresse de prévisualisation : elle figure dans les liens de vérification des documents remis",
      backupSecret: (minLength: number) =>
        `chiffrement des copies de secours des brouillons sur le poste (${minLength} caractères au moins)`,
    },
  },
  statusScreen: {
    error: (code: string) => `Erreur ${code}`,
    backHome: "Retour à l’accueil",
  },
};
