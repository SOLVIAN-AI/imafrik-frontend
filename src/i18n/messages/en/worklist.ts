import type { AppMessages } from "@/i18n/messages/fr";

/** Texts for the "worklist" area, in English. */
export const worklist: AppMessages["worklist"] = {
  scope: {
    empty: "The examinations entrusted to you",
    clinics: (list: string) => `The examinations entrusted to you: ${list}`,
    count: (count: number) =>
      `The examinations entrusted to you: ${count} ${count === 1 ? "facility" : "facilities"}`,
  },
  supervision: {
    scope: {
      empty: "The whole platform, to dispatch",
      clinics: (list: string) => `The whole platform, to dispatch: ${list}`,
      count: (count: number) =>
        `The whole platform, to dispatch: ${count} ${count === 1 ? "facility" : "facilities"}`,
    },
    assign: {
      column: "Assignment",
      noCandidate: "No radiologist",
      reasons: {
        clinic_inactive:
          "The clinic is suspended: its examinations can no longer be assigned.",
        no_reader:
          "No radiologist reads for this clinic: none of its own, and no contract with the network.",
        not_credentialed:
          "None of the radiologists who read for this clinic is credentialed yet.",
        modality_not_read:
          "No credentialed radiologist reads this modality for this clinic.",
      },
    },
    readingHint: (count: number) => `and ${count} with a radiologist`,
    reading: { title: "With a radiologist", hint: "assigned or being read" },
    open: { title: "To assign", hint: "waiting for a radiologist" },
    toAssign: "To assign",
  },
  metrics: {
    toTake: "Assigned to you",
    mineHint: (count: number) => `including ${count} in progress`,
    urgentOpen: "Urgent to take",
    urgentHint: "the first to take it gets it",
    overdue: "Overdue",
    overdueHint: "turnaround exceeded",
    nextDeadline: "Next deadline",
  },
  arrivals: {
    many: (count: number) => `${count} new urgent examinations to take`,
    one: (study: string) => `New urgent examination to take: ${study}`,
  },
  truncated:
    "The worklist holds more examinations than this screen shows: only those closest to their deadline are listed. Narrow it down with the search or the filters.",
  groups: {
    mine: { title: "Assigned to you", hint: "by deadline" },
    open: {
      title: "Urgent to take",
      hint: "urgent list: the first to take it gets it",
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
        "No examinations are waiting for you. An examination appears here as soon as it is assigned to you, and an urgent one from your urgent list as soon as it is received.",
    },
  },
  myStudies: {
    description: "Examinations you are reading that are still to be signed",
    empty: {
      title: "No examinations in progress",
      detail:
        "Open an examination assigned to you, from the “To read” worklist, to take it on.",
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
