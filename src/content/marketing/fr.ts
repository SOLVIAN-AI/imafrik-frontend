import type { MarketingCopy } from "@/content/marketing/types";

/**
 * Textes du site public, en français.
 *
 * Langue de référence : les adresses, les ancres et le droit applicable
 * sont français, et la version anglaise en est la traduction.
 */
export const fr: MarketingCopy = {
  meta: {
    homeTitle: "IMAFRIK · Téléradiologie pour l’Afrique",
    homeDescription:
      "Le compte-rendu de vos examens le jour même. Une passerelle logicielle sur un de vos postes, et vos manipulateurs ne changent rien à leurs habitudes.",
    securityTitle: "Sécurité et conformité",
    securityDescription:
      "Chiffrement, cloisonnement par établissement, journal d’accès, hébergement européen, réversibilité : les garanties d’IMAFRIK sur les données de santé.",
    contactTitle: "Demander une démonstration",
    contactDescription:
      "Trente minutes pour voir le parcours complet d’un examen, de l’envoi au compte-rendu signé.",
    verifyTitle: "Vérification d’un compte-rendu",
    verifyDescription:
      "Vérifiez l’authenticité d’un compte-rendu IMAFRIK à partir du code figurant sur le document.",
  },
  languageSwitch: { label: "Langue du site" },
  nav: {
    links: [
      { href: "/#fonctionnement", label: "Fonctionnement" },
      { href: "/#profils", label: "Cliniques & radiologues" },
      { href: "/securite", label: "Sécurité" },
      { href: "/#tarifs", label: "Tarifs" },
    ],
    signIn: "Se connecter",
    demoShort: "Démonstration",
    demoLong: "Demander une démonstration",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    home: "Accueil IMAFRIK",
  },
  footer: {
    tagline:
      "Téléradiologie pour l’Afrique. Vos examens lus par des radiologues inscrits à l’Ordre, sans investissement matériel.",
    columns: [
      {
        title: "Produit",
        links: [
          { href: "/#fonctionnement", label: "Fonctionnement" },
          { href: "/#profils", label: "Pour les cliniques" },
          { href: "/#profils", label: "Pour les radiologues" },
          { href: "/#tarifs", label: "Tarifs" },
        ],
      },
      {
        title: "Confiance",
        links: [
          { href: "/securite", label: "Sécurité et conformité" },
          { href: "/confidentialite", label: "Données personnelles" },
          { href: "/cgu", label: "Conditions d’utilisation" },
          { href: "/mentions-legales", label: "Mentions légales" },
        ],
      },
      {
        title: "Contact",
        links: [
          { href: "/contact", label: "Demander une démonstration" },
          { href: "/connexion", label: "Accéder à mon compte" },
        ],
      },
    ],
    publisher: "IMAFRIK est un service édité par SOLVIAN AI LLC, Lomé, Togo.",
    hosting: "Images hébergées dans l’Union européenne, chiffrées au repos.",
  },
  appPreview: {
    windowLabel: "file de lecture",
    metrics: {
      toRead: "À lire",
      urgent: "Urgences",
      turnaround: "Délai moyen",
      turnaroundShort: "Délai",
    },
    turnaroundValue: "1 h 50",
    states: {
      toRead: "À lire",
      inProgress: "En cours",
      reported: "Rendu",
      assigned: "Attribué",
    },
    exams: [
      "CT · Thorax",
      "MR · Crâne",
      "CR · Thorax",
      "CT · Abdomen",
      "US · Pelvis",
    ],
  },
  hero: {
    badge: "Téléradiologie pour l’Afrique",
    title: {
      before: "Le compte-rendu de vos examens, ",
      highlight: "le jour même",
      after: ".",
    },
    lead: "Nous installons une passerelle sur un poste de votre établissement. Vos manipulateurs y envoient les examens comme à n’importe quelle destination du réseau interne. Un radiologue les lit à distance et signe le compte-rendu.",
    primaryCta: "Demander une démonstration",
    secondaryCta: "Voir les garanties de sécurité",
    commitmentsTitle: "Nos engagements de délai",
    commitments: [
      { value: "2 h", label: "Examen de routine" },
      { value: "30 min", label: "Urgence" },
      { value: "7 j/7", label: "Nuits et week-ends compris" },
    ],
    commitmentsNote:
      "Délais fixés au contrat, à compter de la réception de l’examen.",
  },
  howItWorks: {
    eyebrow: "Fonctionnement",
    title: "Trois étapes, rien à installer sur vos postes",
    lead: "Entre l’acquisition et le compte-rendu signé, il n’y a que le temps de lecture du radiologue.",
    steps: [
      {
        title: "La passerelle reçoit",
        detail:
          "Vos modalités envoient l’examen à un poste de l’établissement, comme à n’importe quelle destination du réseau interne. Il accepte immédiatement, même si la liaison est coupée.",
        note: "Un logiciel à installer, aucun matériel à acheter",
      },
      {
        title: "Un radiologue lit",
        detail:
          "L’examen part vers la plateforme dès que la liaison le permet, compressé et chiffré. Il entre dans une file de travail ; les urgences remontent en tête.",
        note: "Images et compte-rendu côte à côte",
      },
      {
        title: "Le compte-rendu est signé",
        detail:
          "Signature nominative, document verrouillé, transmis à l’établissement. Un code imprimé permet d’en vérifier l’authenticité en ligne.",
        note: "PDF disponible immédiatement",
      },
    ],
    uploadNote:
      "Pas encore de passerelle, ou un examen gravé sur CD ? Les fichiers se déposent depuis un navigateur, sans rien installer.",
  },
  audiences: {
    eyebrow: "Deux métiers",
    title: "Le même service, vu des deux côtés",
    lead: "Une clinique et un radiologue n’attendent pas la même chose d’une plateforme. Chacun dispose de son propre portail.",
    clinics: {
      eyebrow: "Pour les cliniques",
      title: "Un service de radiologie, sans radiologue sur place",
      points: [
        "Passerelle logicielle installée sur un de vos postes, sans matériel à acheter",
        "Rien à administrer : ni serveur, ni licence, ni sauvegarde",
        "Vos examens restent consultables sur place, même Internet coupé",
        "Suivi de chaque examen envoyé, jusqu’au compte-rendu signé",
        "Continuité la nuit, le week-end et pendant les congés",
      ],
      cta: "Demander une démonstration",
    },
    radiologists: {
      eyebrow: "Pour les radiologues",
      title: "Lire depuis là où vous êtes, avec un outil qui suit",
      points: [
        "File de travail commune, urgences signalées",
        "Images et compte-rendu en écran scindé",
        "Modèles par modalité et par région anatomique",
        "Signature nominative, document verrouillé après signature",
        "Lecture depuis n’importe quel poste, sans installation",
      ],
      cta: "Rejoindre le réseau",
    },
  },
  securityTeaser: {
    eyebrow: "Confiance",
    title: "Des données de santé, traitées comme telles",
    lead: "La sécurité n’est pas une option activable : elle est intégrée à l’architecture du service.",
    guarantees: [
      {
        title: "Rien en clair sur Internet",
        detail:
          "Les images voyagent chiffrées de la passerelle jusqu’à nos serveurs, dans un réseau privé, et le restent au stockage.",
      },
      {
        title: "Cloisonnement par établissement",
        detail:
          "L’isolation est appliquée par la base de données, pas seulement par l’interface : une erreur dans le code de l’application ne suffit pas à l’ouvrir.",
      },
      {
        title: "Journal d’accès complet",
        detail:
          "Chaque consultation d’examen est enregistrée, horodatée et attribuable à une personne nommée.",
      },
      {
        title: "Hébergement européen",
        detail:
          "Stockage dans l’Union européenne. Durée de conservation fixée au contrat, export complet sur simple demande.",
      },
    ],
    more: "Le détail des garanties et de la conformité",
  },
  pricing: {
    eyebrow: "Tarifs",
    title: "À l’acte, sans abonnement.",
    lead: "Vous payez les examens lus. Le tarif unitaire dépend de la modalité et du délai retenu ; il est fixé au contrat et n’évolue pas en cours d’année.",
    includedTitle: "Compris dans chaque contrat",
    included: [
      "Installation et supervision de la passerelle",
      "Stockage et archivage des examens",
      "Portail clinique et accès pour toute l’équipe",
      "Comptes-rendus signés, PDF et vérification en ligne",
      "Assistance au raccordement des modalités",
    ],
    noCommitment: "Aucun engagement de volume n’est demandé à l’établissement.",
    quoteTitle: "Obtenir une grille",
    quoteText:
      "Dites-nous votre volume mensuel et vos modalités : nous vous adressons une proposition chiffrée.",
    quoteCta: "Demander une proposition",
  },
  faq: {
    eyebrow: "Questions",
    title: "Ce qu’on nous demande avant de signer",
    entries: [
      {
        question: "Faut-il changer notre installation ?",
        answer:
          "Non. La passerelle est un logiciel que nous installons sur un poste de l’établissement ; vos modalités lui envoient les examens comme à n’importe quelle destination du réseau interne. Si vous avez déjà un PACS, il reste en place.",
      },
      {
        question: "Quel ordinateur faut-il pour la passerelle ?",
        answer:
          "Un poste bureautique sous Windows 10 ou plus récent, avec une centaine de gigaoctets libres : la passerelle garde une copie des examens sur place. Une seule exigence, mais elle est ferme : il doit rester allumé, sinon les examens ne partent pas. Un poste dédié vaut mieux qu’un poste partagé qu’on éteint le soir. Nous recommandons d’activer le chiffrement de son disque (BitLocker), et vous y aidons à l’installation.",
      },
      {
        question: "Que se passe-t-il si Internet ou le courant est coupé ?",
        answer:
          "L’examen est accepté quand même : la passerelle le conserve et le transfère dès que la liaison revient. Vos images restent consultables sur place pendant la coupure. C’est sa raison d’être : une console d’acquisition, elle, ne garde pas les envois qui échouent.",
      },
      {
        question: "Qui signe le compte-rendu, et qui en est responsable ?",
        answer:
          "Un radiologue nommément identifié, inscrit à un ordre professionnel, dont le numéro figure sur le document. La responsabilité de l’interprétation lui incombe, comme pour un examen lu sur place. IMAFRIK assure la transmission et la traçabilité.",
      },
      {
        question:
          "Qui crée les comptes, et comment un radiologue est-il admis ?",
        answer:
          "Votre établissement crée lui-même les comptes de son personnel, depuis son portail. Un radiologue qui souhaite lire pour le réseau en fait la demande par le formulaire de contact, avec son numéro d’ordre. L’équipe IMAFRIK le vérifie auprès de l’Ordre des médecins : tant que ce n’est pas fait, aucun examen ne lui est accessible, y compris s’il a été invité par une clinique.",
      },
      {
        question: "Où sont stockées les images de nos patients ?",
        answer:
          "Sur la passerelle de votre établissement, et sur nos serveurs dans l’Union européenne, chiffrées. Elles restent la propriété de l’établissement, qui en reçoit l’export complet sur simple demande. Leur durée de conservation sur nos serveurs est fixée au contrat.",
      },
      {
        question: "Combien de temps prend la mise en service ?",
        answer:
          "L’installation de la passerelle et le raccordement des modalités se planifient avec votre technicien. Le dépôt depuis un navigateur, lui, est utilisable dès la création du compte : vous pouvez envoyer votre premier examen sans attendre.",
      },
      {
        question: "Peut-on essayer avant de s’engager ?",
        answer:
          "Oui. La démonstration se fait sur des examens de test, sans aucune donnée patient. Les premiers examens réels peuvent être traités sous convention d’essai avant contrat.",
      },
    ],
  },
  finalCta: {
    title: {
      before: "Voyons ce que cela donnerait ",
      highlight: "chez vous",
      after: ".",
    },
    text: "Trente minutes suffisent : vous nous décrivez votre installation et votre volume, nous vous montrons le parcours complet d’un examen, de l’envoi au compte-rendu signé.",
    primary: "Demander une démonstration",
    secondary: "J’ai déjà un compte",
  },
  securityPage: {
    eyebrow: "Sécurité",
    title: "Ce que nous garantissons sur vos données",
    lead: "Confier les examens de ses patients à un tiers engage la responsabilité de l’établissement. Cette page dit précisément ce qu’il advient d’une image entre le moment où elle quitte votre console et celui où elle est supprimée.",
    chapters: [
      {
        title: "En transit",
        detail:
          "Entre la clinique et la plateforme, les examens voyagent dans un réseau privé chiffré ; le portail ne répond qu’en HTTPS. Entre nos services, les échanges restent à l’intérieur du serveur, et tout ce qui en sort (base de données, stockage) est chiffré. Aucun examen ne traverse Internet en clair.",
      },
      {
        title: "Au repos",
        detail:
          "Images et comptes-rendus sont chiffrés au repos dans un stockage objet dédié, distinct de la base de données ; les sauvegardes sont chiffrées avant de quitter le serveur. Un accès à l’un ne donne pas accès à l’autre.",
      },
      {
        title: "Cloisonnement",
        detail:
          "Chaque organisation ne voit que ses examens. L’isolation est appliquée par la base elle-même, à chaque requête, et non par le seul code applicatif : une erreur dans le code de l’application ne suffit pas à l’ouvrir.",
      },
      {
        title: "Traçabilité",
        detail:
          "Prise en charge d’un examen, consultation de ses images, signature, addendum, chaque téléchargement du compte-rendu : chaque geste est horodaté et rattaché à une personne nommée, dans un journal que personne ne peut modifier depuis l’application.",
      },
      {
        title: "Hébergement",
        detail:
          "Images, comptes-rendus, base de données et sauvegardes hébergés dans l’Union européenne ; le déploiement contrôle la localisation du stockage. Elle figure au contrat et ne change pas sans avenant.",
      },
      {
        title: "Conservation",
        detail:
          "La durée de conservation des images est fixée au contrat, établissement par établissement : à son terme, elles quittent nos serveurs et chaque purge est tracée. Sans durée fixée, rien n’est supprimé automatiquement. Les comptes-rendus signés sont conservés vingt ans dans un stockage verrouillé : personne ne peut les modifier ni les supprimer. Les sauvegardes chiffrées expirent au plus tard douze mois après leur création.",
      },
      {
        title: "Réversibilité",
        detail:
          "Sur simple demande, à tout moment, l’établissement reçoit l’export de ses examens et de ses comptes-rendus : images DICOM, PDF signés, et un manifeste d’empreintes pour en vérifier l’intégrité. Ses données lui appartiennent.",
      },
      {
        title: "Incidents",
        detail:
          "En cas de violation de données, l’établissement est informé sans délai injustifié, avec la nature de l’incident, les données concernées et les mesures prises.",
      },
    ],
    obligationsTitle: "Vos obligations, les nôtres",
    obligations: [
      "L’établissement reste responsable du traitement des données de ses patients ; IMAFRIK agit comme sous-traitant, sur instruction et dans le cadre défini au contrat. Cette répartition, les mesures de sécurité et la liste des sous-traitants ultérieurs figurent dans une annexe de traitement des données, jointe à toute proposition.",
      "Aucun examen n’est utilisé à d’autres fins que la production du compte-rendu demandé : ni entraînement de modèle, ni statistique nominative, ni transmission à un tiers non prévu au contrat.",
    ],
  },
  contactPage: {
    eyebrow: "Contact",
    title: "Parlons de votre installation",
    lead: "Trente minutes suffisent : vous décrivez votre installation et votre volume, nous vous montrons le parcours complet d’un examen, de l’acquisition au compte-rendu signé.",
    emailHint: "Nous vous rappelons pour convenir d’un créneau.",
    location: "Lomé, Togo",
    testDataNotice:
      "La démonstration se fait sur des examens de test. Ne nous transmettez aucune donnée de patient avant la signature d’un contrat et de son annexe de traitement des données.",
    sentTitle: "Demande envoyée",
    sentText:
      "Merci {name}. Nous revenons vers vous à l’adresse {email} avec une proposition de créneau.",
    sentTextRadiologist:
      "Merci {name}. L’équipe IMAFRIK vérifie votre numéro d’ordre auprès de l’Ordre, puis revient vers vous à l’adresse {email}. L’accès aux examens s’ouvre une fois cette vérification faite.",
    requester: {
      legend: "Je suis",
      clinic: "Un établissement de santé",
      clinicDetail:
        "Clinique, hôpital, centre d’imagerie : vous souhaitez faire lire vos examens.",
      radiologist: "Un radiologue",
      radiologistDetail:
        "Vous souhaitez lire des examens pour le réseau. Votre numéro d’ordre est vérifié avant tout accès.",
    },
    fields: {
      name: "Nom complet",
      role: "Fonction",
      rolePlaceholder: "Directeur, manipulateur, radiologue…",
      organization: "Établissement",
      organizationRadiologist: "Établissement où vous exercez",
      licenseNumber: "Numéro d’ordre",
      licenseNumberHint:
        "Celui de votre inscription à l’Ordre des médecins, tel qu’il figurera sous votre signature.",
      email: "Adresse électronique",
      phone: "Téléphone",
      optional: "Facultatif.",
      volume: "Volume mensuel estimé",
      modalities: "Modalités concernées",
      message: "Message",
      messagePlaceholder:
        "Vos modalités, vos délais actuels, ce qui vous pose problème aujourd’hui…",
    },
    volumes: [
      "Moins de 50 examens par mois",
      "50 à 200 examens par mois",
      "200 à 500 examens par mois",
      "Plus de 500 examens par mois",
      "Je ne sais pas encore",
    ],
    modalityOptions: [
      "Scanner (CT)",
      "IRM (MR)",
      "Radiographie (CR/DX)",
      "Échographie (US)",
    ],
    submit: "Envoyer la demande",
    errors: {
      requesterKind:
        "Indiquez si vous écrivez pour un établissement de santé ou en tant que radiologue.",
      name: "Indiquez votre nom.",
      organization: "Indiquez le nom de votre établissement.",
      licenseNumber:
        "Indiquez votre numéro d’ordre (50 caractères au maximum).",
      email: "Adresse électronique invalide.",
      rateLimited:
        "Trop de demandes depuis cette connexion. Réessayez dans une heure, ou écrivez-nous : contact@imafrik.tech",
      unavailable:
        "Le formulaire n’est pas disponible pour le moment. Écrivez-nous : contact@imafrik.tech",
      generic:
        "La demande n’a pas pu être envoyée. Réessayez, ou écrivez-nous : contact@imafrik.tech",
    },
  },
  verifyPage: {
    validTitle: "Document authentique",
    validText:
      "Ce code correspond à un compte-rendu signé sur la plateforme IMAFRIK. Pour protéger le patient, seule l’initiale de son nom est affichée : ni son identité complète ni le contenu du compte-rendu ne le sont.",
    signedBy: "Signé par",
    license: "Ordre n° {number}",
    signedAt: "Date de signature",
    exam: "Examen",
    patient: "Patient {initial}",
    addendaOne:
      "Ce compte-rendu a été complété par un addendum depuis sa signature. Demandez-en le texte à l’établissement qui vous a remis le document.",
    addendaMany:
      "Ce compte-rendu a été complété par {count} addenda depuis sa signature. Demandez-en le texte à l’établissement qui vous a remis le document.",
    invalidTitle: "Code inconnu",
    invalidText:
      "Aucun compte-rendu signé ne correspond à ce code. Vérifiez que l’adresse est complète ; le plus sûr est de scanner le QR code du document. Si elle l’est, le document ne provient pas d’IMAFRIK.",
    submittedCode: "Code soumis : {code}",
    report: "Signaler un document suspect",
    unavailableTitle: "Vérification momentanément indisponible",
    unavailableText:
      "Le service de vérification ne répond pas pour l’instant. Cela ne dit rien de l’authenticité du document : réessayez dans quelques minutes. Si le problème persiste, écrivez-nous à {email}.",
    retry: "Réessayer",
  },
  hashCheck: {
    title: "Vérifier un fichier PDF",
    text: "Vous avez reçu ce compte-rendu en PDF ? Choisissez le fichier : son empreinte est calculée sur votre ordinateur et comparée à celle enregistrée à la signature. Le fichier n’est envoyé nulle part.",
    choose: "Choisir le fichier PDF…",
    match: "Fichier intact : identique à celui signé.",
    mismatch:
      "Ce fichier diffère du document signé : il a été modifié, ou ce n’est pas le bon fichier.",
    expected: "Empreinte enregistrée : {hash}",
  },
  legal: {
    translationNotice: "",
    updatedAt: "Dernière mise à jour : {date}",
  },
};
