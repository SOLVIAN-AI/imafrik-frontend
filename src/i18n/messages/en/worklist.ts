import type { AppMessages } from "@/i18n/messages/fr";

/** Texts for the "worklist" area, in English. */
export const worklist: AppMessages["worklist"] = {
  scope: {
    empty: "Group worklist",
    clinics: (list: string) => `Group worklist: ${list}`,
    count: (count: number) =>
      `Group worklist: ${count} ${count === 1 ? "facility" : "facilities"}`,
  },
  metrics: {
    toTake: "To claim",
    mineHint: (count: number) => `plus ${count} assigned to you`,
    urgentOpen: "Unclaimed urgent",
    urgentHint: "claim these first",
    overdue: "Overdue",
    overdueHint: "turnaround exceeded",
    nextDeadline: "Next deadline",
  },
  arrivals: {
    many: (count: number) => `${count} new urgent examinations in the worklist`,
    one: (study: string) => `New urgent examination: ${study}`,
  },
  truncated:
    "The worklist holds more examinations than this screen shows: only those closest to their deadline are listed. Narrow it down with the search or the filters.",
  groups: {
    mine: { title: "Claimed by you", hint: "to complete" },
    open: { title: "To claim", hint: "by deadline" },
    colleagues: {
      title: "With a colleague",
      hint: "view only",
    },
  },
  refreshNote: (seconds: number) =>
    `The worklist refreshes automatically every ${seconds} seconds.`,
  noResults: {
    title: "No results",
    detail: "Change the search or clear the filters.",
  },
  deadline: {
    remaining: (duration: string) => `${duration} left`,
    overdue: (duration: string) => `overdue by ${duration}`,
    dueAt: (time: string) => `Due at ${time}`,
  },
  table: {
    columns: {
      deadline: "Deadline",
      patient: "Patient",
      study: "Examination",
      follow: "Status",
      received: "Received",
    },
    clinicalInfo: (text: string) => `Clinical information: ${text}`,
    colleague: "A colleague",
    keyboard: {
      browse: "or arrow keys to move through the worklist,",
      enter: "Enter",
      open: "to open the examination.",
    },
    empty: {
      title: "Worklist clear",
      detail:
        "No examinations are awaiting reporting. New examinations appear here as soon as they are received.",
    },
  },
  myStudies: {
    description: "Examinations you have claimed that are still to be reported",
    empty: {
      title: "No examinations in progress",
      detail: "Claim an examination from the “To read” worklist.",
    },
  },
  filters: {
    modalities: "Modalities",
    clinic: "Clinic",
    allClinics: "All clinics",
  },
  toolbar: {
    searchLabel: "Search for a patient or a modality",
    searchPlaceholder: "Patient, ID, modality…",
    urgentShort: "Urgent",
    urgentOnly: "Urgent only",
    invalidSearch: "Invalid search.",
  },
};
