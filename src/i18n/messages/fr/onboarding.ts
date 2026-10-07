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
        lead: "Ce qui sera imprimé sous votre signature, sur chaque compte-rendu.",
      },
      termine: {
        title: "Terminé",
        lead: "Votre file de lecture vous attend.",
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
    licenseHint: "Imprimé sous votre signature.",
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
  },
};
