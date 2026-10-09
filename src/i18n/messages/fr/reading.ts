/**
 * Textes de la zone « reading », en français : écran de lecture,
 * éditeur de compte-rendu, signature, addenda et modèles. Voir
 * `fr/common.ts` pour les conventions.
 *
 * Les titres des sections (`sections.titles`) servent aussi d'aperçu du
 * document imprimé : l'éditeur les prend dans la langue du
 * compte-rendu, pas dans celle de l'utilisateur.
 */
export const reading = {
  /** Écran de lecture, côté serveur. */
  page: {
    loading: "Ouverture de l’examen",
    claimedBy: (name: string) => `Examen pris en charge par ${name}.`,
    claimedByOther: "Examen pris en charge par un autre radiologue.",
    /** Radiologue dont le numéro d'ordre n'est pas validé : consultation seule. */
    credentialsMissing:
      "Renseignez votre numéro d’ordre dans vos paramètres : la prise en charge s’ouvrira après sa validation par l’équipe IMAFRIK.",
    credentialsPending:
      "Votre numéro d’ordre est en cours de vérification : la prise en charge s’ouvrira après sa validation par l’équipe IMAFRIK.",
  },
  /**
   * Langue du compte-rendu, quand elle diffère de celle de l'écran.
   * Indexé par la langue du compte-rendu.
   */
  reportLanguage: {
    chip: {
      fr: "Compte-rendu en français",
      en: "Compte-rendu en anglais",
    },
    tooltip: {
      fr: "Cette clinique reçoit ses comptes-rendus en français, comme le prévoit son contrat. Les titres des sections sont affichés tels qu’ils seront imprimés.",
      en: "Cette clinique reçoit ses comptes-rendus en anglais, comme le prévoit son contrat. Les titres des sections sont affichés tels qu’ils seront imprimés.",
    },
  },
  /** Espace de travail : barre de l'examen, actions, bandeaux. */
  workspace: {
    signed: "Signé",
    backupFound:
      "Du texte n’a pas pu être envoyé lors d’une coupure. Il est gardé sur ce poste.",
    backupRestore: "Reprendre",
    backupDiscard: "Écarter",
    backupConflictFound:
      "Une copie de votre texte est gardée sur ce poste, mais le brouillon enregistré a changé depuis : autre onglet, ou enregistrement dont la réponse s’est perdue. Reprendre la copie remplace le brouillon enregistré.",
    conflictBanner:
      "Ce brouillon a été modifié ailleurs. Votre texte reste gardé sur ce poste : enregistrez-le à la place de l’autre version, ou rechargez la version enregistrée (votre texte vous sera alors proposé).",
    conflictKeepMine: "Garder mon texte",
    conflictReload: "Recharger",
    conflictKept: "Votre texte est enregistré.",
    conflictKeepFailed:
      "Votre texte n’a pas pu être enregistré. Il reste gardé sur ce poste : réessayez dans un instant.",
    conflictSignedElsewhere:
      "Ce compte-rendu a été signé entre-temps et n’est plus modifiable. Votre texte reste gardé sur ce poste.",
    conflictBeforeSign:
      "Ce compte-rendu a été modifié ailleurs. Gardez votre texte ou rechargez la page avant de signer.",
    saveFailedBeforeSign:
      "Le texte n’a pas pu être enregistré. Vérifiez la connexion, puis signez de nouveau.",
    signedToast: "Compte-rendu signé et transmis à la clinique.",
    nextStudy: "Examen suivant",
    releaseConfirm:
      "Rendre cet examen au pool ? Le brouillon commencé sera effacé.",
    release: "Rendre au pool",
    sign: "Signer",
    claim: "Prendre en charge",
    signedBanner: "Compte-rendu signé et transmis : il n’est plus modifiable.",
    claimBanner:
      "Prenez l’examen en charge pour commencer le compte-rendu. Il vous sera réservé jusqu’à la signature, ou jusqu’à ce que vous le rendiez au pool.",
    clinicalInfo: "Renseignement clinique",
    copyToIndication: "Recopier dans l’indication clinique",
    indication: "Indication",
    panes: {
      label: "Volet affiché",
      images: "Images",
      report: "Compte-rendu",
    },
  },
  /** Sections du compte-rendu, par clé (`SectionKey`). */
  sections: {
    titles: {
      indication: "Indication clinique",
      technique: "Technique",
      comparatif: "Comparatif",
      resultats: "Résultats",
      conclusion: "Conclusion",
    },
    placeholders: {
      indication: "Motif de l’examen, renseignement clinique transmis…",
      technique: "Protocole d’acquisition, injection, reconstructions…",
      comparatif: "Examens antérieurs disponibles, ou absence de comparatif…",
      resultats: "Description par organe…",
      conclusion: "Synthèse diagnostique.",
    },
  },
  /** Éditeur de compte-rendu. */
  editor: {
    requiredTitle: "Section obligatoire pour signer",
    requiredLabel: "Section obligatoire, actuellement vide",
    offline: "Hors ligne : copie gardée sur ce poste",
    conflict: "Modifié ailleurs : texte gardé sur ce poste",
    outline: {
      label: "Sections du compte-rendu",
      filled: ", rédigée",
      requiredEmpty: ", obligatoire et vide",
      optionalEmpty: ", facultative et vide",
    },
    words: (count: number) => (count > 1 ? `${count} mots` : `${count} mot`),
    find: "Rechercher et remplacer (Ctrl+F)",
    reviewButton: (count: number) =>
      count === 0
        ? "Relecture : rien à signaler"
        : count === 1
          ? "Relecture : 1 point à vérifier"
          : `Relecture : ${count} points à vérifier`,
    shortcuts: "Raccourcis clavier",
    focusEnter: "Rédiger en plein écran",
    focusExit: "Quitter le plein écran",
    /** Aide sous la feuille : « Tapez / {slash} Tab {tab} ». */
    hint: {
      type: "Tapez",
      slash:
        "en début de ligne pour insérer une phrase type, un sous-titre ou un tableau de mesures ;",
      tab: "pour passer au champ à compléter suivant, puis à la section suivante.",
    },
    review: {
      title: "Relecture",
      withFindings:
        "Points à vérifier avant de signer. Ce sont des signalements, pas des erreurs certaines : vous restez seul juge de votre texte.",
      clean:
        "Rien à signaler : latéralité cohérente, aucun champ de modèle oublié, mesures avec leur unité.",
    },
  },
  /** Relecture automatique : natures et messages des points relevés. */
  review: {
    kinds: {
      laterality: "Latéralité",
      placeholder: "Modèle",
      unit: "Unité",
      repeat: "Répétition",
    },
    sides: { droit: "droit", gauche: "gauche" },
    lateralityFindings: (asked: string, described: string) =>
      `L’indication porte sur le côté ${asked}, les résultats ne décrivent que le côté ${described}.`,
    lateralityConclusion: (side: string, other: string) =>
      `La conclusion mentionne le côté ${side}, absent de l’indication et des résultats, qui ne parlent que du côté ${other}.`,
    placeholder: (text: string) =>
      `Passage de modèle non complété : « ${text} ».`,
    unit: (text: string) => `Mesure sans unité : « ${text} ».`,
    repeat: (text: string) => `Mot répété : « ${text} ».`,
  },
  /** Barre de mise en forme. */
  toolbar: {
    label: "Mise en forme",
    undo: "Annuler",
    redo: "Rétablir",
    subtitle: "Sous-titre",
    bold: "Gras",
    italic: "Italique",
    underline: "Souligné",
    strike: "Barré",
    highlight: "Surligner",
    superscript: "Exposant (cm², mm³)",
    subscript: "Indice",
    bulletList: "Liste à puces",
    orderedList: "Liste numérotée",
    outdent: "Diminuer le retrait",
    indent: "Augmenter le retrait",
    alignment: "Alignement",
    align: {
      left: "Aligner à gauche",
      center: "Centrer",
      right: "Aligner à droite",
      justify: "Justifier",
    },
    table: "Tableau",
    addRow: "Ajouter une ligne dessous",
    addColumn: "Ajouter une colonne à droite",
    headerRow: "Ligne d’en-tête",
    deleteRow: "Supprimer la ligne",
    deleteColumn: "Supprimer la colonne",
    deleteTable: "Supprimer le tableau",
    insertTable: "Insérer un tableau",
    tablePresets: {
      values: "2 × 2 : valeur et mesure",
      lesions: "3 × 3 : lésions et dimensions",
      followUp: "4 × 3 : suivi comparatif",
    },
    symbols: "Caractères spéciaux",
    insertSymbol: "Insérer un signe",
    /** Nom de chaque signe, par signe. */
    symbolNames: {
      "±": "plus ou moins",
      "×": "multiplié par (dimensions)",
      "°": "degré",
      µ: "micro",
      "²": "au carré",
      "³": "au cube",
      "≤": "inférieur ou égal",
      "≥": "supérieur ou égal",
      "<": "inférieur",
      ">": "supérieur",
      "≈": "environ",
      "→": "évolue vers",
      "↑": "augmentation",
      "↓": "diminution",
      Ø: "diamètre",
      "‰": "pour mille",
    },
    clearFormatting: "Effacer la mise en forme",
  },
  /**
   * Aide des raccourcis. `Mod` devient ⌘ sur Mac, Ctrl ailleurs ; les
   * touches sont séparées par des espaces, « · » sépare deux variantes.
   */
  shortcuts: {
    title: "Raccourcis clavier",
    description:
      "Ceux des traitements de texte courants, plus quelques gestes propres au compte-rendu.",
    groups: [
      {
        title: "Texte",
        entries: [
          { label: "Gras", keys: "Mod B" },
          { label: "Italique", keys: "Mod I" },
          { label: "Souligné", keys: "Mod U" },
          { label: "Barré", keys: "Mod ⇧ S" },
          { label: "Surligner", keys: "Mod ⇧ H" },
          { label: "Exposant", keys: "Mod ." },
          { label: "Indice", keys: "Mod ," },
        ],
      },
      {
        title: "Structure",
        entries: [
          { label: "Sous-titre", keys: "Mod Alt 3" },
          { label: "Liste à puces", keys: "Mod ⇧ 8" },
          { label: "Liste numérotée", keys: "Mod ⇧ 7" },
          { label: "Retrait dans une liste", keys: "Tab · ⇧ Tab" },
          { label: "Aligner à gauche / centrer", keys: "Mod ⇧ L · E" },
          { label: "Aligner à droite / justifier", keys: "Mod ⇧ R · J" },
        ],
      },
      {
        title: "Rédaction",
        entries: [
          { label: "Phrases types, tableau…", keys: "/" },
          {
            label: "Champ à compléter suivant / précédent",
            keys: "Tab · ⇧ Tab",
          },
          {
            label: "Section suivante / précédente",
            keys: "↓ · ↑ en bord de section",
          },
          { label: "Rechercher", keys: "Mod F" },
          { label: "Rechercher et remplacer", keys: "Ctrl H" },
          { label: "Annuler / rétablir", keys: "Mod Z · Mod ⇧ Z" },
          { label: "Quitter le plein écran", keys: "Échap" },
        ],
      },
      {
        title: "Saisie automatique",
        entries: [
          { label: "±", keys: "+/-" },
          { label: "≤ · ≥", keys: "<= · >=" },
          { label: "→ · ←", keys: "-> · <-" },
          { label: "…", keys: "..." },
        ],
      },
    ],
  },
  /** Menu « / ». Les phrases types sont du contenu : elles ne sont pas ici. */
  slash: {
    groups: { structure: "Structure", phrases: "Phrases types" },
    insert: "Insérer",
    noMatch: "Aucune commande ne correspond.",
    items: {
      subtitle: {
        title: "Sous-titre",
        hint: "Un organe, une région",
        keywords: "titre organe heading",
      },
      paragraph: {
        title: "Paragraphe",
        hint: "Texte courant",
        keywords: "texte normal",
      },
      bullets: { title: "Liste à puces", hint: "", keywords: "puces liste" },
      numbers: {
        title: "Liste numérotée",
        hint: "",
        keywords: "numeros liste ordre",
      },
      table: {
        title: "Tableau de mesures",
        hint: "3 colonnes, ligne d’en-tête",
        keywords: "tableau mesures dimensions",
      },
    },
  },
  /** Recherche et remplacement dans le compte-rendu. */
  find: {
    label: "Rechercher dans le compte-rendu",
    placeholder: "Rechercher dans le compte-rendu",
    noResult: "Aucun résultat",
    previous: "Occurrence précédente (Maj+Entrée)",
    next: "Occurrence suivante (Entrée)",
    matchCase: "Respecter la casse",
    replace: "Remplacer",
    close: "Fermer (Échap)",
    replaceWith: "Remplacer par",
    replaceAll: "Tout remplacer",
  },
  /** Confirmation de signature. */
  sign: {
    title: "Signer le compte-rendu",
    /** « Le compte-rendu de {patient} sera signé… {locked}{after} » */
    description: {
      before: "Le compte-rendu de",
      middle: (signer: string) =>
        `sera signé au nom de ${signer}, puis transmis à la clinique. Il deviendra`,
      locked: "non modifiable",
      after:
        " : toute correction ultérieure prendra la forme d’un addendum, visible par la clinique.",
    },
    missing: (count: number) =>
      count === 1
        ? "Une section obligatoire est vide"
        : `${count} sections obligatoires sont vides`,
    review: (count: number) =>
      count === 1
        ? "Relecture : un point à vérifier"
        : `Relecture : ${count} points à vérifier`,
    signAnyway: "Si c’est voulu, vous pouvez signer tel quel.",
    stillDraft: "Le compte-rendu reste un brouillon.",
    failed:
      "La signature n’a pas abouti. Le compte-rendu reste un brouillon ; vos modifications sont conservées.",
    keepWriting: "Continuer à rédiger",
    confirmAnyway: "Signer quand même",
    confirm: "Signer et transmettre",
  },
  /** Volet des images. */
  viewer: {
    frameTitle: (uid: string) => `Images de l’examen ${uid}`,
    series: (count: number) =>
      count > 1 ? `${count} séries` : `${count} série`,
    /** Nombre de coupes : le nombre, et sa forme écrite. 0 et 1 au singulier. */
    images: (count: number, formatted: string) =>
      `${formatted} ${count < 2 ? "coupe" : "coupes"}`,
    simulated: "Images simulées",
    openFullscreen: "Ouvrir les images en plein écran",
    fullscreen: "Plein écran",
    archivedTitle: "Images archivées",
    /** « … échue depuis le {date}{archivedAfter} » */
    archivedBefore:
      "La durée de conservation prévue au contrat de la clinique est échue depuis le",
    archivedAfter:
      " : les images ont quitté la plateforme. Le compte-rendu reste consultable, et les originaux sont conservés par la clinique.",
    unavailableTitle: "Images indisponibles",
    unavailableDetail:
      "Le jeton de visualisation n’a pas pu être obtenu. Actualisez la page ; si le problème persiste, l’examen est peut-être encore en cours de transfert depuis la clinique.",
  },
  /** Coupe simulée de la démonstration. */
  scan: {
    label: (slice: number, total: number) =>
      `Coupe simulée ${slice} sur ${total} (démonstration)`,
    series: "Série 2 · Axial",
    window: "F 400 · N 40",
    thickness: "Ép. 1,0 mm",
    /** Repères d'orientation : droite et gauche du patient. */
    right: "D",
    left: "G",
  },
  /** Modèles : page, bibliothèque, outils de l'écran de lecture. */
  templates: {
    description:
      "À appliquer depuis l’écran de lecture ; à créer depuis un compte-rendu en cours",
    emptyTitle: "Aucun modèle",
    emptyDetail:
      "Dans l’écran de lecture, « Enregistrer comme modèle » transforme le texte en cours en modèle pour toute l’organisation.",
    search: "Rechercher un modèle",
    searchPlaceholder: "Nom, région…",
    modality: "Modalité",
    allModalities: "Toutes",
    noMatch: "Aucun modèle ne correspond à cette recherche.",
    allRegions: "Toutes régions",
    anyModality: "Toutes modalités",
    organisation: "Organisation",
    providedByImafrik: "Fourni par IMAFRIK",
    noneSelected: "Aucun modèle sélectionné",
    /** Nom courant d'une modalité DICOM, pour le filtre. */
    modalityNames: {
      CT: "Scanner",
      MR: "IRM",
      CR: "Radiographie",
      DX: "Radiographie",
      US: "Échographie",
      MG: "Mammographie",
    } as Record<string, string>,
    deleteConfirm: (name: string) =>
      `Supprimer le modèle « ${name} » pour toute l’organisation ?`,
    deleted: "Modèle supprimé.",
    picker: "Modèle",
    pickerLabel: "Compléter les sections vides",
    applied: (count: number) =>
      count > 1
        ? `Modèle appliqué : ${count} sections complétées.`
        : `Modèle appliqué : ${count} section complétée.`,
    nothingApplied:
      "Toutes les sections étaient déjà rédigées : rien n’a été remplacé.",
    saveAs: "Enregistrer comme modèle",
    saveAsDescription:
      "Le texte actuel des cinq sections devient un modèle, proposé à vos collègues pour les examens de même modalité. Retirez d’abord tout ce qui est propre à ce patient.",
    name: "Nom du modèle",
    namePlaceholder: "TDM thoracique normale",
    region: "Région",
    saved: "Modèle enregistré.",
    nameRequired: "Donnez un nom au modèle",
    createDemoAction: "La création d’un modèle",
    deleteDemoAction: "La suppression d’un modèle",
  },
  /** Addenda d'un compte-rendu signé. */
  addenda: {
    title: "Addenda",
    license: (number: string) => `Ordre n° ${number}`,
    none: "Aucune correction depuis la signature.",
    confirm:
      "Ajouter cet addendum ? Il sera signé à votre nom, visible de la clinique, et ne pourra plus être modifié.",
    added: "Addendum ajouté et transmis.",
    label: "Nouvel addendum",
    placeholder: "Correction ou complément au compte-rendu signé…",
    submit: "Signer l’addendum",
  },
  /** Messages des actions serveur du circuit de lecture. */
  actions: {
    releaseDemoAction: "Rendre un examen",
    signDemoAction: "La signature",
    pdfDemoAction: "Le téléchargement du PDF",
    addendumDemoAction: "L’ajout d’un addendum",
    invalidDraft: "Brouillon invalide.",
    addendumEmpty: "L’addendum est vide.",
    addendumTooLong: "L’addendum dépasse 10 000 caractères.",
  },
};
