import type { AppMessages } from "@/i18n/messages/fr";

/** Vocabulary shared by every screen of the application, in English. */
export const common: AppMessages["common"] = {
  appDescription: "Teleradiology platform",
  skipToContent: "Skip to content",
  actions: {
    save: "Save",
    saving: "Saving…",
    saved: "Saved",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    delete: "Delete",
    retry: "Try again",
    refresh: "Refresh",
    back: "Back",
    open: "Open",
    search: "Search",
    clearFilters: "Clear filters",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    signOut: "Sign out",
    seeAll: "See all",
  },
  roles: {
    platform_admin: "IMAFRIK administrator",
    radiologist: "Radiologist",
    clinic_staff: "Clinic",
  },
  studyStatus: {
    received: "To read",
    assigned: "Assigned",
    in_progress: "In progress",
    reported: "Reported",
    delivered: "Delivered",
  },
  urgent: "Urgent",
  sex: { M: "Male", F: "Female", O: "Other" },
  sexShort: { M: "M", F: "F", O: "O" },
  pagination: {
    label: "List pages",
    shown: (shown: number, total: number) => `${shown} shown of ${total}`,
    first: "Back to the start",
    next: "Next page",
  },
  units: {
    minute: "min",
    hour: "h",
    day: "d",
    bytes: ["B", "KB", "MB", "GB"],
    months: (count: number) => (count === 1 ? "1 month" : `${count} months`),
    years: (count: number) => (count === 1 ? "1 year" : `${count} years`),
  },
  errors: {
    unexpected: "An unexpected error occurred. Please try again.",
    invalidId: "Invalid identifier.",
    demoUnavailable: (what: string) =>
      `${what} is not available in the demo: no service is connected.`,
    sessionExpired: "Session expired.",
    network:
      "The service is not responding. Please check your connection and try again.",
    invalidRequest: "Invalid request.",
    serviceUnavailable:
      "The service is temporarily unavailable. Please try again in a moment.",
    requestFailed: "The request could not be completed.",
    apiNotConfigured: "The API is not configured.",
    unexpectedResponse: "The service returned an unexpected response.",
    unreachable:
      "The service cannot be reached. Please check your connection and try again.",
  },
  language: {
    label: "Language",
    fr: "Français",
    en: "English",
  },
};
