/**
 * Espace de formation, en français : s'exercer sur de vrais examens
 * anonymisés, sans jamais toucher un patient (docs/formation.md du
 * backend).
 */
export const training = {
  page: {
    title: "Formation",
    description:
      "Des examens réels anonymisés, pour prendre l’outil en main sans patient ni clinique.",
    stepsTitle: "Le parcours, comme sur un vrai examen",
    steps: [
      "Prenez l’exercice en charge.",
      "Lisez les images et rédigez, avec vos modèles.",
      "Signez l’exercice, puis téléchargez son PDF spécimen.",
      "Comparez au corrigé quand il existe, et recommencez quand vous voulez.",
    ],
    emptyTitle: "Les exercices arrivent",
    emptyDetail:
      "Les trois examens de formation sont en préparation. Ils apparaîtront ici dès qu’un radiologue aura relu leur contexte clinique.",
  },
  states: {
    todo: "À faire",
    draft: "En cours",
    submitted: "Signé",
  },
  actions: {
    start: "Commencer",
    resume: "Reprendre",
    review: "Revoir",
    preview: "Prévisualiser",
  },
  underReview: "En relecture",
  underReviewHint:
    "Visible de l’équipe IMAFRIK seulement, le temps qu’un radiologue relise le contexte clinique.",
  reviewedBy: (name: string) => `Contexte relu par ${name}`,
  source: (name: string, license: string) =>
    `Images : ${name}, licence ${license}.`,
  sourceLink: "Voir la source",
  hasReference: "Corrigé disponible",
  /** Clinique affichée en tête de l'écran de lecture. */
  facility: "Espace de formation IMAFRIK",
  caseId: (position: number) =>
    `IMAFRIK-FORMATION-${String(position).padStart(2, "0")}`,
  workspace: {
    notice:
      "Exercice de formation : rien de ce que vous faites ici n’atteint un patient ni une clinique.",
    previewNotice:
      "Prévisualisation : ce cas est en relecture. L’exercice s’ouvrira une fois le cas publié.",
    claim: "Commencer l’exercice",
    claimBanner:
      "Prenez l’exercice en charge pour rédiger, comme sur un vrai examen.",
    sign: "Signer l’exercice",
    signedToast: "Exercice signé. Son PDF spécimen est prêt.",
    signedBanner:
      "Exercice signé : le texte est figé, comme un vrai compte-rendu. Un addendum reste possible.",
    release: "Recommencer",
    releaseConfirm:
      "Effacer cet exercice et recommencer ? Le texte rédigé sera perdu.",
  },
  sign: {
    title: "Signer l’exercice",
    description: {
      before: "L’exercice",
      middle: (signer: string) =>
        `sera signé au nom de ${signer}, comme un vrai compte-rendu, mais ne sera transmis à personne. Il deviendra`,
      locked: "non modifiable",
      after: " : une correction prendra la forme d’un addendum, comme en vrai.",
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
    stillDraft: "L’exercice reste en cours.",
    failed:
      "La signature n’a pas abouti. L’exercice reste en cours ; vos modifications sont conservées.",
    keepWriting: "Continuer à rédiger",
    confirmAnyway: "Signer quand même",
    confirm: "Signer l’exercice",
  },
  afterword: {
    title: "Après la signature",
    pdf: "Télécharger le PDF spécimen",
    pdfHint:
      "La vraie mise en page, sans valeur médicale : filigrane sur chaque page, aucun QR code.",
    pdfDemo: "Le PDF spécimen n’est pas produit en démonstration.",
    reference: "Corrigé",
    referenceBy: (name: string) => `Rédigé ou validé par ${name}.`,
    noReference:
      "Pas encore de corrigé pour ce cas : il n’en aura qu’une fois validé par un radiologue.",
    addenda: "Addenda de l’exercice",
    addendumLabel: "Nouvel addendum",
    addendumPlaceholder:
      "Précision ou correction, comme sur un vrai compte-rendu…",
    addendumSave: "Ajouter l’addendum",
    addendumAdded: "Addendum ajouté.",
    restart: "Recommencer l’exercice",
    restarted: "Exercice effacé : vous pouvez recommencer.",
  },
  errors: {
    invalidDraft: "Le texte de l’exercice est illisible : rechargez la page.",
    emptyAddendum: "L’addendum est vide.",
    demo: "Disponible sur un vrai compte : en démonstration, l’exercice n’est pas enregistré.",
  },
  admin: {
    label: "Formation",
    progress: (done: number, total: number) =>
      `${done} exercice${done > 1 ? "s" : ""} signé${done > 1 ? "s" : ""} sur ${total}`,
    inProgress: (count: number) =>
      count === 1 ? "un en cours" : `${count} en cours`,
    none: "Pas encore d’exercice",
  },
  onboarding: {
    link: "S’exercer sur trois examens d’exemple",
    hint: "Scanner, IRM et radiographie, dans le vrai écran de lecture, sans patient.",
  },
};
