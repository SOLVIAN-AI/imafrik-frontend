/**
 * Visites guidées, en français : la prise en main d'un écran, pas à pas,
 * à la première visite (`components/tour`).
 */
export const tour = {
  ui: {
    next: "Suivant",
    previous: "Précédent",
    finish: "Terminer",
    skip: "Passer la visite",
    progress: (step: number, total: number) => `Étape ${step} sur ${total}`,
  },
  help: {
    button: "Aide",
    tourOfHome: "Visite guidée de l’accueil",
    training: "S’exercer dans la formation",
    contact: "Écrire à l’équipe IMAFRIK",
    replayHere: "Revoir la visite de cet écran",
  },
  tours: {
    "radiologue-file": {
      welcome: {
        title: "Bienvenue sur IMAFRIK",
        body: "En une minute, voici où trouver vos examens, comment les ouvrir et où vous exercer. Vous pourrez revoir cette visite à tout moment depuis le bouton d’aide.",
      },
      worklist: {
        title: "La file à lire",
        body: "Les examens envoyés par les cliniques arrivent ici, classés par échéance. Le compteur dit combien attendent un lecteur ; il passe au rouge tant qu’une urgence n’est pas rendue.",
      },
      metrics: {
        title: "L’essentiel d’un coup d’œil",
        body: "Examens à prendre, urgences libres, retards et prochaine échéance : ces indicateurs se mettent à jour avec la file, toutes les trente secondes.",
      },
      filters: {
        title: "Filtrer la file",
        body: "Ne gardez qu’une modalité ou qu’une clinique. Le filtre reste dans l’adresse de la page : il survit au rechargement.",
      },
      table: {
        title: "Ouvrir un examen",
        body: "Cliquez sur une ligne, ou parcourez la file au clavier avec J et K, puis Entrée. L’échéance dit le temps restant avant le délai promis.",
      },
      mine: {
        title: "Vos examens",
        body: "Ceux que vous avez pris en charge, jusqu’à leur signature : vous les retrouvez ici sans chercher dans la file.",
      },
      training: {
        title: "S’exercer sans risque",
        body: "Des examens d’exemple pour prendre l’écran de lecture en main : rien de ce que vous y faites n’atteint un patient ni une clinique.",
      },
      search: {
        title: "Tout retrouver",
        body: "Un patient, un examen, un écran : tapez quelques lettres. Le raccourci ⌘ K, ou Ctrl K, l’ouvre de partout.",
      },
      help: {
        title: "Besoin d’aide ?",
        body: "Ce bouton relance cette visite, ouvre la formation, ou vous met en contact avec l’équipe IMAFRIK.",
      },
    },
    lecture: {
      viewer: {
        title: "Les images",
        body: "Faites défiler les coupes à la molette, fenêtrez et mesurez avec les outils du viewer. Le plein écran agrandit les images.",
      },
      clinical: {
        title: "Le renseignement clinique",
        body: "Ce qui accompagne l’examen. Tant que l’indication de votre compte-rendu est vide, un clic l’y recopie.",
      },
      claim: {
        title: "Prendre en charge",
        body: "Prenez l’examen en charge pour rédiger son compte-rendu. Sur un examen réel, il vous est alors réservé : personne d’autre ne peut l’écrire, et vous pouvez le rendre à tout moment.",
      },
      editor: {
        title: "Le compte-rendu",
        body: "Cinq sections, enregistrées automatiquement pendant que vous écrivez. Tapez / en début de ligne pour insérer une phrase type.",
      },
      templates: {
        title: "Vos modèles",
        body: "Un modèle remplit les sections encore vides : vous ne corrigez que ce qui diffère. Vos propres modèles s’enregistrent à partir d’un texte.",
      },
      sign: {
        title: "Signer",
        body: "La signature fige le texte et produit le PDF ; sur un examen réel, il porte un QR code de vérification. Toute correction ultérieure passe par un addendum.",
      },
      back: {
        title: "Revenir à la liste",
        body: "Ce bouton vous ramène à la liste d’où vous venez. Cette visite se relance depuis le bouton d’aide de la barre.",
      },
    },
    "clinique-accueil": {
      welcome: {
        title: "Bienvenue sur IMAFRIK",
        body: "En une minute, voici comment envoyer un examen, suivre sa lecture et récupérer son compte-rendu.",
      },
      send: {
        title: "Envoyer un examen",
        body: "Déposez les fichiers DICOM ou le dossier d’un CD. La console de votre établissement peut aussi envoyer les examens d’elle-même.",
      },
      stats: {
        title: "Suivre l’activité",
        body: "Examens envoyés, en cours de lecture, comptes-rendus prêts, et délai médian de la réception à la signature, sur trente jours.",
      },
      ready: {
        title: "Récupérer les comptes-rendus",
        body: "Dès qu’un compte-rendu est signé, il apparaît ici, prêt à télécharger en PDF.",
      },
      studies: {
        title: "Vos examens",
        body: "Le suivi de chaque examen, de l’envoi à la signature. Sur sa fiche, vous pouvez signaler une urgence et compléter le renseignement clinique.",
      },
      team: {
        title: "Votre équipe",
        body: "Invitez les collègues de votre établissement : chacun a son propre compte.",
      },
      help: {
        title: "Besoin d’aide ?",
        body: "Ce bouton relance cette visite, ou vous met en contact avec l’équipe IMAFRIK.",
      },
    },
    "equipe-cockpit": {
      welcome: {
        title: "La tour de contrôle",
        body: "Elle montre l’état de la plateforme et ce qui demande une action. Voici les écrans à connaître.",
      },
      alerts: {
        title: "Ce qui demande votre attention",
        body: "Examens en retard, dossiers de radiologues à valider, examens refusés à l’arrivée : chaque alerte mène à l’écran où agir.",
      },
      accounts: {
        title: "Les comptes",
        body: "Valider les dossiers des radiologues, rattacher un compte à une organisation, réinitialiser une double authentification.",
      },
      organisations: {
        title: "Les organisations",
        body: "Cliniques et groupes de radiologie, leurs contrats et leurs réglages.",
      },
      training: {
        title: "La formation",
        body: "Prévisualisez les cas d’exemple avant leur publication, et voyez qui s’est exercé dans la page des comptes.",
      },
      help: {
        title: "Besoin d’aide ?",
        body: "Ce bouton relance cette visite à tout moment, et ouvre la formation.",
      },
    },
  },
};
