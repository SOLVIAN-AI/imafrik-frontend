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
  blocked: {
    title: "Nobody can receive this examination",
    short: "Nobody can receive it",
    candidates: (count: number) =>
      count === 1 ? "1 possible radiologist" : `${count} possible radiologists`,
    compact: "Nobody eligible",
    candidatesCompact: (count: number) => `${count} eligible`,
    reasons: {
      clinic_inactive:
        "The clinic is suspended: its examinations can no longer be assigned.",
      no_reader:
        "No radiologist reads for this clinic: it has none of its own, and no network group has a contract with it.",
      not_credentialed:
        "The radiologists who read for this clinic are not credentialed yet: their supporting document has not been approved.",
      modality_not_read:
        "No credentialed radiologist reads this modality for this clinic.",
    },
    modalityNotRead: (group: string) =>
      `No credentialed radiologist reads “${group}” for this clinic.`,
    unknown:
      "No credentialed radiologist who reads for this clinic and this modality can receive it.",
    clinic: "None of your radiologists can receive this examination.",
    whatToDo: "To be able to assign it",
    remedies: {
      reactivate: {
        text: "Reactivate the clinic from its record.",
        link: "Clinic record",
      },
      openToPool: {
        text: "Check on its record that it is open to the pool, with an active service contract.",
        link: "Clinic record",
      },
      attachRadiologist: {
        text: "Or attach a credentialed radiologist to it, from “Accounts”.",
        link: "Accounts",
      },
      validateCredentials: {
        text: "Approve the supporting document of a radiologist who reads for the clinic: they become credentialed.",
        link: "Documents to review",
      },
      setModalities: {
        text: "Tick this modality for a credentialed radiologist: “Modalities” button on their row, in “Accounts”.",
        link: "Accounts",
      },
      checkTeam: {
        text: "Check in “Team” that your radiologists are approved and read this modality.",
        link: "Team",
      },
      askTeam: {
        text: "Otherwise, ask the IMAFRIK team to assign it to a network radiologist.",
        link: "",
      },
    },
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
    action: "Assignment",
    modalityLabel: "Modalities",
    allModalities: "All",
    modalityCount: (label: string, count: number) =>
      count === 1
        ? `${label}, 1 examination`
        : `${label}, ${count} examinations`,
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
      "On the urgent list, they can take an urgent examination without waiting for it to be assigned. The modalities they read are set by the IMAFRIK team.",
    trigger: "Urgent list",
    triggerLabel: (name: string) => `Urgent list: ${name}`,
    urgentTitle: (name: string) => `${name} and the urgent list`,
    urgentSaved: (name: string) => `${name}’s urgent list setting saved.`,
    button: "Modalities",
    buttonLabel: (name: string) => `Modalities read by ${name}`,
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
  plan: {
    title: "Assignment schedule",
    trigger: "Assignment schedule",
    description: "Who receives the clinic’s examinations, on arrival.",
    adminDescription:
      "Who receives this clinic’s examinations on arrival, network radiologists included.",
    howItWorks:
      "On arrival, an examination goes automatically to the radiologist of the line that covers it. When several lines cover it, the most precise wins: the modality, then the period, then the hours. What the schedule does not cover stays to assign, and you can always reassign from the examination.",
    timeZone: (zone: string) => `Clinic hours and dates (${zone}).`,
    previousWeek: "Previous week",
    nextWeek: "Following week",
    thisWeek: "This week",
    followingWeek: "Next week",
    weekLabel: (from: string, to: string) => `Week of ${from} to ${to}`,
    today: "Today",
    view: "View",
    byRadiologist: "By radiologist",
    byModality: "By modality",
    radiologistColumn: "Radiologist",
    modalityColumn: "Modality",
    allModalities: "All modalities",
    nobodyThatDay: "Nobody planned",
    allDay: "All day",
    hours: (from: string, to: string) => `${from}–${to}`,
    weekly: "Every week",
    dated: (from: string, to: string) => `From ${from} to ${to}`,
    conflictBadge: "Conflict",
    conflictInfo:
      "Two lines as precise as each other, for two radiologists, overlap: during that time the schedule does not decide and the examination stays to assign.",
    conflict: (first: string, second: string, days: string) =>
      `${first} and ${second} are planned at the same time (${days}), as precisely as each other: the schedule does not decide, and an examination arriving then will stay to assign. Add a modality, a period or hours.`,
    cannotReceive: (name: string) =>
      `${name} cannot receive examinations yet (credentials or affiliation): their lines do not count.`,
    notReading: (name: string, modality: string) =>
      `${name} does not read: ${modality}. This line does not count; the IMAFRIK team sets the modalities each radiologist reads.`,
    network: "IMAFRIK network",
    networkLocked:
      "Placed by the IMAFRIK team: you can remove their line, not change it.",
    linesTitle: "Lines of the week",
    linesInfo:
      "The lines that apply during the week shown: the weekly ones, and those whose period touches it.",
    noLines:
      "No line this week: examinations arrive to assign, and you assign them yourself.",
    add: "Add a line",
    edit: "Edit",
    editLabel: (line: string) => `Edit the line: ${line}`,
    remove: "Remove",
    removeLabel: (line: string) => `Remove the line: ${line}`,
    removeTitle: "Remove this line?",
    removeDescription: (line: string) =>
      `${line}. Examinations arriving from now on will no longer be assigned by this line; nothing already assigned changes.`,
    removed: "Line removed.",
    updatedBy: (name: string, date: string) => `${name}, on ${date}`,
    copy: "Copy the previous week",
    copyInfo:
      "The dated lines of the previous week are repeated on this one. Weekly lines already apply.",
    copyNothing: "The previous week has no dated line to copy.",
    copyTitle: "Replace this week’s lines?",
    copyDescription: (count: number) =>
      count > 1
        ? `This week already has ${count} dated lines: they will be replaced by those of the previous week.`
        : "This week already has a dated line: it will be replaced by those of the previous week.",
    copyReplace: "Replace",
    copied: (copied: number, skipped: number) =>
      [
        copied === 0
          ? "No line copied: their days are already over."
          : copied > 1
            ? `${copied} lines copied.`
            : "1 line copied.",
        skipped > 0 &&
          (skipped > 1
            ? `${skipped} left out: their radiologist can no longer appear, or is from the network.`
            : "1 left out: its radiologist can no longer appear, or is from the network."),
      ]
        .filter(Boolean)
        .join(" "),
    dialogAdd: "Add a line",
    dialogEdit: "Edit the line",
    dialogDescription:
      "A radiologist and days; if needed a modality, hours and a period.",
    radiologist: "Radiologist",
    chooseRadiologist: "Choose a radiologist",
    modality: "Modality",
    modalityAll: "All",
    modalityNotRead: (name: string) => `${name} does not read this modality.`,
    days: "Days",
    allWeek: "The whole week",
    workweek: "Monday to Friday",
    dayShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    dayNames: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    daysRange: (from: string, to: string) => `${from} to ${to}`,
    hoursLabel: "Hours",
    allDayLong: "All day",
    from: "From",
    to: "to",
    overnight: "until the next morning",
    duration: "Duration",
    everyWeek: "Every week",
    shownWeek: (from: string, to: string) =>
      `This week only, from ${from} to ${to}`,
    period: "A period",
    periodFrom: "From",
    periodTo: "To",
    problems: {
      radiologist: "Choose a radiologist.",
      days: "Tick at least one day.",
      hours: "Enter a start time and an end time.",
      sameHours: "The start and the end cannot be at the same time.",
      period: "Enter the first and the last day of the period.",
      periodOrder: "The period must end after it starts.",
      periodTooLong: "A period lasts one year at most.",
      periodPast: "This period is already over.",
      noDayInPeriod: "None of the chosen days falls within this period.",
      modalityNotRead: "This radiologist does not read this modality.",
    },
    submitAdd: "Add",
    submitEdit: "Save",
    added: "Line added.",
    updated: "Line updated.",
    noRadiologists:
      "No radiologist in your team: invite one from “Team” to build the schedule.",
    noRadiologistsAdmin:
      "No radiologist can read this clinic: affiliate one, or open it to the network.",
    back: "Team",
    summary: (weekly: number, dated: number) =>
      weekly === 0 && dated === 0
        ? "No line: examinations arrive to assign."
        : [
            weekly > 0 && `${weekly} weekly line${weekly > 1 ? "s" : ""}`,
            dated > 0 && `${dated} dated line${dated > 1 ? "s" : ""}`,
          ]
            .filter(Boolean)
            .join(" · "),
    byRule: {
      modality: "radiologist for the modality",
      schedule: "assignment schedule",
    },
    assignedBy: (rule: string) => `Assigned by the rule: ${rule}`,
  },
  demoAction: "Assigning examinations",
};
