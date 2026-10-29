import type { AppMessages } from "@/i18n/messages/fr";

/** Texts for list filters, in English. */
export const filters: AppMessages["filters"] = {
  bar: "Filters",
  clear: "Clear filters",
  clinic: "Clinic",
  allClinics: "All clinics",
  clinicSearch: "Search for a clinic",
  clinicNoMatch: "No clinic matches.",
  clinicMatches: (count: number) =>
    count === 0 ? "No clinic" : count === 1 ? "1 clinic" : `${count} clinics`,
  radiologist: "Radiologist",
  allRadiologists: "All radiologists",
  radiologistSearch: "Search for a radiologist",
  radiologistNoMatch: "No radiologist matches.",
  radiologistMatches: (count: number) =>
    count === 0
      ? "No radiologist"
      : count === 1
        ? "1 radiologist"
        : `${count} radiologists`,
  state: "Status",
  allStates: "All statuses",
  states: {
    to_assign: "To assign",
    reading: "Being read",
    ready: "Ready",
    delivered: "Delivered",
  },
  period: "Period",
  allDates: "All dates",
  periods: {
    "1": "24 h",
    "7": "7 days",
    "30": "30 days",
    "90": "90 days",
    "365": "12 months",
  },
  modality: "Modality",
  allModalities: "All modalities",
  urgency: "Urgency",
  allPriorities: "All priorities",
  urgent: "Urgent",
  nouns: {
    studies: (count: number) =>
      count === 1 ? "1 examination" : `${count} examinations`,
    reports: (count: number) => (count === 1 ? "1 report" : `${count} reports`),
  },
  empty: {
    studies: "No examination matches these filters",
    reports: "No report matches these filters",
    detail: (filters: string) =>
      `Filters applied: ${filters}. Clear one to widen the list.`,
  },
};
