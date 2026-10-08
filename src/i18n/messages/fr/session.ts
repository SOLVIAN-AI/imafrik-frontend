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
      scan: "Scannez le QR code qui s’affichera.",
      enterCode: "Saisissez le code à six chiffres qu’elle affiche.",
    },
    setUp: "Configurer mon application",
    codeLabel: "Code à six chiffres",
    verify: "Vérifier",
    noSmartphone: "Pas de smartphone ?",
    lostPhone: "Téléphone perdu ou changé ?",
    support:
      "Contactez l’équipe IMAFRIK : après vérification de votre identité, elle réinitialise l’accès et vous configurez un nouvel appareil.",
    qrAlt: "QR code à scanner avec votre application d’authentification",
    cannotScan: "Impossible de scanner ? Saisissez cette clé :",
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
