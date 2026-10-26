import type { AppMessages } from "@/i18n/messages/fr";

/** Clinic gateways in the control tower, in English. */
export const gateways: AppMessages["gateways"] = {
  metaTitle: "Gateways",
  description:
    "The clinic workstations that send examinations: enrolment, approval, PACS trust",
  section: "Gateways",
  sectionDescription: "Workstations that send this clinic’s examinations",

  status: {
    awaiting_approval: "Awaiting approval",
    pending: "Approved, activation in progress",
    active: "Active",
    suspended: "Suspended",
    rejected: "Rejected",
    revoked: "Revoked",
  },
  statusHelp: {
    awaiting_approval:
      "The workstation enrolled with a valid code. Nothing accepts it yet: check it, then approve or reject it.",
    pending:
      "Approved. It becomes active once its node is found on the private network and trust is applied to the PACS, usually within two minutes.",
    active: "The PACS accepts its examinations, from its own address only.",
    suspended:
      "Temporarily refused: its examinations are rejected, its node stays on the network. Resume it once the cause is cleared.",
    rejected: "Rejected before becoming active: final.",
    revoked: "Revoked: final. Its node has been removed from the network.",
  },
  filters: {
    label: "Filter by status",
    all: "All",
  },
  count: (count: number) => `${count} gateway${count === 1 ? "" : "s"}`,
  columns: {
    gateway: "Workstation",
    clinic: "Clinic",
    status: "Status",
    address: "Address",
    certificate: "Certificate",
    heartbeat: "Heartbeat",
    enrolled: "Enrolled",
    actions: "Actions",
  },
  origin: {
    enrolled: "Enrolled with a code",
    adopted: "Adopted: connected before enrolment",
  },
  keyProtection: {
    tpm: "Security chip (TPM)",
    software_non_exportable: "Windows store, non-exportable",
  },
  addressSource: {
    tailscale: "Read from the Tailscale API",
    fixed: "Fixed public address",
  },
  empty: "No gateways yet.",
  emptyForFilter: "No gateways with this status.",
  emptyForClinic:
    "No gateways: issue a code to connect the clinic’s workstation.",
  online: "Online",
  offline: "Offline",
  nodeUnknown: "Node not found",
  nodeStateUnknown: "Network status unavailable",
  noAddress: "Address unknown",
  neverHeard: "No heartbeat",
  legacyNoHeartbeat: "No heartbeat (previous kit)",
  certificateApplied: "In force at the PACS",
  certificatePending: "Not yet applied to the PACS",
  expiresOn: "Expiry",
  details: "Details",
  openGateway: (hostname: string) => `Open gateway ${hostname}`,
  backToOverview: "Gateways",
  seeAll: "All gateways",

  code: {
    title: "Connect a gateway",
    explanation:
      "The code is entered in the installation kit, on the clinic’s workstation. It is valid for 15 minutes and once only; a new code cancels the previous one. The workstation’s key is created on the workstation and never leaves it.",
    issue: "Issue a code",
    issueAgain: "Issue a new code",
    issued: "Enrolment code",
    shownOnce:
      "This code will not be shown again. Read it out to the installer, or send it over an encrypted channel.",
    expiresIn: (remaining: string) => `Expires in ${remaining}`,
    expiredNow: "Code expired: issue a new one.",
    copy: "Copy the code",
    copied: "Code copied",
    copyFailed: "The browser refused to copy: select the code to copy it.",
    inProgress: "Code in progress",
    inProgressDetail: (expires: string, attempts: number) =>
      `Valid until ${expires} · ${attempts} attempt${attempts === 1 ? "" : "s"} out of 5`,
    issuedBy: (name: string) => `Issued by ${name}`,
    cancel: "Cancel this code",
    cancelled: "Code cancelled: it can no longer be used.",
    confirmReplace:
      "A code is already in progress. The new one will cancel it: continue?",
    demo: "Demonstration code: it does not connect any workstation.",
    closedContract:
      "This clinic’s contract has ended: no gateway can be connected any more.",
    suspendedClinic:
      "Clinic suspended: reactivate it before connecting a gateway.",
  },

  readiness: {
    notReady: "The server cannot enrol gateways yet",
    missing: {
      tailscale_credentials:
        "No Tailscale connection: Settings → Tailscale connection.",
      pacs_host:
        "The server does not know the PACS address on the private network (PACS_TAILSCALE_IP).",
      pacs_certificate: "The API cannot read the PACS certificate.",
    },
    settingsLink: "Open the Tailscale connection",
  },

  actions: {
    approve: "Approve",
    reject: "Reject",
    suspend: "Suspend",
    resume: "Resume",
    revoke: "Revoke",
    renew: "Force renewal",
  },
  dialogs: {
    reasonLabel: "Reason",
    reasonHint: "At least three characters. Kept in the audit log.",
    reasonTooShort: "Reason: at least three characters.",
    reasonTooLong: "Reason: 500 characters at most.",
    approve: {
      title: (hostname: string) => `Approve ${hostname}`,
      description:
        "With the clinic on the phone, check that this workstation is theirs:",
      checks: [
        "the workstation name and its Windows identifier (MachineGuid);",
        "the address it enrolled from, which should be the clinic’s;",
        "its node on the private network, online;",
        "the certificate fingerprint, if the installer can read it on the workstation.",
      ],
      submit: "Approve the gateway",
      done: (hostname: string) =>
        `${hostname} approved: it will become active within minutes.`,
    },
    reject: {
      title: (hostname: string) => `Reject ${hostname}`,
      description:
        "Final. The workstation’s node is removed from the private network and its certificate is never accepted. The clinic will need to enrol again with a new code.",
      placeholder: "E.g. workstation unknown to the clinic",
      submit: "Reject the gateway",
      done: (hostname: string) => `${hostname} rejected.`,
    },
    suspend: {
      title: (hostname: string) => `Suspend ${hostname}`,
      description:
        "Temporary refusal: ingestion rejects its examinations at once and the PACS stops accepting it within a minute. Its node stays on the network; you can resume it.",
      placeholder: "E.g. security check in progress",
      submit: "Suspend the gateway",
      done: (hostname: string) => `${hostname} suspended.`,
    },
    resume: {
      title: (hostname: string) => `Resume ${hostname}`,
      description:
        "The PACS will accept it again within a minute, from its own address only.",
      submit: "Resume the gateway",
      done: (hostname: string) => `${hostname} resumed.`,
    },
    revoke: {
      title: (hostname: string) => `Revoke ${hostname}`,
      description: "Final, and recorded in the audit log. This action:",
      consequences: [
        "rejects every examination from this gateway at once;",
        "removes its node from the private network: the tunnel drops within seconds;",
        "withdraws its certificate and AE Title from the PACS within a minute;",
        "leaves every other gateway of the clinic untouched.",
      ],
      placeholder: "E.g. stolen, replaced or out-of-service workstation",
      confirm: "I understand that revocation is final.",
      submit: "Revoke the gateway",
      done: (hostname: string) => `${hostname} revoked.`,
    },
    renew: {
      title: (hostname: string) => `Renew the certificate of ${hostname}`,
      description:
        "The workstation creates a new key and certificate at its next heartbeat, within five minutes. The previous certificate stays accepted during the switch-over.",
      submit: "Request renewal",
      done: (hostname: string) =>
        `Renewal requested: ${hostname} will renew at its next heartbeat.`,
    },
  },

  detail: {
    identity: "Workstation",
    hostname: "Workstation name",
    machineGuid: "Windows identifier (MachineGuid)",
    keyProtection: "Key protection",
    enrolledFrom: "Enrolment address",
    origin: "Origin",
    network: "Private network",
    tailscaleHostname: "Tailscale node",
    address: "Address accepted by the PACS",
    addressSource: "Address source",
    lastSeen: "Last contact with Tailscale",
    lifecycle: "Lifecycle",
    enrolled: "Enrolled",
    approved: "Approved",
    approvedBy: (name: string) => `by ${name}`,
    activated: "Activated",
    suspendedOn: "Suspended",
    rejectedOn: "Rejected",
    revokedOn: "Revoked",
    reason: "Reason",
    reasonIs: (reason: string) => `Reason: ${reason}`,
    renewalRequested: "Renewal requested",
    heartbeat: "Heartbeat",
    lastHeartbeat: "Last heartbeat",
    pendingSeries: "Series waiting to be sent",
    oldestPending: "Oldest waiting",
    diskFree: "Free disk space",
    kitVersion: "Kit version",
    orthancVersion: "Orthanc version",
    noHeartbeat:
      "No heartbeat received. The kit sends one every five minutes; an adopted gateway without the new kit does not.",
    certificates: "Certificates",
    certificatesDescription:
      "Pinned by fingerprint, with no certificate authority; 90 days, renewed by the workstation",
    certificateColumns: {
      fingerprint: "SHA-256 fingerprint",
      validity: "Validity",
      state: "State",
    },
    certificateOrigin: {
      enrollment: "Enrolment",
      renewal: "Renewal",
      adoption: "Adoption",
    },
    certificateState: {
      inForce: "In force at the PACS",
      waiting: "Waiting to be applied",
      overlap: (until: string) => `Overlap until ${until}`,
      retired: "Withdrawn",
    },
    retireReason: {
      renewed: "renewed",
      superseded: "superseded",
      expired: "expired",
      rejected: "gateway rejected",
      revoked: "gateway revoked",
    },
    history: "History",
    historyDescription: "Audit log of this gateway",
    noHistory: "No entries.",
    system: "IMAFRIK (automatic)",
    copyFingerprint: "Copy the fingerprint",
    fingerprintCopied: "Fingerprint copied",
  },

  agent: {
    title: "Applying trust to the PACS",
    description:
      "The server task that writes the list of accepted certificates and AE Titles, and reloads Orthanc",
    lastReport: "Last cycle",
    never:
      "The host task has never reported. It is installed with every deployment (tools/deploy.sh --up).",
    silent:
      "The host task has not reported for more than five minutes: no decision is applied to the PACS any more.",
    outcome: {
      unchanged: "Up to date",
      applied: "Applied",
      deferred: "Deferred: at most one restart per minute",
      refused: "Refused: inconsistent state, nothing written",
      failed: "Failed",
    },
    lastRestart: "Last Orthanc restart",
    noRestart: "None",
    pending: "Waiting to be applied",
    noPending: "Nothing waiting: the PACS applies the state decided here.",
    change: { add: "to accept", remove: "to withdraw" },
    cycles: "Notable cycles",
    noCycles: "No notable cycles.",
    cycleSummary: (added: number, removed: number) =>
      `${added} added, ${removed} removed`,
    restarted: "Orthanc reloaded",
  },

  kit: {
    title: "Installation kit",
    description:
      "The same for every clinic, with no secret. The enrolment code is entered in it.",
    download: "Download the kit",
    sha256: "SHA-256 fingerprint",
    sha256Hint:
      "Computed by the server on the file it serves: compare it with the one announced when the kit was signed.",
    version: "Version",
    builtAt: "Built on",
    size: "Size",
    none: "No kit on the server",
    noneDetail:
      "Build and sign it (make kit-passerelle), then upload it: tools/deploy.sh <server> --push-kit.",
    unavailable: "The kit could not be downloaded. Try again.",
    signed: "Signed (Authenticode)",
    publisherIs: (publisher: string) => `Publisher: ${publisher}`,
    certificateUntil: "Code-signing certificate valid until",
    timestamped: "timestamped signature",
    unsigned:
      "Unsigned kit: its launcher tells the installer so, and nothing proves to the workstation that it comes from IMAFRIK. Build it with the signing account (make kit-passerelle), then upload it again.",
    signatureUnknown:
      "Signature unknown: the kit manifest (kit-passerelle.json) is missing or unreadable.",
    manifestMismatch:
      "The archive served does not match its manifest: upload the kit and its manifest together (tools/deploy.sh <server> --push-kit).",
  },

  createClinic: {
    open: "New clinic",
    title: "Create a clinic",
    description:
      "The clinic is created at once. Its gateway is then connected from its page, with a code.",
    name: "Facility name",
    nameHint: "As it is printed on reports.",
    city: "City",
    language: "Report language",
    pool: "Examinations open to the platform’s radiologists",
    poolHint:
      "Otherwise only the clinic’s own radiologists read them. The clinic can change this later.",
    group: "Radiology group that reads for the pool",
    groupHint: "The service contract is created with this group.",
    noGroup:
      "No active radiology group: open to the pool once one has been created.",
    submit: "Create the clinic",
    done: (name: string) => `${name} created. Now connect its gateway.`,
    nameRequired: "The facility name is required (at least 2 characters).",
    nameTooLong: "Name: 200 characters at most.",
    cityTooLong: "City: 100 characters at most.",
    groupRequired: "Choose the group that will read its examinations.",
  },

  tailscale: {
    title: "Tailscale connection",
    description:
      "The OAuth client that creates the gateways’ auth keys, finds their nodes and removes them on revocation",
    sourceConsole: "Entered in the console",
    sourceEnvironment: "Server values file",
    sourceNone: "No connection configured",
    clientId: "Client ID",
    secret: "Client secret",
    secretEnding: (last4: string) => `•••• ${last4}`,
    configuredOn: "Saved on",
    configuredBy: (name: string) => `by ${name}`,
    scopes: "Scopes found",
    required: "Required scopes",
    scopeLabels: {
      auth_keys: "Auth keys (auth_keys)",
      "devices:core": "Nodes (devices:core)",
      policy_file: "Access policy (policy_file)",
      all: "All (all)",
    },
    missingScopes: (scopes: string) =>
      `Missing scopes: ${scopes}. Add them to the client in the Tailscale console, then try again.`,
    consoleLink: "Open the Tailscale console",
    test: "Test the connection",
    testOk: "Connection tested: token obtained, scopes present.",
    replace: "Replace the connection",
    configure: "Save a connection",
    remove: "Remove the console entry",
    removeDescription:
      "The server will fall back to its values file, if it has one. Without it, no gateway can enrol or be revoked on the network.",
    removed: "Connection removed from the console.",
    saved: "Connection tested and saved, encrypted.",
    notSaved: "Nothing was saved.",
    secretHint:
      "Encrypted before it reaches the database, under a key that lives only on the server; never shown again.",
    otp: "Code from your authenticator app",
    otpHint:
      "Required for this action: proof of a recent sign-in, which a stolen session does not give.",
    otpInvalid: "Enter the six digits shown by your app.",
    encryptionMissing:
      "The secrets encryption key is missing from the server (PLATFORM_SECRETS_KEY): saving is impossible. It is generated at the next deployment.",
    clientIdTooShort: "Client ID: at least 4 characters.",
    secretTooShort: "Secret: at least 8 characters.",
    policy: {
      title: "Access policy",
      description:
        "The versioned policy (deploy/tailscale/policy.hujson), compared with the network’s",
      compare: "Compare",
      inSync: "Identical to the versioned policy.",
      differs: "Different from the versioned policy.",
      unavailable: "Comparison not possible",
      diff: "Difference (network → repository version)",
      push: "Push the versioned policy",
      pushDescription:
        "Tailscale validates the policy and runs its tests before applying it; nothing changes if one fails, or if the network policy changed since the comparison.",
      pushed: "Versioned policy applied to the network.",
      noScope:
        "The connection lacks the policy_file scope: the difference is shown, pushing is done in the Tailscale console.",
    },
  },

  demo: {
    alerts: {
      awaiting: (name: string) => `${name} is awaiting approval`,
      silent: (name: string, duration: string) =>
        `${name} has not reported in for ${duration}`,
      expiring: (name: string, days: number) =>
        `${name}: certificate expires in ${days} d, not renewed`,
    },
  },
  demoActions: {
    approve: "Approving a gateway",
    reject: "Rejecting a gateway",
    suspend: "Suspending a gateway",
    resume: "Resuming a gateway",
    revoke: "Revoking a gateway",
    renew: "Renewing a certificate",
    cancelCode: "Cancelling a code",
    createClinic: "Creating a clinic",
    tailscale: "The Tailscale connection",
    policy: "The access policy",
    kit: "Downloading the kit",
  },
};
