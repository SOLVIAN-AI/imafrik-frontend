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
  kind: "Type",
  allKinds: "All types",
  kinds: { clinic: "Clinics", radiology_group: "Radiology groups" },
  standing: "Standing",
  allStandings: "All standings",
  standings: { active: "Active", suspended: "Suspended" },
  link: "Connection",
  allLinks: "All connections",
  links: {
    connected: "PACS connected",
    not_connected: "Not connected",
    silent: "Silent for 24 h",
  },
  organization: "Organisation",
  allOrganizations: "All organisations",
  organizationSearch: "Search for an organisation",
  organizationNoMatch: "No organisation matches.",
  organizationMatches: (count: number) =>
    count === 0
      ? "No organisation"
      : count === 1
        ? "1 organisation"
        : `${count} organisations`,
  role: "Role",
  allRoles: "All roles",
  account: "Account",
  allAccounts: "All accounts",
  mute: "Silent",
  noPlan: "Without a plan",
  mfa: "Two-factor authentication",
  withoutMfa: "Without two-factor authentication",
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
    gateways: (count: number) =>
      count === 1 ? "1 gateway" : `${count} gateways`,
    statements: (count: number) =>
      count === 1 ? "1 statement" : `${count} statements`,
    accounts: (count: number) =>
      count === 1 ? "1 account" : `${count} accounts`,
    studies: (count: number) =>
      count === 1 ? "1 examination" : `${count} examinations`,
    reports: (count: number) => (count === 1 ? "1 report" : `${count} reports`),
    organizations: (count: number) =>
      count === 1 ? "1 organisation" : `${count} organisations`,
  },
  empty: {
    gateways: "No gateway matches these filters",
    statements: "No statement matches these filters",
    studies: "No examination matches these filters",
    reports: "No report matches these filters",
    accounts: "No account matches these filters",
    organizations: "No organisation matches these filters",
    detail: (filters: string) =>
      `Filters applied: ${filters}. Clear one to widen the list.`,
  },
};
