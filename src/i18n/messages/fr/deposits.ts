/**
 * Dépôt d'une archive ZIP d'images, depuis le navigateur : l'envoi, la
 * liste des dépôts et le compte rendu de chacun, pour le responsable de
 * la clinique et pour l'équipe IMAFRIK.
 *
 * Les textes disent ce qui se passe vraiment : une connexion reste
 * nécessaire pendant l'envoi, mais il reprend après chaque coupure ;
 * l'archive est contrôlée avant que ses images n'entrent sur la
 * plateforme ; un fichier écarté est nommé, avec sa raison.
 */
export const deposits = {
  metaTitle: "Dépôts d’images",
  title: "Dépôts d’images",
  description: (clinic: string) =>
    `Archives ZIP envoyées depuis le navigateur · ${clinic}`,
  teamDescription:
    "Archives ZIP déposées par les cliniques, ou par l’équipe en leur nom",
  /** Bouton de l'écran « Examens ». */
  depositAction: "Déposer des images",
  /** Ce qui est indisponible en démonstration. */
  demoAction: "Le dépôt d’une archive",
  demoCancel: "L’annulation d’un dépôt",

  uploader: {
    section: "Déposer une archive ZIP",
    sectionTip:
      "L’archive part par morceaux. Après une coupure, l’envoi reprend à l’octet près : rien de ce qui est arrivé n’est renvoyé.",
    dropTitle: "Glissez une archive ZIP ici",
    dropDetail: (max: string) =>
      `L’export DICOM d’un examen ou d’un CD, compressé en ZIP. ${max} au plus par archive.`,
    choose: "Choisir une archive",
    chooseMany:
      "Une ou plusieurs archives : elles partent l’une après l’autre.",
    honestTitle: "Une connexion reste nécessaire pendant l’envoi",
    honest:
      "Si elle se coupe, l’envoi s’arrête puis reprend seul, là où il s’était arrêté, dès le retour du réseau.",
    honestClosed: (hours: number) =>
      `Page fermée ou ordinateur éteint ? Choisissez de nouveau le même fichier dans les ${hours} heures : l’envoi reprend où il en était, même depuis un autre poste.`,
    limits: "Ce que le service accepte",
    limitsTip: (archive: string, files: string, file: string) =>
      `${archive} et ${files} au plus par archive, ${file} par image. Seuls les fichiers DICOM sont retenus ; les autres sont listés dans le compte rendu.`,
    demoNotice: "Démonstration : l’envoi est simulé, rien ne quitte ce poste.",
    onBehalf: (clinic: string) =>
      `Dépôt au nom de ${clinic}, tracé à votre nom au journal d’audit.`,
    chooseClinicFirst:
      "Choisissez d’abord la clinique au nom de laquelle vous déposez.",
    checking: "Préparation de l’envoi…",
    resuming: (percent: number) => `Reprise de l’envoi à ${percent} %`,
    percent: (percent: number) => `${percent} %`,
    of: (sent: string, total: string) => `${sent} sur ${total}`,
    rate: (rate: string) => `${rate}/s`,
    measuring: "Mesure du débit…",
    remaining: (duration: string) => `reste environ ${duration}`,
    underAMinute: "moins d’une minute",
    offline:
      "Connexion perdue. L’envoi reprendra seul dès le retour du réseau.",
    paused: "En pause",
    received: "Archive reçue. Contrôle en cours : le compte rendu suit.",
    cancelled: "Envoi annulé : ce qui était reçu est effacé.",
    pause: "Pause",
    resume: "Reprendre",
    cancel: "Annuler l’envoi",
    remove: "Retirer de la liste",
    report: "Voir le compte rendu",
    refused: {
      not_zip: "Ce fichier n’est pas une archive ZIP.",
      too_large: (max: string) =>
        `Archive trop volumineuse : ${max} au plus. Découpez-la en plusieurs archives.`,
      empty: "Ce fichier est vide.",
    },
    refusedStatus: (status: number) =>
      `Envoi refusé par le service (code ${status}).`,
    tokenRefused:
      "Votre session ne permet plus de déposer : rechargez la page, puis choisissez de nouveau le fichier.",
    unavailable: "Dépôt indisponible pour le moment.",
    leaving:
      "Un envoi est en cours. Si vous quittez la page, il s’arrête ; il reprendra quand vous choisirez de nouveau le même fichier.",
  },

  list: {
    title: "Mes dépôts",
    teamTitle: "Dépôts",
    columns: {
      date: "Déposé le",
      file: "Archive",
      clinic: "Clinique",
      author: "Par",
      state: "État",
      result: "Résultat",
    },
    tips: {
      state:
        "En cours d’envoi : l’archive n’est pas entièrement arrivée. En contrôle : elle est arrivée et ses images sont vérifiées. Intégré : le compte rendu est établi. Refusé : l’archive entière a été écartée. Abandonné : envoi annulé, ou sans nouvel octet pendant 72 heures.",
      result:
        "Examens et images transmis, et fichiers ignorés. Le compte rendu les détaille.",
    },
    teamAuthor: "Équipe IMAFRIK",
    empty: "Aucun dépôt pour le moment",
    emptyDetail:
      "Les archives que vous déposez apparaissent ici, avec leur compte rendu.",
    teamEmpty: "Aucun dépôt dans le réseau",
    limited: "Les 500 dépôts les plus récents.",
    received: (received: string, total: string) => `${received} sur ${total}`,
    interrupted: (date: string) =>
      `Interrompu. Choisissez de nouveau ce fichier avant le ${date} pour reprendre.`,
    waiting: "Contrôle de l’archive en cours",
    result: (studies: number, instances: number) =>
      `${studies > 1 ? `${studies} examens` : `${studies} examen`} · ${
        instances > 1 ? `${instances} images` : `${instances} image`
      }`,
    ignored: (count: number) =>
      count > 1 ? `${count} fichiers ignorés` : "1 fichier ignoré",
    resume: "Reprendre",
    resumeLabel: (file: string) => `Reprendre l’envoi de ${file}`,
    cancel: "Annuler",
    cancelLabel: (file: string) => `Annuler l’envoi de ${file}`,
    cancelConfirm: (file: string) =>
      `Annuler l’envoi de « ${file} » ? Ce qui est déjà reçu sera effacé.`,
    cancelled: "Envoi annulé",
    keep: "Garder l’envoi",
    open: "Compte rendu",
    openLabel: (file: string) => `Compte rendu du dépôt ${file}`,
  },

  /** États d'un dépôt, tels que les listes les filtrent. */
  states: {
    uploading: "En cours d’envoi",
    processing: "En contrôle",
    done: "Intégré",
    refused: "Refusé",
    abandoned: "Abandonné",
  },

  /** Étapes précises, pour le compte rendu. */
  statuses: {
    uploading: "Envoi en cours, ou interrompu",
    received: "Archive reçue, en attente de contrôle",
    processing: "Contrôle en cours",
    done: "Compte rendu établi",
    refused: "Archive refusée",
    cancelled: "Envoi annulé",
    expired: "Envoi abandonné (72 heures sans octet reçu)",
  },

  /** Raisons d'un refus de toute l'archive, et ce qu'il faut faire. */
  refusals: {
    not_a_zip: {
      title: "Ce fichier n’est pas une archive ZIP lisible",
      action:
        "Recréez l’archive : clic droit sur le dossier exporté, « Envoyer vers », « Dossier compressé ».",
    },
    split_archive: {
      title: "Archive en plusieurs parties",
      action:
        "Envoyez une archive d’un seul tenant, ou plusieurs archives séparées.",
    },
    too_many_files: {
      title: "Trop de fichiers dans l’archive",
      action:
        "10 000 fichiers au plus : découpez l’export en plusieurs archives, un examen par archive par exemple.",
    },
    too_large_uncompressed: {
      title: "Archive trop volumineuse une fois décompressée",
      action:
        "8 Go décompressés au plus : découpez l’export en plusieurs archives.",
    },
    suspicious_compression: {
      title: "Taux de compression anormal",
      action:
        "L’archive se décompresse bien au-delà de ce qu’une image permet : elle a été écartée par sécurité. Recréez-la à partir du dossier d’images.",
    },
    unsafe_path: {
      title: "Archive écartée par sécurité",
      action:
        "Elle contient un chemin qui sort de son dossier, ou un lien. Recréez-la à partir du dossier d’images exporté par la console.",
    },
    empty_archive: {
      title: "Archive vide",
      action: "Vérifiez que le dossier compressé contient bien les images.",
    },
    clinic_inactive: {
      title: "Clinique suspendue",
      action:
        "Les dépôts reprendront avec l’activité de la clinique. Contactez l’équipe IMAFRIK.",
    },
    pacs_unavailable: {
      title: "Le serveur d’images n’a pas répondu pendant 72 heures",
      action:
        "L’équipe IMAFRIK est prévenue. Déposez de nouveau l’archive : les images déjà reçues ne seront pas comptées deux fois.",
    },
    processing_failed: {
      title: "Le contrôle de l’archive a échoué",
      action:
        "L’équipe IMAFRIK est prévenue. Déposez de nouveau l’archive dans quelques heures.",
    },
  },

  /** Raisons d'un fichier ignoré. */
  reasons: {
    other_clinic: {
      label: "Examen d’une autre clinique",
      detail:
        "Cet examen est déjà rattaché à une autre clinique, ou arrive par la passerelle d’une autre : rien n’en a été transmis.",
    },
    not_dicom: {
      label: "Pas une image DICOM",
      detail:
        "Document, image ordinaire ou fichier DICOM sans son en-tête de fichier (Part 10).",
    },
    invalid_dicom: {
      label: "DICOM incomplet",
      detail:
        "Il manque un identifiant indispensable (examen, série ou image), ou ils ne concordent pas.",
    },
    corrupt: {
      label: "Fichier corrompu",
      detail:
        "Données abîmées dans l’archive, ou image tronquée. Réexportez l’examen depuis la console.",
    },
    encrypted: {
      label: "Fichier chiffré",
      detail:
        "Protégé par un mot de passe dans l’archive. Recréez l’archive sans mot de passe.",
    },
    pacs_refused: {
      label: "Refusé par le serveur d’images",
      detail: "Le serveur d’images n’a pas pu lire ce fichier DICOM.",
    },
    too_large: {
      label: "Fichier trop volumineux",
      detail: "Plus de 512 Mo pour une seule image.",
    },
    suspicious_compression: {
      label: "Taux de compression anormal",
      detail:
        "Le fichier se décompresse bien au-delà de ce qu’une image permet : écarté par sécurité.",
    },
    unsupported_compression: {
      label: "Compression non prise en charge",
      detail:
        "Recréez l’archive avec la compression habituelle (« Dossier compressé » de Windows).",
    },
    nested_archive: {
      label: "Archive dans l’archive",
      detail: "Une archive n’est pas ouverte : décompressez-la avant.",
    },
    dicomdir: {
      label: "Sommaire du CD",
      detail: "Le fichier DICOMDIR décrit le CD, il ne contient pas d’image.",
    },
    system_file: {
      label: "Fichier du système",
      detail:
        "Ajouté par Windows ou macOS à l’archive, sans rapport avec l’examen.",
    },
  },

  report: {
    back: "Dépôts d’images",
    teamBack: "Dépôts",
    title: (file: string) => `Dépôt ${file}`,
    meta: (date: string, author: string, size: string) =>
      `Déposé le ${date} par ${author} · ${size}`,
    entries: (count: number) =>
      count > 1
        ? `${count} fichiers dans l’archive`
        : "1 fichier dans l’archive",
    summary: "Résultat",
    figures: {
      studies: "Examens",
      series: "Séries",
      instances: "Images transmises",
      duplicates: "Doublons",
      ignored: "Fichiers ignorés",
    },
    tips: {
      studies:
        "Examens dont au moins une image a été transmise. Ils arrivent dans « Examens », « à attribuer », une minute environ après le contrôle.",
      series: "Séries des examens transmis.",
      instances: "Images entrées sur la plateforme par ce dépôt.",
      duplicates:
        "Images présentes deux fois dans l’archive, ou déjà reçues par IMAFRIK : envoyées une seule fois, jamais comptées deux fois.",
      ignored:
        "Fichiers de l’archive écartés : leur raison est donnée plus bas.",
    },
    studiesSection: "Examens trouvés dans l’archive",
    columns: {
      patient: "Patient",
      modality: "Modalité",
      date: "Date de l’examen",
      series: "Séries",
      images: "Images",
      duplicates: "Doublons",
      state: "Intégration",
    },
    integrated: "Intégré",
    open: "Ouvrir l’examen",
    pending: "En cours d’intégration",
    pendingTip:
      "L’examen apparaît une minute environ après sa dernière image, le temps que le serveur d’images le sache complet.",
    refusedStudy: "Non transmis",
    unknownPatient: "Patient à venir",
    ignoredSection: "Fichiers ignorés",
    ignoredCount: (count: number) =>
      count > 1 ? `${count} fichiers` : "1 fichier",
    showFiles: (count: number) =>
      count > 1 ? `Voir les ${count} fichiers` : "Voir le fichier",
    listedOnly: (shown: number, total: number) =>
      `${shown} fichiers nommés sur ${total} ignorés.`,
    noneIgnored:
      "Aucun fichier ignoré : tout ce que contenait l’archive a été retenu.",
    refusedTitle: "Archive refusée",
    uploadingTitle: "Envoi interrompu",
    uploadingDetail: (received: string, total: string, date: string) =>
      `${received} reçus sur ${total}. Choisissez de nouveau le même fichier dans « Dépôts d’images » avant le ${date} : l’envoi reprendra là.`,
    processingTitle: "Contrôle en cours",
    processingDetail:
      "L’archive est arrivée. Ses images sont vérifiées puis transmises : cette page se met à jour d’elle-même.",
    abandonedTitle: "Envoi abandonné",
    abandonedDetail:
      "Ce qui avait été reçu est effacé. Déposez de nouveau l’archive pour l’envoyer.",
    nothingAccepted:
      "Aucune image n’a été retenue : voyez pourquoi dans les fichiers ignorés.",
  },

  chooseClinic: "Clinique",
  chooseClinicPlaceholder: "Choisir une clinique",
};
