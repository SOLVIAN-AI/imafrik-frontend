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
      sent: "Sent in the last 30 days",
      inReading: "Being read",
      reportsReady: "Reports ready",
      toDownload: "to download",
      medianTurnaround: "Median turnaround (30 days)",
      turnaroundHint: "from receipt to signature",
    },
    readyTitle: "Reports to download",
    readyEmpty: "No reports waiting to be downloaded.",
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
    reportAvailable: "Report available",
    columns: {
      patient: "Patient",
      study: "Examination",
      status: "Status",
      slices: "Images",
      sent: "Sent",
      report: "Report",
    },
    available: "Available",
    pending: "Pending",
  },
  study: {
    readAndWrite: "Read and report",
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
    added: (name: string, organization: string) =>
      `${name} has been added to ${organization}.`,
  },
  reports: {
    title: "Reports",
    descriptionClinic: "Signed documents sent to your facility",
    descriptionRadiologist: "The reports you have signed",
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
};
