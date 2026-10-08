/**
 * Parcours de mise en service, en français. Voir `fr/common.ts` pour les
 * conventions.
 */
export const onboarding = {
  /**
   * Intitulé et phrase d'introduction de chaque étape, par parcours et par
   * segment d'URL (voir `lib/onboarding/steps.ts`).
   */
  steps: {
    clinic: {
      profil: {
        title: "Votre profil",
        lead: "Votre nom, tel qu’il figurera dans le journal d’accès.",
      },
      lecture: {
        title: "Qui lit vos examens",
        lead: "Vos radiologues, ou tous ceux de la plateforme.",
      },
      "premier-envoi": {
        title: "Premier envoi",
        lead: "Un examen, par la passerelle ou depuis ce navigateur, pour valider la liaison.",
      },
      equipe: {
        title: "Équipe",
        lead: "Les personnes qui suivront les examens au quotidien.",
      },
      termine: { title: "Terminé", lead: "Votre service est ouvert." },
    },
    radiologist: {
      profil: {
        title: "Votre profil",
        lead: "Ce qui sera imprimé sous votre signature, et le numéro d’ordre que l’équipe IMAFRIK vérifiera.",
      },
      termine: {
        title: "Terminé",
        lead: "Votre profil est enregistré.",
      },
    },
    admin: {
      profil: {
        title: "Votre profil",
        lead: "Votre nom, tel qu’il figurera dans le journal d’audit.",
      },
      termine: { title: "Terminé", lead: "Le back-office vous attend." },
    },
  },
  help: "Besoin d’aide ?",
  backToStep: (title: string) => `Revenir à l’étape ${title}`,
  continue: "Continuer",
  skip: "Passer cette étape",
  profile: {
    fullName: "Nom complet",
    title: "Titre",
    titleHintRadiologist:
      "Imprimé devant votre nom, par exemple « Dr » ou « Pr ».",
    titleHintStaff: "Votre fonction dans l’établissement.",
    license: "Numéro d’ordre",
    licenseHint:
      "Imprimé sous votre signature. L’équipe IMAFRIK le vérifie auprès de l’Ordre avant d’ouvrir l’accès aux examens.",
  },
  reading: {
    legend: "Qui lit vos examens",
    poolTitle: "Tous les radiologues de la plateforme",
    poolDetail:
      "Vos examens entrent dans la file commune ; le premier radiologue disponible les prend.",
    ownTitle: "Nos radiologues uniquement",
    ownDetail:
      "Seuls les radiologues que vous inviterez dans votre équipe verront vos examens.",
    note: "Ce réglage se change à tout moment dans les paramètres.",
  },
  firstStudy: {
    waiting: "En attente d’un examen…",
    received: "Un examen est arrivé : la liaison fonctionne.",
    instructions:
      "Envoyez un examen depuis votre console, ou déposez-le ci-dessous. Cet écran se met à jour seul.",
  },
  team: {
    intro:
      "Invitez les personnes qui suivront les examens, et les radiologues que vous employez. Chacune reçoit un lien et choisit son propre mot de passe.",
  },
  done: {
    openDashboard: "Ouvrir le tableau de bord",
    openWorklist: "Ouvrir la file de lecture",
    openControlTower: "Ouvrir la tour de contrôle",
    ready: "Tout est en place.",
    /** Radiologue dont le numéro d'ordre attend la validation. */
    pendingTitle: "Votre numéro d’ordre est en cours de vérification.",
    pendingDetail:
      "L’équipe IMAFRIK le vérifie auprès de l’Ordre avant d’ouvrir votre file de lecture : un compte-rendu signé engage un médecin. Les examens apparaîtront dès sa validation ; vous n’avez rien d’autre à faire.",
    missingTitle: "Votre numéro d’ordre reste à renseigner.",
    missingDetail:
      "Sans lui, l’équipe IMAFRIK ne peut pas valider votre accès aux examens. Revenez à l’étape précédente, ou renseignez-le plus tard dans vos paramètres.",
  },
};
