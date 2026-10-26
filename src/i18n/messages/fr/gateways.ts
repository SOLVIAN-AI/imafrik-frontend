/**
 * Passerelles des cliniques, dans la tour de contrôle : enrôlement par
 * code, approbation, révocation, confiance du PACS, kit d'installation,
 * connexion Tailscale, création d'une clinique. En français.
 *
 * Le vocabulaire suit la décision du service
 * (`docs/plan/enrolement-passerelle.md`) : une passerelle est le poste
 * Orthanc d'une clinique ; elle s'enrôle par un code, l'équipe IMAFRIK
 * l'approuve, le serveur l'active.
 */
export const gateways = {
  metaTitle: "Passerelles",
  description:
    "Les postes des cliniques qui envoient leurs examens : enrôlement, approbation, confiance du PACS",
  section: "Passerelles",
  sectionDescription: "Postes de la clinique qui envoient ses examens",

  /** Statuts, par code du service. */
  status: {
    awaiting_approval: "En attente d’approbation",
    pending: "Approuvée, activation en cours",
    active: "Active",
    suspended: "Suspendue",
    rejected: "Rejetée",
    revoked: "Révoquée",
  },
  /** Ce que signifie chaque statut, pour l'exploitant. */
  statusHelp: {
    awaiting_approval:
      "Le poste s’est enrôlé avec un code valable. Rien ne l’accepte encore : vérifiez-le, puis approuvez ou rejetez.",
    pending:
      "Approuvée. Elle devient active dès que son nœud est trouvé sur le réseau privé et la confiance appliquée au PACS, d’ordinaire en moins de deux minutes.",
    active: "Le PACS accepte ses examens, depuis sa seule adresse.",
    suspended:
      "Refus temporaire : ses examens sont refusés, son nœud reste sur le réseau. Reprenez-la quand la cause est levée.",
    rejected: "Rejetée avant d’être active : définitif.",
    revoked: "Révoquée : définitif. Son nœud a été supprimé du réseau.",
  },
  filters: {
    label: "Filtrer par statut",
    all: "Toutes",
  },
  count: (count: number) => `${count} passerelle${count > 1 ? "s" : ""}`,
  columns: {
    gateway: "Poste",
    clinic: "Clinique",
    status: "Statut",
    address: "Adresse",
    certificate: "Certificat",
    heartbeat: "Signe de vie",
    enrolled: "Enrôlée",
    actions: "Actions",
  },
  origin: {
    enrolled: "Enrôlée par code",
    adopted: "Reprise : raccordée avant l’enrôlement",
  },
  keyProtection: {
    tpm: "Puce de sécurité (TPM)",
    software_non_exportable: "Magasin Windows, non exportable",
  },
  addressSource: {
    tailscale: "Lue dans l’API Tailscale",
    fixed: "Adresse publique fixe",
  },
  empty: "Aucune passerelle pour l’instant.",
  emptyForFilter: "Aucune passerelle dans cet état.",
  emptyForClinic:
    "Aucune passerelle : émettez un code pour raccorder le poste de la clinique.",
  online: "En ligne",
  offline: "Hors ligne",
  nodeUnknown: "Nœud non trouvé",
  nodeStateUnknown: "État du réseau indisponible",
  noAddress: "Adresse inconnue",
  neverHeard: "Aucun signe de vie",
  legacyNoHeartbeat: "Sans signal de vie (ancien kit)",
  certificateApplied: "En vigueur au PACS",
  certificatePending: "Pas encore appliqué au PACS",
  expiresOn: "Échéance",
  details: "Détail",
  openGateway: (hostname: string) => `Ouvrir la passerelle ${hostname}`,
  backToOverview: "Passerelles",
  seeAll: "Toutes les passerelles",

  /** Code d'enrôlement, émis depuis la fiche d'une clinique. */
  code: {
    title: "Raccorder une passerelle",
    explanation:
      "Le code se saisit dans le kit d’installation, sur le poste de la clinique. Il vaut 15 minutes et une seule fois ; un nouveau code annule le précédent. La clé du poste naît sur le poste et ne le quitte jamais.",
    issue: "Émettre un code",
    issueAgain: "Émettre un nouveau code",
    issued: "Code d’enrôlement",
    shownOnce:
      "Ce code ne sera plus affiché. Dictez-le à l’installateur, ou transmettez-le par un canal chiffré.",
    expiresIn: (remaining: string) => `Expire dans ${remaining}`,
    expiredNow: "Code expiré : émettez-en un nouveau.",
    copy: "Copier le code",
    copied: "Code copié",
    copyFailed:
      "Copie refusée par le navigateur : sélectionnez le code pour le copier.",
    inProgress: "Code en cours",
    inProgressDetail: (expires: string, attempts: number) =>
      `Valable jusqu’à ${expires} · ${attempts} essai${attempts > 1 ? "s" : ""} sur 5`,
    issuedBy: (name: string) => `Émis par ${name}`,
    cancel: "Annuler ce code",
    cancelled: "Code annulé : il ne peut plus servir.",
    confirmReplace:
      "Un code est déjà en cours. Le nouveau l’annulera : continuer ?",
    demo: "Code de démonstration : il ne raccorde aucun poste.",
    closedContract:
      "Le contrat de cette clinique est terminé : aucune passerelle ne peut plus être raccordée.",
    suspendedClinic:
      "Clinique suspendue : réactivez-la avant de raccorder une passerelle.",
  },

  /** Ce qui manque au serveur pour enrôler. */
  readiness: {
    notReady: "Le serveur ne peut pas encore enrôler de passerelle",
    missing: {
      tailscale_credentials:
        "Connexion Tailscale absente : Réglages → Connexion Tailscale.",
      pacs_host:
        "Adresse du PACS sur le réseau privé inconnue du serveur (PACS_TAILSCALE_IP).",
      pacs_certificate: "Certificat du PACS illisible par l’API.",
    },
    settingsLink: "Ouvrir la connexion Tailscale",
  },

  /** Gestes sur une passerelle. */
  actions: {
    approve: "Approuver",
    reject: "Rejeter",
    suspend: "Suspendre",
    resume: "Reprendre",
    revoke: "Révoquer",
    renew: "Forcer le renouvellement",
  },
  dialogs: {
    reasonLabel: "Motif",
    reasonHint: "Trois caractères au moins. Conservé au journal d’audit.",
    reasonTooShort: "Motif : trois caractères au moins.",
    reasonTooLong: "Motif : 500 caractères au plus.",
    approve: {
      title: (hostname: string) => `Approuver ${hostname}`,
      description:
        "Avec la clinique au téléphone, vérifiez que ce poste est bien le sien :",
      checks: [
        "le nom du poste et son identifiant Windows (MachineGuid) ;",
        "l’adresse d’où il s’est enrôlé, celle de la clinique ;",
        "son nœud sur le réseau privé, en ligne ;",
        "l’empreinte du certificat, si l’installateur peut la lire sur le poste.",
      ],
      submit: "Approuver la passerelle",
      done: (hostname: string) =>
        `${hostname} approuvée : elle s’active dans les minutes qui viennent.`,
    },
    reject: {
      title: (hostname: string) => `Rejeter ${hostname}`,
      description:
        "Définitif. Le nœud du poste est supprimé du réseau privé et son certificat n’est jamais accepté. La clinique devra se réenrôler avec un nouveau code.",
      placeholder: "Ex. : poste inconnu de la clinique",
      submit: "Rejeter la passerelle",
      done: (hostname: string) => `${hostname} rejetée.`,
    },
    suspend: {
      title: (hostname: string) => `Suspendre ${hostname}`,
      description:
        "Refus temporaire : l’ingestion refuse aussitôt ses examens et le PACS cesse de l’accepter dans la minute. Son nœud reste sur le réseau ; vous pourrez la reprendre.",
      placeholder: "Ex. : contrôle de sécurité en cours",
      submit: "Suspendre la passerelle",
      done: (hostname: string) => `${hostname} suspendue.`,
    },
    resume: {
      title: (hostname: string) => `Reprendre ${hostname}`,
      description:
        "Le PACS l’acceptera de nouveau dans la minute, depuis sa seule adresse.",
      submit: "Reprendre la passerelle",
      done: (hostname: string) => `${hostname} reprise.`,
    },
    revoke: {
      title: (hostname: string) => `Révoquer ${hostname}`,
      description: "Définitif et tracé au journal d’audit. Ce geste :",
      consequences: [
        "fait refuser aussitôt tout examen de cette passerelle ;",
        "supprime son nœud du réseau privé : le tunnel tombe en quelques secondes ;",
        "retire son certificat et son AE Title du PACS dans la minute ;",
        "ne touche à aucune autre passerelle de la clinique.",
      ],
      placeholder: "Ex. : poste volé, remplacé, hors service",
      confirm: "Je comprends que la révocation est définitive.",
      submit: "Révoquer la passerelle",
      done: (hostname: string) => `${hostname} révoquée.`,
    },
    renew: {
      title: (hostname: string) => `Renouveler le certificat de ${hostname}`,
      description:
        "Le poste fabrique une nouvelle clé et un nouveau certificat à son prochain signal de vie, dans cinq minutes au plus. L’ancien certificat reste accepté le temps de la bascule.",
      submit: "Demander le renouvellement",
      done: (hostname: string) =>
        `Renouvellement demandé : ${hostname} le fera à son prochain signal de vie.`,
    },
  },

  /** Fiche d'une passerelle. */
  detail: {
    identity: "Poste",
    hostname: "Nom du poste",
    machineGuid: "Identifiant Windows (MachineGuid)",
    keyProtection: "Protection de la clé",
    enrolledFrom: "Adresse d’enrôlement",
    origin: "Origine",
    network: "Réseau privé",
    tailscaleHostname: "Nœud Tailscale",
    address: "Adresse acceptée par le PACS",
    addressSource: "Source de l’adresse",
    lastSeen: "Dernier contact avec Tailscale",
    lifecycle: "Cycle de vie",
    enrolled: "Enrôlée",
    approved: "Approuvée",
    approvedBy: (name: string) => `par ${name}`,
    activated: "Activée",
    suspendedOn: "Suspendue",
    rejectedOn: "Rejetée",
    revokedOn: "Révoquée",
    reason: "Motif",
    reasonIs: (reason: string) => `Motif : ${reason}`,
    renewalRequested: "Renouvellement demandé",
    heartbeat: "Signal de vie",
    lastHeartbeat: "Dernier signe de vie",
    pendingSeries: "Séries en attente d’envoi",
    oldestPending: "Plus ancienne en attente",
    diskFree: "Disque libre",
    kitVersion: "Version du kit",
    orthancVersion: "Version d’Orthanc",
    noHeartbeat:
      "Aucun signal de vie reçu. Le kit en envoie un toutes les cinq minutes ; une passerelle reprise, sans le nouveau kit, n’en envoie pas.",
    certificates: "Certificats",
    certificatesDescription:
      "Épinglés par empreinte, sans autorité de certification ; 90 jours, renouvelés par le poste",
    certificateColumns: {
      fingerprint: "Empreinte SHA-256",
      validity: "Validité",
      state: "État",
    },
    certificateOrigin: {
      enrollment: "Enrôlement",
      renewal: "Renouvellement",
      adoption: "Reprise",
    },
    certificateState: {
      inForce: "En vigueur au PACS",
      waiting: "En attente d’application",
      overlap: (until: string) => `Chevauchement jusqu’au ${until}`,
      retired: "Retiré",
    },
    retireReason: {
      renewed: "renouvelé",
      superseded: "remplacé",
      expired: "échu",
      rejected: "passerelle rejetée",
      revoked: "passerelle révoquée",
    } as Record<string, string>,
    history: "Historique",
    historyDescription: "Journal d’audit de cette passerelle",
    noHistory: "Aucune entrée.",
    system: "IMAFRIK (automatique)",
    copyFingerprint: "Copier l’empreinte",
    fingerprintCopied: "Empreinte copiée",
  },

  /** Tâche d'hôte qui applique la confiance au PACS. */
  agent: {
    title: "Application de la confiance au PACS",
    description:
      "La tâche du serveur qui écrit la liste des certificats et des AE Title acceptés, et recharge Orthanc",
    lastReport: "Dernier cycle",
    never:
      "La tâche d’hôte ne s’est jamais manifestée. Elle s’installe à chaque déploiement (tools/deploy.sh --up).",
    silent:
      "La tâche d’hôte ne s’est pas manifestée depuis plus de cinq minutes : aucune décision n’est plus appliquée au PACS.",
    outcome: {
      unchanged: "À jour",
      applied: "Appliqué",
      deferred: "Différé : un redémarrage par minute au plus",
      refused: "Refusé : état incohérent, rien n’a été écrit",
      failed: "En échec",
    },
    lastRestart: "Dernier redémarrage d’Orthanc",
    noRestart: "Aucun",
    pending: "En attente d’application",
    noPending: "Rien en attente : le PACS applique l’état décidé ici.",
    change: { add: "à accepter", remove: "à retirer" },
    cycles: "Cycles marquants",
    noCycles: "Aucun cycle marquant.",
    cycleSummary: (added: number, removed: number) =>
      `${added} ajouté${added > 1 ? "s" : ""}, ${removed} retiré${removed > 1 ? "s" : ""}`,
    restarted: "Orthanc rechargé",
  },

  /** Kit d'installation des passerelles. */
  kit: {
    title: "Kit d’installation",
    description:
      "Le même pour toutes les cliniques, sans aucun secret. Le code d’enrôlement s’y saisit.",
    download: "Télécharger le kit",
    sha256: "Empreinte SHA-256",
    sha256Hint:
      "Calculée par le serveur sur le fichier servi : comparez-la à celle annoncée à la signature du kit.",
    version: "Version",
    builtAt: "Produit le",
    size: "Taille",
    none: "Aucun kit sur le serveur",
    noneDetail:
      "Le produire et le signer (make kit-passerelle), puis le déposer : tools/deploy.sh <serveur> --push-kit.",
    unavailable: "Le kit n’a pas pu être téléchargé. Réessayez.",
    signed: "Signé (Authenticode)",
    publisherIs: (publisher: string) => `Éditeur : ${publisher}`,
    certificateUntil: "Certificat de signature valable jusqu’au",
    timestamped: "signature horodatée",
    unsigned:
      "Kit non signé : son lanceur l’annonce à l’installateur, et rien ne prouve au poste qu’il vient d’IMAFRIK. Produisez-le avec le compte de signature (make kit-passerelle), puis redéposez-le.",
    signatureUnknown:
      "Signature inconnue : le manifeste du kit (kit-passerelle.json) est absent ou illisible.",
    manifestMismatch:
      "L’archive servie ne correspond pas à son manifeste : redéposez le kit et son manifeste ensemble (tools/deploy.sh <serveur> --push-kit).",
  },

  /** Création d'une clinique depuis la console. */
  createClinic: {
    open: "Nouvelle clinique",
    title: "Créer une clinique",
    description:
      "La clinique est créée tout de suite. Sa passerelle se raccorde ensuite, depuis sa fiche, par un code.",
    name: "Nom de l’établissement",
    nameHint: "Tel qu’il s’imprime sur les comptes-rendus.",
    city: "Ville",
    language: "Langue des comptes-rendus",
    pool: "Examens ouverts aux radiologues de la plateforme",
    poolHint:
      "Sinon, seuls les radiologues de la clinique les lisent. Réglable ensuite par la clinique.",
    group: "Groupe de radiologie qui lit pour le pool",
    groupHint: "Le contrat de service est créé avec ce groupe.",
    noGroup:
      "Aucun groupe de radiologie actif : ouvrez au pool après en avoir créé un.",
    submit: "Créer la clinique",
    done: (name: string) =>
      `${name} créée. Raccordez maintenant sa passerelle.`,
    nameRequired:
      "Le nom de l’établissement est requis (2 caractères au moins).",
    nameTooLong: "Nom : 200 caractères au plus.",
    cityTooLong: "Ville : 100 caractères au plus.",
    groupRequired: "Choisissez le groupe qui lira ses examens.",
  },

  /** Connexion Tailscale de la plateforme. */
  tailscale: {
    title: "Connexion Tailscale",
    description:
      "Le client OAuth qui crée les clés d’adhésion des passerelles, retrouve leurs nœuds et les supprime à la révocation",
    sourceConsole: "Saisie en console",
    sourceEnvironment: "Fichier de valeurs du serveur",
    sourceNone: "Aucune connexion configurée",
    clientId: "Identifiant du client",
    secret: "Secret du client",
    secretEnding: (last4: string) => `•••• ${last4}`,
    configuredOn: "Enregistrée le",
    configuredBy: (name: string) => `par ${name}`,
    scopes: "Portées constatées",
    required: "Portées indispensables",
    scopeLabels: {
      auth_keys: "Clés d’adhésion (auth_keys)",
      "devices:core": "Nœuds (devices:core)",
      policy_file: "Politique d’accès (policy_file)",
      all: "Toutes (all)",
    } as Record<string, string>,
    missingScopes: (scopes: string) =>
      `Portées manquantes : ${scopes}. Ajoutez-les au client dans la console Tailscale, puis réessayez.`,
    consoleLink: "Ouvrir la console Tailscale",
    test: "Éprouver la connexion",
    testOk: "Connexion éprouvée : jeton obtenu, portées présentes.",
    replace: "Remplacer la connexion",
    configure: "Enregistrer une connexion",
    remove: "Retirer la saisie en console",
    removeDescription:
      "Le serveur reprendra les valeurs de son fichier de valeurs, s’il en a. Sans elles, plus aucune passerelle ne peut s’enrôler ni être révoquée sur le réseau.",
    removed: "Connexion retirée de la console.",
    saved: "Connexion éprouvée et enregistrée, chiffrée.",
    notSaved: "Rien n’a été enregistré.",
    secretHint:
      "Chiffré avant d’entrer en base, sous une clé qui ne vit que sur le serveur ; jamais réaffiché.",
    otp: "Code de votre application d’authentification",
    otpHint:
      "Exigé pour ce geste : la preuve d’une authentification récente, que le vol d’une session ne donne pas.",
    otpInvalid: "Saisissez les six chiffres affichés par votre application.",
    encryptionMissing:
      "La clé de chiffrement des secrets est absente du serveur (PLATFORM_SECRETS_KEY) : l’enregistrement est impossible. Elle est générée au déploiement suivant.",
    clientIdTooShort: "Identifiant : 4 caractères au moins.",
    secretTooShort: "Secret : 8 caractères au moins.",
    policy: {
      title: "Politique d’accès",
      description:
        "La politique versionnée (deploy/tailscale/policy.hujson), comparée à celle du réseau",
      compare: "Comparer",
      inSync: "Identique à la politique versionnée.",
      differs: "Différente de la politique versionnée.",
      unavailable: "Comparaison impossible",
      diff: "Écart (réseau → version du dépôt)",
      push: "Pousser la politique versionnée",
      pushDescription:
        "Tailscale valide la politique et exécute ses tests avant de l’appliquer ; rien ne change si l’un d’eux échoue, ou si la politique du réseau a changé depuis la comparaison.",
      pushed: "Politique versionnée appliquée au réseau.",
      noScope:
        "La connexion n’a pas la portée policy_file : l’écart s’affiche, la poussée se fait dans la console Tailscale.",
    },
  },

  /** Textes que le service produirait, fabriqués par le jeu de démonstration. */
  demo: {
    alerts: {
      awaiting: (name: string) => `${name} attend une approbation`,
      silent: (name: string, duration: string) =>
        `${name} ne donne plus signe de vie depuis ${duration}`,
      expiring: (name: string, days: number) =>
        `${name} : certificat échu dans ${days} j, sans renouvellement`,
    },
  },
  demoActions: {
    approve: "L’approbation d’une passerelle",
    reject: "Le rejet d’une passerelle",
    suspend: "La suspension d’une passerelle",
    resume: "La reprise d’une passerelle",
    revoke: "La révocation d’une passerelle",
    renew: "Le renouvellement d’un certificat",
    cancelCode: "L’annulation d’un code",
    createClinic: "La création d’une clinique",
    tailscale: "La connexion Tailscale",
    policy: "La politique d’accès",
    kit: "Le téléchargement du kit",
  },
};
