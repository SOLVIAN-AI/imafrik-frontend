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
  modality: "Modality",
  allModalities: "All modalities",
  urgency: "Urgency",
  allPriorities: "All priorities",
  urgent: "Urgent",
  nouns: {
    studies: (count: number) =>
      count === 1 ? "1 examination" : `${count} examinations`,
  },
  empty: {
    studies: "No examination matches these filters",
    detail: (filters: string) =>
      `Filters applied: ${filters}. Clear one to widen the list.`,
  },
};
