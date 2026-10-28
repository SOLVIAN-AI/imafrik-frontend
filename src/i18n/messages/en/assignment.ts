import type { AppMessages } from "@/i18n/messages/fr";

/** Texts for assigning examinations, in English. */
export const assignment: AppMessages["assignment"] = {
  dialog: {
    trigger: "Assign",
    triggerReassign: "Reassign",
    triggerLabel: (patient: string) => `Assign ${patient}’s examination`,
    triggerReassignLabel: (patient: string) =>
      `Reassign ${patient}’s examination`,
    title: "Assign the examination",
    description:
      "The chosen radiologist finds it in “Assigned to you”; only they can see it and take it on, and they are notified by email.",
    current: "Current holder",
    currentSince: "assigned on",
    urgentTaken: "urgent examination taken from the urgent list",
    nobody: "Nobody: the examination is waiting to be assigned.",
    candidates: "Radiologists who can receive it",
    candidatesHint: (modality: string) =>
      `Approved, and reading the ${modality} modality.`,
    noCandidatesClinic:
      "None of your radiologists can receive this examination: check their modalities in “Team”, or ask the IMAFRIK team to assign it to a network radiologist.",
    noCandidatesTeam:
      "No approved radiologist can receive this examination: check the affiliations, the service contract and the modalities.",
    pool: "IMAFRIK network",
    clinicRadiologist: "Clinic radiologist",
    load: (count: number) =>
      count === 0
        ? "No examination in progress"
        : `${count} examination${count > 1 ? "s" : ""} in progress`,
    draftWarning: (name: string) =>
      `${name} has started writing this report. Their draft will be discarded.`,
    confirmDraft: "Understood: discard the draft",
    submit: "Assign",
    reassign: "Reassign",
    share: "Share",
    release: "Withdraw the assignment",
    assigned: (name: string) => `Examination assigned to ${name}.`,
    assignedNotNotified: (name: string) =>
      `Examination assigned to ${name}. The email was not sent: let them know directly.`,
    released:
      "Assignment withdrawn: the examination is waiting to be assigned again.",
    shared: (count: number) =>
      count > 1
        ? `${count} prior examinations shared.`
        : "Prior examination shared.",
    unshared: "Prior examination withdrawn.",
    signed: "Report signed: the examination can no longer be assigned.",
    loading: "Loading radiologists…",
  },
  priors: {
    title: "The patient’s prior examinations",
    hint: "Nothing is shared by default: tick what the radiologist should see, images and signed report, read-only.",
    forHolder: (name: string) => `Shared with ${name}`,
    certain: "Same patient",
    certainHint: "same patient ID",
    probable: "Probably the same patient, to check",
    probableHint: "same name and date of birth, different ID",
    selectAll: "Select all",
    none: "No prior examination of this patient at the clinic.",
    signedReport: "Signed report",
    noReport: "No signed report",
    alreadyShared: "Shared",
    revoke: "Withdraw",
    revokeLabel: (study: string) => `Withdraw the prior examination ${study}`,
    loading: "Looking for prior examinations…",
    identity: (name: string, id: string, birth: string) =>
      [name, id && `ID ${id}`, birth && `born ${birth}`]
        .filter(Boolean)
        .join(" · "),
  },
  sheet: {
    title: "Assignment",
    toAssign: "To assign",
    toAssignHint:
      "No radiologist can see this examination until you assign it.",
    urgentWaiting:
      "Urgent: visible to the radiologists on your urgent list; the first to take it gets it.",
    holder: (name: string) => `Assigned to ${name}`,
    since: "since",
    priorsShared: (count: number) =>
      count === 0
        ? "No prior examination shared"
        : count > 1
          ? `${count} prior examinations shared`
          : "1 prior examination shared",
    signedBy: (name: string) => `Read and signed by ${name}`,
  },
  list: {
    all: "All",
    toAssign: "To assign",
    filterLabel: "Show",
    radiologist: "Radiologist",
    unassigned: "To assign",
  },
  modalities: {
    radiography: "Radiography",
    mammography: "Mammography",
    ultrasound: "Ultrasound",
    ct: "CT",
    mri: "MRI",
    other: "Other",
    all: "All modalities",
  },
  reading: {
    title: (name: string) => `${name}’s reading`,
    description:
      "The modalities they read limit what can be assigned to them; the urgent list lets them take an urgent examination without waiting for it to be assigned.",
    trigger: "Modalities and urgent list",
    triggerLabel: (name: string) => `Modalities and urgent list for ${name}`,
    modalities: "Modalities read",
    modalitiesHint: "At least one. All ticked: they read everything.",
    urgent: "Urgent list",
    urgentHint:
      "They are emailed when an urgent examination is waiting, and can take it without an assignment. The first to take it gets it.",
    urgentBadge: "Urgent list",
    saved: (name: string) => `${name}’s reading saved.`,
    submit: "Save",
  },
  urgentReaders: {
    title: "Urgent list",
    description:
      "Radiologists allowed to take an urgent examination from this clinic without an assignment, emailed when it arrives. The first to take it gets it.",
    trigger: "Set the urgent list",
    empty:
      "No approved radiologist can read this clinic: affiliate one, or open it to the network.",
    none: "Nobody on the list: urgent examinations wait for an assignment.",
    count: (count: number) =>
      count > 1
        ? `${count} radiologists on the list`
        : "1 radiologist on the list",
    saved: "Urgent list saved.",
    submit: "Save",
    loading: "Loading radiologists…",
  },
  demoAction: "Assigning examinations",
};
