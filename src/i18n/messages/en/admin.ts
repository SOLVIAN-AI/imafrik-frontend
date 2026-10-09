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
    byClinic: "By clinic",
    byClinicDescription:
      "Throughput is measured on the link between the gateway and the central PACS",
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
    byRadiologist: "By radiologist",
    byRadiologistDescription:
      "Total turnaround (receipt → signature) and reading time (claim → signature)",
    noReport: "No reports signed in this period.",
    signed: "signed",
    radiologistTimes: (total: string, reading: string) =>
      `turnaround ${total} · reading ${reading}`,
  },

  flow: {
    description: (count: number) =>
      `The last ${count} examinations received, from acquisition to report delivery`,
    emptyTitle: "No examinations received",
    emptyDetail:
      "Examinations appear here as soon as the central PACS has received them.",
    medianThroughput: "Median throughput",
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
    openUrgent: "Open urgent cases",
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
  },

  organisations: {
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
    contractTerm: "Contract term",
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
      "The period set in the contract, starting from report delivery. After that, images leave the central PACS; the examination record and the signed report are kept, and the clinic keeps its originals. Empty: images are kept for the full term of the contract.",
    label: "Image retention (days)",
    purgedHint: (count: number) =>
      `${count} examination${count === 1 ? "" : "s"} already purged. Between 30 and 7,300 days.`,
    hint: "Between 30 and 7,300 days. Leave empty to keep images for the full term of the contract.",
    contractTerm: "Contract term",
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
      "keep images for the retention period set in the contract;",
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
    accountCount: (count: number) =>
      `${count} account${count === 1 ? "" : "s"}`,
    withoutMfa: (count: number) =>
      `${count} with a sensitive role and no two-factor authentication`,
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
    mfaRequired: "Required for radiologists and administrators",
    mfaMissing: "MFA missing",
    mfaNone: "No MFA",
    unverifiedFilter: "To verify",
    unverifiedTitle: "Registration numbers to verify",
    unverifiedDescription:
      "Radiologists whose registration number is awaiting verification by the IMAFRIK team: until then, they cannot see any examinations.",
    noUnverified: "No registration numbers to verify",
    unverifiedHint:
      "A radiologist appears here once attached to an organisation, and again if they change their registration number.",
  },

  credentials: {
    status: {
      verified: "Number verified",
      pending: "To verify",
      missing: "Number missing",
    },
    verifiedOn: "Verified on",
    licenseLabel: "Reg. no.",
    verify: {
      trigger: "Verify registration number",
      title: (name: string) => `Verify ${name}’s registration number`,
      description:
        "Check with the medical council that this number is registered to this person and allows them to practise. Verification gives immediate access to examinations; it is recorded in the audit log together with the number checked.",
      numberLabel:
        "Number to check, as it will be printed below their signature",
      submit: "Verify this number",
      done: (name: string) => `${name}’s registration number verified.`,
      missing:
        "No registration number provided: the radiologist must enter it in their settings before it can be verified.",
      self: "You cannot verify your own registration number: another member of the IMAFRIK team must check it.",
    },
    revoke: {
      trigger: "Withdraw verification",
      title: (name: string) => `Withdraw ${name}’s verification`,
      description:
        "This person immediately loses access to examinations. Those they have claimed but not yet signed return to the pool, and their drafts for these examinations are deleted. Reports already signed are not affected.",
      submit: "Withdraw verification",
      done: (name: string, released: number) =>
        released === 0
          ? `${name}’s verification withdrawn.`
          : `${name}’s verification withdrawn: ${released} examination${released === 1 ? "" : "s"} returned to the pool.`,
    },
  },

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
      `${month}: procedures received, by clinic and modality`,
    month: "Month",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    csvFilename: (month: string) => `imafrik-procedures-${month}.csv`,
    csvHeaders: [
      "Month",
      "Clinic",
      "Modality",
      "Routine",
      "Urgent",
      "Total",
      "Reports signed",
    ],
    totals: "Monthly totals",
    received: "Procedures received",
    urgentRate: "billed at the urgent rate",
    unreported: "Without a signed report",
    monthInProgress: "the month is still in progress",
    checkBeforeInvoice: "to check before invoicing",
    procedures: "Procedures",
    emptyTitle: "No procedures this month",
    emptyDetail: "Examinations received appear here, grouped by clinic.",
    clinicSummary: (received: string, urgent: string, reported: string) =>
      `${received} procedures · ${urgent} urgent · ${reported} reports signed`,
    columns: {
      modality: "Modality",
      routine: "Routine",
      urgent: "Urgent",
      total: "Total",
      signed: "Signed",
    },
    total: "Total",
  },

  system: {
    description: (environment: string, release: string | null) =>
      `Environment: ${environment} · version ${release ?? "unknown"}`,
    services: "Services",
    operational: "Operational",
    degraded: "Degraded",
    responding: (ok: number, total: number) => `${ok} of ${total} responding`,
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
  },

  audit: {
    description:
      "Every sensitive action, timestamped and attributed (read-only)",
    olderEntries: "Older entries",
    backToLatest: "Back to the most recent",
    emptyTitle: "No entries",
    emptyForAction: "No entries for this action.",
    emptyDetail: "The log fills up as the platform is used.",
    system: "System",
    actions: {
      "study.viewed": "Examination viewed",
      "study.claimed": "Examination claimed",
      "study.released": "Examination returned to the pool",
      "study.images_purged": "Images purged from the PACS",
      "report.signed": "Report signed",
      "report.addendum": "Addendum added",
      "report.delivered": "Report delivered",
      "report.downloaded": "Report downloaded",
      "membership.created": "Member added",
      "membership.removed": "Member removed",
      "organization.state_changed": "Organisation activated or suspended",
      "organization.pool_changed": "Pool access changed",
      "organization.retention_changed": "Retention period changed",
      "organization.report_language_changed": "Report language changed",
      "organization.contract_ended": "Clinic contract ended",
      "organization.exported": "Organisation data exported",
      "profile.identity_changed": "Name, title or registration number changed",
      "user.mfa_reset": "Two-factor authentication reset",
      "user.credentials_verified": "Registration number verified",
      "user.credentials_revoked": "Registration number verification withdrawn",
      "platform.settings_changed": "Settings changed",
      "contact_request.tracked": "Contact request followed up",
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
      clinic: {
        task: "Connect a clinic",
        why: "Generates the DICOM TLS certificate and the single-use Tailscale key: secrets that never travel over the web.",
      },
      revoke: {
        task: "Revoke a gateway",
        why: "Revocation involves the certificate authority, which is kept offline.",
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
  },
  demoActions: {
    settings: "Changing the settings",
    grant: "Attaching an account",
    tracking: "Following up on requests",
    mfaReset: "Resetting two-factor authentication",
    credentials: "Verifying registration numbers",
    retention: "Changing the retention period",
    reportLanguage: "Changing the report language",
    contractEnd: "Ending a contract",
    suspension: "Suspending an organisation",
    invitation: "Sending an invitation",
  },

  demo: {
    alerts: {
      urgentOverdue: (count: number, minutes: number) =>
        `${count} urgent examination${count === 1 ? " has" : "s have"} been waiting for more than ${minutes} min`,
      routineOverdue: (count: number, hours: number) =>
        `${count} examination${count === 1 ? " has" : "s have"} exceeded the ${hours} h turnaround`,
      clinicSilent: (clinic: string, hours: number) =>
        `${clinic} has sent nothing for ${hours} h: check the gateway`,
      hostWatchFailed: "Host monitoring failed: /var disk at 83%",
      unverifiedRadiologists: (count: number) =>
        count === 1
          ? "1 radiologist is awaiting verification of their registration number"
          : `${count} radiologists are awaiting verification of their registration number`,
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
        "3 examinations purged from the PACS, 0 failed, 0 contact requests deleted",
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
