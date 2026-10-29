import type { AppMessages } from "@/i18n/messages/fr";

/**
 * Clinic portal, in English: dashboard, examinations, sending, team and
 * reports (screens shared with radiologists).
 */
export const clinic: AppMessages["clinic"] = {
  dashboard: {
    title: "Dashboard",
    send: "Send an examination",
    metrics: {
      toAssign: "To assign",
      toAssignHint: "no radiologist can see them yet",
      toAssignInfo:
        "Examinations received that have no radiologist yet: none can see them, except an urgent one, open to the radiologists on your urgent list.",
      urgentWaiting: (count: number) =>
        count > 1
          ? `including ${count} urgent ones, open to your urgent list`
          : "including 1 urgent one, open to your urgent list",
      sent: "Sent in the last 30 days",
      inReading: "Being read",
      reportsReady: "Reports ready",
      toDownload: "to download",
      medianTurnaround: "Median turnaround (30 days)",
      turnaroundHint: "from receipt to signature",
    },
    readyTitle: "Reports to download",
    readyEmpty: "No reports waiting to be downloaded.",
    readyNote:
      "Each PDF carries a verification code that your patient or a colleague can check on imafrik.tech. Every download is logged.",
    signedBy: (name: string) => `signed by ${name}`,
    recentTitle: "Latest examinations sent",
    recentEmpty: "No examinations sent yet.",
  },
  studies: {
    title: "Examinations",
    count: (count: number) =>
      count === 1 ? "1 examination" : `${count} examinations`,
    send: "Send",
    noResult: "No results",
    noResultDetail: "Broaden your search to see more examinations.",
    empty: "No examinations sent",
    emptyDetail:
      "Examinations relayed by your gateway or uploaded from the browser appear here.",
    columns: {
      patient: "Patient",
      study: "Examination",
      status: "Status",
      sent: "Sent",
      report: "Report",
    },
    pending: "Pending",
  },
  study: {
    report: "Report",
    signedBy: "Signed by",
    fullDocument: "Full document",
    reportInProgress: "The report is being written.",
    reportPending:
      "The report will be available as soon as a radiologist has signed it.",
    progress: "Progress",
    information: "Details",
    facility: "Facility",
    clinicalInfo: "Clinical information",
    series: "Series",
    receivedAt: "Received",
    radiologist: "Radiologist",
    unassigned: "Not assigned",
    studyUid: "Study UID",
    images: "Images",
    seriesCount: (count: number) => `${count} series`,
    slices: (count: number, display: string) =>
      count === 1 ? `${display} image` : `${display} images`,
    openImages: "Open images",
    viewerNote: "Images open in the viewer, and every access is logged.",
    clinical: {
      title: "Urgency and clinical information",
      urgentLabel: "Urgent examination",
      urgentDetail:
        "Read first, within the turnaround promised for urgent cases. Keep it for situations that cannot wait.",
      urgentUnsaved:
        "Not sent yet: save to flag the examination as urgent to the radiologist.",
      urgentRemovalUnsaved: "Not sent yet: save to remove the urgent flag.",
      infoLabel: "Clinical information",
      infoHint:
        "Context and the question for the radiologist, who sees it on the reading screen and can carry it into the indication.",
      infoPlaceholder:
        "E.g. sudden headache for two hours, left-sided weakness. Suspected stroke.",
      save: "Save",
      saved: "Examination updated.",
      lockedNote: "Can be changed until a radiologist signs the report.",
      tooLong: (max: string) =>
        `Clinical information cannot exceed ${max} characters.`,
      demoAction: "Saving urgency and clinical information",
    },
  },
  timeline: {
    received: {
      title: "Examination received",
      detail: "The images have arrived on the platform.",
    },
    assigned: {
      title: "Assigned to a radiologist",
      detail: "A radiologist has taken on the examination.",
    },
    in_progress: {
      title: "Being read",
      detail: "The report is being written.",
    },
    reported: {
      title: "Report signed",
      detail: "The document is available to download.",
    },
    delivered: {
      title: "Report delivered",
      detail: "The facility has downloaded the document.",
    },
  },
  send: {
    title: "Send an examination",
    description: (organization: string) =>
      `Images from ${organization} are encrypted in transit`,
    browserUpload: "Upload from this browser",
    gateway: "Facility gateway",
    gatewayText:
      "If your facility is equipped with the IMAFRIK gateway, your consoles need no further action: each examination is sent automatically, encrypted, one minute after its last image.",
    lastReceived: "Last examination received: ",
    noneYet: "none yet",
    troubleshootBefore: "Has an examination you sent not appeared? Run",
    troubleshootAfter: (guide: string) =>
      `on the gateway computer, then refer to the guide supplied at installation (${guide}).`,
  },
  uploader: {
    dropTitle: "Drop the examination files here",
    dropDetail:
      "Or choose the whole folder from a CD: the index and any files that are not images are set aside automatically.",
    chooseFiles: "Choose files",
    chooseFolder: "Choose a folder",
    progress: (done: number, total: number) =>
      `${done} of ${total} ${total === 1 ? "file" : "files"} processed`,
    rejected: (count: number) => `, ${count} rejected`,
    finished: ". The examination will appear in your list within a minute.",
    waiting: "Waiting",
    sending: (percent: number) => `Uploading… ${percent}%`,
    stored: "Uploaded",
    duplicate: "Already received",
    ignored: "CD index, set aside",
    refused: (status: number) => `Rejected (${status})`,
    connectionLost: "Connection lost",
    unavailable: "Upload unavailable",
    demoAction: "Uploading examinations",
  },
  team: {
    title: "Team",
    count: (count: number) => (count === 1 ? "1 member" : `${count} members`),
    you: "(you)",
    roleSince: (role: string, date: string) => `${role} since ${date}`,
    since: (date: string) => `Since ${date}`,
    remove: "Remove from team",
    removeConfirm: (name: string) =>
      `Remove ${name} from the team? Their access ends immediately.`,
    removed: (name: string) => `${name} has been removed from the team.`,
    actionsFor: (name: string) => `Actions for ${name}`,
    soleManager:
      "You are the clinic’s only manager: invite a second one, who will take over in your absence. The last manager cannot be removed.",
    invalidEmail: "Invalid email address",
    nameRequired: "A name is required",
    nameTooLong: "The name is too long",
    inviteDemoAction: "Inviting a member",
    removeDemoAction: "Removing a member",
    poolDemoAction: "This setting",
  },
  invite: {
    button: "Invite",
    title: (organization: string) => `Invite to ${organization}`,
    description:
      "The person receives a link by email and chooses their own password. If they already use IMAFRIK, they are simply added.",
    fullName: "Full name",
    email: "Email address",
    role: "Role",
    submit: "Send invitation",
    radiologistNote:
      "A radiologist can only access examinations once the IMAFRIK team has verified their registration number. They enter it themselves when they first sign in.",
    managerNote:
      "A manager sends the examinations, entrusts them to the clinic’s radiologists and manages the team: they invite and remove managers and radiologists.",
    added: (name: string, organization: string) =>
      `${name} has been added to ${organization}.`,
  },
  reports: {
    title: "Reports",
    descriptionClinic: "Signed documents sent to your facility",
    descriptionRadiologist: "The reports you have signed",
    /** IMAFRIK team: every report on the platform. */
    descriptionAdmin: (count: number) =>
      `${count} report${count === 1 ? "" : "s"} across all clinics, drafts in progress included`,
    filter: "Report status",
    filters: {
      all: "All",
      draft: "Being written",
      signed: "Signed",
      delivered: "Delivered",
      toDownload: "To download",
      downloaded: "Downloaded",
    },
    draftBy: (name: string) => `Being written · ${name}`,
    emptyAdmin:
      "Reports from every clinic appear here as soon as they start being written.",
    noResult: "No results",
    noResultDetail: "Try another name or ID.",
    empty: "No reports",
    emptyDetail:
      "Signed reports appear here, with their PDF and verification link.",
    toDownload: "To download",
    downloaded: "Downloaded",
    signedBy: "Signed by",
    signatureDate: "Date signed",
    license: (number: string) => `Registration no. ${number}`,
    publicVerification: "Public verification",
    downloadPdf: "Download PDF",
  },
  activity: {
    title: "Activity and billing",
    month: "Month",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    activity: {
      title: "Activity",
      description:
        "Examinations received during the month, and what became of them, even if signed after the month ended",
      received: "Examinations received",
      ofWhichUrgent: (count: number) => `${count} of them urgent`,
      signed: "Reported",
      pending: (count: number) =>
        count === 1
          ? `${count} is awaiting its report`
          : `${count} are awaiting their report`,
      median: "Median turnaround",
      medianHint: "from receipt to signed report",
      withinSla: "Within promised times",
      slaHint: (routine: string, urgent: string) =>
        `${routine} routine, ${urgent} urgent`,
      byModality: "By modality",
      columns: {
        modality: "Modality",
        routine: "Routine",
        urgent: "Urgent",
        signed: "Reported",
        median: "Median turnaround",
        withinSla: "Within time",
      },
      emptyTitle: "No examination received this month",
      emptyDetail:
        "The examinations your clinic sends appear here, month by month.",
    },
    anchors: {
      label: "On this page",
      activity: "Activity",
      performance: "Performance by radiologist",
      billing: "Billing",
    },
    performance: {
      title: "Performance by radiologist",
      description:
        "Examinations received during the month: turnaround, promised times met, trend against the previous month. Click a heading to sort; ⓘ tells what it measures.",
      emptyTitle: "No radiologist activity this month",
      emptyDetail:
        "Performance appears as soon as an examination received during the month is handed to a credentialed radiologist, then signed.",
      noSigned:
        "No report signed this month: turnaround stays empty until the first signed procedure. Examinations in progress and returned are already counted.",
      info: {
        signed:
          "Signed reports for examinations received during the month, urgent ones included.",
        pickup:
          "Median time between the examination’s assignment and the start of its reading.",
        reading:
          "Median time between the start of reading and the report’s signature.",
        released:
          "Examinations the radiologist returned before signing them (“Return the examination”), during the month.",
        urgentClaimed:
          "Urgent examinations taken from the urgent list without assignment, during the month.",
        open: "Right now: examinations assigned but not started, then examinations being read.",
        trendTitle: "Trend arrows",
        trend:
          "Arrow under a figure: the change from the previous month, green when it improves.",
      },
      groups: {
        overall: "All priorities",
        routine: "Routine",
        urgent: "Urgent",
        workflow: "Medians",
        month: "During the month",
      },
      columns: {
        name: "Radiologist",
        signed: "Procedures signed",
        median: "Median turnaround",
        withinSla: "Within time",
        routineMedian: "Median",
        routineMean: "Mean",
        routineP90: "90th percentile",
        routineWithinSla: "Within time",
        urgentMedian: "Median",
        urgentMean: "Mean",
        urgentP90: "90th percentile",
        urgentWithinSla: "Within time",
        pickup: "Pick-up",
        reading: "Reading",
        released: "Returned unsigned",
        urgentClaimed: "Urgent taken",
        open: "In progress",
      },
      sortBy: (column: string) => `Sort by ${column}`,
      urgentShare: (count: number) => `${count} urgent`,
      open: (waiting: number, reading: number) =>
        `${waiting} assigned not started, ${reading} being read`,
      points: (value: string) => `${value} pts`,
      trend: {
        better: (value: string) => `improved by ${value} on the previous month`,
        worse: (value: string) => `worse by ${value} than the previous month`,
        same: "stable on the previous month",
      },
    },
    billing: {
      title: "Billing",
      provisional:
        "Provisional statement: it follows the month’s activity until the IMAFRIK team closes the month.",
      closedBefore: "Month closed on ",
      closedAfter: ": this statement no longer changes.",
      none: "No statement for this month: the clinic was not yet in service.",
      noPlan: "Plan not set",
      noPlanDetail:
        "The IMAFRIK team sets your subscription plan. Until then, neither the subscription nor the total is priced.",
      plans: {
        essential: "Essentiel plan",
        pro: "Pro plan",
        facility: "Établissement plan",
      },
      subscription: "Subscription",
      perMonth: "per month",
      technicalFees: "Technical fees",
      technicalFeesDetail:
        "One fee per examination received during the month whose report is signed, at the normal or urgent rate.",
      baseTariff:
        "Each procedure is counted at the base rate of its modality (radiography, CT, MRI): how complex examinations are classified is still to be defined.",
      feeClasses: {
        radiography: "Radiography",
        complex_radiography: "Complex radiography",
        hysterosalpingography: "Hysterosalpingography",
        ct: "CT",
        complex_ct: "Complex CT",
        mri: "MRI",
      },
      columns: {
        type: "Examination type",
        routine: "Normal",
        urgent: "Urgent",
        amount: "Amount",
      },
      acts: (count: number) =>
        count === 1 ? `${count} procedure` : `${count} procedures`,
      unitPrice: (amount: string) => `at ${amount}`,
      urgentActs: (count: number) => `${count} urgent`,
      noActs: "No procedure billed this month.",
      outOfGrid: (list: string) => `Outside the fee schedule: ${list}`,
      outOfGridDetail:
        "Modalities missing from the fee schedule: no fee is billed.",
      unreported: (count: number) =>
        count === 1
          ? `${count} examination received without a signed report: not billed`
          : `${count} examinations received without a signed report: not billed`,
      fees: "Radiologists’ fees",
      feesDetail:
        "Procedures signed by each radiologist. The fee amount is agreed between the clinic and the radiologist and goes to them in full: IMAFRIK never collects it.",
      noFees: "No procedure signed this month.",
      total: "Total excl. tax",
      totalHint: "subscription and technical fees",
      totalMissing: "not priced without a plan",
      amount: (amount: string) => `${amount} FCFA`,
      csvFilename: (month: string) => `imafrik-statement-${month}.csv`,
      csvHeaders: [
        "Month",
        "Item",
        "Detail",
        "Procedures",
        "Of which urgent",
        "Normal rate (FCFA excl. tax)",
        "Urgent rate (FCFA excl. tax)",
        "Amount (FCFA excl. tax)",
      ],
      csv: {
        subscription: "Subscription",
        technicalFee: "Technical fee",
        outOfGrid: "Outside the fee schedule",
        unreported: "Not billed",
        unreportedDetail: "No signed report",
        fees: "Fees",
        total: "Total",
      },
    },
  },
};
