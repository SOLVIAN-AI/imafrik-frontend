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
  author: "Author",
  allAuthors: "All authors",
  authorSearch: "Search for an author",
  authorNoMatch: "No author matches.",
  authorMatches: (count: number) =>
    count === 0 ? "No author" : count === 1 ? "1 author" : `${count} authors`,
  family: "Family",
  allFamilies: "All families",
  action: "Action",
  actionSearch: "Search for an action",
  actionNoMatch: "No action matches.",
  actionMatches: (count: number) =>
    count === 0 ? "No action" : count === 1 ? "1 action" : `${count} actions`,
  allRequesters: "All requesters",
  requestSearch: "Search for a request",
  requestSearchPlaceholder: "Name, email, facility…",
  stage: "Stage",
  ideaCategory: "Category",
  allIdeaCategories: "All categories",
  allStages: "All stages",
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
  origin: "Origin",
  allOrigins: "All origins",
  origins: { imafrik: "IMAFRIK", organization: "Organisation" },
  task: "Task",
  allTasks: "All tasks",
  urgentList: "Urgent list",
  onUrgentList: "On the urgent list",
  allMembers: "All members",
  failures: "Failures",
  allRuns: "All runs",
  failuresOnly: "Failures only",
  memberSearch: "Search for a member",
  memberSearchPlaceholder: "Name, email address…",
  nouns: {
    entries: (count: number) => (count === 1 ? "1 entry" : `${count} entries`),
    requests: (count: number) =>
      count === 1 ? "1 request" : `${count} requests`,
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
    members: (count: number) => (count === 1 ? "1 member" : `${count} members`),
    templates: (count: number) =>
      count === 1 ? "1 template" : `${count} templates`,
    cases: (count: number) => (count === 1 ? "1 case" : `${count} cases`),
    runs: (count: number) => (count === 1 ? "1 run" : `${count} runs`),
    ideas: (count: number) => (count === 1 ? "1 idea" : `${count} ideas`),
    deposits: (count: number) =>
      count === 1 ? "1 upload" : `${count} uploads`,
  },
  empty: {
    entries: "No entry matches these filters",
    requests: "No request matches these filters",
    gateways: "No gateway matches these filters",
    statements: "No statement matches these filters",
    studies: "No examination matches these filters",
    reports: "No report matches these filters",
    accounts: "No account matches these filters",
    organizations: "No organisation matches these filters",
    members: "No member matches these filters",
    templates: "No template matches these filters",
    cases: "No case matches these filters",
    runs: "No run matches these filters",
    ideas: "No idea matches these filters",
    deposits: "No upload matches these filters",
    detail: (filters: string) =>
      `Filters applied: ${filters}. Clear one to widen the list.`,
    searchTitle: "No result for this search",
    searchDetail: "Check the spelling, or search for another word.",
  },
};
