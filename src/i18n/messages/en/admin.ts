import type { AppMessages } from "@/i18n/messages/fr";

/** Texts for the control tower (`/admin`), in English. */
export const admin: AppMessages["admin"] = {
  shared: {
    routine: "Routine",
    urgent: "Urgent",
    urgentPlural: "Urgent",
    wholeNetwork: "Whole network",
    filterByClinic: "Filter by clinic",
    filter: "Filter",
    all: "All",
    summary: "Summary",
    examinations: "Examinations",
    receivedStudies: "Examinations received",
    mostRecentFirst: "Most recent first",
    medianTurnaround: "Median turnaround",
    imagesReceived: "Images received",
    volumeReceived: "Volume received",
    signedReports: "Reports signed",
    ofWhichUrgent: "Of which urgent",
    unassigned: "Unassigned",
    never: "never",
    csvExport: "Export as CSV",
    ago: (age: string) => `${age} ago`,
    studyCount: (count: number, shown: string) =>
      `${shown} examination${count === 1 ? "" : "s"}`,
    imageCount: (count: number, shown: string) =>
      `${shown} image${count === 1 ? "" : "s"}`,
  },

  alerts: {
    label: "Alerts",
    severity: {
      critical: "Critical",
      warning: "Warning",
      info: "Information",
    },
    severityPrefix: (severity: string) => `${severity}: `,
    allClear:
      "All systems normal: turnaround on target, gateways active, backups up to date.",
  },

  ops: {
    labels: {
      backup: "Backup",
      restore_drill: "Restore drill",
      reconciliation: "PACS reconciliation",
      host_watch: "Host monitoring",
      retention: "Data retention",
    },
    purpose: {
      backup:
        "Encrypted copy (age) of the database and the PACS index to R2, every night.",
      restore_drill:
        "A real restore of the latest backup into a disposable database, every week: a backup that has never been restored is not a backup.",
      reconciliation:
        "Recovers examinations that the PACS received without the application being notified.",
      host_watch:
        "Checks the central server’s disk, containers, and HTTPS and DICOM certificates.",
      retention:
        "Applies the retention periods set by contract: images of delivered examinations, and contact requests older than three years. Every purge is logged.",
    },
    targets: {
      supabase: "application database",
      "orthanc-index": "PACS index",
    },
    succeeded: "Succeeded",
    failed: "Failed",
    neverRun: "never run",
    emptyBefore: "No runs recorded yet. Tasks are installed with",
    emptyAfter: ".",
  },

  stages: {
    labels: {
      arrival: "Transmission",
      transfer: "Transfer",
      queue: "Queue",
      reading: "Reading",
      delivery: "Delivery",
    },
    details: {
      arrival: "acquisition → last image received",
      transfer: "first → last image",
      queue: "receipt → claim",
      reading: "claim → signature",
      delivery: "signature → download",
    },
    info: {
      arrival:
        "Median time between the examination’s acquisition on the clinic’s device and its last image reaching the central PACS.",
      transfer:
        "Median time between the first and the last image received by the central PACS: how long sending takes, longer over a slow link.",
      queue:
        "Median time between the examination’s receipt and its claim by a radiologist: the wait in the queue.",
      reading:
        "Median time between the examination’s claim and its report’s signature.",
      delivery:
        "Median time between the report’s signature and its download by the clinic.",
    },
    ongoingSuffix: " (in progress)",
    ongoing: (stage: string) => `${stage.toLowerCase()} in progress`,
  },

  charts: {
    period: "Period",
    day: "Day",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    hour: (hour: number) => `${String(hour).padStart(2, "0")}:00`,
    hourTick: (hour: number) => String(hour).padStart(2, "0"),
    point: (label: string, serie: string, value: string) =>
      `${label} · ${serie}: ${value}`,
    heatmapCell: (day: string, hour: string, count: number) =>
      `${day} ${hour}: ${count} examination${count === 1 ? "" : "s"}`,
    noData: "No data for this period.",
    ring: (label: string, value: string | null) =>
      `${label}: ${value ?? "no data"}`,
  },

  filters: {
    byAction: "Filter by action",
    allActions: "All actions",
  },

  cockpit: {
    title: "Control tower",
    description:
      "Platform status right now: queues, turnaround, network and operations.",
    detailedAnalytics: "Detailed analytics",
    receivedDescription: "Last fourteen days, by priority",
    activity: "Activity",
    receivedCaption: "Examinations received per day over fourteen days",
    sla: "Turnaround commitments",
    slaDescription: "Examinations signed over thirty days",
    slaRing: (label: string) => `${label}: share reported on time`,
    promised: (duration: string) => `(committed: ${duration})`,
    median: "Median",
    p90: "9 in 10 within",
    signed: "Signed",
    network: "Network",
    clinicsActive: "Active clinics",
    clinicsConnected: "Connected gateways",
    outOf: (total: number) => `of ${total}`,
    radiologistsActive: "Active radiologists",
    newRequests: "Requests to handle",
    operations: "Operations",
    operationsDescription: "Latest run of each task",
    system: "System",
    computedBefore: "Calculated on",
    computedAfter: "(UTC). Reload the page to refresh.",
    waiting: "Awaiting reading",
    waitingHint: (urgent: number, oldest: string) =>
      `including ${urgent} urgent; the oldest has been waiting for ${oldest}`,
    emptyQueue: "queue empty",
    overdue: "Overdue",
    overdueHint: (urgent: number, routine: number) =>
      `${urgent} urgent · ${routine} routine`,
    overdueInfo: (urgent: string, routine: string) =>
      `Examinations not yet reported whose promised time has passed: ${urgent} for urgent, ${routine} for routine.`,
    inProgress: "Being read",
    inProgressHint: "not yet signed",
    signedToday: "Signed today",
    signedTodayHint: (received: number, delivered: number) =>
      `${received} received · ${delivered} delivered`,
  },

  activity: {
    description: (scope: string, days: number) =>
      `${scope} · last ${days} days`,
    period: "Period",
    arrivals: "Arrival times",
    arrivalsDescription:
      "Examinations received by day of the week and hour (UTC, Lomé time)",
    arrivalsCaption: "Examinations received by day of the week and by hour",
    modalities: "Modalities",
    modalitiesDescription: "Examinations received · median turnaround",
    totals: "Period totals",
    ofReceived: (share: string) => `${share} of those received`,
    withinSla: "Within committed turnaround",
    withinSlaHint: (urgent: string, routine: string) =>
      `urgent ${urgent} · routine ${routine}`,
    perStudy: (size: string) => `${size} per examination`,
    perWeek: "Per week",
    perDay: "Per day",
    receivedPerWeek: "Examinations received per week",
    receivedPerDay: "Examinations received per day",
    median: "Median",
    p90: "9 examinations in 10",
    turnaround: "Reporting turnaround",
    turnaroundWeekly:
      "From receipt to signature, as a weekly average of daily values",
    turnaroundDaily: "From receipt to signature, per day",
    turnaroundCaption: "Time from receipt to signature, in minutes",
    routineTarget: (duration: string) => `Routine commitment: ${duration}`,
    journey: "Examination journey",
    journeyDescription:
      "Median duration of each stage, with the longest highlighted",
    tabs: {
      label: "Sections",
      ensemble: "Overview",
      radiologues: "By radiologist",
      cliniques: "By clinic",
      billing: "Billing",
    },
    focus: (name: string) => `${name}’s performance`,
    focusNone:
      "This radiologist has no activity this month: no examination received in the month was handed to them.",
    seeAll: "All radiologists",
    byClinic: "By clinic",
    throughputInfo: (slow: string) =>
      `Median throughput of the link between the clinic’s gateway and the central PACS, per examination; amber below ${slow}.`,
    noClinic: "No clinics in this period.",
    columns: {
      clinic: "Clinic",
      received: "Received",
      signed: "Signed",
      median: "Median turnaround",
      withinSla: "On time",
      throughput: "Throughput",
      volume: "Volume",
      lastSent: "Last sent",
    },
  },

  flow: {
    description: (count: number) =>
      `The last ${count} examinations received, from acquisition to report delivery`,
    emptyTitle: "No examinations received",
    emptyDetail:
      "Examinations appear here as soon as the central PACS has received them.",
    medianThroughput: "Median throughput",
    medianThroughputInfo:
      "Median receiving throughput of the examinations listed: each one’s volume, divided by the time between its first and last image received by the central PACS.",
    slowestTenth: (rate: string) => `10% below ${rate}`,
    medianArrival: "Median transmission",
    arrivalHint: "acquisition → last image",
    inQueue: "In queue",
    inQueueHint: "not yet claimed",
  },

  studies: {
    metaTitle: "All examinations",
    urgentDescription: (count: number) =>
      `${count} urgent examination${count === 1 ? "" : "s"} not yet reported`,
    allDescription: (count: number) =>
      `${count} examination${count === 1 ? "" : "s"} across all organisations`,
    clinicDescription: (count: number) =>
      `${count} examination${count === 1 ? "" : "s"}`,
    openUrgent: "Open urgent cases",
    clinicFilter: "Clinic",
    allClinics: "All clinics",
    openImages: (patient: string) => `Open the images of ${patient}`,
    stuck: (count: number) =>
      `${count} urgent examination${count === 1 ? " is" : "s are"} waiting to be claimed.`,
    columns: {
      patient: "Patient",
      study: "Examination",
      facility: "Facility",
      status: "Status",
      radiologist: "Radiologist",
      uid: "UID",
      waiting: "Waiting",
    },
    waitingInfo: (hours: number) =>
      `Time since the examination was received, amber after ${hours} hours; no longer flagged once the report is delivered.`,
  },

  organisations: {
    searchPlaceholder: "Name or city…",
    clinicCount: (count: number) =>
      `${count} ${count === 1 ? "clinic" : "clinics"}`,
    groupCount: (count: number) =>
      `${count} ${count === 1 ? "radiology group" : "radiology groups"}`,
    memberCount: (count: number) =>
      `${count} ${count === 1 ? "member" : "members"}`,
    received30d: (count: number) =>
      `${count} ${count === 1 ? "examination" : "examinations"} in 30 days`,
    kind: { clinic: "Clinic", radiology_group: "Group" },
    lastSent: "Last sent:",
    columns: {
      organisation: "Organisation",
      kind: "Type",
      pacs: "PACS",
      members: "Members",
      days30: "30 days",
      lastSent: "Last sent",
      state: "Status",
      actions: "Actions",
    },
    info: {
      pacs: "Connected: one of the clinic’s gateways has received its AE Title, and the IMAFRIK PACS accepts its examinations. A radiology group sends none.",
      days30:
        "Examinations received from the clinic over the last thirty days, to the day; a radiology group receives none.",
    },
    totalStudies: (count: number) =>
      `${count} examination${count === 1 ? "" : "s"} in total`,
    noPacs: "No PACS",
    pacsConnected: "PACS connected",
    pacsNotConnected: "PACS not connected",
    active: "Active",
    suspended: "Suspended",
    suspend: "Suspend",
    reactivate: "Reactivate",
    confirmSuspend: (name: string) =>
      `Suspend ${name}? All of its members will lose access immediately.`,
    inviteInto: (name: string) => `Invite someone to ${name}`,
  },

  clinic: {
    metaTitle: "Clinic",
    active: "active",
    suspended: "suspended",
    contractEnded: "contract ended",
    openToPool: "open to the pool",
    ownRadiologists: "dedicated radiologists",
    backToOrganisations: "Organisations",
    detailedActivity: "Detailed activity",
    radiologistPerformance: "Radiologist performance",
    clinicStudies: "Clinic examinations",
    onboarding: "Onboarding",
    stepsDone: (done: number, total: number) =>
      `${done} of ${total} step${total === 1 ? "" : "s"} completed`,
    steps: {
      created: "Organisation created",
      connected: "Gateway connected",
      team: "Team invited",
      first_study: "First examination received",
      first_report: "First report signed",
      first_delivery: "First report delivered",
    },
    stepDone: ": done",
    stepNext: ": next step",
    stepUpcoming: ": upcoming",
    pending: "Pending",
    retention: "Image retention",
    noLimit: "No limit, never purged",
    retentionDays: (days: number) =>
      `${days} day${days === 1 ? "" : "s"} after delivery`,
    summary: "Thirty-day summary",
    received30d: "Received · 30 days",
    noStudyReceived: "no examinations received",
    receiptToSignature: "receipt → signature",
    throughput: "Receiving throughput",
    throughputHint: "median per examination",
    overThirtyDays: "over thirty days",
    lastThirtyDays: "Last thirty days",
    receivedCaption: "Examinations received per day over thirty days",
    withinSla: "Reported on time",
    recent: "Latest examinations",
    recentDescription: "From the clinic’s scanner to the delivered report",
    fullFlow: "Full image flow",
    noRecent:
      "No examinations received yet. Once the gateway is installed, the kit’s test examination appears here within a minute.",
  },

  retention: {
    integerDays: "Retention period: a whole number of days.",
    confirmPurge: (clinic: string, days: number) =>
      `Purge the images of ${clinic}’s examinations delivered more than ${days} days ago?\n\n` +
      "The purge starts at the next daily run and cannot be undone. " +
      "Reports are kept; the clinic keeps its originals.",
    saved: "Retention period saved.",
    explanation:
      "The period set in the contract, starting from report delivery. After that, images leave the central PACS; the examination record and the signed report are kept, and the clinic keeps its originals. Empty: no automatic purge; images are kept with no time limit, including after the contract ends.",
    label: "Image retention (days)",
    purgedHint: (count: number) =>
      `${count} examination${count === 1 ? "" : "s"} already purged. Between 30 and 7,300 days.`,
    hint: "Between 30 and 7,300 days. Leave empty to never purge images automatically, even after the contract ends.",
    noLimit: "No limit",
  },

  aiFeatures: {
    open: (name: string) => `AI features for ${name}`,
    title: "AI features",
    explanation:
      "A feature is offered only to radiologists working within this organisation. It never changes a report and never blocks a signature. Every change is recorded in the audit log.",
    review: "Advanced review before signing",
    reviewHint:
      "Flags inconsistencies between the sections of a draft. The text is sent to the model without the patient’s name, identifier or date of birth.",
    loadFailed: "The current state could not be read. Please try again.",
    saved: "AI features saved.",
  },

  clinicLogo: {
    title: "Watermark logo",
    none: "No logo",
    since: "Set",
    explanation:
      "The clinic’s logo is printed large, pale and slightly blurred, in the middle of every page of the signed report, behind the text. Reports already signed keep their logo; a change applies to the next ones.",
    preview: "Current clinic logo",
    choose: "Choose a logo",
    replace: "Replace the logo",
    remove: "Remove the logo",
    formats:
      "PNG, JPEG or WebP, 2 MB at most. A transparent background looks best.",
    saved: "Logo saved: it will be printed on the next reports.",
    removed: "Logo removed: the next reports will have no watermark.",
    tooLarge: "This file is larger than 2 MB.",
    badType: "Upload a PNG, JPEG or WebP file.",
    unreadable: "This file could not be read.",
  },
  plan: {
    title: "Subscription",
    none: "Plan not set",
    explanation:
      "The plan the clinic signed up for, per its agreement. It applies to months still open; a closed month keeps the plan in its statement.",
    label: "Plan",
    monthlyFee: "Monthly price (FCFA excl. tax)",
    monthlyFeeHint: "On quotation, at least 100,000 FCFA excl. tax.",
    perMonth: (amount: string) => `${amount} FCFA excl. tax per month`,
    since: "Set on",
    saved: "Subscription plan saved.",
  },

  reportLanguage: {
    title: "Report language",
    explanation:
      "The headings and statements of the signed PDF report, and its verification page, follow this language. Reports already signed are not changed. Radiologists see it in the editor.",
    saved: "Report language saved.",
  },

  contract: {
    title: "Contract",
    underContract: "Under contract",
    endedOnBefore: "Contract ended on ",
    endedOnAfter: "",
    endedDetail:
      "The clinic is suspended and removed from the pool: its members no longer have access to IMAFRIK. Signed reports remain stored for twenty years and can still be verified by their QR code. This page is now read-only.",
    readOnly: "Read-only: this clinic’s contract has ended.",
    dangerZone: "Danger zone",
    endTitle: "End the contract",
    endDescription:
      "Suspends the clinic, removes it from the pool and closes its service contracts. This cannot be undone.",
    dialogTitle: (clinic: string) => `End the contract with ${clinic}`,
    dialogDescription:
      "This cannot be undone and is recorded in the audit log. It will:",
    consequences: [
      "remove access to IMAFRIK for every member of the clinic, from their next request;",
      "remove the clinic from the pool and close its service contracts;",
      "keep signed reports stored for twenty years, still verifiable by their QR code;",
      "leave images untouched: they follow the retention period set for the clinic, with no time limit if none is set;",
      "leave the full data export to be run next on the server, then handed over to the clinic through an encrypted channel.",
    ],
    confirmBefore: "To confirm, type the clinic’s name: ",
    confirmLabel: "Clinic name",
    confirmHint: "The exact name; capitals and surrounding spaces are ignored.",
    unreportedTitle: (count: number) =>
      count === 1
        ? "1 examination has not been reported yet"
        : `${count} examinations have not been reported yet`,
    abandonLabel: "Abandon these examinations",
    abandonDetail:
      "They will not be read for this clinic: readings in progress stop and their drafts are deleted.",
    submit: "End the contract",
    done: (clinic: string) => `Contract with ${clinic} ended.`,
    abandoned: (count: number) =>
      count === 1
        ? "1 unreported examination was abandoned."
        : `${count} unreported examinations were abandoned.`,
    exportTitle: "Clinic data export",
    exportIntro: "Run this now on the server, from the operations workstation:",
    copy: "Copy command",
    copied: "Command copied",
    exportReminder:
      "The archive contains identifiable health data: hand it over to the clinic through an encrypted channel, then delete it from the machine that produced it.",
    endedExportReminder:
      "If the export has not yet been handed over to the clinic, run it on the server, hand it over through an encrypted channel, then delete it from the machine that produced it.",
  },

  users: {
    reading: {
      urgentLists: (names: string) => `Urgent list: ${names}`,
      noUrgentList: "On no urgent list",
      performance: "See their performance",
      filter: "Modality read",
      anyModality: "All modalities",
    },
    accountCount: (count: number) =>
      `${count} account${count === 1 ? "" : "s"}`,
    withoutMfa: (count: number) => `${count} without two-factor authentication`,
    pendingFilter: "Pending",
    searchLabel: "Search accounts",
    searchPlaceholder: "Name or email…",
    pendingTitle: "Awaiting assignment",
    allTitle: "Accounts",
    pendingDescription:
      "Registered but not attached to any organisation: they cannot see any examinations.",
    allDescription: "Memberships, two-factor authentication, last sign-in",
    noPending: "No pending accounts",
    noneFound: "No accounts found",
    tryAnother: "Try another name or email address.",
    pendingHint:
      "Radiologists who sign up appear here until they are attached to an organisation.",
    unknownEmail: "unknown email",
    unattached: "Not attached to any organisation",
    signedIn: "Signed in",
    neverSignedIn: "Never signed in; account created on",
    mfaUnknown: "MFA unknown",
    mfaActive: "MFA enabled",
    mfaRequired: "Required for every role",
    mfaMissing: "MFA missing",
    mfaNone: "No MFA",
    unverifiedFilter: "To review",
    unverifiedTitle: "Files to review",
    unverifiedDescription:
      "Radiologists whose supporting document awaits the IMAFRIK team’s decision: diploma, enrolment certificate, or certificate renewal.",
    noUnverified: "No files to review",
    unverifiedHint:
      "A radiologist appears here as soon as they upload a supporting document, and again if they change their name, title or registration number.",
    signingFilter: "Signature to review",
    signingTitle: "Signatures and stamps to review",
    signingDescription:
      "Radiologists who have uploaded a new signature or stamp. The previous image stays printed until you decide: nothing is blocked.",
    noSigning: "No image to review",
    signingHint:
      "A radiologist appears here as soon as they draw or upload a signature, or upload a stamp.",
  },

  voidReport: {
    trigger: "Void the report",
    title: (patient: string) => `Void the report for ${patient}`,
    description:
      "Only for a mistake an addendum cannot fix: a test signed on a real examination, a report written on the wrong examination. The document is archived as it is and withdrawn; the examination returns to the worklist for a real reading; public verification shows it as voided. The action is logged.",
    reason: "Reason for voiding",
    reasonHint:
      "Kept with the voided document, never made public. At least 10 characters.",
    reasonInvalid: "Give a reason of 10 to 500 characters.",
    submit: "Void the report",
    done: (patient: string) =>
      `Report for ${patient} voided: the examination is back in the worklist.`,
    demoAction: "Voiding a report",
  },

  signing: {
    trigger: "Signature",
    due: "Signature to review",
    title: (name: string) => `Signature and stamp of ${name}`,
    description:
      "Compare each uploaded image with the radiologist’s name and supporting document: a stamp must show the name and registration number. Each opening of this window is recorded in the log.",
    loading: "Loading images…",
    kinds: { signature: "Signature", stamp: "Stamp" },
    current: {
      signature: "Printed today",
      stamp: "Printed today",
    },
    submitted: {
      signature: (date: string) => `Uploaded on ${date}, to review`,
      stamp: (date: string) => `Uploaded on ${date}, to review`,
    },
    noneCurrent: "None",
    nothingPending: "Nothing to review.",
    accept: "Accept",
    reject: "Reject",
    reason: "Reason for rejection",
    reasonHint:
      "The radiologist reads it in their settings and in the email that informs them.",
    rejectSubmit: "Reject the image",
    accepted: {
      signature: "Signature accepted: the radiologist has been informed.",
      stamp: "Stamp accepted: the radiologist has been informed.",
    },
    rejected: "Image rejected: the radiologist has been informed.",
    reasonRequired:
      "Give the reason for rejection: the radiologist will read it.",
    reasonTooLong: "The reason exceeds 500 characters.",
    self: "You cannot decide on your own images.",
    imageAlt: {
      current: {
        signature: "Signature printed today",
        stamp: "Stamp printed today",
      },
      pending: {
        signature: "Signature uploaded, to review",
        stamp: "Stamp uploaded, to review",
      },
    },
    pin: {
      title: "Personal code",
      set: "Set",
      notSet: "Not created yet",
      locked: (time: string) => `Locked until ${time}`,
      reset: "Erase the code",
      resetConfirm: (name: string) =>
        `Erase the personal code of ${name}? They will create a new one at their next signature, and will be informed by email. Only do this at their request, after checking their identity through another channel.`,
      resetSubmit: "Erase the code",
      resetDone: "Code erased: the radiologist will create a new one.",
      self: "You cannot erase your own code.",
    },
    demoActions: {
      review: "Reviewing a signature",
      reset: "Erasing a personal code",
    },
  },

  credentials: {
    status: {
      verified: "Approved",
      pending: "To review",
      expired: "Certificate expired",
      undeclared: "File incomplete",
      license_missing: "Number missing",
      documents_missing: "Document missing",
    },
    practice: {
      registered: "Registered",
      resident: "Resident",
    },
    verifiedOn: "Approved on",
    validUntil: "Certificate valid until",
    licenseLabel: "Reg. no.",
    review: {
      trigger: "Review the file",
      title: (name: string) => `${name}’s file`,
      description:
        "Open the supporting document, check it, then accept or refuse. Every viewing and every decision is recorded in the audit log.",
      loading: "Loading the file…",
      noDocument:
        "No supporting document awaiting review: the radiologist must upload theirs first.",
      view: "Open the document",
      viewFailed: "The document could not be opened. Try again.",
      self: "You cannot decide on your own accreditation: another member of the IMAFRIK team must review your file.",
      licenseHint:
        "Check with the Medical Council that this number is registered to this person: it will be printed below their signature.",
      validUntil: "End date read on the certificate",
      validUntilHint:
        "Correct it if it differs from the one declared. Access closes the following day.",
      /** Ends within a month: to be confirmed before approving. */
      validUntilShort: (days: number) =>
        `Access would close ${days === 0 ? "tomorrow" : `in ${days + 1} days`}: a certificate usually covers a full academic year.`,
      validUntilShortConfirm: "I have checked this date on the certificate",
      accept: "Accept and approve",
      accepted: (name: string) =>
        `${name} is approved: their access to examinations is open.`,
      reject: "Refuse",
      reason: "Reason for refusal",
      reasonHint:
        "Sent to the radiologist, who will read it in their settings: say what they need to correct.",
      rejectSubmit: "Refuse this document",
      rejected: (name: string) =>
        `${name}’s document refused: the reason has been sent to them.`,
    },
    revoke: {
      trigger: "Withdraw approval",
      title: (name: string) => `Withdraw ${name}’s approval`,
      description:
        "This person immediately loses access to examinations. Those they held but had not yet signed are to assign again, and their drafts for these examinations are deleted. Reports already signed are not affected.",
      submit: "Withdraw approval",
      done: (name: string, released: number) =>
        released === 0
          ? `${name}’s approval withdrawn.`
          : `${name}’s approval withdrawn: ${released} examination${released === 1 ? " is" : "s are"} to assign again.`,
    },
  },

  /** Assignment of an examination to a radiologist by the team. */

  grant: {
    trigger: "Attach",
    title: (name: string) => `Attach ${name}`,
    description:
      "The person gains access to the organisation’s examinations on their next request. Check their file first: registration number, qualifications and identity.",
    organisation: "Organisation",
    groupSuffix: " (group)",
    role: "Role",
    submit: "Attach",
    done: (name: string, organisation: string | null) =>
      `${name} is now attached to ${organisation ?? "the organisation"}.`,
  },

  /**
   * Anonymising an account: the right to erasure, applied immediately.
   * The service does the same automatically five years after the
   * relationship ends.
   */
  anonymize: {
    trigger: "Anonymise",
    title: "Right to erasure",
    dialogTitle: (name: string) => `Anonymise ${name}’s account`,
    dialogDescription:
      "The action that fulfils a request for erasure. It is permanent and recorded in the audit log. It will:",
    consequences: [
      "delete the login account: email address, password, two-factor authentication and sessions; the person can no longer sign in;",
      "make their examinations in progress to assign again, and delete their drafts on those examinations;",
      "if they signed a report, wrote an addendum or appear in the audit log, keep their name, title and registration number attached to those records; their signature and preferences are deleted;",
      "otherwise, delete their profile entirely.",
    ],
    /** Before the account name, displayed separately. */
    confirmBefore: "To confirm, type the account name: ",
    confirmLabel: "Account name",
    confirmHint: "The exact name; capitals and surrounding spaces are ignored.",
    activeTitle: "This account is still a member of an active organisation",
    removeLabel: "Remove their memberships",
    removeDetail:
      "They immediately lose access to all their organisations, and their viewing and upload tokens are revoked.",
    submit: "Anonymise permanently",
    done: (name: string, kept: boolean) =>
      kept
        ? `${name}’s account has been anonymised: their identity remains attached to signed records and the audit log.`
        : `${name}’s account has been anonymised and deleted.`,
  },

  mfaReset: {
    confirm: (name: string) =>
      `Reset two-factor authentication for ${name}?\n\n` +
      "First verify their identity through another channel, for example by calling them on a known number. " +
      "At their next sign-in, they will set up a new phone.",
    done: (name: string) => `Two-factor authentication reset for ${name}.`,
    title: "Phone lost or replaced",
    button: "Reset",
  },

  requests: {
    inviteRadiologist: "Invite as radiologist",
    inviteTrackingFailed:
      "Invitation sent, but the request could not be marked as converted: update it by hand.",
    description: (count: number, fresh: number) =>
      `${count} request${count === 1 ? "" : "s"} · ${fresh} to handle`,
    stage: "Follow-up stage",
    allFilter: (count: number) => `All · ${count}`,
    status: {
      new: "New",
      contacted: "Contacted",
      converted: "Converted",
      dismissed: "Dismissed",
    },
    statusPlural: {
      new: "New",
      contacted: "Contacted",
      converted: "Converted",
      dismissed: "Dismissed",
    },
    noRequest: "No requests",
    nothingInStage: "Nothing at this stage",
    emptyDetail: "Requests sent from the website’s contact form appear here.",
    notesLabel: "Team notes",
    notesPlaceholder: "Notes: call-back scheduled, quote sent…",
    saved: "Follow-up saved.",
    requester: "Requester",
    allRequesters: "All",
    requesterKind: {
      clinic: "Healthcare facility",
      radiologist: "Radiologist",
    },
    requesterKindPlural: {
      clinic: "Facilities",
      radiologist: "Radiologists",
    },
    license: "Declared registration number",
    licenseMissing: "Registration number not provided",
  },

  billing: {
    description: (month: string) =>
      `${month}: each clinic’s statement, as its manager sees it`,
    month: "Month",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    csvFilename: (month: string) => `imafrik-billing-${month}.csv`,
    csvHeaders: [
      "Month",
      "Clinic",
      "Item",
      "Detail",
      "Procedures",
      "Of which urgent",
      "Normal rate (FCFA excl. tax)",
      "Urgent rate (FCFA excl. tax)",
      "Amount (FCFA excl. tax)",
    ],
    totals: "Monthly totals",
    invoiced: "Total excl. tax",
    invoicedHint: (missing: number) =>
      missing === 0
        ? "subscriptions and technical fees"
        : missing === 1
          ? "excluding 1 clinic without a plan"
          : `excluding ${missing} clinics without a plan`,
    acts: "Procedures billed",
    actsHint: "signed report",
    unreported: "Without a signed report",
    unreportedHint: "not billed",
    unreportedInfo:
      "Examinations received during the month whose report is not yet signed: they do not count as procedures, and are not billed.",
    missingPlans: "Without a plan",
    missingPlansHint: "to set on the clinic’s page",
    current: "Current month: statements are provisional.",
    toClose:
      "Month over, not yet closed: check the statements, then close it to freeze them.",
    closedBefore: "Month closed on ",
    closedAfter: ": the statements no longer change.",
    close: "Close the month",
    closeTitle: (month: string) => `Close ${month}?`,
    closeDetail:
      "Each clinic’s statement is frozen as displayed. It will no longer change, even if a priority changes, a report is voided or a plan is modified. This cannot be undone.",
    closeConfirm: "Close for good",
    closed: (month: string) => `${month} is closed.`,
    clinicSheet: "Clinic page",
    emptyTitle: "No clinic this month",
    emptyDetail: "Each clinic’s statement appears here, month by month.",
  },

  system: {
    description: (environment: string, release: string | null) =>
      `Environment: ${environment} · version ${release ?? "unknown"}`,
    services: "Services",
    operational: "Operational",
    degraded: "Degraded",
    responding: (ok: number, total: number) => `${ok} of ${total} responding`,
    tasksFailing: (count: number) =>
      count > 1 ? `${count} safety tasks failing` : "1 safety task failing",
    pacs: "Central PACS",
    engineVersion: "engine version",
    storedStudies: "Examinations stored",
    inPacs: "in the PACS",
    imageVolume: "Image volume",
    onPacsDisk: "on the PACS disk",
    dependencies: "Dependencies",
    up: "Responding",
    down: "Not responding",
    safetyNets: "Safety nets",
    safetyNetsDescription: "Latest run of each scheduled task",
    history: "Operations history",
    historyDescription: "Recent runs across all tasks",
    historyFiltered: "Recent runs matching the filters",
  },

  audit: {
    description:
      "Every sensitive action, timestamped and attributed (read-only)",
    olderEntries: "Older entries",
    backToLatest: "Back to the most recent",
    emptyTitle: "No entries",
    emptyDetail: "The log fills up as the platform is used.",
    system: "System",
    rule: "Assignment rule",
    families: {
      study: "Examinations",
      prior: "Prior studies",
      report: "Reports",
      signing: "Signatures and stamps",
      user: "Accounts",
      membership: "Memberships",
      profile: "Profiles",
      organization: "Organisations",
      gateway: "Gateways",
      billing: "Billing",
      agreement: "Agreements",
      contact_request: "Requests received",
      platform: "Platform",
    },
    actions: {
      "study.viewed": "Examination viewed",
      "study.claimed": "Examination claimed",
      "study.urgent_claimed": "Urgent examination taken from the urgent list",
      "study.released": "Examination returned by the radiologist",
      "study.assigned": "Examination assigned to a radiologist",
      "study.auto_assigned": "Examination assigned by a rule",
      "study.unassigned": "Assignment withdrawn",
      "study.urgent_alerted": "Alert: urgent examination not taken in 10 min",
      "prior.shared": "Prior examination shared",
      "prior.unshared": "Prior examination withdrawn",
      "study.updated": "Urgency or clinical information changed",
      "study.images_purged": "Images purged from the PACS",
      "report.signed": "Report signed",
      "report.addendum": "Addendum added",
      "report.delivered": "Report delivered",
      "report.downloaded": "Report downloaded",
      "report.voided": "Report voided",
      "report.ai_reviewed": "Draft reviewed by AI",
      "membership.created": "Member added",
      "membership.removed": "Member removed",
      "membership.reading_changed":
        "Radiologist’s modalities or urgent list changed",
      "organization.state_changed": "Organisation activated or suspended",
      "organization.pool_changed": "Pool access changed",
      "organization.urgent_readers_changed": "Urgent list changed",
      "organization.assignment_rules_changed": "Assignment rules changed",
      "organization.plan_changed": "Subscription plan changed",
      "organization.viewed": "Clinic opened in view-only mode",
      "organization.retention_changed": "Retention period changed",
      "organization.report_language_changed": "Report language changed",
      "organization.logo_changed": "Report logo changed",
      "organization.contract_ended": "Clinic contract ended",
      "organization.exported": "Organisation data exported",
      "organization.ai_features_changed": "AI features enabled or disabled",
      "user.mfa_reset_requested": "Two-factor authentication reset requested",

      "profile.identity_changed": "Name, title or registration number changed",
      "user.mfa_reset": "Two-factor authentication reset",
      "user.credential_document_uploaded": "Supporting document uploaded",
      "user.credential_document_viewed": "Supporting document viewed",
      "user.credentials_verified": "Radiologist approved",
      "user.credentials_rejected": "Supporting document refused",
      "user.credentials_revoked": "Approval withdrawn",
      "user.anonymization_requested": "Account anonymisation requested",
      "user.anonymized": "Account anonymised",
      "platform.settings_changed": "Settings changed",
      "billing.month_closed": "Billing month closed",
      "contact_request.tracked": "Contact request followed up",
      "agreement.accepted": "Agreement accepted",
      "signing.asset_changed": "Signature or stamp uploaded",
      "signing.asset_reviewed": "Signature or stamp reviewed",
      "signing.asset_viewed": "Signature or stamp viewed",
      "signing.pin_set": "Personal code set",
      "signing.pin_failed": "Wrong personal code",
      "signing.pin_locked": "Personal code locked",
      "signing.pin_reset_requested": "Personal code erasure requested",
      "signing.pin_reset": "Personal code erased",
      "organization.created": "Clinic created",
      "gateway.enrollment_created": "Enrolment code issued",
      "gateway.enrollment_cancelled": "Enrolment code cancelled",
      "gateway.enrolled": "Gateway enrolled",
      "gateway.approved": "Gateway approved",
      "gateway.rejected": "Gateway rejected",
      "gateway.activated": "Gateway activated",
      "gateway.suspended": "Gateway suspended",
      "gateway.resumed": "Gateway resumed",
      "gateway.revoked": "Gateway revoked",
      "gateway.renewal_requested": "Certificate renewal requested",
      "gateway.renewed": "Gateway certificate renewed",
      "gateway.adopted": "Gateway adopted into the database",
      "gateway.kit_downloaded": "Installation kit downloaded",
      "platform.tailscale_configured": "Tailscale connection saved",
      "platform.tailscale_removed": "Tailscale connection removed",
      "platform.tailscale_policy_pushed": "Tailscale access policy pushed",
    },
  },

  settings: {
    description:
      "Applied to the whole platform from the next page load and recorded in the audit log",
    platform: "Platform",
    lastChanged: "Last changed on",
    unreadable:
      "The settings cannot be read at the moment: the service is not responding. Please try again shortly.",
    operatorOnly: "From the operations workstation",
    operatorOnlyDescription: "Deliberately left out of this screen",
    operatorTasks: {
      adopt: {
        task: "Adopt the gateways connected before enrolment",
        why: "Once, during the transition: reads the certificates held on the operations workstation, which are not on the server.",
      },
      kit: {
        task: "Build and sign the installation kit",
        why: "Signing requires the code-signing certificate, kept off the server; the kit is then uploaded with tools/deploy.sh --push-kit.",
      },
      restore: {
        task: "Restore a backup",
        why: "Decryption requires the private age key, kept off the web and never typed into a form.",
      },
      deploy: {
        task: "Deploy a release",
        why: "Every deployment goes through CI, with its tests and approval step.",
      },
    },
    saved: "Settings saved.",
    typedValue: (duration: string) => ` Value entered: ${duration}.`,
    targets: "Turnaround committed to clinics",
    urgentHint: (preview: string) => `Between 5 and 720 minutes.${preview}`,
    routineHint: (preview: string) => `Between 15 and 2,880 minutes.${preview}`,
    banner: "Maintenance banner",
    bannerLabel: "Message shown to all users",
    bannerHint: (length: number, max: number) =>
      `${length} / ${max} characters. Leave empty to show no banner.`,
    bannerPlaceholder:
      "E.g. PACS maintenance on Sunday from 2:00 to 3:00 (Lomé time). Uploads will resume automatically.",
    bannerPreview: "Banner preview",
  },

  validation: {
    urgentInvalid: "Invalid urgent turnaround",
    urgentInteger: "Urgent turnaround: a whole number of minutes",
    urgentMin: "Urgent turnaround: at least 5 minutes",
    urgentMax: "Urgent turnaround: no more than 12 hours",
    routineInvalid: "Invalid routine turnaround",
    routineInteger: "Routine turnaround: a whole number of minutes",
    routineMin: "Routine turnaround: at least 15 minutes",
    routineMax: "Routine turnaround: no more than 48 hours",
    bannerMax: "Banner: no more than 280 characters",
    urgentAboveRoutine:
      "The urgent turnaround cannot exceed the routine turnaround",
    organisationInvalid: "Invalid organisation",
    notesMax: "Notes: no more than 4,000 characters",
    retentionInvalid: "Invalid retention period",
    retentionInteger: "Retention period: a whole number of days",
    retentionMin: "Retention period: at least 30 days",
    retentionMax: "Retention period: no more than 20 years",
    languageUnknown: "Unknown language.",
    stateInvalid: "Invalid status.",
    emailInvalid: "Invalid email address",
    nameRequired: "A name is required",
    confirmNameRequired: "Type the clinic’s name to confirm",
    confirmAccountNameRequired: "Type the account name to confirm",
  },
  demoActions: {
    plan: "Setting the subscription plan",
    closeMonth: "Closing the month",
    assignment: "Assigning examinations",
    clinicLogo: "The report logo",
    settings: "Changing the settings",
    grant: "Attaching an account",
    tracking: "Following up on requests",
    mfaReset: "Resetting two-factor authentication",
    credentials: "Verifying registration numbers",
    retention: "Changing the retention period",
    reportLanguage: "Changing the report language",
    aiFeatures: "Enabling AI features",
    contractEnd: "Ending a contract",
    anonymize: "Anonymising an account",
    suspension: "Suspending an organisation",
    invitation: "Sending an invitation",
  },

  demo: {
    alerts: {
      urgentUnclaimed: (count: number, minutes: number) =>
        count > 1
          ? `${count} urgent examinations have not been taken by any radiologist for more than ${minutes} min`
          : `${count} urgent examination has not been taken by any radiologist for more than ${minutes} min`,
      urgentOverdue: (count: number, minutes: number) =>
        `${count} urgent examination${count === 1 ? " has" : "s have"} been waiting for more than ${minutes} min`,
      routineOverdue: (count: number, hours: number) =>
        `${count} examination${count === 1 ? " has" : "s have"} exceeded the ${hours} h turnaround`,
      clinicSilent: (clinic: string, hours: number) =>
        `${clinic} has sent nothing for ${hours} h: check the gateway`,
      hostWatchFailed: "Host monitoring failed: /var disk at 83%",
      unverifiedRadiologists: (count: number) =>
        count === 1
          ? "1 radiologist’s supporting document is awaiting review"
          : `${count} radiologists’ supporting documents are awaiting review`,
      signingReviews: (count: number) =>
        count === 1
          ? "1 signature or stamp image awaits your review"
          : `${count} signature or stamp images await your review`,
      newRequests: (count: number) =>
        `${count} contact request${count === 1 ? " is" : "s are"} awaiting a reply`,
    },
    ops: {
      backupDatabase: "41.3 MB encrypted · 18 tables verified",
      backupDatabasePrevious: "41.1 MB encrypted · 18 tables verified",
      backupIndex: "3.8 MB encrypted",
      restoreDrill: "Restore successful: 18 tables, 0 discrepancies",
      reconciliationClean: "0 examinations missing",
      reconciliationCaught: "1 examination recovered",
      retention:
        "3 examinations purged from the PACS, 0 failed, 0 contact requests deleted, 0 accounts anonymised, 0 postponed",
      hostWatchFailed: "/var disk at 83% (alert threshold: 80%)",
      hostWatchOk: "/var disk at 79%",
    },
    environment: "demo",
    services: {
      database: "Database",
      pacs: "Central PACS",
      storage: "Object storage",
      network: "Private network",
    },
    serviceDetails: {
      storage: "R2 · reports",
      network: (gateways: number) =>
        `Tailscale · ${gateways} ${gateways === 1 ? "gateway" : "gateways"}`,
    },
  },
};
